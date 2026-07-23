import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['owner', 'designer', 'crew', 'design_reviewer']),
  phone: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(['owner', 'designer', 'crew', 'design_reviewer']).optional(),
});

export const usersListQuerySchema = z.object({
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional(),
  search: z.string().optional(),
  role: z.enum(['owner', 'designer', 'crew', 'design_reviewer']).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
