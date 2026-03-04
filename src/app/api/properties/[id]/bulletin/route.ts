import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireMember, requireAdmin, getCurrentUserId } from "@/lib/auth";

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

  const posts = await prisma.bulletinPost.findMany({
    where: { propertyId: id, isArchived: false },
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ posts });
}

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const prisma = await getPrisma();
  const { id } = await paramsPromise;
  const isAdmin = await requireAdmin(id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }

  const userId = await getCurrentUserId();
  const { title, body } = await request.json();

  const post = await prisma.bulletinPost.create({
    data: {
      propertyId: id,
      authorId: userId,
      title,
      body,
    },
    include: { author: true },
  });

  return NextResponse.json({ post }, { status: 201 });
}
