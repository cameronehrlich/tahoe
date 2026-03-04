import { getPrisma } from "./prisma";

export async function logActivity(
  propertyId: string,
  actorId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>
) {
  const prisma = await getPrisma();
  await prisma.activityLog.create({
    data: {
      propertyId,
      actorId,
      action,
      targetType,
      targetId,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}
