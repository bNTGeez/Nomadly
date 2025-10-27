import React from "react";

interface CTASectionProps {
  onSignUp: () => void;
}

export const CTASection: React.FC<CTASectionProps> = ({ onSignUp }) => {
  return (
    <div className="bg-gray-900 py-16 sm:py-20 lg:py-24">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">
            Ready to Start Your Journey?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-300 mb-8 sm:mb-10">
            Join thousands of travelers who trust Nomadly for their trip
            planning
          </p>
          <button
            onClick={onSignUp}
            className="bg-white text-gray-900 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-medium hover:bg-gray-100 transition-colors duration-200"
          >
            Create Free Account
          </button>
        </div>
      </div>
    </div>
  );
};
