import React from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function AdminPlaceholder() {
  const location = useLocation();
  const section = location.pathname.split("/admin/")[1] || "this section";
  const title = section.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      <Card className="rounded-xl">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <Construction className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">
            {title} is coming soon
          </p>
          <p className="text-muted-foreground max-w-md">
            This admin section is being built. Check back soon for full functionality.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}