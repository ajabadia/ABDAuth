import { EntityIdSchema, TenantIdSchema } from './core';
import { z } from 'zod';

/**
 * 💸 Billing & Usage Schemas
 */

export const UsageLogSchema = z.object({
 _id: EntityIdSchema.optional(),

 tenantId: TenantIdSchema,
 type: z.enum(['LLM_TOKENS', 'STORAGE_BYTES', 'VECTOR_SEARCH', 'API_REQUEST', 'SAVINGS_TOKENS', 'EMBEDDING_OPS', 'REPORTS_GENERATED', 'RAG_PRECISION']),
 value: z.number(), // Cantidad (tokens, bytes, etc)
 resource: z.string(), // 'gemini-2.5-pro', 'cloudinary', etc
 description: z.string().optional(),
 correlationId: EntityIdSchema.optional(),
 metadata: z.record(z.string(), z.unknown()).optional(),
 timestamp: z.coerce.date().default(() => new Date()),
}).passthrough();
export type UsageLog = z.infer<typeof UsageLogSchema>;

export const TenantSubscriptionStatusSchema = z.enum(['trial', 'active', 'past_due', 'suspended', 'canceled']);
export type TenantSubscriptionStatus = z.infer<typeof TenantSubscriptionStatusSchema>;

export const TenantSubscriptionSchema = z.object({
 planSlug: z.enum(['FREE', 'BASIC', 'PRO', 'ENTERPRISE']).default('FREE'),
 status: TenantSubscriptionStatusSchema.default('trial'),

 // Stripe Integration
 stripeCustomerId: z.string().optional().nullable(),
 stripeSubscriptionId: z.string().optional().nullable(),

 // Limits Overrides
 overrides: z.record(z.string(), z.unknown()).default({}),

 // Dates
 trialEndsAt: z.coerce.date().optional().nullable(),
 currentPeriodStart: z.coerce.date().optional().nullable(),
 currentPeriodEnd: z.coerce.date().optional().nullable(),
 canceledAt: z.coerce.date().optional().nullable(),
 suspendedAt: z.coerce.date().optional().nullable(),

 createdAt: z.coerce.date().default(() => new Date()),
 updatedAt: z.coerce.date().default(() => new Date()),
});
export type TenantSubscription = z.infer<typeof TenantSubscriptionSchema>;
