import { z } from 'zod';

export const createExpenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  payerId: z.string().uuid('Invalid payer ID'),
});


export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
