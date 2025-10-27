"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2 } from "lucide-react";

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

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: LocationSuggestion) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  requireSelection?: boolean; // New prop to require dropdown selection
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = "Enter your destination",
  className = "",
  disabled = false,
  requireSelection = false,
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isValidSelection, setIsValidSelection] = useState(false);
  const [currentInput, setCurrentInput] = useState(value);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, LocationSuggestion[]>>(new Map());

  // Optimized search function with caching and request cancellation
  const searchLocations = async (query: string) => {
    if (query.length < 3) {
      // Increased minimum to 3 characters
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    if (cacheRef.current.has(cacheKey)) {
      const cachedSuggestions = cacheRef.current.get(cacheKey)!;
      setSuggestions(cachedSuggestions);
      setShowSuggestions(true);
      setSelectedIndex(-1);
      return;
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/geocoding/autocomplete?q=${encodeURIComponent(query)}`,
        { signal: abortController.signal }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(
          `Failed to fetch suggestions: ${
            errorData.error || response.statusText
          }`
        );
      }

      const data = await response.json();
      console.log("Received suggestions:", data);

      const newSuggestions = data.suggestions || [];

      // Cache the results
      cacheRef.current.set(cacheKey, newSuggestions);

      // Limit cache size to prevent memory issues
      if (cacheRef.current.size > 50) {
        const firstKey = Array.from(cacheRef.current.keys())[0];
        cacheRef.current.delete(firstKey);
      }

      setSuggestions(newSuggestions);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // Request was cancelled, ignore the error
        return;
      }
      console.error("Error fetching location suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCurrentInput(newValue);

    // If requireSelection is enabled, only allow changes that come from dropdown selection
    if (requireSelection && !isValidSelection) {
      // Allow typing for search purposes, but don't update the main value
      // The main value will only be updated when a suggestion is selected
    } else {
      onChange(newValue);
    }

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new timeout for debounced search (increased delay to reduce API calls)
    debounceRef.current = setTimeout(() => {
      if (newValue.trim().length >= 3) {
        // Minimum 3 characters
        searchLocations(newValue);
      } else if (newValue.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsValidSelection(false);
      }
    }, 600); // Increased from 300ms to 600ms
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    setCurrentInput(suggestion.formatted);
    setIsValidSelection(true);
    onChange(suggestion.formatted);
    onSelect(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync currentInput with value prop
  useEffect(() => {
    setCurrentInput(value);
    if (value && requireSelection) {
      // If we have a value and requireSelection is true, assume it's valid
      // This handles cases where the value comes from a dropdown selection
      setIsValidSelection(true);
    } else if (requireSelection && !value) {
      setIsValidSelection(false);
    }
  }, [value, requireSelection]);

  // Cleanup timeout and abort controller on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder + " (min 3 characters)"}
          disabled={disabled}
          className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            disabled
              ? "bg-gray-100 cursor-not-allowed border-gray-300"
              : requireSelection && !isValidSelection
              ? "border-orange-300 bg-orange-50"
              : isValidSelection
              ? "border-green-300 bg-green-50"
              : "border-gray-300"
          } ${className}`}
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Status indicator */}
      {requireSelection && (
        <div className="mt-1 text-xs">
          {isValidSelection ? (
            <span className="text-green-600 flex items-center">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Valid destination selected
            </span>
          ) : currentInput.length > 0 ? (
            <span className="text-orange-600 flex items-center">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Please select from dropdown
            </span>
          ) : null}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-600">
              Choose a destination:
            </p>
          </div>
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150 ${
                  index === selectedIndex
                    ? "bg-blue-100 border-blue-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        index === selectedIndex ? "bg-blue-500" : "bg-gray-300"
                      }`}
                    />
                  </div>
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        index === selectedIndex
                          ? "text-blue-900"
                          : "text-gray-900"
                      }`}
                    >
                      {suggestion.city}
                    </p>
                    <p
                      className={`text-sm truncate ${
                        index === selectedIndex
                          ? "text-blue-700"
                          : "text-gray-500"
                      }`}
                    >
                      {suggestion.country}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        index === selectedIndex
                          ? "bg-blue-200 text-blue-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {suggestion.resultType.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-6 text-center">
              <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No destinations found</p>
              <p className="text-xs text-gray-400 mt-1">
                Try a different search term
              </p>
            </div>
          )}
          <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Use ↑↓ to navigate, Enter to select, Esc to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
