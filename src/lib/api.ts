// Client-side API helper

const BASE = "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || "Request failed");
  }

  return res.json();
}

export const api = {
  // Auth
  getMe: () => request<{ user: Profile }>("/api/auth/me"),
  getUsers: () => request<{ users: Profile[] }>("/api/auth/users"),
  switchUser: (userId: string) =>
    request<{ user: Profile }>("/api/auth/switch", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  // Properties
  getProperties: () => request<{ properties: PropertyWithRole[] }>("/api/properties"),
  getProperty: (id: string) =>
    request<{ property: Property; role: string }>(`/api/properties/${id}`),
  updateProperty: (id: string, data: Partial<Property>) =>
    request<{ property: Property }>(`/api/properties/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Reservations
  getReservations: (propertyId: string, status?: string) =>
    request<{ reservations: ReservationWithUsers[] }>(
      `/api/properties/${propertyId}/reservations${status ? `?status=${status}` : ""}`
    ),
  createReservation: (propertyId: string, data: CreateReservationData) =>
    request<{ reservation: Reservation }>(`/api/properties/${propertyId}/reservations`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateReservation: (id: string, data: ReservationAction) =>
    request<{ reservation: Reservation }>(`/api/reservations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Members
  getMembers: (propertyId: string) =>
    request<{ members: MemberWithProfile[] }>(`/api/properties/${propertyId}/members`),
  addMember: (propertyId: string, data: { email: string; fullName: string; role?: string }) =>
    request(`/api/properties/${propertyId}/members`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Holds
  getHolds: (propertyId: string) =>
    request<{ holds: HoldWithUsers[] }>(`/api/properties/${propertyId}/holds`),
  createHold: (propertyId: string, data: CreateHoldData) =>
    request(`/api/properties/${propertyId}/holds`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateHold: (id: string, data: Record<string, unknown>) =>
    request(`/api/holds/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteHold: (id: string) =>
    request(`/api/holds/${id}`, { method: "DELETE" }),

  // Waitlist
  getWaitlist: (propertyId: string) =>
    request<{ entries: WaitlistEntryWithProfile[] }>(`/api/properties/${propertyId}/waitlist`),
  addToWaitlist: (propertyId: string, data: { checkIn: string; checkOut: string }) =>
    request(`/api/properties/${propertyId}/waitlist`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Watched ranges
  getWatches: (propertyId: string) =>
    request<{ ranges: WatchedRange[] }>(`/api/properties/${propertyId}/watches`),
  addWatch: (propertyId: string, data: { startDate: string; endDate: string }) =>
    request(`/api/properties/${propertyId}/watches`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Pages
  getPages: (propertyId: string) =>
    request<{ pages: PropertyPage[] }>(`/api/properties/${propertyId}/pages`),

  // Bulletin
  getBulletin: (propertyId: string) =>
    request<{ posts: BulletinPostWithAuthor[] }>(`/api/properties/${propertyId}/bulletin`),
  createBulletinPost: (propertyId: string, data: { title: string; body: string }) =>
    request(`/api/properties/${propertyId}/bulletin`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Logs
  getLogs: (propertyId: string) =>
    request<{ logs: ActivityLogWithActor[] }>(`/api/properties/${propertyId}/logs`),

  // Reporting
  getReporting: (propertyId: string, year?: number) =>
    request<ReportingData>(`/api/properties/${propertyId}/reporting${year ? `?year=${year}` : ""}`),

  // Notifications
  getNotifications: () =>
    request<{ notifications: Notification[]; unreadCount: number }>("/api/notifications"),
  markNotificationsRead: (data: { markAllRead?: boolean; id?: string }) =>
    request("/api/notifications", { method: "PATCH", body: JSON.stringify(data) }),
};

// Types
export interface Profile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface Property {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  cleaningGapDays: number;
  createdAt: string;
}

export interface PropertyWithRole extends Property {
  role: string;
}

export interface Reservation {
  id: string;
  propertyId: string;
  requestedBy: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  status: string;
  notes: string | null;
  adminNotes: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  denialReason: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationWithUsers extends Reservation {
  requester: Profile;
  approver: Profile | null;
}

export interface CreateReservationData {
  checkIn: string;
  checkOut: string;
  guestCount: number;
  notes?: string;
}

export interface ReservationAction {
  action: "approve" | "deny" | "cancel" | "edit";
  reason?: string;
  adminNotes?: string;
  checkIn?: string;
  checkOut?: string;
  guestCount?: number;
  notes?: string;
}

export interface PropertyMember {
  id: string;
  propertyId: string;
  profileId: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
}

export interface MemberWithProfile extends PropertyMember {
  profile: Profile;
}

export interface RecurringHold {
  id: string;
  propertyId: string;
  heldFor: string;
  createdBy: string;
  label: string;
  patternType: string;
  patternConfig: string;
  skippedYears: string;
  createdAt: string;
}

export interface HoldWithUsers extends RecurringHold {
  holder: Profile;
  creator: Profile;
}

export interface CreateHoldData {
  heldFor: string;
  label: string;
  patternType: string;
  patternConfig: Record<string, unknown>;
}

export interface WaitlistEntry {
  id: string;
  propertyId: string;
  profileId: string;
  checkIn: string;
  checkOut: string;
  status: string;
  createdAt: string;
}

export interface WaitlistEntryWithProfile extends WaitlistEntry {
  profile: Profile;
}

export interface WatchedRange {
  id: string;
  propertyId: string;
  profileId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface PropertyPage {
  id: string;
  propertyId: string;
  slug: string;
  title: string;
  content: string | null;
  sortOrder: number;
  isAdminOnly: boolean;
  updatedAt: string;
}

export interface BulletinPost {
  id: string;
  propertyId: string;
  authorId: string;
  title: string;
  body: string | null;
  isArchived: boolean;
  createdAt: string;
}

export interface BulletinPostWithAuthor extends BulletinPost {
  author: Profile;
}

export interface ActivityLog {
  id: string;
  propertyId: string;
  actorId: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: string | null;
  createdAt: string;
}

export interface ActivityLogWithActor extends ActivityLog {
  actor: Profile;
}

export interface Notification {
  id: string;
  profileId: string;
  propertyId: string | null;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  metadata: string | null;
  createdAt: string;
}

export interface ReportingData {
  year: number;
  totalReservations: number;
  totalNights: number;
  nightsPerMember: { name: string; nights: number }[];
  holidayUsage: { holiday: string; reservations: { name: string; checkIn: string; checkOut: string }[] }[];
  cancellations: { name: string; checkIn: string; checkOut: string; reason: string | null }[];
}
