"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, PropertyWithRole } from "@/lib/api";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const [properties, setProperties] = useState<PropertyWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProperties()
      .then((data) => setProperties(data.properties))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-stone-800 mb-6">Your Properties</h1>

        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : properties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                You don&apos;t have access to any properties yet.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Ask an admin to invite you to a property.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {properties.map((property) => (
              <Link key={property.id} href={`/property/${property.slug}/calendar`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{property.name}</CardTitle>
                      <Badge
                        variant={property.role === "admin" ? "default" : "secondary"}
                      >
                        {property.role}
                      </Badge>
                    </div>
                    {property.address && (
                      <CardDescription>{property.address}</CardDescription>
                    )}
                  </CardHeader>
                  {property.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {property.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
