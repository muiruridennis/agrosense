"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Crosshair, Loader2, Globe } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { FarmFormData, farmSchema } from "../types";



// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Africa-first timezone list — most relevant for AgroSense's market.
 * Add more as the product expands.
 */
const TIMEZONES = [
  { value: "Africa/Nairobi",     label: "East Africa Time — Nairobi (EAT, UTC+3)" },
  { value: "Africa/Johannesburg",label: "South Africa Standard — Johannesburg (SAST, UTC+2)" },
  { value: "Africa/Lagos",       label: "West Africa Time — Lagos (WAT, UTC+1)" },
  { value: "Africa/Accra",       label: "Greenwich Mean — Accra (GMT, UTC+0)" },
  { value: "Africa/Cairo",       label: "Eastern European — Cairo (EET, UTC+2)" },
  { value: "Africa/Dar_es_Salaam", label: "East Africa — Dar es Salaam (EAT, UTC+3)" },
  { value: "Africa/Kampala",     label: "East Africa — Kampala (EAT, UTC+3)" },
  { value: "Africa/Kigali",      label: "Central Africa — Kigali (CAT, UTC+2)" },
  { value: "Africa/Addis_Ababa", label: "East Africa — Addis Ababa (EAT, UTC+3)" },
] as const;

const KENYA_COUNTIES = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu",
  "Garissa", "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho",
  "Kiambu", "Kilifi", "Kirinyaga", "Kisii", "Kisumu", "Kitui",
  "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera",
  "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi",
  "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri",
  "Samburu", "Siaya", "Taita-Taveta", "Tana River", "Tharaka-Nithi",
  "Trans-Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot",
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface Farm {
  id: string;
  name: string;
  description?: string;
  areaHectares: number;
  country: string;
  region: string;
  subRegion?: string;
  timezone: string;
  location?: { latitude: number; longitude: number };
}

interface FarmFormProps {
  defaultValues?: Farm;
  onSubmit: (data: FarmFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOCATION METHOD TOGGLE
// ─────────────────────────────────────────────────────────────────────────────

function LocationToggle({
  value,
  onChange,
}: {
  value: "region" | "gps";
  onChange: (v: "region" | "gps") => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg border border-border bg-muted/40 p-1">
      {(["region", "gps"] as const).map((method) => (
        <button
          key={method}
          type="button"
          onClick={() => onChange(method)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150",
            value === method
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {method === "region" ? (
            <>
              <MapPin className="h-3 w-3" /> Region & Address
            </>
          ) : (
            <>
              <Crosshair className="h-3 w-3" /> GPS Coordinates
            </>
          )}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FORM
// ─────────────────────────────────────────────────────────────────────────────

export function FarmForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Save farm",
}: FarmFormProps) {
  const [locationMethod, setLocationMethod] = useState<"region" | "gps">(
    defaultValues?.location ? "gps" : "region",
  );
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const form = useForm<FarmFormData>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      name:         defaultValues?.name         ?? "",
      description:  defaultValues?.description  ?? "",
      country:      defaultValues?.country       ?? "Kenya",
      region:       defaultValues?.region        ?? "",
      subRegion:    defaultValues?.subRegion     ?? "",
      timezone:     defaultValues?.timezone      ?? "Africa/Nairobi",
      areaHectares: defaultValues?.areaHectares ?? undefined,
      location:     defaultValues?.location ?? undefined,
    },
  });

  const handleGetCurrentLocation = () => {
    setLocationError(null);

    if (!("geolocation" in navigator)) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        form.setValue("location", {
          latitude:  parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
        });
        setIsLocating(false);
      },
      (err) => {
        setLocationError(
          err.code === 1
            ? "Location access denied. Please allow location access or enter coordinates manually."
            : "Could not get your location. Please enter coordinates manually.",
        );
        setIsLocating(false);
      },
      { timeout: 10_000, maximumAge: 60_000, enableHighAccuracy: true },
    );
  };

  const handleCoordInput = (
    field: "latitude" | "longitude",
    raw: string,
  ) => {
    const parsed = parseFloat(raw);
    const current = form.getValues("location");

    if (raw === "" || isNaN(parsed)) {
      // Clear the whole location object if both coords would be empty
      const other = field === "latitude" ? current?.longitude : current?.latitude;
      if (other === undefined || isNaN(other)) {
        form.setValue("location", undefined);
      }
      return;
    }

    form.setValue("location", {
      latitude:  field === "latitude"  ? parsed : (current?.latitude  ?? 0),
      longitude: field === "longitude" ? parsed : (current?.longitude ?? 0),
    });
  };

  return (
    <Form {...form}>
      {/*
        The form itself has no max-height — the parent modal/sheet is
        responsible for scroll containment. This prevents content rendering
        outside the modal when tab content changes height.
      */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Farm name ── */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Farm name <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Kamau's Githunguri Dairy Farm"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Description ── */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your farm's main activity, livestock, or crops…"
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Location ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">Farm location</span>
          </div>

          <LocationToggle value={locationMethod} onChange={setLocationMethod} />

          {/* Fixed-height wrapper prevents tab switch from reflowing the modal */}
          <div className="min-h-[120px]">
            {locationMethod === "region" ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* Country — read-only for now; extend to Select when expanding markets */}
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            readOnly
                            className="bg-muted/40 cursor-default focus:ring-0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* County — select from Kenya counties */}
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>County <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select county" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="max-h-56">
                            {KENYA_COUNTIES.map((county) => (
                              <SelectItem key={county} value={county}>
                                {county}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subRegion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-county / ward</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Githunguri" {...field} />
                      </FormControl>
                      <FormDescription>
                        Helps with weather forecasting and advisory services
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {/* GPS auto-detect */}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                    className="gap-1.5 shrink-0"
                  >
                    {isLocating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Crosshair className="h-3.5 w-3.5" />
                    )}
                    {isLocating ? "Locating…" : "Use my location"}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    or enter coordinates manually
                  </span>
                </div>

                {locationError && (
                  <p className="text-xs text-destructive">{locationError}</p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {/* Latitude */}
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="-1.0524"
                        value={form.watch("location.latitude") ?? ""}
                        onChange={(e) =>
                          handleCoordInput("latitude", e.target.value)
                        }
                      />
                    </FormControl>
                    {form.formState.errors.location?.latitude && (
                      <p className="text-xs text-destructive mt-1">
                        {form.formState.errors.location.latitude.message}
                      </p>
                    )}
                  </FormItem>

                  {/* Longitude */}
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="36.7630"
                        value={form.watch("location.longitude") ?? ""}
                        onChange={(e) =>
                          handleCoordInput("longitude", e.target.value)
                        }
                      />
                    </FormControl>
                    {form.formState.errors.location?.longitude && (
                      <p className="text-xs text-destructive mt-1">
                        {form.formState.errors.location.longitude.message}
                      </p>
                    )}
                  </FormItem>
                </div>

                <p className="text-xs text-muted-foreground">
                  GPS coordinates enable weather forecasting and satellite farm monitoring
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Farm size ── */}
        <FormField
          control={form.control}
          name="areaHectares"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Farm size (hectares) <span className="text-destructive">*</span></FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="e.g., 5.8"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.valueAsNumber;
                    field.onChange(isNaN(val) ? undefined : val);
                  }}
                />
              </FormControl>
              <FormDescription>
                Total land area used for farming operations
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Timezone ── */}
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                Timezone <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Used for scheduling daily reports and advisory alerts
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Actions ── */}
        <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {isLoading ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}