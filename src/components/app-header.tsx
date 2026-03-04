"use client";

import Link from "next/link";
import { UserSwitcher } from "./user-switcher";
import { NotificationBell } from "./notification-bell";

export function AppHeader() {
  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold text-emerald-700">Tahoe</span>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            Shared Property Manager
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <UserSwitcher />
        </div>
      </div>
    </header>
  );
}
