/**
 * Time utility functions for the Nomadly application
 */

/**
 * Formats a time string (HH:MM) to a human-readable format (H:MM AM/PM)
 * @param timeString - Time in HH:MM format (e.g., "09:30", "14:45")
 * @returns Formatted time string (e.g., "9:30 AM", "2:45 PM")
 */
export const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Formats a date string to a human-readable format
 * @param dateString - ISO date string
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
): string => {
  return new Date(dateString).toLocaleDateString("en-US", options);
};

/**
 * Formats a date string to include weekday (e.g., "Monday, March 15, 2024")
 * @param dateString - ISO date string
 * @returns Formatted date string with weekday
 */
export const formatDateWithWeekday = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Calculates the difference in days between two dates
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns Number of days difference (inclusive of both dates)
 */
export const getDaysDifference = (
  startDate: string,
  endDate: string
): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
};

/**
 * Formats duration in minutes to a human-readable format
 * @param minutes - Duration in minutes
 * @returns Formatted duration string (e.g., "1h 30m", "45m", "2h")
 */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
};

/**
 * Parses a time string (HH:MM) into hours and minutes
 * @param timeString - Time in HH:MM format
 * @returns Object with hour and minute numbers
 */
export const parseTime = (
  timeString: string
): { hour: number; minute: number } => {
  const [hours, minutes] = timeString.split(":").map(Number);
  return { hour: hours, minute: minutes };
};

/**
 * Converts hours and minutes to total minutes
 * @param hour - Hour number
 * @param minute - Minute number
 * @returns Total minutes
 */
export const timeToMinutes = (hour: number, minute: number): number => {
  return hour * 60 + minute;
};

/**
 * Converts total minutes back to hours and minutes
 * @param totalMinutes - Total minutes
 * @returns Object with hour and minute numbers
 */
export const minutesToTime = (
  totalMinutes: number
): { hour: number; minute: number } => {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return { hour, minute };
};

/**
 * Validates if end time is after start time
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @returns True if end time is after start time
 */
export const isTimeValid = (startTime: string, endTime: string): boolean => {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  const startMinutes = timeToMinutes(start.hour, start.minute);
  const endMinutes = timeToMinutes(end.hour, end.minute);
  return endMinutes > startMinutes;
};

/**
 * Validates if end date is after start date
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns True if end date is after start date
 */
export const isDateValid = (startDate: string, endDate: string): boolean => {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end > start;
};

/**
 * Calculates trip duration in days
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns Number of days in the trip
 */
export const getTripDuration = (startDate: string, endDate: string): number => {
  if (!isDateValid(startDate, endDate)) return 0;
  return getDaysDifference(startDate, endDate);
};

/**
 * Formats budget string to display format
 * @param budget - Budget string (e.g., "dollarDollar")
 * @returns Formatted budget string (e.g., "$$")
 */
export const formatBudget = (budget: string): string => {
  return budget.replace(/dollar/gi, "$").replace(/Dollar/gi, "$");
};

/**
 * Gets today's date in YYYY-MM-DD format for date inputs
 * @returns Today's date string
 */
export const getTodayDateString = (): string => {
  return new Date().toISOString().split("T")[0];
};
