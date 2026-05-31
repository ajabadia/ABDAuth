import { z } from 'zod';

/**
 * 🎫 Federated Token Schema
 */
export const TokenExchangeSchema = z.object({
  code: z.string().min(1),
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
  redirect_uri: z.string().url().optional(),
});

export type TokenExchangeInput = z.infer<typeof TokenExchangeSchema>;
