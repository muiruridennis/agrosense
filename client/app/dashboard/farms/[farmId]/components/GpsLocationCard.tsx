// app/dashboard/farms/[farmId]/components/GpsLocationCard.tsx
"use client";

import { MapPin, ExternalLink } from "lucide-react";

interface GpsLocationCardProps {
  geoPoint: {
    type: "Point";
    coordinates: [number, number];
  };
}

export function GpsLocationCard({ geoPoint }: GpsLocationCardProps) {
  const [lng, lat] = geoPoint.coordinates;

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-2.5 border-b px-5 py-4">
        <div className="rounded-lg bg-primary/10 p-2">
          <MapPin className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">GPS Coordinates</h3>
      </div>
      <div className="p-5 space-y-3">
        <div className="rounded-lg bg-muted/30 p-3 text-center font-mono text-sm">
          <p className="text-foreground">
            {lat.toFixed(6)}° N, {lng.toFixed(6)}° E
          </p>
        </div>
        <a
          href={`https://maps.google.com/?q=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-all hover:bg-primary/10"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open in Google Maps
        </a>
        <p className="text-center text-[11px] text-muted-foreground">
          Use these coordinates for precise farm location tracking
        </p>
      </div>
    </div>
  );
}