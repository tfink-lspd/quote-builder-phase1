-- Migration: 002_align_schema_with_types
-- Description: Update database schema to match shared TypeScript types
-- Created: 2026-02-24

-- Update quote_items table to match shared types
ALTER TABLE quote_items
  RENAME COLUMN product_name TO name;

ALTER TABLE quote_items
  RENAME COLUMN product_sku TO sku;

ALTER TABLE quote_items
  RENAME COLUMN line_total_cents TO total_cents;

-- Add missing columns
ALTER TABLE quote_items
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE quote_items
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE quote_items
  ADD COLUMN IF NOT EXISTS line_order INTEGER NOT NULL DEFAULT 0;

-- Update quotes table to add missing fields
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS external_notes TEXT;

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS created_by INTEGER;

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Make product_id nullable for custom items
ALTER TABLE quote_items
  ALTER COLUMN product_id DROP NOT NULL;

-- Record this migration
INSERT INTO schema_migrations (migration_name) VALUES ('002_align_schema_with_types')
ON CONFLICT (migration_name) DO NOTHING;
