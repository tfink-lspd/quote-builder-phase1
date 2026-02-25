import { Router } from 'express';
import { quoteController } from '../controllers/quote.controller';
import { validate } from '../middleware/validation.middleware';
import {
  createQuoteSchema,
  updateQuoteSchema,
  quoteIdSchema,
  listQuotesSchema
} from '../validators/quote.validator';

const router = Router();

/**
 * @route   POST /api/v1/quotes
 * @desc    Create a new quote
 * @access  Private (requires authentication - to be implemented)
 */
router.post(
  '/',
  validate(createQuoteSchema, 'body'),
  quoteController.createQuote.bind(quoteController)
);

/**
 * @route   GET /api/v1/quotes
 * @desc    Get all quotes for merchant
 * @access  Private (requires authentication - to be implemented)
 */
router.get(
  '/',
  validate(listQuotesSchema, 'query'),
  quoteController.listQuotes.bind(quoteController)
);

/**
 * @route   GET /api/v1/quotes/:quoteId
 * @desc    Get quote by ID
 * @access  Private (requires authentication - to be implemented)
 */
router.get(
  '/:quoteId',
  validate(quoteIdSchema, 'params'),
  quoteController.getQuote.bind(quoteController)
);

/**
 * @route   PUT /api/v1/quotes/:quoteId
 * @desc    Update quote
 * @access  Private (requires authentication - to be implemented)
 */
router.put(
  '/:quoteId',
  validate(quoteIdSchema, 'params'),
  validate(updateQuoteSchema, 'body'),
  quoteController.updateQuote.bind(quoteController)
);

/**
 * @route   DELETE /api/v1/quotes/:quoteId
 * @desc    Delete (cancel) quote
 * @access  Private (requires authentication - to be implemented)
 */
router.delete(
  '/:quoteId',
  validate(quoteIdSchema, 'params'),
  quoteController.deleteQuote.bind(quoteController)
);

export default router;
