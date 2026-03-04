"use client";

import { useEffect, useState } from "react";
import { useProperty } from "@/hooks/use-property";
import { api, PropertyPage } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

export default function ContactsPage() {
  const { propertyId, loading } = useProperty();
  const [page, setPage] = useState<PropertyPage | null>(null);

  useEffect(() => {
    if (!propertyId) return;
    api.getPages(propertyId).then((data) => {
      const p = data.pages.find((p) => p.slug === "contacts");
      setPage(p || null);
    });
  }, [propertyId]);

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Emergency Contacts</h2>
      {page?.content ? (
        <Card>
          <CardContent className="py-6 prose prose-stone max-w-none">
            <div dangerouslySetInnerHTML={{ __html: page.content }} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No emergency contacts have been added yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
