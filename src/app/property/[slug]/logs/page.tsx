"use client";

import { useEffect, useState } from "react";
import { useProperty } from "@/hooks/use-property";
import { api, ActivityLogWithActor, ReportingData } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";

export default function LogsPage() {
  const { propertyId, isAdmin, loading } = useProperty();
  const [logs, setLogs] = useState<ActivityLogWithActor[]>([]);
  const [reporting, setReporting] = useState<ReportingData | null>(null);

  useEffect(() => {
    if (!propertyId || !isAdmin) return;
    api.getLogs(propertyId).then((data) => setLogs(data.logs));
    api.getReporting(propertyId).then((data) => setReporting(data));
  }, [propertyId, isAdmin]);

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Admin access required.
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Logs & Reports</h2>

      <Tabs defaultValue="reporting">
        <TabsList>
          <TabsTrigger value="reporting">Usage Report</TabsTrigger>
          <TabsTrigger value="logs">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="reporting" className="mt-4 space-y-4">
          {reporting ? (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-2xl font-bold">{reporting.totalReservations}</p>
                    <p className="text-sm text-muted-foreground">Reservations</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-2xl font-bold">{reporting.totalNights}</p>
                    <p className="text-sm text-muted-foreground">Total Nights</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-2xl font-bold">{reporting.cancellations.length}</p>
                    <p className="text-sm text-muted-foreground">Cancellations</p>
                  </CardContent>
                </Card>
              </div>

              {/* Nights per member */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Nights Per Member ({reporting.year})</CardTitle>
                </CardHeader>
                <CardContent>
                  {reporting.nightsPerMember.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No approved reservations this year</p>
                  ) : (
                    <div className="space-y-2">
                      {reporting.nightsPerMember.map((m) => (
                        <div key={m.name} className="flex items-center justify-between">
                          <span className="text-sm">{m.name}</span>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 bg-emerald-500 rounded"
                              style={{
                                width: `${Math.min(
                                  (m.nights / Math.max(...reporting.nightsPerMember.map((n) => n.nights))) * 200,
                                  200
                                )}px`,
                              }}
                            />
                            <span className="text-sm font-medium w-12 text-right">
                              {m.nights} nights
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Holiday usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Holiday Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reporting.holidayUsage.map((h) => (
                      <div key={h.holiday}>
                        <p className="text-sm font-medium">{h.holiday}</p>
                        {h.reservations.length === 0 ? (
                          <p className="text-xs text-muted-foreground ml-4">No reservations</p>
                        ) : (
                          h.reservations.map((r, i) => (
                            <p key={i} className="text-xs text-muted-foreground ml-4">
                              {r.name}: {r.checkIn} to {r.checkOut}
                            </p>
                          ))
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <p className="text-muted-foreground">Loading report...</p>
          )}
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          {logs.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No activity yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">{log.actor.fullName}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {formatAction(log.action)}
                        </span>
                        {log.metadata && (
                          <span className="text-xs text-muted-foreground ml-1">
                            — {formatMetadata(log.metadata)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function formatAction(action: string): string {
  const map: Record<string, string> = {
    reservation_created: "submitted a reservation request",
    reservation_approved: "approved a reservation",
    reservation_denied: "denied a reservation",
    reservation_cancelled: "cancelled a reservation",
    hold_created: "created a recurring hold",
    hold_edited: "edited a recurring hold",
    hold_skipped: "skipped a recurring hold for this year",
    member_added: "added a member",
  };
  return map[action] || action;
}

function formatMetadata(metadata: string): string {
  try {
    const data = JSON.parse(metadata);
    const parts: string[] = [];
    if (data.requester) parts.push(`for ${data.requester}`);
    if (data.dates) parts.push(data.dates);
    if (data.memberName) parts.push(data.memberName);
    if (data.label) parts.push(data.label);
    if (data.reason) parts.push(`"${data.reason}"`);
    return parts.join(", ");
  } catch {
    return "";
  }
}
