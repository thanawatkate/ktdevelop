#!/usr/bin/env node

require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');
const { createHmac } = require('crypto');

function parseBoolean(value, fallback) {
  if (!value) return fallback;
  return String(value).toLowerCase() === 'true';
}

function parseNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function createSignature(secret, timestamp, body) {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

function calculateNextRetry(attemptCount) {
  const baseMs = 30_000;
  const maxMs = 10 * 60_000;
  const waitMs = Math.min(maxMs, baseMs * Math.pow(2, Math.max(0, attemptCount - 1)));
  return new Date(Date.now() + waitMs);
}

async function fetchPendingRows(connection, limit) {
  const [rows] = await connection.query(
    `SELECT quote_id, quote_number, attempt_count
     FROM quote_pos_sync
     WHERE status IN ('pending', 'failed')
       AND next_retry_at <= NOW()
     ORDER BY next_retry_at ASC
     LIMIT ?`,
    [limit]
  );
  return rows;
}

async function fetchQuoteAggregate(connection, quoteId) {
  const [quoteRows] = await connection.query(
    `SELECT q.*, sp.name AS service_package_name
     FROM quotes q
     LEFT JOIN service_packages sp ON sp.id = q.service_package_id
     WHERE q.id = ?
     LIMIT 1`,
    [quoteId]
  );

  if (!quoteRows.length) return null;
  const quote = quoteRows[0];

  const [itemRows] = await connection.query(
    `SELECT description, quantity, unit_price, total_price, item_type
     FROM quote_items
     WHERE quote_id = ?
     ORDER BY id ASC`,
    [quoteId]
  );

  return { quote, items: itemRows };
}

async function markSynced(connection, quoteId) {
  await connection.query(
    `UPDATE quote_pos_sync
     SET status = 'synced',
         attempt_count = attempt_count + 1,
         last_error = NULL,
         last_attempt_at = NOW(),
         next_retry_at = NOW()
     WHERE quote_id = ?`,
    [quoteId]
  );
}

async function markFailed(connection, quoteId, attemptCount, message) {
  const nextAttempt = attemptCount + 1;
  const nextRetryAt = calculateNextRetry(nextAttempt);
  await connection.query(
    `UPDATE quote_pos_sync
     SET status = 'failed',
         attempt_count = ?,
         last_error = ?,
         last_attempt_at = NOW(),
         next_retry_at = ?
     WHERE quote_id = ?`,
    [nextAttempt, String(message).slice(0, 2000), nextRetryAt, quoteId]
  );
}

async function pushToPos(payload) {
  const enabled = parseBoolean(process.env.POS_SYNC_ENABLED, false);
  if (!enabled) {
    return { ok: true, message: 'POS sync disabled' };
  }

  const baseUrl = (process.env.POS_API_BASE_URL || '').trim().replace(/\/$/, '');
  const apiKey = (process.env.POS_API_KEY || '').trim();
  const secret = (process.env.POS_WEBHOOK_SECRET || '').trim();
  const timeoutMs = parseNumber(process.env.POS_REQUEST_TIMEOUT_MS, 1500);

  if (!baseUrl || !apiKey || !secret) {
    return { ok: false, message: 'Missing POS API configuration' };
  }

  const body = JSON.stringify(payload);
  const timestamp = new Date().toISOString();
  const signature = createSignature(secret, timestamp, body);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/api/integrations/website/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'X-Signature': signature,
        'X-Timestamp': timestamp,
        'X-Idempotency-Key': payload.quote_number,
      },
      body,
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timer);

    if (response.ok) {
      return { ok: true, message: 'POS sync success' };
    }

    const text = await response.text();
    return { ok: false, message: `POS sync failed (${response.status}): ${text.slice(0, 300)}` };
  } catch (error) {
    clearTimeout(timer);
    return { ok: false, message: error instanceof Error ? error.message : 'POS sync network error' };
  }
}

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseNumber(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ktdevelop_db',
  });

  try {
    const limit = parseNumber(process.env.POS_SYNC_PROCESS_LIMIT, 100);
    const pendingRows = await fetchPendingRows(connection, limit);
    const result = { scanned: pendingRows.length, synced: 0, failed: 0, skipped: 0 };

    for (const row of pendingRows) {
      const aggregate = await fetchQuoteAggregate(connection, row.quote_id);
      if (!aggregate) {
        await markFailed(connection, row.quote_id, row.attempt_count || 0, 'Quote not found during sync');
        result.failed += 1;
        continue;
      }

      const { quote, items } = aggregate;
      const payload = {
        quote_number: quote.quote_number,
        client_name: quote.client_name,
        client_email: quote.client_email,
        client_phone: quote.client_phone,
        service_package_id: quote.service_package_id,
        service_package_name: quote.service_package_name || undefined,
        base_price: quote.base_price,
        discount_percent: quote.discount_percent,
        discount_amount: quote.discount_amount,
        final_price: quote.final_price,
        additional_requirements: quote.additional_requirements,
        status: quote.status,
        valid_until: quote.valid_until ? new Date(quote.valid_until).toISOString() : undefined,
        created_at: quote.created_at ? new Date(quote.created_at).toISOString() : undefined,
        items: (items || []).map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          total_price: Number(item.total_price),
          item_type: item.item_type,
        })),
      };

      const syncResult = await pushToPos(payload);
      if (syncResult.ok) {
        await markSynced(connection, row.quote_id);
        result.synced += 1;
      } else {
        await markFailed(connection, row.quote_id, row.attempt_count || 0, syncResult.message);
        result.failed += 1;
      }
    }

    console.log('[pos:sync:pending] done', result);
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error('[pos:sync:pending] failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
