import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

// Get all properties the current user has access to
export async function GET() {
  const prisma = await getPrisma();
  const userId = await getCurrentUserId();

  const memberships = await prisma.propertyMember.findMany({
    where: { profileId: userId, isActive: true },
    include: {
      property: true,
    },
  });

  const properties = memberships.map((m) => ({
    ...m.property,
    role: m.role,
  }));

  return NextResponse.json({ properties });
}
