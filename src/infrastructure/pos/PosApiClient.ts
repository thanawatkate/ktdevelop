import { createHmac } from 'crypto';

export interface PosQuoteSyncPayload {
  quote_number: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  service_package_id: number;
  service_package_name?: string;
  base_price: number;
  discount_percent: number;
  discount_amount: number;
  final_price: number;
  additional_requirements?: string;
  status: string;
  valid_until?: string;
  created_at?: string;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    item_type: 'base' | 'addon' | 'extra';
  }>;
}

interface PosSyncResult {
  ok: boolean;
  status?: number;
  message: string;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return value.toLowerCase() === 'true';
}

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createRequestSignature(secret: string, timestamp: string, body: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

function getPosConfig() {
  return {
    enabled: parseBoolean(process.env.POS_SYNC_ENABLED, false),
    baseUrl: process.env.POS_API_BASE_URL?.trim() || '',
    apiKey: process.env.POS_API_KEY?.trim() || '',
    webhookSecret: process.env.POS_WEBHOOK_SECRET?.trim() || '',
    timeoutMs: parseNumber(process.env.POS_REQUEST_TIMEOUT_MS, 1500),
    maxRetries: parseNumber(process.env.POS_SYNC_MAX_RETRIES, 1),
  };
}

export async function syncQuoteToPos(payload: PosQuoteSyncPayload): Promise<PosSyncResult> {
  const config = getPosConfig();

  if (!config.enabled) {
    return { ok: true, message: 'POS sync disabled' };
  }

  if (!config.baseUrl || !config.apiKey || !config.webhookSecret) {
    return {
      ok: false,
      message: 'POS sync is enabled but POS_API_BASE_URL/POS_API_KEY/POS_WEBHOOK_SECRET is missing',
    };
  }

  const url = `${config.baseUrl.replace(/\/$/, '')}/api/integrations/website/quotes`;
  const jsonBody = JSON.stringify(payload);
  const timestamp = new Date().toISOString();
  const signature = createRequestSignature(config.webhookSecret, timestamp, jsonBody);
  const idempotencyKey = payload.quote_number;

  let lastError = 'Unknown POS sync error';

  for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.apiKey,
          'X-Signature': signature,
          'X-Timestamp': timestamp,
          'X-Idempotency-Key': idempotencyKey,
        },
        body: jsonBody,
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timer);

      if (response.ok) {
        return { ok: true, status: response.status, message: 'POS sync success' };
      }

      const responseText = await response.text();
      lastError = `POS sync failed (${response.status}): ${responseText.slice(0, 300)}`;

      if (!isRetryableStatus(response.status) || attempt >= config.maxRetries) {
        return { ok: false, status: response.status, message: lastError };
      }
    } catch (error) {
      clearTimeout(timer);
      lastError = error instanceof Error ? error.message : 'Network error while syncing to POS';

      if (attempt >= config.maxRetries) {
        return { ok: false, message: `POS sync failed: ${lastError}` };
      }
    }

    const backoffMs = 150 * Math.pow(2, attempt);
    await sleep(backoffMs);
  }

  return { ok: false, message: lastError };
}
