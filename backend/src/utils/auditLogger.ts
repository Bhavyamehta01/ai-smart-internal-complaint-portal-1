import { prisma } from '../config/prisma';

interface AuditLogOptions {
  userId?: string;
  action: string;
  details: string;
  ipAddress?: string;
}

/**
 * Creates an entry in the AuditLog table.
 * Failures are silently swallowed so they never crash a primary operation.
 */
export async function createAuditLog(options: AuditLogOptions): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: options.userId ?? null,
        action: options.action,
        details: options.details,
        ipAddress: options.ipAddress ?? null,
      },
    });
  } catch (err) {
    console.error('[AuditLog Error]:', err);
  }
}
