import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMember, requireAdmin, getUserRole } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const { id } = await paramsPromise;
  const isMember = await requireMember(id);
  if (!isMember) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const role = await getUserRole(id);

  const pages = await prisma.propertyPage.findMany({
    where: {
      propertyId: id,
      ...(role !== "admin" ? { isAdminOnly: false } : {}),
    },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json({ pages });
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

  const data = await request.json();

  const page = await prisma.propertyPage.create({
    data: {
      propertyId: id,
      slug: data.slug,
      title: data.title,
      content: data.content || "",
      sortOrder: data.sortOrder || 0,
      isAdminOnly: data.isAdminOnly || false,
    },
  });

  return NextResponse.json({ page }, { status: 201 });
}
