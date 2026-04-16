import { NextRequest, NextResponse } from 'next/server';
import { quoteRepository } from '@/infrastructure/repositories/QuoteRepository';
import { syncQuoteToPos } from '@/infrastructure/pos/PosApiClient';
import { buildPosQuotePayload } from '@/infrastructure/pos/buildPosQuotePayload';
import { quotePosSyncRepository } from '@/infrastructure/repositories/QuotePosSyncRepository';

interface CreateQuoteRequest {
  client_name: string;
  client_email: string;
  client_phone?: string;
  service_package_id: number;
  additional_requirements?: string;
  discount_percent?: number;
}

/**
 * POST /api/quotes
 * Create a new quote
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateQuoteRequest = await request.json();

    // Validate required fields
    if (!body.client_name || !body.client_email || !body.service_package_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.client_email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get package details
    const packageData = await quoteRepository.getPackageById(body.service_package_id);
    if (!packageData) {
      return NextResponse.json(
        { success: false, error: 'Service package not found' },
        { status: 404 }
      );
    }

    // Calculate pricing
    const basePrice = packageData.base_price;
    const discountPercent = Math.max(0, Math.min(body.discount_percent || 0, 100));
    const totalPrice = basePrice;
    const discountAmount = totalPrice * (discountPercent / 100);
    const finalPrice = totalPrice - discountAmount;

    // Generate quote number
    const quoteNumber = await quoteRepository.generateQuoteNumber();

    // Set valid_until to 30 days from now
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    // Create quote
    const quote = await quoteRepository.createQuote({
      quote_number: quoteNumber,
      client_name: body.client_name,
      client_email: body.client_email,
      client_phone: body.client_phone,
      service_package_id: body.service_package_id,
      base_price: basePrice,
      additional_requirements: body.additional_requirements,
      total_price: totalPrice,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      final_price: finalPrice,
      status: 'draft',
      valid_until: validUntil
    });

    // Add base package as first item
    await quoteRepository.addQuoteItem(quote.id, {
      description: packageData.name,
      quantity: 1,
      unit_price: basePrice,
      total_price: basePrice,
      item_type: 'base'
    });

    // Fetch complete quote with items
    const completeQuote = await quoteRepository.getQuoteById(quote.id);

    if (!completeQuote) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch newly created quote' },
        { status: 500 }
      );
    }

    // Track sync state in DB (outbox pattern) so failed sync can be retried safely.
    await quotePosSyncRepository.upsertPending(completeQuote.id, completeQuote.quote_number);

    // Best-effort POS sync: keep quote creation fast and reliable even when POS is unavailable.
    const syncPayload = buildPosQuotePayload(completeQuote, packageData.name);
    const syncResult = await syncQuoteToPos(syncPayload);

    if (!syncResult.ok) {
      console.warn('[quotes] POS sync warning:', syncResult.message);
      await quotePosSyncRepository.markFailed(completeQuote.id, syncResult.message);
    } else {
      await quotePosSyncRepository.markSynced(completeQuote.id);
    }

    return NextResponse.json({
      success: true,
      data: completeQuote,
      integrations: {
        pos: {
          synced: syncResult.ok,
          message: syncResult.message,
        },
      },
    });
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create quote' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/quotes
 * Get quotes by email (requires email query parameter)
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter required' },
        { status: 400 }
      );
    }

    const quotes = await quoteRepository.getQuotesByEmail(email);
    return NextResponse.json({
      success: true,
      data: quotes
    });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}
