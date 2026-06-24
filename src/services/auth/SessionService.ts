/**
 * @purpose Gestiona sesiones de usuario, incluyendo crear nuevas sesiones y validar existentes.
 * @purpose_en Manages user sessions, including creating new sessions and validating existing ones.
 * @refactorable true (contains too many state variables and UI parts)
 * @classification Business Service
 * @complexity Low
 * @fingerprint exports:1,imports:4,sig:17l05y4
 * @lastUpdated 2026-06-23T23:00:31.602Z
 */

import { sessionRepository } from "@/lib/repositories/SessionRepository";
import { UserSessionSchema, type UserSession } from "@/lib/schemas/auth";
import type { EntityId, TenantId } from "@/lib/schemas/common";
import { ObjectId } from "mongodb";

/**
 * 🗝️ SessionService
 * Orchestrates user session lifecycle and security.
 * Ported and refined from ABDAgRAG.
 */
export class SessionService {
  /**
   * 📝 Create a new session after successful login
   */
  static async createSession(payload: {
    userId: string;
    email: string;
    tenantId: string;
    ip?: string;
    userAgent?: string;
  }): Promise<string> {
    const deviceInfo = this.parseUserAgent(payload.userAgent || "");

    const newSession = {
      userId: payload.userId as EntityId,
      email: payload.email,
      tenantId: payload.tenantId as TenantId,
      ip: payload.ip,
      userAgent: payload.userAgent,
      device: deviceInfo,
      isCurrent: false,
      lastActive: new Date(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };

    // Validate with Zod
    const validated = UserSessionSchema.parse(newSession);

    return await sessionRepository.create(validated as UserSession);
  }

  /**
   * 🔍 Validate if a session is active and valid
   */
  static async validateSession(sessionId: string, tenantId: string): Promise<boolean> {
    try {
      const session = await sessionRepository.findOne({ 
        _id: new ObjectId(sessionId),
        tenantId: tenantId as TenantId,
        expiresAt: { $gt: new Date() }
      });

      if (session) {
        // Update lastActive asynchronously (fire and forget)
        sessionRepository.update(sessionId, { lastActive: new Date() }).catch(() => {});
        return true;
      }
      return false;
    } catch (error) {
      console.error('[SessionService] Validation error:', error);
      return false;
    }
  }

  /**
   * 📋 Get all active sessions for a user
   */
  static async getUserSessions(userId: EntityId, tenantId: string): Promise<UserSession[]> {
    return await sessionRepository.findByUserId(userId, tenantId);
  }

  /**
   * 🚫 Revoke a specific session
   */
  static async revokeSession(sessionId: string, userId: EntityId, tenantId: string): Promise<boolean> {
    return await sessionRepository.revoke(sessionId, userId, tenantId);
  }

  /**
   * 🌪️ Revoke all sessions for a user
   */
  static async revokeAllUserSessions(userId: EntityId, tenantId: string): Promise<void> {
    await sessionRepository.revokeAllForUser(userId, tenantId);
  }

  /**
   * 🧹 Revoke all sessions EXCEPT the current one
   */
  static async revokeAllOtherSessions(userId: EntityId, currentSessionId: string, tenantId: string): Promise<void> {
    await sessionRepository.deleteMany({
      userId,
      tenantId: tenantId as TenantId,
      _id: { $ne: new ObjectId(currentSessionId) } as unknown as string
    } as unknown as Partial<UserSession>);
  }

  /**
   * 🖥️ Manual UserAgent Parser (Dependency-free)
   */
  private static parseUserAgent(ua: string): { browser?: string; os?: string; type: "DESKTOP" | "MOBILE" | "TABLET" | "UNKNOWN" } {
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
    const isTablet = /iPad|Tablet/i.test(ua);

    let os = "Unknown";
    if (/Windows/i.test(ua)) os = "Windows";
    else if (/Macintosh|Mac OS X/i.test(ua)) os = "macOS";
    else if (/Android/i.test(ua)) os = "Android";
    else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
    else if (/Linux/i.test(ua)) os = "Linux";

    let browser = "Unknown";
    if (/Chrome/i.test(ua)) browser = "Chrome";
    else if (/Safari/i.test(ua)) browser = "Safari";
    else if (/Firefox/i.test(ua)) browser = "Firefox";
    else if (/Edge/i.test(ua)) browser = "Edge";
    else if (/MSIE|Trident/i.test(ua)) browser = "Internet Explorer";

    return {
      os,
      browser,
      type: isTablet ? "TABLET" : isMobile ? "MOBILE" : "DESKTOP",
    };
  }
}
