# Tahoe — Shared Vacation Property Manager

## Overview

Tahoe is a web application for families and groups who co-own vacation or second homes. It provides transparent calendars, reservation request workflows, admin approvals, recurring holds, waitlists, in-app notifications, and property information pages.

## V1 Scope (This Build)

### Included
- **Mock authentication** — user switcher (no real auth provider; Supabase Auth can be wired in later)
- **Multi-property support** — users see only properties they have access to
- **Role-based access** — admin vs. member per property
- **Shared calendar** — day-based, check-in/check-out, with FullCalendar
- **Reservation workflow** — submit → pending → approved/denied, with conflict detection
- **Recurring holds** — simple patterns (e.g., "first week of August every year"), skip-this-year
- **Waitlist & watch** — users can waitlist on conflicting dates, watch date ranges
- **In-app notifications** — real notification records, displayed in UI
- **Property content pages** — house rules, emergency contacts, maintenance info, admin bulletin
- **Audit log** — full trail of reservation lifecycle events
- **Reporting** — nights per member, holiday usage, cancellations
- **Seed data** — 2 properties, 1 admin, 2 members, sample reservations

### Deferred (v2+)
- Real Supabase Auth / OAuth / magic links
- Email / SMS / push notifications (architecture is in place)
- File uploads and image management
- Invite links with expiry
- Row-level security policies (schema supports it, policies commented out)
- Mobile app (API layer is ready)

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14+ with App Router |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| UI | shadcn/ui + Tailwind CSS |
| Calendar | FullCalendar |
| State | React hooks + server components where possible |
| API | Next.js Route Handlers (REST-style, mobile-ready) |

---

## Data Model

### Core Tables

```
profiles          — id, full_name, email, avatar_url, created_at
properties        — id, name, slug, description, address, cleaning_gap_days (default 3), created_at
property_members  — id, property_id, profile_id, role (admin|member), is_active, joined_at
reservations      — id, property_id, requested_by, check_in, check_out, guest_count,
                    status (pending|approved|denied|cancelled), notes, admin_notes,
                    approved_by, approved_at, denial_reason, cancelled_by, cancelled_at,
                    cancel_reason, created_at, updated_at
recurring_holds   — id, property_id, held_for, created_by, label, pattern_type,
                    pattern_config (jsonb), skipped_years (int[]), created_at
waitlist_entries  — id, property_id, profile_id, check_in, check_out, status (active|fulfilled|expired),
                    created_at
watched_ranges    — id, property_id, profile_id, start_date, end_date, is_active, created_at
notifications     — id, profile_id, property_id, type, title, body, is_read, metadata (jsonb), created_at
notification_prefs — id, profile_id, email_enabled, in_app_enabled, created_at
property_pages    — id, property_id, slug, title, content (text/html), sort_order, is_admin_only, updated_at
bulletin_posts    — id, property_id, author_id, title, body, is_archived, created_at
activity_logs     — id, property_id, actor_id, action, target_type, target_id, metadata (jsonb), created_at
```

### Pattern Config Examples (recurring_holds)
```json
{ "type": "specific_date", "month": 7, "day": 4, "duration_days": 3 }
{ "type": "week_of_month", "month": 8, "week": 1, "duration_days": 7 }
```

---

## Key Business Rules

### Calendar
- Dates are day-based: check_in is first night, check_out is departure day (no overnight on check_out)
- Default 3-day cleaning gap between stays (configurable per property by admin)
- Same-day turnover disallowed by default

### Reservations
- All member requests start as **pending**
- Admin requests also start as pending (must be approved by another admin)
- If dates conflict with approved reservation or active hold → block submission, offer waitlist
- One admin approval is sufficient
- Admins can modify dates before approving (requester is notified, no reconfirmation needed)
- Admins must provide a reason when editing/denying/cancelling another user's booking
- Members can cancel their own approved bookings

### Conflict & Waitlist
- Conflict = overlapping dates considering cleaning gap
- User offered waitlist if conflict exists
- When time opens (cancellation, skipped hold) → notify waitlisted users and admins

### Recurring Holds
- Generate instances for current + next year on the fly
- "Skip this year" removes only current year instance, opens dates, triggers notifications
- Visible on calendar like approved reservations (different color)

### Notifications (v1 = in-app only)
- Stored in `notifications` table
- Created by business logic when events occur
- Bell icon with unread count in header
- Notification preferences respected (but email sending is stubbed)

---

## Pages & Routes

```
/                           → redirect to /dashboard
/dashboard                  → property selector (cards for each accessible property)
/property/[slug]            → property workspace layout
/property/[slug]/calendar   → shared calendar (default view)
/property/[slug]/requests   → reservation requests list + submit
/property/[slug]/waitlist   → waitlist & watched date ranges
/property/[slug]/rules      → house rules page
/property/[slug]/contacts   → emergency contacts
/property/[slug]/maintenance → maintenance info
/property/[slug]/bulletin   → admin bulletin
/property/[slug]/members    → members management (admin only)
/property/[slug]/settings   → property settings (admin only)
/property/[slug]/logs       → activity logs & reporting (admin only)
```

---

## API Routes

```
GET/POST   /api/properties
GET/PATCH  /api/properties/[id]
GET/POST   /api/properties/[id]/members
GET/POST   /api/properties/[id]/reservations
PATCH      /api/reservations/[id]            (approve/deny/cancel/edit)
GET/POST   /api/properties/[id]/holds
PATCH      /api/holds/[id]                   (edit, skip year)
GET/POST   /api/properties/[id]/waitlist
GET/POST   /api/properties/[id]/watches
GET/POST   /api/properties/[id]/pages
GET/POST   /api/properties/[id]/bulletin
GET        /api/properties/[id]/logs
GET        /api/properties/[id]/reporting
GET/PATCH  /api/notifications
```

---

## UX Notes
- Clean, warm, family-friendly — not corporate
- Earthy/cabin color palette with Tailwind
- Calendar is the hero view — big, clear, color-coded by status
- Status colors: approved=green, pending=amber, hold=blue, waitlist=purple, cancelled=gray
- Responsive: works well on desktop, tablet, mobile
- Simple empty states with friendly copy
- Toast notifications for actions (success/error)
- Bell icon in header for notification center

---

## Setup Requirements
- Node.js 18+
- Supabase project (free tier works)
- Environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- Run migration SQL in Supabase SQL editor
- Run seed SQL for demo data
- `npm install && npm run dev`
