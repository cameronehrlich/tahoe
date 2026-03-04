import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const prisma = await getPrisma();
  const { id } = await paramsPromise;
  const isAdmin = await requireAdmin(id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }

  const logs = await prisma.activityLog.findMany({
    where: { propertyId: id },
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ logs });
}
