import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireMember, getCurrentUserId } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const { id } = await paramsPromise;
  const isMember = await requireMember(id);
  if (!isMember) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const holds = await prisma.recurringHold.findMany({
    where: { propertyId: id },
    include: { holder: true, creator: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ holds });
}

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const { id } = await paramsPromise;
  const isAdmin = await requireAdmin(id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }

  const userId = await getCurrentUserId();
  const { heldFor, label, patternType, patternConfig } = await request.json();

  if (!heldFor || !label || !patternType || !patternConfig) {
    return NextResponse.json(
      { error: "heldFor, label, patternType, and patternConfig are required" },
      { status: 400 }
    );
  }

  const hold = await prisma.recurringHold.create({
    data: {
      propertyId: id,
      heldFor,
      createdBy: userId,
      label,
      patternType,
      patternConfig: JSON.stringify(patternConfig),
    },
    include: { holder: true },
  });

  await logActivity(id, userId, "hold_created", "recurring_hold", hold.id, {
    label,
    heldFor: hold.holder.fullName,
  });

  return NextResponse.json({ hold }, { status: 201 });
}
