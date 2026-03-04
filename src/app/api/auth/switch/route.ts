import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Mock auth: switch current user
export async function POST(request: NextRequest) {
  const { userId } = await request.json();

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
  });

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const response = NextResponse.json({ user: profile });
  response.cookies.set("tahoe_user_id", userId, {
    path: "/",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}
