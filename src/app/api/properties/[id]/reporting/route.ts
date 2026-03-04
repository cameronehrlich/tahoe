import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { differenceInDays, parseISO } from "date-fns";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const { id } = await paramsPromise;
  const isAdmin = await requireAdmin(id);
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  // Get all approved reservations for the year
  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId: id,
      status: "approved",
      checkIn: { gte: yearStart, lte: yearEnd },
    },
    include: { requester: true },
  });

  // Calculate nights per member
  const nightsPerMember: Record<string, { name: string; nights: number }> = {};

  for (const r of reservations) {
    const nights = differenceInDays(parseISO(r.checkOut), parseISO(r.checkIn));
    const key = r.requestedBy;

    if (!nightsPerMember[key]) {
      nightsPerMember[key] = { name: r.requester.fullName, nights: 0 };
    }
    nightsPerMember[key].nights += nights;
  }

  // Holiday reservations (July 4, Thanksgiving week, Christmas week, New Year's)
  const holidayRanges = [
    { name: "July 4th", start: `${year}-07-01`, end: `${year}-07-07` },
    { name: "Thanksgiving", start: `${year}-11-24`, end: `${year}-11-30` },
    { name: "Christmas", start: `${year}-12-22`, end: `${year}-12-28` },
    { name: "New Year's", start: `${year}-12-29`, end: `${year + 1}-01-02` },
  ];

  const holidayUsage = holidayRanges.map((holiday) => {
    const overlapping = reservations.filter(
      (r) => r.checkIn <= holiday.end && r.checkOut >= holiday.start
    );
    return {
      holiday: holiday.name,
      reservations: overlapping.map((r) => ({
        name: r.requester.fullName,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
      })),
    };
  });

  // Cancellations
  const cancellations = await prisma.reservation.findMany({
    where: {
      propertyId: id,
      status: "cancelled",
      checkIn: { gte: yearStart, lte: yearEnd },
    },
    include: { requester: true },
  });

  return NextResponse.json({
    year,
    totalReservations: reservations.length,
    totalNights: Object.values(nightsPerMember).reduce((sum, m) => sum + m.nights, 0),
    nightsPerMember: Object.values(nightsPerMember).sort((a, b) => b.nights - a.nights),
    holidayUsage,
    cancellations: cancellations.map((c) => ({
      name: c.requester.fullName,
      checkIn: c.checkIn,
      checkOut: c.checkOut,
      reason: c.cancelReason,
    })),
  });
}
