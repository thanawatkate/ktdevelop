import { quotePosSyncRepository } from '@/infrastructure/repositories/QuotePosSyncRepository';
import { quoteRepository } from '@/infrastructure/repositories/QuoteRepository';
import { buildPosQuotePayload } from '@/infrastructure/pos/buildPosQuotePayload';
import { syncQuoteToPos } from '@/infrastructure/pos/PosApiClient';

export interface ProcessPendingResult {
  scanned: number;
  synced: number;
  failed: number;
  skipped: number;
}

export async function processPendingQuotePosSync(limit = 50): Promise<ProcessPendingResult> {
  const rows = await quotePosSyncRepository.getPending(limit);
  const result: ProcessPendingResult = {
    scanned: rows.length,
    synced: 0,
    failed: 0,
    skipped: 0,
  };

  for (const row of rows) {
    const quote = await quoteRepository.getQuoteById(row.quote_id);
    if (!quote) {
      await quotePosSyncRepository.markFailed(row.quote_id, 'Quote not found during sync processing');
      result.failed += 1;
      continue;
    }

    const packageData = await quoteRepository.getPackageById(quote.service_package_id);
    if (!packageData) {
      await quotePosSyncRepository.markFailed(row.quote_id, 'Service package not found during sync processing');
      result.failed += 1;
      continue;
    }

    const syncPayload = buildPosQuotePayload(quote, packageData.name);
    const syncResult = await syncQuoteToPos(syncPayload);

    if (syncResult.ok) {
      await quotePosSyncRepository.markSynced(quote.id);
      result.synced += 1;
    } else {
      await quotePosSyncRepository.markFailed(quote.id, syncResult.message);
      result.failed += 1;
    }
  }

  return result;
}
