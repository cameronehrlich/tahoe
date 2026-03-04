"use client";

import { useEffect, useState } from "react";
import { useProperty } from "@/hooks/use-property";
import { api, WaitlistEntryWithProfile, WatchedRange } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function WaitlistPage() {
  const { propertyId, loading } = useProperty();
  const [waitlist, setWaitlist] = useState<WaitlistEntryWithProfile[]>([]);
  const [watches, setWatches] = useState<WatchedRange[]>([]);
  const [newWaitlist, setNewWaitlist] = useState({ checkIn: "", checkOut: "" });
  const [newWatch, setNewWatch] = useState({ startDate: "", endDate: "" });

  const fetchData = async () => {
    if (!propertyId) return;
    const [wl, wr] = await Promise.all([
      api.getWaitlist(propertyId),
      api.getWatches(propertyId),
    ]);
    setWaitlist(wl.entries);
    setWatches(wr.ranges);
  };

  useEffect(() => {
    fetchData();
  }, [propertyId]);

  const handleAddWaitlist = async () => {
    if (!propertyId || !newWaitlist.checkIn || !newWaitlist.checkOut) return;
    try {
      await api.addToWaitlist(propertyId, newWaitlist);
      toast.success("Added to waitlist");
      setNewWaitlist({ checkIn: "", checkOut: "" });
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleAddWatch = async () => {
    if (!propertyId || !newWatch.startDate || !newWatch.endDate) return;
    try {
      await api.addWatch(propertyId, newWatch);
      toast.success("Watch added");
      setNewWatch({ startDate: "", endDate: "" });
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Waitlist Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Waitlist</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Join the waitlist for dates that are currently booked. You&apos;ll be notified if they open up.
        </p>

        <Card className="mb-4">
          <CardContent className="py-4">
            <div className="flex gap-3 items-end">
              <div>
                <Label>Check-in</Label>
                <Input
                  type="date"
                  value={newWaitlist.checkIn}
                  onChange={(e) => setNewWaitlist({ ...newWaitlist, checkIn: e.target.value })}
                />
              </div>
              <div>
                <Label>Check-out</Label>
                <Input
                  type="date"
                  value={newWaitlist.checkOut}
                  onChange={(e) => setNewWaitlist({ ...newWaitlist, checkOut: e.target.value })}
                />
              </div>
              <Button onClick={handleAddWaitlist} className="bg-emerald-600 hover:bg-emerald-700">
                Add to Waitlist
              </Button>
            </div>
          </CardContent>
        </Card>

        {waitlist.length === 0 ? (
          <p className="text-sm text-muted-foreground">No waitlist entries</p>
        ) : (
          <div className="space-y-2">
            {waitlist.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-medium">{entry.profile.fullName}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {entry.checkIn} to {entry.checkOut}
                    </span>
                  </div>
                  <Badge variant={entry.status === "active" ? "default" : "secondary"}>
                    {entry.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Watched Ranges Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Watch Dates</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Watch a date range to be notified when those dates become available.
        </p>

        <Card className="mb-4">
          <CardContent className="py-4">
            <div className="flex gap-3 items-end">
              <div>
                <Label>From</Label>
                <Input
                  type="date"
                  value={newWatch.startDate}
                  onChange={(e) => setNewWatch({ ...newWatch, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>To</Label>
                <Input
                  type="date"
                  value={newWatch.endDate}
                  onChange={(e) => setNewWatch({ ...newWatch, endDate: e.target.value })}
                />
              </div>
              <Button onClick={handleAddWatch} className="bg-emerald-600 hover:bg-emerald-700">
                Watch Dates
              </Button>
            </div>
          </CardContent>
        </Card>

        {watches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No watched date ranges</p>
        ) : (
          <div className="space-y-2">
            {watches.map((range) => (
              <Card key={range.id}>
                <CardContent className="py-3">
                  <span className="text-sm">
                    Watching: {range.startDate} to {range.endDate}
                  </span>
                  {range.isActive && (
                    <Badge className="ml-2 bg-emerald-100 text-emerald-800">Active</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
