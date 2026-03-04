import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireMember, getCurrentUserId } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const prisma = await getPrisma();
  const { id } = await paramsPromise;
  const isMember = await requireMember(id);
  if (!isMember) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const entries = await prisma.waitlistEntry.findMany({
    where: { propertyId: id },
    include: { profile: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ entries });
}

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const prisma = await getPrisma();
  const { id } = await paramsPromise;
  const isMember = await requireMember(id);
  if (!isMember) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const userId = await getCurrentUserId();
  const { checkIn, checkOut } = await request.json();

  const entry = await prisma.waitlistEntry.create({
    data: {
      propertyId: id,
      profileId: userId,
      checkIn,
      checkOut,
    },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
