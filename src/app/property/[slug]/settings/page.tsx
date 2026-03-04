"use client";

import { useEffect, useState } from "react";
import { useProperty } from "@/hooks/use-property";
import { api, Property, HoldWithUsers } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function SettingsPage() {
  const { propertyId, isAdmin, loading } = useProperty();
  const [property, setProperty] = useState<Property | null>(null);
  const [holds, setHolds] = useState<HoldWithUsers[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    address: "",
    cleaningGapDays: 3,
  });

  useEffect(() => {
    if (!propertyId) return;
    api.getProperty(propertyId).then((data) => {
      setProperty(data.property);
      setForm({
        name: data.property.name,
        description: data.property.description || "",
        address: data.property.address || "",
        cleaningGapDays: data.property.cleaningGapDays,
      });
    });
    api.getHolds(propertyId).then((data) => setHolds(data.holds));
  }, [propertyId]);

  const handleSave = async () => {
    if (!propertyId) return;
    try {
      const data = await api.updateProperty(propertyId, form);
      setProperty(data.property);
      setEditing(false);
      toast.success("Settings saved");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleSkipHold = async (holdId: string) => {
    try {
      await api.updateHold(holdId, {
        action: "skip_year",
        year: new Date().getFullYear(),
      });
      toast.success("Hold skipped for this year");
      api.getHolds(propertyId).then((data) => setHolds(data.holds));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

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
    <div className="space-y-6">
      {/* Property settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Property Settings</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (editing) handleSave();
                else setEditing(true);
              }}
            >
              {editing ? "Save" : "Edit"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            {editing ? (
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            ) : (
              <p className="text-sm">{property?.name}</p>
            )}
          </div>
          <div>
            <Label>Address</Label>
            {editing ? (
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            ) : (
              <p className="text-sm">{property?.address || "Not set"}</p>
            )}
          </div>
          <div>
            <Label>Description</Label>
            {editing ? (
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            ) : (
              <p className="text-sm">{property?.description || "Not set"}</p>
            )}
          </div>
          <div>
            <Label>Cleaning Gap (days between stays)</Label>
            {editing ? (
              <Input
                type="number"
                min={0}
                value={form.cleaningGapDays}
                onChange={(e) =>
                  setForm({ ...form, cleaningGapDays: parseInt(e.target.value) || 0 })
                }
              />
            ) : (
              <p className="text-sm">{property?.cleaningGapDays} days</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recurring holds */}
      <Card>
        <CardHeader>
          <CardTitle>Recurring Holds</CardTitle>
        </CardHeader>
        <CardContent>
          {holds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recurring holds</p>
          ) : (
            <div className="space-y-3">
              {holds.map((hold) => {
                const config = JSON.parse(hold.patternConfig);
                const skippedYears: number[] = JSON.parse(hold.skippedYears);
                const currentYear = new Date().getFullYear();
                const isSkippedThisYear = skippedYears.includes(currentYear);

                return (
                  <div
                    key={hold.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{hold.label}</p>
                      <p className="text-sm text-muted-foreground">
                        For: {hold.holder.fullName} — Type: {hold.patternType}
                        {config.month && ` (Month ${config.month})`}
                      </p>
                      {skippedYears.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Skipped: {skippedYears.join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {isSkippedThisYear ? (
                        <Badge variant="secondary">Skipped {currentYear}</Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSkipHold(hold.id)}
                        >
                          Skip {currentYear}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
