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

  const members = await prisma.propertyMember.findMany({
    where: { propertyId: id },
    include: { profile: true },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json({ members });
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
  const { email, fullName, role } = await request.json();

  if (!email || !fullName) {
    return NextResponse.json({ error: "email and fullName required" }, { status: 400 });
  }

  // Find or create profile
  let profile = await prisma.profile.findUnique({ where: { email } });

  if (!profile) {
    profile = await prisma.profile.create({
      data: { fullName, email },
    });
  }

  // Check if already a member
  const existing = await prisma.propertyMember.findUnique({
    where: { propertyId_profileId: { propertyId: id, profileId: profile.id } },
  });

  if (existing) {
    if (!existing.isActive) {
      // Reactivate
      await prisma.propertyMember.update({
        where: { id: existing.id },
        data: { isActive: true, role: role || "member" },
      });
    } else {
      return NextResponse.json({ error: "Already a member" }, { status: 409 });
    }
  } else {
    await prisma.propertyMember.create({
      data: {
        propertyId: id,
        profileId: profile.id,
        role: role || "member",
      },
    });
  }

  await logActivity(id, userId, "member_added", "profile", profile.id, {
    memberName: fullName,
    role: role || "member",
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
