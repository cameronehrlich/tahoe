import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getCurrentUserId } from "@/lib/auth";
import { notifyWatchersForOpenDates } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";


export async function PATCH(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const { id } = await paramsPromise;
  const hold = await prisma.recurringHold.findUnique({
    where: { id: id },
    include: { holder: true },
  });

  if (!hold) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = await requireAdmin(hold.propertyId);
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }

  const userId = await getCurrentUserId();
  const data = await request.json();

  if (data.action === "skip_year") {
    const year = data.year || new Date().getFullYear();
    const skippedYears: number[] = JSON.parse(hold.skippedYears);

    if (skippedYears.includes(year)) {
      return NextResponse.json({ error: "Year already skipped" }, { status: 400 });
    }

    skippedYears.push(year);

    const updated = await prisma.recurringHold.update({
      where: { id: id },
      data: { skippedYears: JSON.stringify(skippedYears) },
    });

    // Get the dates that were opened by skipping
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    await notifyWatchersForOpenDates(hold.propertyId, yearStart, yearEnd);

    await logActivity(hold.propertyId, userId, "hold_skipped", "recurring_hold", id, {
      label: hold.label,
      year,
      heldFor: hold.holder.fullName,
    });

    return NextResponse.json({ hold: updated });
  }

  // General edit
  const updated = await prisma.recurringHold.update({
    where: { id: id },
    data: {
      ...(data.label && { label: data.label }),
      ...(data.patternConfig && { patternConfig: JSON.stringify(data.patternConfig) }),
      ...(data.heldFor && { heldFor: data.heldFor }),
    },
  });

  await logActivity(hold.propertyId, userId, "hold_edited", "recurring_hold", id, {
    label: updated.label,
  });

  return NextResponse.json({ hold: updated });
}

export async function DELETE(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const { id } = await paramsPromise;
  const hold = await prisma.recurringHold.findUnique({
    where: { id: id },
  });

  if (!hold) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isAdmin = await requireAdmin(hold.propertyId);
  if (!isAdmin) {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }

  await prisma.recurringHold.delete({ where: { id: id } });

  return NextResponse.json({ success: true });
}
