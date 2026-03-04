import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

// List all users (for mock auth user switcher)
export async function GET() {
  const prisma = await getPrisma();
  const users = await prisma.profile.findMany({
    orderBy: { fullName: "asc" },
  });
  return NextResponse.json({ users });
}
