import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-12 sm:py-16">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0 text-center md:text-left">
              <h3 className="text-lg font-bold text-gray-900">Nomadly</h3>
              <p className="text-sm text-gray-600">
                AI-powered travel planning made simple
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-end gap-4 sm:gap-6 text-sm text-gray-600">
              <a
                href="/about"
                className="hover:text-gray-900 transition-colors"
              >
                About
              </a>
              <a
                href="/contact"
                className="hover:text-gray-900 transition-colors"
              >
                Contact
              </a>
              <a
                href="/privacy"
                className="hover:text-gray-900 transition-colors"
              >
                Privacy
              </a>
              <a
                href="/terms"
                className="hover:text-gray-900 transition-colors"
              >
                Terms
              </a>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-200 text-center">
            <p className="text-xs sm:text-sm text-gray-500">
              © {new Date().getFullYear()} Nomadly. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
