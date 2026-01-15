import { z } from "zod";

// Common validation schemas
export const uuidSchema = z.string("Invalid UUID format");
export const timeStringSchema = z
  .string()
  .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)");
export const dateStringSchema = z.iso.datetime(
  "Invalid date format (ISO 8601)"
);
export const timezoneSchema = z.string().min(1, "Timezone is required");

// Interests schema - simple array of selected interests
export const interestsSchema = z.array(z.string()).default([]);

// Trip creation schema
export const createTripSchema = z
  .object({
    userId: uuidSchema,
    title: z.string().min(1, "Title is required").max(100, "Title too long"),
    city: z
      .string()
      .min(1, "City is required")
      .max(50, "City name too long")
      .optional(),
    destTz: timezoneSchema.optional(),
    startDate: dateStringSchema,
    endDate: dateStringSchema,
    pace: z.enum(["relax", "normal", "max"]).default("normal"),
    dayStart: timeStringSchema.default("09:30"),
    dayEnd: timeStringSchema.default("20:30"),
    budget: z
      .enum(["dollar", "dollarDollar", "dollarDollarDollar"])
      .default("dollarDollar"),
    mealPlan: z.enum(["light", "standard", "food_focused"]).default("standard"),
    interests: interestsSchema,
    cuisines: z.array(z.string()).default([]),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) > new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      if (data.dayStart && data.dayEnd) {
        const [startHour, startMin] = data.dayStart.split(":").map(Number);
        const [endHour, endMin] = data.dayEnd.split(":").map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        return endMinutes > startMinutes;
      }
      return true;
    },
    {
      message: "Day end time must be after day start time",
      path: ["dayEnd"],
    }
  )
  .strict();

// POI query schema
export const poiQuerySchema = z
  .object({
    city: z.string().min(1, "City is required"),
    district: z.string().optional(),
    tag: z.string().optional(),
    query: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
    cursor: z.string().optional(),
  })
  .strict();

// Agenda item creation schema
export const createAgendaItemSchema = z
  .object({
    poiId: uuidSchema,
    startAt: dateStringSchema,
    endAt: dateStringSchema,
    mode: z.enum(["location_aware", "activity_focused"]),
    locked: z.boolean().default(false),
  })
  .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
    message: "End time must be after start time",
    path: ["endAt"],
  })
  .strict();

// Fixed window creation schema
export const createFixedWindowSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(100, "Title too long"),
    startAt: dateStringSchema,
    endAt: dateStringSchema,
    location: z.string().max(200).optional(),
  })
  .refine((data) => new Date(data.endAt) > new Date(data.startAt), {
    message: "End time must be after start time",
    path: ["endAt"],
  })
  .strict();

// Trip update schema (partial)
export const updateTripSchema = createTripSchema
  .partial()
  .omit({ userId: true });

// Day update schema
export const updateDaySchema = z
  .object({
    city: z.string().max(50).optional(),
    areaFocus: z.array(z.string()).optional(),
    theme: z
      .enum(["food", "shopping", "nightlife", "rainy_day", "scenic"])
      .optional(),
  })
  .strict();

// Agenda item update schema
export const updateAgendaItemSchema = z
  .object({
    startAt: dateStringSchema.optional(),
    endAt: dateStringSchema.optional(),
    locked: z.boolean().optional(),
    customDurationMin: z.number().min(15).max(480).optional(), // 15 min to 8 hours
    note: z.string().max(500).optional(),
  })
  .strict();

// Fixed window update schema
export const updateFixedWindowSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    startAt: dateStringSchema.optional(),
    endAt: dateStringSchema.optional(),
    location: z.string().max(200).optional(),
  })
  .strict();

// Export types for use in routes
export type CreateTripInput = z.infer<typeof createTripSchema>;
export type PoiQueryInput = z.infer<typeof poiQuerySchema>;
export type CreateAgendaItemInput = z.infer<typeof createAgendaItemSchema>;
export type CreateFixedWindowInput = z.infer<typeof createFixedWindowSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type UpdateDayInput = z.infer<typeof updateDaySchema>;
export type UpdateAgendaItemInput = z.infer<typeof updateAgendaItemSchema>;
export type UpdateFixedWindowInput = z.infer<typeof updateFixedWindowSchema>;
