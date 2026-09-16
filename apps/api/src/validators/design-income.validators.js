import { z } from 'zod';

export const createDesignIncomeSchema = z.object({
  order_id: z.string().min(1),
  designer_id: z.string().min(1),
  designer_name: z.string().min(1),
  fee_amount: z.coerce.number().min(0),
  status: z.enum(['pending', 'approved', 'paid']).default('pending'),
  notes: z.string().optional().nullable(),
});

export const updateDesignIncomeSchema = z.object({
  fee_amount: z.coerce.number().min(0).optional(),
  status: z.enum(['pending', 'approved', 'paid']).optional(),
  notes: z.string().optional().nullable(),
});

export const designIncomeListQuerySchema = z.object({
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional(),
  designerId: z.string().optional(),
  status: z.enum(['pending', 'approved', 'paid']).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
