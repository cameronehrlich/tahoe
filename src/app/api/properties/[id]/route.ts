import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMember, requireAdmin, getCurrentUserId } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const { id } = await paramsPromise;
  const isMember = await requireMember(id);
  if (!isMember) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const property = await prisma.property.findUnique({
    where: { id: id },
  });

  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getCurrentUserId();
  const membership = await prisma.propertyMember.findUnique({
    where: { propertyId_profileId: { propertyId: id, profileId: userId } },
  });

  return NextResponse.json({
    property,
    role: membership?.role,
  });
}

export async function PATCH(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const { id } = await paramsPromise;
  const isAdmin = await requireAdmin(id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }

  const data = await request.json();

  const property = await prisma.property.update({
    where: { id: id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.cleaningGapDays !== undefined && { cleaningGapDays: data.cleaningGapDays }),
    },
  });

  return NextResponse.json({ property });
}
