import { z } from 'zod';

export const createExpenseCategorySchema = z.object({
  name: z.string().min(1).max(100),
});

export const updateExpenseCategorySchema = z.object({
  name: z.string().min(1).max(100),
});
