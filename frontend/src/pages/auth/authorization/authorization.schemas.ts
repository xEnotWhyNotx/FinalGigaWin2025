// schemas/authSchema.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Введите email или логин'),
  password: z.string().min(1, 'Введите пароль'),
});

export type LoginFormData = z.infer<typeof loginSchema>;