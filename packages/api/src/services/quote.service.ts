import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../database';
import { errors } from '../api/middleware/error.middleware';
import { logger } from '../utils/logger';
import {
  Quote,
  QuoteItem,
  QuoteStatus,
  CreateQuoteDTO,
  UpdateQuoteDTO
} from '@lightspeed/quote-builder-shared/types';

export class QuoteService {
  /**
   * Generate a unique quote number
   * Format: Q-YYYYMMDD-XXXX (e.g., Q-20260224-0001)
   */
  private async generateQuoteNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    // Get count of quotes created today
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM quotes
       WHERE quote_number LIKE $1`,
      [`Q-${dateStr}-%`]
    );

    const count = parseInt(result.rows[0]?.count || '0', 10);
    const sequence = (count + 1).toString().padStart(4, '0');

    return `Q-${dateStr}-${sequence}`;
  }

  /**
   * Calculate totals for quote
   */
  private calculateTotals(items: CreateQuoteDTO['items'], taxRate: number = 0) {
    let subtotal = 0;

    const itemsWithTotals = items.map(item => {
      const lineTotal = item.quantity * item.unit_price_cents;
      const itemTaxRate = item.tax_rate || taxRate;
      const taxAmount = Math.round(lineTotal * itemTaxRate);
      subtotal += lineTotal;

      return {
        ...item,
        total_cents: lineTotal,
        tax_cents: taxAmount,
        tax_rate: itemTaxRate
      };
    });

    const tax = Math.round(subtotal * taxRate);
    const total = subtotal + tax;

    return {
      items: itemsWithTotals,
      subtotal_cents: subtotal,
      tax_cents: tax,
      total_cents: total
    };
  }

  /**
   * Create a new quote
   */
  async createQuote(merchantId: number, data: CreateQuoteDTO): Promise<Quote> {
    try {
      logger.info('Creating quote', { merchantId, data });

      // Generate quote number
      const quoteNumber = await this.generateQuoteNumber();

      // TODO: Get tax rate from tax service (using mock for now)
      const taxRate = 0.13; // 13% tax rate for testing

      // Calculate totals
      const { items, subtotal_cents, tax_cents, total_cents } =
        this.calculateTotals(data.items, taxRate);

      // Create quote and items in a transaction
      const quote = await transaction(async (client) => {
        // Insert quote
        const quoteResult = await client.query(
          `INSERT INTO quotes (
            id, quote_number, merchant_id, customer_id, customer_name,
            customer_email, customer_phone, status, subtotal_cents,
            tax_cents, total_cents, notes, expiry_date
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
          ) RETURNING *`,
          [
            uuidv4(),
            quoteNumber,
            merchantId,
            data.customer_id || null,
            data.customer_name || null,
            data.customer_email || null,
            data.customer_phone || null,
            'draft',
            subtotal_cents,
            tax_cents,
            total_cents,
            data.notes || null,
            data.expiry_date || null
          ]
        );

        const createdQuote = quoteResult.rows[0];

        // Insert quote items
        let lineOrder = 0;
        for (const item of items) {
          await client.query(
            `INSERT INTO quote_items (
              id, quote_id, product_id, is_custom, name, description, sku,
              quantity, unit_price_cents, total_cents,
              tax_rate, tax_cents, line_order, notes
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
            )`,
            [
              uuidv4(),
              createdQuote.id,
              item.product_id || null,
              item.is_custom || false,
              item.name,
              item.description || null,
              item.sku || null,
              item.quantity,
              item.unit_price_cents,
              item.total_cents,
              item.tax_rate,
              item.tax_cents,
              lineOrder++,
              item.notes || null
            ]
          );
        }

        return createdQuote;
      });

      logger.info('Quote created successfully', {
        quoteId: quote.id,
        quoteNumber: quote.quote_number
      });

      // Fetch complete quote with items
      return await this.getQuoteById(quote.id);
    } catch (error) {
      logger.error('Failed to create quote', { error, merchantId, data });
      throw errors.internal('Failed to create quote');
    }
  }

  /**
   * Get quote by ID with items and payments
   */
  async getQuoteById(quoteId: string): Promise<Quote> {
    try {
      // Get quote
      const quoteResult = await query<Quote>(
        'SELECT * FROM quotes WHERE id = $1',
        [quoteId]
      );

      if (quoteResult.rows.length === 0) {
        throw errors.notFound('Quote');
      }

      const quote = quoteResult.rows[0];

      // Get quote items
      const itemsResult = await query<QuoteItem>(
        'SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY created_at',
        [quoteId]
      );

      // Get quote payments
      const paymentsResult = await query(
        'SELECT * FROM quote_payments WHERE quote_id = $1 ORDER BY created_at',
        [quoteId]
      );

      return {
        ...quote,
        items: itemsResult.rows,
        payments: paymentsResult.rows
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error;
      }
      logger.error('Failed to get quote', { error, quoteId });
      throw errors.internal('Failed to retrieve quote');
    }
  }

  /**
   * Get all quotes for a merchant
   */
  async getQuotesByMerchant(
    merchantId: number,
    status?: QuoteStatus
  ): Promise<Quote[]> {
    try {
      let sql = 'SELECT * FROM quotes WHERE merchant_id = $1';
      const params: any[] = [merchantId];

      if (status) {
        sql += ' AND status = $2';
        params.push(status);
      }

      sql += ' ORDER BY created_at DESC';

      const result = await query<Quote>(sql, params);

      // For each quote, get items (for list view, we might not need all details)
      const quotes = await Promise.all(
        result.rows.map(async (quote) => {
          const itemsResult = await query<QuoteItem>(
            'SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY created_at',
            [quote.id]
          );
          return {
            ...quote,
            items: itemsResult.rows
          };
        })
      );

      return quotes;
    } catch (error) {
      logger.error('Failed to get quotes', { error, merchantId, status });
      throw errors.internal('Failed to retrieve quotes');
    }
  }

  /**
   * Update quote
   */
  async updateQuote(
    quoteId: string,
    merchantId: number,
    _data: UpdateQuoteDTO
  ): Promise<Quote> {
    try {
      // Verify quote exists and belongs to merchant
      const existingQuote = await this.getQuoteById(quoteId);

      if (existingQuote.merchant_id !== merchantId) {
        throw errors.forbidden('Cannot update quote from another merchant');
      }

      if (existingQuote.status !== 'draft') {
        throw errors.validation(
          'Cannot update quote that is not in draft status'
        );
      }

      // TODO: Implement full update logic with items recalculation

      return await this.getQuoteById(quoteId);
    } catch (error) {
      logger.error('Failed to update quote', { error, quoteId, merchantId });
      throw error;
    }
  }

  /**
   * Delete quote (soft delete by setting status to cancelled)
   */
  async deleteQuote(quoteId: string, merchantId: number): Promise<void> {
    try {
      const quote = await this.getQuoteById(quoteId);

      if (quote.merchant_id !== merchantId) {
        throw errors.forbidden('Cannot delete quote from another merchant');
      }

      await query(
        'UPDATE quotes SET status = $1 WHERE id = $2',
        ['cancelled', quoteId]
      );

      logger.info('Quote deleted', { quoteId, merchantId });
    } catch (error) {
      logger.error('Failed to delete quote', { error, quoteId, merchantId });
      throw error;
    }
  }
}

export const quoteService = new QuoteService();
