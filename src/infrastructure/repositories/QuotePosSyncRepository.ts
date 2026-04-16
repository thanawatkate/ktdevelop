import { RowDataPacket } from 'mysql2';
import { dbPool } from '../db';

export type QuotePosSyncStatus = 'pending' | 'synced' | 'failed';

export interface QuotePosSyncRow extends RowDataPacket {
  id: number;
  quote_id: number;
  quote_number: string;
  status: QuotePosSyncStatus;
  attempt_count: number;
  last_error: string | null;
  last_attempt_at: Date | null;
  next_retry_at: Date;
  created_at: Date;
  updated_at: Date;
}

function calculateNextRetry(attemptCount: number): Date {
  const baseMs = 30_000; // 30 seconds
  const maxMs = 10 * 60_000; // 10 minutes
  const waitMs = Math.min(maxMs, baseMs * Math.pow(2, Math.max(0, attemptCount - 1)));
  return new Date(Date.now() + waitMs);
}

export class QuotePosSyncRepository {
  async upsertPending(quoteId: number, quoteNumber: string): Promise<void> {
    await dbPool.query(
      `INSERT INTO quote_pos_sync (
        quote_id, quote_number, status, attempt_count, last_error, last_attempt_at, next_retry_at
      ) VALUES (?, ?, 'pending', 0, NULL, NULL, NOW())
      ON DUPLICATE KEY UPDATE
        quote_number = VALUES(quote_number),
        status = 'pending',
        next_retry_at = NOW(),
        updated_at = CURRENT_TIMESTAMP`,
      [quoteId, quoteNumber]
    );
  }

  async markSynced(quoteId: number): Promise<void> {
    await dbPool.query(
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

  async markFailed(quoteId: number, errorMessage: string): Promise<void> {
    const [rows] = await dbPool.query<Array<RowDataPacket & { attempt_count: number }>>(
      `SELECT attempt_count FROM quote_pos_sync WHERE quote_id = ? LIMIT 1`,
      [quoteId]
    );

    const currentAttempt = rows[0]?.attempt_count ?? 0;
    const nextAttempt = currentAttempt + 1;
    const nextRetryAt = calculateNextRetry(nextAttempt);

    await dbPool.query(
      `UPDATE quote_pos_sync
       SET status = 'failed',
           attempt_count = ?,
           last_error = ?,
           last_attempt_at = NOW(),
           next_retry_at = ?
       WHERE quote_id = ?`,
      [nextAttempt, errorMessage.slice(0, 2000), nextRetryAt, quoteId]
    );
  }

  async getPending(limit = 50): Promise<QuotePosSyncRow[]> {
    const safeLimit = Math.max(1, Math.min(500, limit));
    const [rows] = await dbPool.query<QuotePosSyncRow[]>(
      `SELECT *
       FROM quote_pos_sync
       WHERE status IN ('pending', 'failed')
         AND next_retry_at <= NOW()
       ORDER BY next_retry_at ASC
       LIMIT ?`,
      [safeLimit]
    );

    return rows;
  }

  async getRecent(limit = 100): Promise<QuotePosSyncRow[]> {
    const safeLimit = Math.max(1, Math.min(500, limit));
    const [rows] = await dbPool.query<QuotePosSyncRow[]>(
      `SELECT *
       FROM quote_pos_sync
       ORDER BY updated_at DESC
       LIMIT ?`,
      [safeLimit]
    );

    return rows;
  }
}

export const quotePosSyncRepository = new QuotePosSyncRepository();
