"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { HeroSection } from "@/app/components/HeroSection";
import { FeaturesSection } from "@/app/components/FeaturesSection";
import { CTASection } from "@/app/components/CTASection";
import { LoadingSection } from "@/app/components/LoadingSection";
import { Footer } from "@/app/components/Footer";

const HomePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleGetStarted = () => {
    if (status === "loading") {
      return; // Don't do anything while loading
    }

    if (session) {
      router.push("/generate");
    } else {
      router.push("/login");
    }
  };

  const handleSignUp = () => {
    router.push("/register");
  };

  if (status === "loading") {
    return <LoadingSection />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 space-y-0">
        <HeroSection
          session={session}
          onGetStarted={handleGetStarted}
          onSignUp={handleSignUp}
        />

        <FeaturesSection />

        {!session && <CTASection onSignUp={handleSignUp} />}
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;
