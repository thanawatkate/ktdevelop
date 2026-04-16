import { NextRequest, NextResponse } from 'next/server';
import { quoteRepository } from '@/infrastructure/repositories/QuoteRepository';
/**
 * GET /api/quotes/[id]
 * Get quote by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const id = parseInt(params.id, 10);
  
  try {
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid quote ID' },
        { status: 400 }
      );
    }

    const quote = await quoteRepository.getQuoteById(id);
    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: quote
    });
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}
