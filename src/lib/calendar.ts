import { prisma } from "./prisma";
import { addDays, parseISO } from "date-fns";

// Check if two date ranges conflict, considering the cleaning gap
export function datesConflict(
  checkIn1: string,
  checkOut1: string,
  checkIn2: string,
  checkOut2: string,
  cleaningGapDays: number
): boolean {
  const start1 = parseISO(checkIn1);
  const end1 = addDays(parseISO(checkOut1), cleaningGapDays);
  const start2 = parseISO(checkIn2);
  const end2 = addDays(parseISO(checkOut2), cleaningGapDays);

  return start1 < end2 && start2 < end1;
}

// Find conflicts for a proposed reservation
export async function findConflicts(
  propertyId: string,
  checkIn: string,
  checkOut: string,
  excludeReservationId?: string
) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) throw new Error("Property not found");

  const gap = property.cleaningGapDays;

  // Check approved reservations
  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId,
      status: "approved",
      ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
    },
    include: { requester: true },
  });

  const conflictingReservations = reservations.filter((r) =>
    datesConflict(checkIn, checkOut, r.checkIn, r.checkOut, gap)
  );

  // Check recurring hold instances for the relevant year(s)
  const holdInstances = await getHoldInstancesForRange(propertyId, checkIn, checkOut);
  const conflictingHolds = holdInstances.filter((h) =>
    datesConflict(checkIn, checkOut, h.checkIn, h.checkOut, gap)
  );

  return {
    hasConflict: conflictingReservations.length > 0 || conflictingHolds.length > 0,
    reservations: conflictingReservations,
    holds: conflictingHolds,
  };
}

interface HoldInstance {
  holdId: string;
  label: string;
  heldForName: string;
  checkIn: string;
  checkOut: string;
  year: number;
}

// Generate concrete date instances from recurring holds
export async function getHoldInstancesForRange(
  propertyId: string,
  rangeStart: string,
  rangeEnd: string
): Promise<HoldInstance[]> {
  const holds = await prisma.recurringHold.findMany({
    where: { propertyId },
    include: { holder: true },
  });

  const instances: HoldInstance[] = [];
  const startYear = parseISO(rangeStart).getFullYear();
  const endYear = parseISO(rangeEnd).getFullYear();

  for (const hold of holds) {
    const config = JSON.parse(hold.patternConfig);
    const skippedYears: number[] = JSON.parse(hold.skippedYears);

    for (let year = startYear; year <= endYear; year++) {
      if (skippedYears.includes(year)) continue;

      const instance = resolveHoldDates(config, hold.patternType, year);
      if (!instance) continue;

      // Check if instance overlaps with range
      if (instance.checkIn <= rangeEnd && instance.checkOut >= rangeStart) {
        instances.push({
          holdId: hold.id,
          label: hold.label,
          heldForName: hold.holder.fullName,
          checkIn: instance.checkIn,
          checkOut: instance.checkOut,
          year,
        });
      }
    }
  }

  return instances;
}

function resolveHoldDates(
  config: { month: number; day?: number; week?: number; duration_days: number },
  patternType: string,
  year: number
): { checkIn: string; checkOut: string } | null {
  if (patternType === "specific_date" && config.day) {
    const checkIn = `${year}-${String(config.month).padStart(2, "0")}-${String(config.day).padStart(2, "0")}`;
    const checkOutDate = addDays(parseISO(checkIn), config.duration_days);
    const checkOut = checkOutDate.toISOString().split("T")[0];
    return { checkIn, checkOut };
  }

  if (patternType === "week_of_month" && config.week) {
    // Find the first day of the Nth week of the month
    // Week 1 = first 7 days, Week 2 = days 8-14, etc.
    const startDay = (config.week - 1) * 7 + 1;
    const checkIn = `${year}-${String(config.month).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`;
    const checkOutDate = addDays(parseISO(checkIn), config.duration_days);
    const checkOut = checkOutDate.toISOString().split("T")[0];
    return { checkIn, checkOut };
  }

  return null;
}

// Get all calendar events for a property within a date range
export async function getCalendarEvents(
  propertyId: string,
  rangeStart: string,
  rangeEnd: string
) {
  // Approved and pending reservations
  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId,
      status: { in: ["approved", "pending"] },
      checkIn: { lte: rangeEnd },
      checkOut: { gte: rangeStart },
    },
    include: { requester: true },
  });

  // Recurring hold instances
  const holdInstances = await getHoldInstancesForRange(propertyId, rangeStart, rangeEnd);

  // Waitlist entries
  const waitlistEntries = await prisma.waitlistEntry.findMany({
    where: {
      propertyId,
      status: "active",
      checkIn: { lte: rangeEnd },
      checkOut: { gte: rangeStart },
    },
    include: { profile: true },
  });

  return { reservations, holdInstances, waitlistEntries };
}
