import { z } from 'zod';

export const createExpenseSchema = z.object({
  transaction_date: z.string().min(1),
  category: z.string().min(1).max(100),
  amount: z.coerce.number().min(0),
  description: z.string().optional().nullable(),
  uploaded_by_id: z.string().min(1),
  receipt_file: z.string().optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expensesListQuerySchema = z.object({
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional(),
  category: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
