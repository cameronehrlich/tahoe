import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();

  const notifications = await prisma.notification.findMany({
    where: { profileId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = await prisma.notification.count({
    where: { profileId: userId, isRead: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: NextRequest) {
  const userId = await getCurrentUserId();
  const data = await request.json();

  if (data.markAllRead) {
    await prisma.notification.updateMany({
      where: { profileId: userId, isRead: false },
      data: { isRead: true },
    });
  } else if (data.id) {
    await prisma.notification.update({
      where: { id: data.id },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ success: true });
}
