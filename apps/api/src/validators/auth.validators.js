import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  passwordConfirm: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['owner', 'designer', 'crew', 'design_reviewer']),
  phone: z.string().optional(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Passwords do not match',
  path: ['passwordConfirm'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});
