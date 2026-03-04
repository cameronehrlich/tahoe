"use client";

import { useEffect, useState, useRef } from "react";
import { useProperty } from "@/hooks/use-property";
import { api, ReservationWithUsers } from "@/lib/api";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    type: "reservation" | "hold" | "waitlist";
    status?: string;
    requesterName?: string;
    guestCount?: number;
    notes?: string;
  };
}

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  approved: { bg: "#059669", border: "#047857", text: "#ffffff" },
  pending: { bg: "#d97706", border: "#b45309", text: "#ffffff" },
  hold: { bg: "#2563eb", border: "#1d4ed8", text: "#ffffff" },
  waitlist: { bg: "#7c3aed", border: "#6d28d9", text: "#ffffff" },
};

export default function CalendarPage() {
  const { property, propertyId, isAdmin, loading } = useProperty();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [newRequest, setNewRequest] = useState({
    checkIn: "",
    checkOut: "",
    guestCount: 1,
    notes: "",
  });

  const fetchEvents = async () => {
    if (!propertyId) return;

    try {
      const { reservations } = await api.getReservations(propertyId);
      const { holds } = await api.getHolds(propertyId);

      const calEvents: CalendarEvent[] = [];

      // Add reservations
      for (const r of reservations) {
        const colors = STATUS_COLORS[r.status] || STATUS_COLORS.pending;
        calEvents.push({
          id: r.id,
          title: `${r.requester.fullName}${r.status === "pending" ? " (pending)" : ""}`,
          start: r.checkIn,
          end: r.checkOut,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text,
          extendedProps: {
            type: "reservation",
            status: r.status,
            requesterName: r.requester.fullName,
            guestCount: r.guestCount,
            notes: isAdmin ? r.notes || undefined : undefined,
          },
        });
      }

      // Add recurring hold instances (current year and next year)
      const now = new Date();
      for (const hold of holds) {
        const config = JSON.parse(hold.patternConfig);
        const skippedYears: number[] = JSON.parse(hold.skippedYears);

        for (let year = now.getFullYear(); year <= now.getFullYear() + 1; year++) {
          if (skippedYears.includes(year)) continue;

          const instance = resolveHoldDates(config, hold.patternType, year);
          if (!instance) continue;

          const colors = STATUS_COLORS.hold;
          calEvents.push({
            id: `hold-${hold.id}-${year}`,
            title: `${hold.label} (${hold.holder.fullName})`,
            start: instance.checkIn,
            end: instance.checkOut,
            backgroundColor: colors.bg,
            borderColor: colors.border,
            textColor: colors.text,
            extendedProps: {
              type: "hold",
              requesterName: hold.holder.fullName,
            },
          });
        }
      }

      setEvents(calEvents);
    } catch (err) {
      toast.error("Failed to load calendar");
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [propertyId, isAdmin]);

  const handleDateSelect = (info: { startStr: string; endStr: string }) => {
    setNewRequest({
      checkIn: info.startStr,
      checkOut: info.endStr,
      guestCount: 1,
      notes: "",
    });
    setShowRequestDialog(true);
  };

  const handleEventClick = (info: { event: { id: string; extendedProps: Record<string, unknown> } }) => {
    const event = events.find((e) => e.id === info.event.id);
    if (event) setSelectedEvent(event);
  };

  const handleSubmitRequest = async () => {
    if (!propertyId) return;

    try {
      await api.createReservation(propertyId, {
        checkIn: newRequest.checkIn,
        checkOut: newRequest.checkOut,
        guestCount: newRequest.guestCount,
        notes: newRequest.notes || undefined,
      });
      toast.success("Reservation request submitted!");
      setShowRequestDialog(false);
      fetchEvents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit request";
      if (message === "Date conflict") {
        toast.error("Those dates conflict with an existing reservation. You can join the waitlist instead.");
      } else {
        toast.error(message);
      }
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Calendar</h2>
          <p className="text-sm text-muted-foreground">
            Click and drag on dates to request a stay. Click an event to see details.
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Badge className="bg-emerald-600">Approved</Badge>
          <Badge className="bg-amber-600">Pending</Badge>
          <Badge className="bg-blue-600">Hold</Badge>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          selectable={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          events={events}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,dayGridWeek",
          }}
          height="auto"
          eventDisplay="block"
        />
      </div>

      {/* New request dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a Stay</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Check-in</Label>
                <Input
                  type="date"
                  value={newRequest.checkIn}
                  onChange={(e) => setNewRequest({ ...newRequest, checkIn: e.target.value })}
                />
              </div>
              <div>
                <Label>Check-out</Label>
                <Input
                  type="date"
                  value={newRequest.checkOut}
                  onChange={(e) => setNewRequest({ ...newRequest, checkOut: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Number of Guests</Label>
              <Input
                type="number"
                min={1}
                value={newRequest.guestCount}
                onChange={(e) => setNewRequest({ ...newRequest, guestCount: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label>Notes (who is coming, details)</Label>
              <Textarea
                placeholder="Optional notes about your stay..."
                value={newRequest.notes}
                onChange={(e) => setNewRequest({ ...newRequest, notes: e.target.value })}
              />
            </div>
            <Button onClick={handleSubmitRequest} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Submit Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event details dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedEvent?.extendedProps.type === "hold" ? "Recurring Hold" : "Reservation"}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-2">
              <p><strong>Who:</strong> {selectedEvent.extendedProps.requesterName}</p>
              <p><strong>Dates:</strong> {selectedEvent.start} to {selectedEvent.end}</p>
              {selectedEvent.extendedProps.status && (
                <p><strong>Status:</strong>{" "}
                  <Badge
                    className={
                      selectedEvent.extendedProps.status === "approved"
                        ? "bg-emerald-600"
                        : "bg-amber-600"
                    }
                  >
                    {selectedEvent.extendedProps.status}
                  </Badge>
                </p>
              )}
              {selectedEvent.extendedProps.guestCount && (
                <p><strong>Guests:</strong> {selectedEvent.extendedProps.guestCount}</p>
              )}
              {isAdmin && selectedEvent.extendedProps.notes && (
                <div>
                  <strong>Notes:</strong>
                  <p className="text-sm text-muted-foreground mt-1">{selectedEvent.extendedProps.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function resolveHoldDates(
  config: { month: number; day?: number; week?: number; duration_days: number },
  patternType: string,
  year: number
): { checkIn: string; checkOut: string } | null {
  if (patternType === "specific_date" && config.day) {
    const checkIn = `${year}-${String(config.month).padStart(2, "0")}-${String(config.day).padStart(2, "0")}`;
    const endDate = new Date(checkIn);
    endDate.setDate(endDate.getDate() + config.duration_days);
    const checkOut = endDate.toISOString().split("T")[0];
    return { checkIn, checkOut };
  }

  if (patternType === "week_of_month" && config.week) {
    const startDay = (config.week - 1) * 7 + 1;
    const checkIn = `${year}-${String(config.month).padStart(2, "0")}-${String(startDay).padStart(2, "0")}`;
    const endDate = new Date(checkIn);
    endDate.setDate(endDate.getDate() + config.duration_days);
    const checkOut = endDate.toISOString().split("T")[0];
    return { checkIn, checkOut };
  }

  return null;
}
