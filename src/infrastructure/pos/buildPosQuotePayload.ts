import { Quote } from '@/infrastructure/repositories/QuoteRepository';
import { PosQuoteSyncPayload } from './PosApiClient';

export function buildPosQuotePayload(
  quote: Quote,
  servicePackageName?: string
): PosQuoteSyncPayload {
  return {
    quote_number: quote.quote_number,
    client_name: quote.client_name,
    client_email: quote.client_email,
    client_phone: quote.client_phone,
    service_package_id: quote.service_package_id,
    service_package_name: servicePackageName,
    base_price: quote.base_price,
    discount_percent: quote.discount_percent,
    discount_amount: quote.discount_amount,
    final_price: quote.final_price,
    additional_requirements: quote.additional_requirements,
    status: quote.status,
    valid_until: quote.valid_until ? new Date(quote.valid_until).toISOString() : undefined,
    created_at: quote.created_at ? new Date(quote.created_at).toISOString() : undefined,
    items: (quote.items || []).map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      item_type: item.item_type,
    })),
  };
}
