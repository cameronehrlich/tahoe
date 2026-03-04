import { getPrisma } from "./prisma";

type NotificationType =
  | "request_submitted"
  | "request_approved"
  | "request_denied"
  | "request_modified"
  | "reservation_cancelled"
  | "dates_opened"
  | "waitlist_available"
  | "hold_skipped"
  | "member_invited"
  | "pending_reminder";

interface NotifyParams {
  profileId: string;
  propertyId: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export async function notify(params: NotifyParams) {
  const prisma = await getPrisma();
  // Check if user has in-app notifications enabled
  const prefs = await prisma.notificationPref.findUnique({
    where: { profileId: params.profileId },
  });

  if (prefs && !prefs.inAppEnabled) return;

  await prisma.notification.create({
    data: {
      profileId: params.profileId,
      propertyId: params.propertyId,
      type: params.type,
      title: params.title,
      body: params.body,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });

  // Email sending would go here in v2
  // if (prefs?.emailEnabled) { sendEmail(...) }
}

export async function notifyAdmins(
  propertyId: string,
  type: NotificationType,
  title: string,
  body: string,
  excludeUserId?: string
) {
  const prisma = await getPrisma();
  const admins = await prisma.propertyMember.findMany({
    where: {
      propertyId,
      role: "admin",
      isActive: true,
      ...(excludeUserId ? { profileId: { not: excludeUserId } } : {}),
    },
  });

  for (const admin of admins) {
    await notify({
      profileId: admin.profileId,
      propertyId,
      type,
      title,
      body,
    });
  }
}

// Check if any waitlist entries or watched ranges match newly opened dates
export async function notifyWatchersForOpenDates(
  propertyId: string,
  checkIn: string,
  checkOut: string
) {
  const prisma = await getPrisma();
  // Find active waitlist entries that overlap with the opened dates
  const waitlistEntries = await prisma.waitlistEntry.findMany({
    where: {
      propertyId,
      status: "active",
      checkIn: { lte: checkOut },
      checkOut: { gte: checkIn },
    },
    include: { profile: true },
  });

  for (const entry of waitlistEntries) {
    await notify({
      profileId: entry.profileId,
      propertyId,
      type: "waitlist_available",
      title: "Dates May Be Available",
      body: `Dates ${checkIn} to ${checkOut} may now be available. An admin will review your waitlist request.`,
    });
  }

  // Find active watched ranges that overlap
  const watchedRanges = await prisma.watchedRange.findMany({
    where: {
      propertyId,
      isActive: true,
      startDate: { lte: checkOut },
      endDate: { gte: checkIn },
    },
    include: { profile: true },
  });

  for (const range of watchedRanges) {
    await notify({
      profileId: range.profileId,
      propertyId,
      type: "dates_opened",
      title: "Watched Dates Now Open",
      body: `Dates you're watching (${range.startDate} to ${range.endDate}) may now be available.`,
    });
  }

  // Notify admins about potential waitlist fulfillment
  if (waitlistEntries.length > 0) {
    await notifyAdmins(
      propertyId,
      "waitlist_available",
      "Waitlisted Dates Available",
      `${waitlistEntries.length} waitlist ${waitlistEntries.length === 1 ? "entry" : "entries"} may be fulfillable for dates ${checkIn} to ${checkOut}.`
    );
  }
}
