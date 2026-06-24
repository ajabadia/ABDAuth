/**
 * @purpose Gestiona un conjunto de enumeraciones y utilidades para roles de usuario dentro del proyecto ABDSuite.
 * @purpose_en Defines an enumeration and utility for user roles within the ABDSuite project.
 * @refactorable false
 * @classification Type Definition
 * @complexity Low
 * @fingerprint exports:3,imports:0,sig:1n0kde
 * @lastUpdated 2026-06-21T14:25:43.798Z
 */

export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
    PROFESSOR = 'PROFESSOR',
    SUPER_ADMIN = 'SUPER_ADMIN',
    SUPPORT = 'SUPPORT',
    TECHNICAL = 'TECHNICAL',
    ENGINEERING = 'ENGINEERING',
    ADMINISTRATIVE = 'ADMINISTRATIVE',
    COMPLIANCE = 'COMPLIANCE',
    AGENT = 'AGENT',
    REVIEWER = 'REVIEWER'
}

export const USER_ROLES = Object.values(UserRole);

export type RoleCheck = UserRole | UserRole[];
