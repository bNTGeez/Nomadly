"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Clock, MapPin, Star, Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  formatTime,
  formatDate,
  formatDateWithWeekday,
  formatDuration,
  formatBudget,
} from "@/lib/time-utils";

interface Trip {
  id: string;
  title: string;
  city: string;
  startDate: string;
  endDate: string;
  dayStart: string;
  dayEnd: string;
  budget: string;
  interests: string[];
  createdAt: string;
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

interface TripDay {
  id: string;
  dateLocal: string;
  items: ItineraryItem[];
}

interface TripPageData {
  trip: Trip;
  days: TripDay[];
}

export default function TripPage() {
  const params = useParams();
  const tripId = params.tripId as string;

  const [tripData, setTripData] = useState<TripPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTripData = async () => {
      try {
        // Fetch trip details
        const tripResponse = await fetch(`/api/trips/${tripId}`);
        if (!tripResponse.ok) {
          throw new Error("Trip not found");
        }
        const trip = await tripResponse.json();

        // Fetch itinerary (we'll need to create this endpoint)
        const itineraryResponse = await fetch(`/api/trips/${tripId}/itinerary`);
        if (!itineraryResponse.ok) {
          throw new Error("Itinerary not found");
        }
        const { days } = await itineraryResponse.json();

        setTripData({ trip, days });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load trip");
      } finally {
        setLoading(false);
      }
    };

    if (tripId) {
      fetchTripData();
    }
  }, [tripId]);

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your trip...</p>
        </div>
      </div>
    );
  }

  if (error || !tripData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Trip Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error || "This trip doesn't exist or you don't have access to it."}
          </p>
          <Link
            href="/generate"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Generate
          </Link>
        </div>
      </div>
    );
  }

  const { trip, days } = tripData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/generate"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Generate
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">{trip.title}</h1>
              <p className="text-gray-600 mt-1">{trip.city}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(trip.startDate).toLocaleDateString()} -{" "}
                {new Date(trip.endDate).toLocaleDateString()}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                {formatTime(trip.dayStart)} - {formatTime(trip.dayEnd)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trip Details */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Trip Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-2">
              <MapPin className="w-5 h-5 text-blue-500 mr-2" />
              <h3 className="font-semibold text-gray-900">Destination</h3>
            </div>
            <p className="text-gray-600">{trip.city}</p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-2">
              <Star className="w-5 h-5 text-yellow-500 mr-2" />
              <h3 className="font-semibold text-gray-900">Budget</h3>
            </div>
            <p className="text-gray-600 capitalize">
              {formatBudget(trip.budget)}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-2">
              <Calendar className="w-5 h-5 text-green-500 mr-2" />
              <h3 className="font-semibold text-gray-900">Interests</h3>
            </div>
            <p className="text-gray-600">
              {trip.interests.length > 0
                ? trip.interests.join(", ")
                : "None selected"}
            </p>
          </div>
        </div>

        {/* Itinerary */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your Itinerary
            </h2>
            <p className="text-gray-600">
              {days.length > 0
                ? `Your personalized itinerary for ${days.length} days, carefully planned based on your preferences and the local attractions.`
                : "No itinerary items found for this trip."}
            </p>
          </div>

          <div className="p-6">
            {days.length > 0 ? (
              <div className="space-y-8">
                {days.map((day, dayIndex) => (
                  <div
                    key={day.id}
                    className="border-b border-gray-200 pb-8 last:border-b-0"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      Day {dayIndex + 1} -{" "}
                      {formatDateWithWeekday(day.dateLocal)}
                    </h3>

                    {day.items.length > 0 ? (
                      <div className="space-y-4">
                        {day.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                {index + 1}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-lg font-semibold text-gray-900">
                                  {item.poiName || `Activity ${index + 1}`}
                                </h4>
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                  <Clock className="w-4 h-4" />
                                  <span>
                                    {formatDuration(item.durationMinutes)}
                                  </span>
                                </div>
                              </div>

                              {item.startTime && item.endTime && (
                                <div className="text-sm text-gray-600 mb-2">
                                  {formatTime(item.startTime)} -{" "}
                                  {formatTime(item.endTime)}
                                </div>
                              )}

                              {item.notes && (
                                <p className="text-gray-600 text-sm">
                                  {item.notes}
                                </p>
                              )}

                              {item.isMeal && (
                                <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full mt-2">
                                  Meal
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">
                          No activities planned for this day
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Itinerary Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Generate an itinerary to see your trip plan here.
                </p>
                <Link
                  href={`/generate?tripId=${tripId}`}
                  className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Generate Itinerary
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
