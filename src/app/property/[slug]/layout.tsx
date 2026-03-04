"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { api, Property } from "@/lib/api";
import { AppHeader } from "@/components/app-header";
import { Badge } from "@/components/ui/badge";

const memberNav = [
  { href: "calendar", label: "Calendar" },
  { href: "requests", label: "Requests" },
  { href: "waitlist", label: "Waitlist" },
  { href: "rules", label: "House Rules" },
  { href: "contacts", label: "Contacts" },
  { href: "maintenance", label: "Maintenance" },
  { href: "bulletin", label: "Bulletin" },
];

const adminNav = [
  { href: "members", label: "Members" },
  { href: "settings", label: "Settings" },
  { href: "logs", label: "Logs & Reports" },
];

export default function PropertyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const slug = params.slug as string;

  const [property, setProperty] = useState<Property | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Look up property by slug to get its ID
    api.getProperties().then((data) => {
      const match = data.properties.find((p) => p.slug === slug);
      if (match) {
        setProperty(match);
        setRole((match as { role: string }).role);
      }
    });
  }, [slug]);

  const currentSection = pathname.split("/").pop();

  return (
    <div className="min-h-screen">
      <AppHeader />

      {/* Property header */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              Properties
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="font-semibold text-stone-800">
              {property?.name || "Loading..."}
            </h1>
            {role && (
              <Badge variant={role === "admin" ? "default" : "secondary"} className="text-xs">
                {role}
              </Badge>
            )}
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto pb-0">
            {memberNav.map((item) => (
              <Link
                key={item.href}
                href={`/property/${slug}/${item.href}`}
                className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                  currentSection === item.href
                    ? "border-emerald-600 text-emerald-700 font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {role === "admin" &&
              adminNav.map((item) => (
                <Link
                  key={item.href}
                  href={`/property/${slug}/${item.href}`}
                  className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                    currentSection === item.href
                      ? "border-emerald-600 text-emerald-700 font-medium"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
          </nav>
        </div>
      </div>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
