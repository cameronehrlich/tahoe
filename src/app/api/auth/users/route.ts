import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// List all users (for mock auth user switcher)
export async function GET() {
  const users = await prisma.profile.findMany({
    orderBy: { fullName: "asc" },
  });
  return NextResponse.json({ users });
}
