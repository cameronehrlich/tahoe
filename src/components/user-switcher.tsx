"use client";

import { useState, useEffect } from "react";
import { api, Profile } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserSwitcherProps {
  onSwitch?: () => void;
}

export function UserSwitcher({ onSwitch }: UserSwitcherProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  useEffect(() => {
    api.getUsers().then((data) => setUsers(data.users));
    api.getMe().then((data) => setCurrentUser(data.user));
  }, []);

  const handleSwitch = async (userId: string) => {
    const { user } = await api.switchUser(userId);
    setCurrentUser(user);
    onSwitch?.();
    window.location.reload();
  };

  if (!currentUser) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Acting as:</span>
      <Select value={currentUser.id} onValueChange={handleSwitch}>
        <SelectTrigger className="w-[180px] h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
