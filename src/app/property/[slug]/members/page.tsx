"use client";

import { useEffect, useState } from "react";
import { useProperty } from "@/hooks/use-property";
import { api, MemberWithProfile } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function MembersPage() {
  const { propertyId, isAdmin, loading } = useProperty();
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newMember, setNewMember] = useState({ fullName: "", email: "", role: "member" });

  const fetchMembers = async () => {
    if (!propertyId) return;
    const data = await api.getMembers(propertyId);
    setMembers(data.members);
  };

  useEffect(() => {
    fetchMembers();
  }, [propertyId]);

  const handleAdd = async () => {
    if (!propertyId || !newMember.fullName || !newMember.email) return;
    try {
      await api.addMember(propertyId, newMember);
      toast.success("Member added");
      setShowAdd(false);
      setNewMember({ fullName: "", email: "", role: "member" });
      fetchMembers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Admin access required to manage members.
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Members</h2>
        <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-700">
          Add Member
        </Button>
      </div>

      <div className="space-y-2">
        {members.map((m) => (
          <Card key={m.id}>
            <CardContent className="py-3 flex items-center justify-between">
              <div>
                <span className="font-medium">{m.profile.fullName}</span>
                <span className="text-sm text-muted-foreground ml-2">{m.profile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={m.role === "admin" ? "default" : "secondary"}>
                  {m.role}
                </Badge>
                {!m.isActive && (
                  <Badge variant="outline" className="text-stone-400">
                    Inactive
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Full Name</Label>
              <Input
                value={newMember.fullName}
                onChange={(e) => setNewMember({ ...newMember, fullName: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Select
                value={newMember.role}
                onValueChange={(v) => setNewMember({ ...newMember, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} className="w-full bg-emerald-600 hover:bg-emerald-700">
              Add Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
