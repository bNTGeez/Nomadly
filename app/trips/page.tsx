"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, MapPin, Clock, Star, Plus, ArrowRight } from "lucide-react";
import {
  formatDate,
  formatTime,
  formatBudget,
  getDaysDifference,
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

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await fetch("/api/trips");
        if (!response.ok) {
          throw new Error("Failed to fetch trips");
        }
        const data = await response.json();
        setTrips(data.trips || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load trips");
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your trips...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Error Loading Trips
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/generate"
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Trip
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
              <p className="text-gray-600 mt-1">
                {trips.length} {trips.length === 1 ? "trip" : "trips"} planned
              </p>
            </div>
            <Link
              href="/generate"
              className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Plan New Trip
            </Link>
          </div>
        </div>
      </div>

      {/* Trips Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trip/${trip.id}`}
                className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                <div className="p-6">
                  {/* Trip Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {trip.title}
                      </h3>
                      <div className="flex items-center text-gray-500 text-sm mt-1">
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{trip.city}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2" />
                  </div>

                  {/* Trip Details */}
                  <div className="space-y-3">
                    {/* Dates */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>
                        {formatDate(trip.startDate)} -{" "}
                        {formatDate(trip.endDate)}
                      </span>
                      <span className="ml-2 text-gray-400">
                        ({getDaysDifference(trip.startDate, trip.endDate)} days)
                      </span>
                    </div>

                    {/* Daily Schedule */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>
                        {formatTime(trip.dayStart)} - {formatTime(trip.dayEnd)}
                      </span>
                    </div>

                    {/* Budget */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="capitalize">
                        {formatBudget(trip.budget)}
                      </span>
                    </div>

                    {/* Interests */}
                    {trip.interests.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {trip.interests.slice(0, 3).map((interest, index) => (
                          <span
                            key={index}
                            className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                          >
                            {interest}
                          </span>
                        ))}
                        {trip.interests.length > 3 && (
                          <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                            +{trip.interests.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Created Date */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      Created {formatDate(trip.createdAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No trips yet
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start planning your next adventure! Create your first trip and let
              our AI help you discover amazing places.
            </p>
            <Link
              href="/generate"
              className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Plan Your First Trip
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
