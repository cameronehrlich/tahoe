import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, getCurrentUserId, getUserRole } from "@/lib/auth";
import { findConflicts } from "@/lib/calendar";
import { notify, notifyAdmins, notifyWatchersForOpenDates } from "@/lib/notifications";
import { logActivity } from "@/lib/activity";

export async function PATCH(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  const { id } = await paramsPromise;
  const reservation = await prisma.reservation.findUnique({
    where: { id: id },
    include: { requester: true, property: true },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = await getCurrentUserId();
  const role = await getUserRole(reservation.propertyId);

  if (!role) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const data = await request.json();
  const { action } = data;

  switch (action) {
    case "approve": {
      if (role !== "admin") {
        return NextResponse.json({ error: "Admin required" }, { status: 403 });
      }

      const updateData: Record<string, unknown> = {
        status: "approved",
        approvedBy: userId,
        approvedAt: new Date(),
        adminNotes: data.adminNotes || reservation.adminNotes,
      };

      // Admin can modify dates before approving
      if (data.checkIn || data.checkOut) {
        const newCheckIn = data.checkIn || reservation.checkIn;
        const newCheckOut = data.checkOut || reservation.checkOut;

        const conflicts = await findConflicts(
          reservation.propertyId,
          newCheckIn,
          newCheckOut,
          reservation.id
        );

        if (conflicts.hasConflict) {
          return NextResponse.json(
            { error: "Modified dates conflict with existing reservations" },
            { status: 409 }
          );
        }

        updateData.checkIn = newCheckIn;
        updateData.checkOut = newCheckOut;
      }

      const updated = await prisma.reservation.update({
        where: { id: id },
        data: updateData,
        include: { requester: true },
      });

      await notify({
        profileId: reservation.requestedBy,
        propertyId: reservation.propertyId,
        type: "request_approved",
        title: "Reservation Approved",
        body: `Your request for ${updated.checkIn} to ${updated.checkOut} has been approved.`,
      });

      await logActivity(reservation.propertyId, userId, "reservation_approved", "reservation", id, {
        checkIn: updated.checkIn,
        checkOut: updated.checkOut,
        requester: reservation.requester.fullName,
      });

      return NextResponse.json({ reservation: updated });
    }

    case "deny": {
      if (role !== "admin") {
        return NextResponse.json({ error: "Admin required" }, { status: 403 });
      }

      if (!data.reason) {
        return NextResponse.json({ error: "Reason required for denial" }, { status: 400 });
      }

      const updated = await prisma.reservation.update({
        where: { id: id },
        data: {
          status: "denied",
          denialReason: data.reason,
          adminNotes: data.adminNotes || reservation.adminNotes,
        },
      });

      await notify({
        profileId: reservation.requestedBy,
        propertyId: reservation.propertyId,
        type: "request_denied",
        title: "Reservation Denied",
        body: `Your request for ${reservation.checkIn} to ${reservation.checkOut} was denied. Reason: ${data.reason}`,
      });

      await logActivity(reservation.propertyId, userId, "reservation_denied", "reservation", id, {
        reason: data.reason,
        requester: reservation.requester.fullName,
      });

      return NextResponse.json({ reservation: updated });
    }

    case "cancel": {
      // Members can cancel their own, admins can cancel anyone's
      const isOwner = reservation.requestedBy === userId;
      const isAdmin = role === "admin";

      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }

      if (isAdmin && !isOwner && !data.reason) {
        return NextResponse.json({ error: "Reason required when cancelling another user's reservation" }, { status: 400 });
      }

      const updated = await prisma.reservation.update({
        where: { id: id },
        data: {
          status: "cancelled",
          cancelledBy: userId,
          cancelledAt: new Date(),
          cancelReason: data.reason || "Cancelled by user",
        },
      });

      // Notify the requester if an admin cancelled it
      if (!isOwner) {
        await notify({
          profileId: reservation.requestedBy,
          propertyId: reservation.propertyId,
          type: "reservation_cancelled",
          title: "Reservation Cancelled",
          body: `Your reservation for ${reservation.checkIn} to ${reservation.checkOut} was cancelled. Reason: ${data.reason}`,
        });
      }

      // If was approved, now opens time — notify watchers
      if (reservation.status === "approved") {
        await notifyWatchersForOpenDates(
          reservation.propertyId,
          reservation.checkIn,
          reservation.checkOut
        );
      }

      await logActivity(reservation.propertyId, userId, "reservation_cancelled", "reservation", id, {
        reason: data.reason,
        requester: reservation.requester.fullName,
        previousStatus: reservation.status,
      });

      return NextResponse.json({ reservation: updated });
    }

    case "edit": {
      // Members can edit their own pending requests
      const isOwner = reservation.requestedBy === userId;
      if (!isOwner && role !== "admin") {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
      }
      if (isOwner && reservation.status !== "pending") {
        return NextResponse.json({ error: "Can only edit pending requests" }, { status: 400 });
      }

      const updated = await prisma.reservation.update({
        where: { id: id },
        data: {
          ...(data.checkIn && { checkIn: data.checkIn }),
          ...(data.checkOut && { checkOut: data.checkOut }),
          ...(data.guestCount && { guestCount: data.guestCount }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.adminNotes !== undefined && role === "admin" && { adminNotes: data.adminNotes }),
        },
      });

      return NextResponse.json({ reservation: updated });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
