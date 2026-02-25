import { Request, Response, NextFunction } from 'express';
import { quoteService } from '../../services/quote.service';
import { ApiSuccessResponse } from '@lightspeed/quote-builder-shared/types';
import { CreateQuoteDTO, UpdateQuoteDTO, QuoteStatus } from '@lightspeed/quote-builder-shared/types';

export class QuoteController {
  /**
   * Create a new quote
   * POST /api/v1/quotes
   */
  async createQuote(
    req: Request<{}, {}, CreateQuoteDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // TODO: Get merchant_id from authenticated user (using hardcoded value for now)
      const merchantId = 1;

      const quote = await quoteService.createQuote(merchantId, req.body);

      const response: ApiSuccessResponse = {
        success: true,
        data: quote,
        message: 'Quote created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get quote by ID
   * GET /api/v1/quotes/:quoteId
   */
  async getQuote(
    req: Request<{ quoteId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { quoteId } = req.params;

      const quote = await quoteService.getQuoteById(quoteId);

      const response: ApiSuccessResponse = {
        success: true,
        data: quote
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all quotes for merchant
   * GET /api/v1/quotes?status=draft
   */
  async listQuotes(
    req: Request<{}, {}, {}, { status?: QuoteStatus }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // TODO: Get merchant_id from authenticated user
      const merchantId = 1;
      const { status } = req.query;

      const quotes = await quoteService.getQuotesByMerchant(merchantId, status);

      const response: ApiSuccessResponse = {
        success: true,
        data: quotes
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update quote
   * PUT /api/v1/quotes/:quoteId
   */
  async updateQuote(
    req: Request<{ quoteId: string }, {}, UpdateQuoteDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { quoteId } = req.params;
      // TODO: Get merchant_id from authenticated user
      const merchantId = 1;

      const quote = await quoteService.updateQuote(quoteId, merchantId, req.body);

      const response: ApiSuccessResponse = {
        success: true,
        data: quote,
        message: 'Quote updated successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete quote (cancel)
   * DELETE /api/v1/quotes/:quoteId
   */
  async deleteQuote(
    req: Request<{ quoteId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { quoteId } = req.params;
      // TODO: Get merchant_id from authenticated user
      const merchantId = 1;

      await quoteService.deleteQuote(quoteId, merchantId);

      const response: ApiSuccessResponse = {
        success: true,
        data: null,
        message: 'Quote cancelled successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const quoteController = new QuoteController();
