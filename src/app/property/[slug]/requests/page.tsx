"use client";

import { useEffect, useState } from "react";
import { useProperty } from "@/hooks/use-property";
import { api, ReservationWithUsers } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";


const statusColors: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  denied: "bg-red-100 text-red-800",
  cancelled: "bg-stone-100 text-stone-600",
};

export default function RequestsPage() {
  const { propertyId, isAdmin, loading } = useProperty();
  const [reservations, setReservations] = useState<ReservationWithUsers[]>([]);
  const [actionDialog, setActionDialog] = useState<{
    reservation: ReservationWithUsers;
    action: string;
  } | null>(null);
  const [reason, setReason] = useState("");
  const [modifiedCheckIn, setModifiedCheckIn] = useState("");
  const [modifiedCheckOut, setModifiedCheckOut] = useState("");

  const fetchReservations = async () => {
    if (!propertyId) return;
    const data = await api.getReservations(propertyId);
    setReservations(data.reservations);
  };

  useEffect(() => {
    fetchReservations();
  }, [propertyId]);

  const handleAction = async () => {
    if (!actionDialog) return;
    const { reservation, action } = actionDialog;

    try {
      if (action === "approve") {
        await api.updateReservation(reservation.id, {
          action: "approve",
          ...(modifiedCheckIn && { checkIn: modifiedCheckIn }),
          ...(modifiedCheckOut && { checkOut: modifiedCheckOut }),
        });
        toast.success("Reservation approved!");
      } else if (action === "deny") {
        if (!reason.trim()) {
          toast.error("Reason required for denial");
          return;
        }
        await api.updateReservation(reservation.id, {
          action: "deny",
          reason,
        });
        toast.success("Reservation denied");
      } else if (action === "cancel") {
        await api.updateReservation(reservation.id, {
          action: "cancel",
          reason: reason || undefined,
        });
        toast.success("Reservation cancelled");
      }

      setActionDialog(null);
      setReason("");
      setModifiedCheckIn("");
      setModifiedCheckOut("");
      fetchReservations();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  const pending = reservations.filter((r) => r.status === "pending");
  const others = reservations.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Reservation Requests</h2>

      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Pending ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                isAdmin={isAdmin}
                onAction={(action) => {
                  setActionDialog({ reservation: r, action });
                  setModifiedCheckIn(r.checkIn);
                  setModifiedCheckOut(r.checkOut);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No pending requests
          </CardContent>
        </Card>
      )}

      {others.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            All Reservations ({others.length})
          </h3>
          <div className="space-y-3">
            {others.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                isAdmin={isAdmin}
                onAction={(action) => {
                  setActionDialog({ reservation: r, action });
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action dialog */}
      <Dialog open={!!actionDialog} onOpenChange={() => setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "approve" && "Approve Reservation"}
              {actionDialog?.action === "deny" && "Deny Reservation"}
              {actionDialog?.action === "cancel" && "Cancel Reservation"}
            </DialogTitle>
          </DialogHeader>
          {actionDialog && (
            <div className="space-y-4">
              <p className="text-sm">
                <strong>{actionDialog.reservation.requester.fullName}</strong>
                {" — "}
                {actionDialog.reservation.checkIn} to {actionDialog.reservation.checkOut}
                {" — "}
                {actionDialog.reservation.guestCount} guests
              </p>

              {actionDialog.action === "approve" && isAdmin && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    You can modify the dates before approving:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Check-in</Label>
                      <Input
                        type="date"
                        value={modifiedCheckIn}
                        onChange={(e) => setModifiedCheckIn(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Check-out</Label>
                      <Input
                        type="date"
                        value={modifiedCheckOut}
                        onChange={(e) => setModifiedCheckOut(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {(actionDialog.action === "deny" || actionDialog.action === "cancel") && (
                <div>
                  <Label>
                    Reason {actionDialog.action === "deny" ? "(required)" : "(optional)"}
                  </Label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide a reason..."
                  />
                </div>
              )}

              <Button
                onClick={handleAction}
                className={
                  actionDialog.action === "approve"
                    ? "w-full bg-emerald-600 hover:bg-emerald-700"
                    : actionDialog.action === "deny"
                    ? "w-full bg-red-600 hover:bg-red-700"
                    : "w-full"
                }
              >
                {actionDialog.action === "approve" && "Approve"}
                {actionDialog.action === "deny" && "Deny"}
                {actionDialog.action === "cancel" && "Cancel Reservation"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReservationCard({
  reservation,
  isAdmin,
  onAction,
}: {
  reservation: ReservationWithUsers;
  isAdmin: boolean;
  onAction: (action: string) => void;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{reservation.requester.fullName}</span>
              <Badge className={statusColors[reservation.status] || ""}>
                {reservation.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {reservation.checkIn} to {reservation.checkOut} — {reservation.guestCount} guests
            </p>
            {reservation.notes && !isAdmin && (
              <p className="text-sm text-muted-foreground">{reservation.notes}</p>
            )}
            {isAdmin && reservation.notes && (
              <p className="text-sm text-stone-600">
                <strong>Notes:</strong> {reservation.notes}
              </p>
            )}
            {reservation.denialReason && (
              <p className="text-sm text-red-600">
                <strong>Denied:</strong> {reservation.denialReason}
              </p>
            )}
            {reservation.cancelReason && (
              <p className="text-sm text-stone-500">
                <strong>Cancelled:</strong> {reservation.cancelReason}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {reservation.status === "pending" && isAdmin && (
              <>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => onAction("approve")}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onAction("deny")}
                >
                  Deny
                </Button>
              </>
            )}
            {reservation.status === "approved" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction("cancel")}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
