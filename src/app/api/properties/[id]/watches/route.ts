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

  const userId = await getCurrentUserId();

  const ranges = await prisma.watchedRange.findMany({
    where: { propertyId: id, profileId: userId },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json({ ranges });
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
  const { startDate, endDate } = await request.json();

  const range = await prisma.watchedRange.create({
    data: {
      propertyId: id,
      profileId: userId,
      startDate,
      endDate,
    },
  });

  return NextResponse.json({ range }, { status: 201 });
}
