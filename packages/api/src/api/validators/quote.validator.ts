import Joi from 'joi';

export const createQuoteSchema = Joi.object({
  customer_id: Joi.number().integer().positive().optional(),
  customer_name: Joi.string().max(255).optional(),
  customer_email: Joi.string().email().max(255).optional(),
  customer_phone: Joi.string().max(50).optional(),
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.number().integer().positive().optional(),
        is_custom: Joi.boolean().optional().default(false),
        name: Joi.string().max(255).required(),
        description: Joi.string().optional(),
        sku: Joi.string().max(100).optional(),
        quantity: Joi.number().integer().positive().required(),
        unit_price_cents: Joi.number().integer().min(0).required(),
        tax_rate: Joi.number().min(0).max(1).optional(),
        notes: Joi.string().optional()
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'Quote must have at least one item'
    }),
  notes: Joi.string().optional(),
  expiry_date: Joi.date().iso().greater('now').optional()
}).messages({
  'any.required': '{#label} is required',
  'number.positive': '{#label} must be a positive number',
  'string.email': '{#label} must be a valid email address'
});

export const updateQuoteSchema = Joi.object({
  customer_id: Joi.number().integer().positive().optional(),
  customer_name: Joi.string().max(255).optional(),
  customer_email: Joi.string().email().max(255).optional(),
  customer_phone: Joi.string().max(50).optional(),
  items: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().uuid().optional(),
        product_id: Joi.number().integer().positive().optional(),
        is_custom: Joi.boolean().optional(),
        name: Joi.string().max(255).required(),
        description: Joi.string().optional(),
        sku: Joi.string().max(100).optional(),
        quantity: Joi.number().integer().positive().required(),
        unit_price_cents: Joi.number().integer().min(0).required(),
        tax_rate: Joi.number().min(0).max(1).optional(),
        notes: Joi.string().optional(),
        _action: Joi.string().valid('add', 'update', 'delete').optional()
      })
    )
    .min(1)
    .optional(),
  notes: Joi.string().optional(),
  external_notes: Joi.string().optional(),
  expiry_date: Joi.date().iso().greater('now').optional()
});

export const quoteIdSchema = Joi.object({
  quoteId: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid quote ID format'
  })
});

export const listQuotesSchema = Joi.object({
  status: Joi.string()
    .valid('draft', 'converted', 'cancelled')
    .optional()
    .messages({
      'any.only': 'Status must be one of: draft, converted, cancelled'
    })
});
