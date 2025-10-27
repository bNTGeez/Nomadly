import React from "react";
import { Lightbulb, Clock, MapPin } from "lucide-react";

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <Lightbulb className="w-8 h-8 text-gray-600" />,
      title: "AI-Powered Planning",
      description:
        "Get personalized recommendations based on your interests and preferences",
    },
    {
      icon: <Clock className="w-8 h-8 text-gray-600" />,
      title: "Smart Scheduling",
      description:
        "Optimize your time with intelligent itinerary planning and scheduling",
    },
    {
      icon: <MapPin className="w-8 h-8 text-gray-600" />,
      title: "Local Insights",
      description:
        "Discover hidden gems and local favorites in your destination",
    },
  ];

  return (
    <div className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
              Why Choose Nomadly?
            </h2>
            <p className="text-base sm:text-lg text-gray-600">
              Everything you need for seamless travel planning
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 sm:p-8">
                <div className="bg-gray-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
