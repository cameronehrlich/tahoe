import { cookies } from "next/headers";
import { prisma } from "./prisma";

// Mock auth: current user is stored as a cookie (profile ID).
// In production, replace with real auth (Supabase Auth, NextAuth, etc.)

const DEFAULT_USER_ID = "a1000000-0000-0000-0000-000000000001"; // Sarah

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("tahoe_user_id")?.value || DEFAULT_USER_ID;

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
  });

  return profile;
}

export async function getCurrentUserId(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get("tahoe_user_id")?.value || DEFAULT_USER_ID;
}

export async function getUserRole(propertyId: string): Promise<string | null> {
  const userId = await getCurrentUserId();

  const membership = await prisma.propertyMember.findUnique({
    where: {
      propertyId_profileId: {
        propertyId,
        profileId: userId,
      },
    },
  });

  if (!membership || !membership.isActive) return null;
  return membership.role;
}

export async function requireAdmin(propertyId: string): Promise<boolean> {
  const role = await getUserRole(propertyId);
  return role === "admin";
}

export async function requireMember(propertyId: string): Promise<boolean> {
  const role = await getUserRole(propertyId);
  return role === "admin" || role === "member";
}
