import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireMember, getCurrentUserId } from "@/lib/auth";
import { findConflicts } from "@/lib/calendar";
import { notifyAdmins } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";

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

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId: id,
      ...(status ? { status } : {}),
    },
    include: { requester: true, approver: true },
    orderBy: { checkIn: "asc" },
  });

  return NextResponse.json({ reservations });
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
  const { checkIn, checkOut, guestCount, notes } = await request.json();

  if (!checkIn || !checkOut || !guestCount) {
    return NextResponse.json(
      { error: "checkIn, checkOut, and guestCount are required" },
      { status: 400 }
    );
  }

  if (checkOut <= checkIn) {
    return NextResponse.json(
      { error: "Check-out must be after check-in" },
      { status: 400 }
    );
  }

  // Check for conflicts
  const conflicts = await findConflicts(id, checkIn, checkOut);

  if (conflicts.hasConflict) {
    return NextResponse.json(
      {
        error: "Date conflict",
        conflicts: {
          reservations: conflicts.reservations.map((r) => ({
            id: r.id,
            checkIn: r.checkIn,
            checkOut: r.checkOut,
            name: r.requester.fullName,
          })),
          holds: conflicts.holds.map((h) => ({
            label: h.label,
            checkIn: h.checkIn,
            checkOut: h.checkOut,
          })),
        },
        suggestion: "waitlist",
      },
      { status: 409 }
    );
  }

  const reservation = await prisma.reservation.create({
    data: {
      propertyId: id,
      requestedBy: userId,
      checkIn,
      checkOut,
      guestCount,
      notes,
      status: "pending",
    },
    include: { requester: true },
  });

  // Notify admins
  await notifyAdmins(
    id,
    "request_submitted",
    "New Reservation Request",
    `${reservation.requester.fullName} has requested ${checkIn} to ${checkOut}.`,
    userId
  );

  await logActivity(id, userId, "reservation_created", "reservation", reservation.id, {
    checkIn,
    checkOut,
    guestCount,
  });

  return NextResponse.json({ reservation }, { status: 201 });
}
