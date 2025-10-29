"use client";

import { useState } from "react";
import { LocationAutocomplete } from "@/app/components/LocationAutocomplete";
import {
  isTimeValid,
  isDateValid,
  getTripDuration,
  getTodayDateString,
} from "@/lib/time-utils";

interface LocationSuggestion {
  id: string;
  formatted: string;
  city: string;
  country: string;
  countryCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timezone?: string;
  confidence: number;
  importance: number;
  resultType: string;
}

interface ItineraryItem {
  poiId: string;
  durationMinutes: number;
  isMeal: boolean;
  notes?: string;
  startTime?: string;
  endTime?: string;
  poiName?: string;
}

interface Itinerary {
  items: ItineraryItem[];
  reasoning: string;
}

interface GenerateResponse {
  success: boolean;
  itinerary: Itinerary;
  poiRecommendations: {
    reasoning: string;
    totalRecommended: number;
  };
  metadata: {
    destination: string;
    dayNumber: number;
    totalPOIsAvailable: number;
    totalPOIsRecommended: number;
  };
}

export default function HomePage() {
  const [location, setLocation] = useState("Tokyo, Japan");
  const [selectedLocation, setSelectedLocation] =
    useState<LocationSuggestion | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [budget, setBudget] = useState("mid-range");
  const [travelStyle, setTravelStyle] = useState("explorer");
  const [poiMode, setPoiMode] = useState<"location_aware" | "activity_focused">(
    "location_aware"
  );
  const [dayStart, setDayStart] = useState("09:30");
  const [dayEnd, setDayEnd] = useState("20:30");
  const [tripStartDate, setTripStartDate] = useState("");
  const [tripEndDate, setTripEndDate] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Function to calculate timestamps for itinerary items
  const calculateTimestamps = (items: ItineraryItem[]) => {
    const startHour = 9; // Start at 9 AM
    let currentMinute = 0;

    return items.map((item, index) => {
      // Calculate start time based on previous items
      let startMinute = 0;
      for (let j = 0; j < index; j++) {
        startMinute += items[j].durationMinutes + 30; // 30 min buffer
      }

      const startHourTotal = startHour + Math.floor(startMinute / 60);
      const startMinuteFinal = startMinute % 60;
      const endMinute = startMinute + item.durationMinutes;
      const endHourTotal = startHour + Math.floor(endMinute / 60);
      const endMinuteFinal = endMinute % 60;

      const startTime = `${String(startHourTotal).padStart(2, "0")}:${String(
        startMinuteFinal
      ).padStart(2, "0")}`;
      const endTime = `${String(endHourTotal).padStart(2, "0")}:${String(
        endMinuteFinal
      ).padStart(2, "0")}`;

      return {
        ...item,
        startTime,
        endTime,
      };
    });
  };

  const interestOptions = [
    "food",
    "culture",
    "nightlife",
    "nature",
    "shopping",
    "art",
    "history",
    "sports",
    "music",
    "photography",
  ];

  const handleInterestToggle = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    setSelectedLocation(suggestion);
    console.log("Selected location:", suggestion);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    // Validate times and dates
    if (!isTimeValid(dayStart, dayEnd)) {
      setError("End time must be after start time");
      setIsGenerating(false);
      return;
    }

    if (!isDateValid(tripStartDate, tripEndDate)) {
      setError("Please select valid start and end dates");
      setIsGenerating(false);
      return;
    }

    try {
      // First, create a trip
      const tripResponse = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `Trip to ${selectedLocation?.city || location}`,
          city: selectedLocation?.city || location,
          startDate: new Date(tripStartDate).toISOString(),
          endDate: new Date(tripEndDate).toISOString(),
          pace: "normal",
          dayStart: dayStart,
          dayEnd: dayEnd,
          budget: budget === "mid-range" ? "dollarDollar" : "dollar",
          mealPlan: "standard",
          interests,
          cuisines: [],
        }),
      });

      if (!tripResponse.ok) {
        const errorData = await tripResponse.json();
        throw new Error(
          `Failed to create trip: ${errorData.error || tripResponse.status}`
        );
      }

      const trip = await tripResponse.json();

      // Then generate the itinerary
      const response = await fetch(`/api/trips/${trip.id}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dayNumber: 1,
          interests,
          budget,
          travelStyle,
          poiMode,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Calculate timestamps and fetch POI names
      const itemsWithTimestamps = calculateTimestamps(data.itinerary.items);

      // Fetch POI names for all items
      const itemsWithNames = await Promise.all(
        itemsWithTimestamps.map(async (item) => {
          try {
            const poiResponse = await fetch(`/api/pois/${item.poiId}`);
            if (poiResponse.ok) {
              const poiData = await poiResponse.json();
              return {
                ...item,
                poiName: poiData.name,
              };
            }
          } catch (error) {
            console.error(`Failed to fetch POI ${item.poiId}:`, error);
          }
          return {
            ...item,
            poiName: `POI ${
              item.poiId.split("_")[1]?.slice(0, 8) || "Unknown"
            }`,
          };
        })
      );

      const processedData = {
        ...data,
        itinerary: {
          ...data.itinerary,
          items: itemsWithNames,
        },
      };

      setResult(processedData);

      // Redirect to trip page after successful generation
      window.location.href = `/trip/${trip.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Plan your trip
          </h1>
          <p className="text-gray-600 mb-6">
            Create a tailored itinerary with your preferences.
          </p>

          {/* Location Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination
            </label>
            <LocationAutocomplete
              value={location}
              onChange={setLocation}
              onSelect={handleLocationSelect}
              placeholder="Enter your destination"
              className="w-full"
              requireSelection={true}
            />
          </div>

          {/* Trip Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={tripStartDate}
                onChange={(e) => setTripStartDate(e.target.value)}
                min={getTodayDateString()} // Can't select past dates
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  !isDateValid(tripStartDate, tripEndDate) &&
                  tripStartDate &&
                  tripEndDate
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                When your trip begins
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={tripEndDate}
                onChange={(e) => setTripEndDate(e.target.value)}
                min={tripStartDate || getTodayDateString()}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  !isDateValid(tripStartDate, tripEndDate) &&
                  tripStartDate &&
                  tripEndDate
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              <p
                className={`text-xs mt-1 ${
                  !isDateValid(tripStartDate, tripEndDate) &&
                  tripStartDate &&
                  tripEndDate
                    ? "text-red-500"
                    : "text-gray-500"
                }`}
              >
                {!isDateValid(tripStartDate, tripEndDate) &&
                tripStartDate &&
                tripEndDate
                  ? "End date must be after start date"
                  : tripStartDate && tripEndDate
                  ? `${getTripDuration(tripStartDate, tripEndDate)} days trip`
                  : "When your trip ends"}
              </p>
            </div>
          </div>

          {/* Budget & Travel Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget
              </label>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="budget">Budget</option>
                <option value="mid-range">Mid-range</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Travel Style
              </label>
              <select
                value={travelStyle}
                onChange={(e) => setTravelStyle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="relaxed">Relaxed</option>
                <option value="explorer">Explorer</option>
                <option value="adventurer">Adventurer</option>
              </select>
            </div>
          </div>

          {/* Day Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day Start Time
              </label>
              <input
                type="time"
                value={dayStart}
                onChange={(e) => setDayStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                When you want to start your day
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Day End Time
              </label>
              <input
                type="time"
                value={dayEnd}
                onChange={(e) => setDayEnd(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  !isTimeValid(dayStart, dayEnd) && dayEnd !== "20:30"
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              <p
                className={`text-xs mt-1 ${
                  !isTimeValid(dayStart, dayEnd) && dayEnd !== "20:30"
                    ? "text-red-500"
                    : "text-gray-500"
                }`}
              >
                {!isTimeValid(dayStart, dayEnd) && dayEnd !== "20:30"
                  ? "End time must be after start time"
                  : "When you want to end your day"}
              </p>
            </div>
          </div>

          {/* POI Mode */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Planning Mode
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="location_aware"
                  checked={poiMode === "location_aware"}
                  onChange={(e) =>
                    setPoiMode(
                      e.target.value as "location_aware" | "activity_focused"
                    )
                  }
                  className="mr-2"
                />
                Location Aware (minimize travel)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="activity_focused"
                  checked={poiMode === "activity_focused"}
                  onChange={(e) =>
                    setPoiMode(
                      e.target.value as "location_aware" | "activity_focused"
                    )
                  }
                  className="mr-2"
                />
                Activity Focused (best experiences)
              </label>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interests (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    interests.includes(interest)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={
              isGenerating ||
              !selectedLocation ||
              !isTimeValid(dayStart, dayEnd) ||
              !isDateValid(tripStartDate, tripEndDate)
            }
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
          >
            {isGenerating ? "Generating..." : "Generate Itinerary"}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Your AI-Generated Itinerary
            </h2>

            {/* Metadata */}
            <div className="bg-gray-50 rounded-md p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Trip Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Destination:</span>
                  <p className="font-medium">{result.metadata.destination}</p>
                </div>
                <div>
                  <span className="text-gray-600">Day:</span>
                  <p className="font-medium">{result.metadata.dayNumber}</p>
                </div>
                <div>
                  <span className="text-gray-600">Available POIs:</span>
                  <p className="font-medium">
                    {result.metadata.totalPOIsAvailable}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Selected:</span>
                  <p className="font-medium">
                    {result.metadata.totalPOIsRecommended}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="bg-gray-50 rounded-md p-4 mb-6 border">
              <h3 className="font-medium text-gray-900 mb-2">Planner notes</h3>
              <p className="text-gray-700">
                {result.poiRecommendations.reasoning}
              </p>
            </div>

            {/* Itinerary Items */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Daily Schedule
              </h3>
              {result.itinerary.items.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="bg-blue-600 text-white px-3 py-2 rounded-lg text-center min-w-[100px]">
                        <div className="text-sm font-bold">
                          {item.startTime}
                        </div>
                        <div className="text-xs opacity-90">
                          to {item.endTime}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {index + 1}. {item.poiName || `POI: ${item.poiId}`}
                        </h4>
                        {item.isMeal && (
                          <span className="inline-flex items-center rounded-full bg-orange-100 text-orange-800 text-xs px-2 py-0.5">
                            Meal
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Duration: {item.durationMinutes} minutes
                      </p>
                      {item.notes && (
                        <p className="text-sm text-gray-700 italic bg-gray-50 p-2 rounded">
                          "{item.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Day Reasoning */}
            <div className="bg-gray-50 rounded-md p-4 mt-6 border">
              <h3 className="font-medium text-gray-900 mb-2">
                How this was planned
              </h3>
              <p className="text-gray-700">{result.itinerary.reasoning}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
