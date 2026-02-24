/**
 * Quote Domain Types
 * Shared between frontend and backend
 */

export type QuoteStatus = 'draft' | 'converted' | 'cancelled';

export interface Quote {
  id: string;
  quote_number: string;
  merchant_id: number;
  customer_id?: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  status: QuoteStatus;
  expiry_date?: string; // ISO 8601 date
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  notes?: string;
  external_notes?: string;
  converted_to_order_id?: number;
  items: QuoteItem[];
  payments?: QuotePayment[];
  created_by?: number;
  created_at: string; // ISO 8601 datetime
  updated_at: string; // ISO 8601 datetime
  deleted_at?: string; // ISO 8601 datetime (soft delete)
  version: number;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id?: number;
  is_custom: boolean;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  unit_price_cents: number;
  tax_rate?: number;
  tax_cents: number;
  total_cents: number;
  line_order: number;
  notes?: string;
  created_at: string;
}

export interface QuotePayment {
  id: string;
  quote_id: string;
  payment_request_id: number;
  payment_id?: number;
  amount_cents: number;
  status: 'pending' | 'paid' | 'expired' | 'failed';
  created_at: string;
  paid_at?: string;
}

// Request DTOs (Data Transfer Objects)
export interface CreateQuoteDTO {
  customer_id?: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  items: CreateQuoteItemDTO[];
  notes?: string;
  external_notes?: string;
  expiry_date?: string;
}

export interface CreateQuoteItemDTO {
  product_id?: number;
  is_custom?: boolean;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  unit_price_cents: number;
  tax_rate?: number;
  notes?: string;
}

export interface UpdateQuoteDTO {
  customer_id?: number;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  items?: UpdateQuoteItemDTO[];
  notes?: string;
  external_notes?: string;
  expiry_date?: string;
}

export interface UpdateQuoteItemDTO extends CreateQuoteItemDTO {
  id?: string; // If provided, update existing item
  _action?: 'add' | 'update' | 'delete'; // Explicit action
}

// Response DTOs
export interface QuoteListResponse {
  quotes: Quote[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface QuoteDetailResponse extends Quote {}

// Query parameters
export interface QuoteListParams {
  page?: number;
  limit?: number;
  status?: QuoteStatus;
  customer_id?: number;
  search?: string;
  sort?: string;
  from_date?: string;
  to_date?: string;
}
