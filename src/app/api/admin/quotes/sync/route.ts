import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, isSessionAuthorizedByValue } from '@/core/security/adminAuth';
import { quotePosSyncRepository } from '@/infrastructure/repositories/QuotePosSyncRepository';
import { processPendingQuotePosSync } from '@/infrastructure/pos/processPendingQuotePosSync';

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
 * GET /api/admin/quotes/sync?limit=100
 * Returns latest quote sync statuses.
 */
export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const limit = Number.parseInt(request.nextUrl.searchParams.get('limit') || '100', 10);
    const rows = await quotePosSyncRepository.getRecent(Number.isFinite(limit) ? limit : 100);

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to fetch sync status';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/admin/quotes/sync
 * Triggers processing of pending quote sync rows.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const limit = Number.parseInt(String(body?.limit || '50'), 10);
    const result = await processPendingQuotePosSync(Number.isFinite(limit) ? limit : 50);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to process pending sync';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
