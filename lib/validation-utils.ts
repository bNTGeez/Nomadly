import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DateTime } from "luxon";

export function handleValidationError(error: ZodError) {
  const formattedErrors = error.issues.map((err) => ({
    field: err.path.join("."),
    message: err.message,
    code: err.code,
  }));

  return NextResponse.json(
    {
      error: "Validation failed",
      details: formattedErrors,
    },
    { status: 400 }
  );
}

export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: unknown
) {
  const responseBody: { error: string; details?: unknown } = {
    error: message,
  };
  if (details) {
    responseBody.details = details;
  }
  return NextResponse.json(responseBody, { status });
}

export function createSuccessResponse(data: unknown, status: number = 200) {
  return NextResponse.json(data, { status });
}

// Day Window and Free Segments utilities

export interface DayBounds {
  startUTC: DateTime;
  endUTC: DateTime;
}

export interface FreeSegment {
  start: DateTime;
  end: DateTime;
}

export interface FixedWindow {
  start: DateTime;
  end: DateTime;
}

// Types for Pick Candidates functionality
export type PoiMode = "location_aware" | "activity_focused";

export interface TripData {
  city?: string;
  // Other trip fields can be added as needed
}

export interface DayData {
  city?: string;
  areaFocus?: string[];
  // Other day fields can be added as needed
}

export interface PoiData {
  id: string;
  mode: PoiMode;
  city?: string;
  name: string;
  district?: string;
  tags: string[];
  // Other POI fields can be added as needed
}

/**
 * Converts a local day window to UTC bounds
 * @param dateLocalISO - The date in local timezone (ISO string)
 * @param dayStartHHmm - Day start time in HH:MM format (e.g., "09:30")
 * @param dayEndHHmm - Day end time in HH:MM format (e.g., "20:30")
 * @param tz - Timezone string (e.g., "America/New_York")
 * @returns Object with startUTC and endUTC DateTime objects
 * @throws Error if dayEndHHmm <= dayStartHHmm
 */
export function getDayBoundsUTC(
  dateLocalISO: string,
  dayStartHHmm: string,
  dayEndHHmm: string,
  tz: string
): DayBounds {
  // Parse the date and create DateTime in the specified timezone
  const localDate = DateTime.fromISO(dateLocalISO, { zone: tz });

  // Validate input date and timezone
  if (!localDate.isValid) {
    throw new Error("Invalid dateLocalISO or timezone");
  }

  // Parse start and end times
  const [startHour, startMin] = dayStartHHmm.split(":").map(Number);
  const [endHour, endMin] = dayEndHHmm.split(":").map(Number);

  // Validate day times
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (endMinutes <= startMinutes) {
    throw new Error("Day end time must be after day start time");
  }

  // Create start and end times for the day in local timezone
  const startLocal = localDate.set({
    hour: startHour,
    minute: startMin,
    second: 0,
    millisecond: 0,
  });
  const endLocal = localDate.set({
    hour: endHour,
    minute: endMin,
    second: 0,
    millisecond: 0,
  });

  // Convert to UTC
  const startUTC = startLocal.toUTC();
  const endUTC = endLocal.toUTC();

  return { startUTC, endUTC };
}

/**
 * Builds free segments by subtracting fixed windows from the day bounds
 * @param bounds - Day bounds with startUTC and endUTC
 * @param fixedWindows - Array of fixed windows to subtract
 * @returns Array of free segments
 */
export function buildFreeSegments(
  bounds: DayBounds,
  fixedWindows: FixedWindow[]
): FreeSegment[] {
  const segments: FreeSegment[] = [];

  // Filter out invalid fixed windows (end <= start)
  const validWindows = fixedWindows.filter(
    (window) => window.end.toMillis() > window.start.toMillis()
  );

  // Clip fixed windows to day bounds and merge overlapping ones
  const processedWindows = processFixedWindows(validWindows, bounds);

  let currentStart = bounds.startUTC;

  for (const window of processedWindows) {
    // If the window starts after our current position, we have a free segment
    if (window.start.toMillis() > currentStart.toMillis()) {
      segments.push({
        start: currentStart,
        end: window.start,
      });
    }

    // Move current position to the end of this window (if it extends further)
    if (window.end.toMillis() > currentStart.toMillis()) {
      currentStart = window.end;
    }
  }

  // Add final segment if there's time left after the last window
  if (currentStart.toMillis() < bounds.endUTC.toMillis()) {
    segments.push({
      start: currentStart,
      end: bounds.endUTC,
    });
  }

  return segments;
}

/**
 * Clips fixed windows to day bounds and merges overlapping/touching windows
 * @param windows - Array of fixed windows
 * @param bounds - Day bounds to clip against
 * @returns Array of processed windows
 */
function processFixedWindows(
  windows: FixedWindow[],
  bounds: DayBounds
): FixedWindow[] {
  if (windows.length === 0) return [];

  // Sort by start time
  const sortedWindows = [...windows].sort(
    (a, b) => a.start.toMillis() - b.start.toMillis()
  );

  // Clip each window to day bounds
  const clippedWindows = sortedWindows
    .map((window) => ({
      start: DateTime.max(window.start, bounds.startUTC),
      end: DateTime.min(window.end, bounds.endUTC),
    }))
    .filter((window) => window.end.toMillis() > window.start.toMillis());

  if (clippedWindows.length === 0) return [];

  // Merge overlapping or touching windows
  const mergedWindows: FixedWindow[] = [clippedWindows[0]];

  for (let i = 1; i < clippedWindows.length; i++) {
    const current = clippedWindows[i];
    const last = mergedWindows[mergedWindows.length - 1];

    // If current window overlaps or touches the last one, merge them
    if (current.start.toMillis() <= last.end.toMillis()) {
      last.end = DateTime.max(last.end, current.end);
    } else {
      // No overlap, add as new window
      mergedWindows.push(current);
    }
  }

  return mergedWindows;
}

/**
 * Pick Candidates for the Day
 * Filters POIs down to the relevant set based on trip and day context
 * @param pois - Array of all available POIs
 * @param trip - Trip data containing city and other trip context
 * @param day - Day data containing city and areaFocus (optional)
 * @returns Filtered array of candidate POIs
 */
export function pickCandidatesForDay(
  pois: PoiData[],
  trip: TripData,
  day?: DayData
): PoiData[] {
  let candidates: PoiData[] = [];

  // Determine filtering strategy based on trip.city
  if (trip.city) {
    // Location-aware: Filter by city
    candidates = pois.filter((poi) => poi.city === trip.city);
  } else {
    // Activity-only: Filter by mode
    candidates = pois.filter((poi) => poi.mode === "activity_focused");
  }

  // Optional: Prefer districts if day.areaFocus is provided
  // Note: This is a soft preference, not a hard filter (as requested)
  if (day?.areaFocus && day.areaFocus.length > 0) {
    // Sort candidates to prefer those in the areaFocus districts
    // Use stable sort with secondary key (name) for consistent results
    candidates = candidates.sort((a, b) => {
      const aInFocus = a.district && day.areaFocus!.includes(a.district);
      const bInFocus = b.district && day.areaFocus!.includes(b.district);

      if (aInFocus && !bInFocus) return -1;
      if (!aInFocus && bInFocus) return 1;

      // Tie-break by name for stable sort
      return a.name.localeCompare(b.name);
    });
  }

  return candidates;
}
