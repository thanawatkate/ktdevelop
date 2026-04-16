import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, isSessionAuthorizedByValue } from '@/core/security/adminAuth';
import { quoteRepository } from '@/infrastructure/repositories/QuoteRepository';
import { syncQuoteToPos } from '@/infrastructure/pos/PosApiClient';
import { buildPosQuotePayload } from '@/infrastructure/pos/buildPosQuotePayload';
import { quotePosSyncRepository } from '@/infrastructure/repositories/QuotePosSyncRepository';

function readCookieValue(cookieHeader: string | null, cookieName: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(';');
  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (part.startsWith(`${cookieName}=`)) {
      return decodeURIComponent(part.slice(cookieName.length + 1)).trim();
    }
  }

  return null;
}

function isAuthorized(request: NextRequest): boolean {
  const bearerToken = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() || null;
  const headerToken = request.headers.get('x-admin-token')?.trim() || null;
  const cookieToken = readCookieValue(request.headers.get('cookie'), ADMIN_COOKIE_NAME);
  const providedToken = bearerToken || headerToken || cookieToken;
  return isSessionAuthorizedByValue(providedToken);
}

/**
 * POST /api/integrations/pos/quotes/[id]
 * Re-sync a quote to POS (admin only)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const quoteId = Number.parseInt(id, 10);
    if (!Number.isInteger(quoteId) || quoteId <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid quote ID' }, { status: 400 });
    }

    const quote = await quoteRepository.getQuoteById(quoteId);
    if (!quote) {
      return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 });
    }

    await quotePosSyncRepository.upsertPending(quote.id, quote.quote_number);

    const packageData = await quoteRepository.getPackageById(quote.service_package_id);

    const syncResult = await syncQuoteToPos(buildPosQuotePayload(quote, packageData?.name));

    if (!syncResult.ok) {
      await quotePosSyncRepository.markFailed(quote.id, syncResult.message);
      return NextResponse.json(
        { success: false, error: syncResult.message },
        { status: syncResult.status || 502 }
      );
    }

    await quotePosSyncRepository.markSynced(quote.id);

    return NextResponse.json({
      success: true,
      message: syncResult.message,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected integration error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
