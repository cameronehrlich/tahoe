"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api, PropertyWithRole } from "@/lib/api";

export function useProperty() {
  const params = useParams();
  const slug = params.slug as string;
  const [property, setProperty] = useState<PropertyWithRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProperties().then((data) => {
      const match = data.properties.find((p) => p.slug === slug);
      setProperty(match || null);
      setLoading(false);
    });
  }, [slug]);

  return {
    property,
    propertyId: property?.id || "",
    role: property?.role || null,
    isAdmin: property?.role === "admin",
    loading,
    slug,
  };
}
