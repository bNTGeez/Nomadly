"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface HeroSectionProps {
  session: any;
  onGetStarted: () => void;
  onSignUp: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  session,
  onGetStarted,
  onSignUp,
}) => {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 sm:mb-6">
          Plan Your Perfect Trip
        </h1>
        <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
          Discover amazing destinations, create personalized itineraries, and
          make unforgettable memories with AI-powered travel planning.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto bg-black text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-medium hover:bg-gray-800 transition-colors duration-200 shadow-lg"
          >
            {session ? "Generate Trip" : "Get Started"}
          </button>

          {!session && (
            <button
              onClick={onSignUp}
              className="w-full sm:w-auto border border-gray-300 text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              Sign Up
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
