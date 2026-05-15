import { z } from 'zod';

export const IndustryTypeSchema = z.enum([
    'ELEVATORS',
    'LEGAL',
    'BANKING',
    'INSURANCE',
    'FINANCE',
    'RETAIL',
    'MANUFACTURING',
    'ENERGY',
    'HEALTHCARE',
    'GOVERNMENT',
    'EDUCATION',
    'REAL_ESTATE',
    'IT',
    'MEDICAL',
    'GENERIC'
]);

export type IndustryType = z.infer<typeof IndustryTypeSchema>;

export const ObjectIdSchema = z.string()
    .min(5, "ID must be at least 5 characters") 
    .max(32, "ID must be at most 32 characters") 
    .regex(/^[0-9a-fA-F]{10,24}$|^(platform_master|demo-tenant|abd_global|abd-tenant|system|SYSTEM_STUCK_DETECTOR|system-recovery|unknown)$/, "Invalid ID format");

export const EntityIdSchema = ObjectIdSchema.brand<"EntityId">();
export type EntityId = z.infer<typeof EntityIdSchema>;

export const TenantIdSchema = ObjectIdSchema.brand<"TenantId">();
export type TenantId = z.infer<typeof TenantIdSchema>;

export const DateSchema = z.union([z.date(), z.string().datetime()]).nullish();

export const AuditMetadataSchema = z.object({
    createdAt: DateSchema,
    updatedAt: DateSchema,
    createdBy: EntityIdSchema.nullish(),
    updatedBy: EntityIdSchema.nullish(),
});

export const TenantScopedSchema = AuditMetadataSchema.extend({
    tenantId: TenantIdSchema,
    isDeleted: z.boolean().default(false),
    deletedAt: DateSchema,
});

export type TenantScoped = z.infer<typeof TenantScopedSchema>;

export const JobPayloadSchema = z.object({
    tenantId: TenantIdSchema,
    userId: EntityIdSchema,
    correlationId: z.string().uuid(),
    data: z.record(z.string(), z.unknown()).optional(),
});
