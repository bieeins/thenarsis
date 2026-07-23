import { z } from 'zod';

const CATEGORIES = ['supplies', 'hosting', 'domain', 'internet', 'ads', 'equipment maintenance', 'food', 'other'];

export const createExpenseSchema = z.object({
  transaction_date: z.string().min(1),
  category: z.enum(CATEGORIES),
  amount: z.coerce.number().min(0),
  description: z.string().optional().nullable(),
  uploaded_by_id: z.string().min(1),
  receipt_file: z.string().optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export const expensesListQuerySchema = z.object({
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional(),
  category: z.enum(CATEGORIES).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
