-- Migration: 001_initial_schema
-- Description: Create initial database schema for quotes, quote items, and quote payments
-- Created: 2026-02-24

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number VARCHAR(50) UNIQUE NOT NULL,
  merchant_id INTEGER NOT NULL,
  customer_id INTEGER,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'converted', 'cancelled')),
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  expiry_date TIMESTAMP,
  converted_at TIMESTAMP,
  converted_order_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version INTEGER NOT NULL DEFAULT 1
);

-- Create index on merchant_id for faster lookups
CREATE INDEX idx_quotes_merchant_id ON quotes(merchant_id);

-- Create index on customer_id for faster lookups
CREATE INDEX idx_quotes_customer_id ON quotes(customer_id);

-- Create index on quote_number for faster lookups
CREATE INDEX idx_quotes_quote_number ON quotes(quote_number);

-- Create index on status for filtering
CREATE INDEX idx_quotes_status ON quotes(status);

-- Create quote_items table
CREATE TABLE IF NOT EXISTS quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_sku VARCHAR(100),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL,
  line_total_cents INTEGER NOT NULL,
  tax_rate DECIMAL(5, 4),
  tax_cents INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on quote_id for faster joins
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);

-- Create quote_payments table
CREATE TABLE IF NOT EXISTS quote_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  payment_id VARCHAR(255) UNIQUE NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method VARCHAR(50),
  payment_gateway VARCHAR(50),
  gateway_transaction_id VARCHAR(255),
  processed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on quote_id for faster joins
CREATE INDEX idx_quote_payments_quote_id ON quote_payments(quote_id);

-- Create index on payment_id for faster lookups
CREATE INDEX idx_quote_payments_payment_id ON quote_payments(payment_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_items_updated_at
  BEFORE UPDATE ON quote_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_payments_updated_at
  BEFORE UPDATE ON quote_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  migration_name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Record this migration
INSERT INTO schema_migrations (migration_name) VALUES ('001_initial_schema')
ON CONFLICT (migration_name) DO NOTHING;
