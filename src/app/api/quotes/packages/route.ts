import { NextRequest, NextResponse } from 'next/server';
import { quoteRepository } from '@/infrastructure/repositories/QuoteRepository';

/**
 * GET /api/quotes/packages
 * Get all active service packages
 */
export async function GET() {
  try {
    const packages = await quoteRepository.getAllPackages();
    return NextResponse.json({ success: true, data: packages });
  } catch (error) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}
