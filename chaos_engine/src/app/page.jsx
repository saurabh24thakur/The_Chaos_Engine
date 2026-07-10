"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import ProfilePopup from "@/components/ProfilePopup";
import AnimatedBackground from "@/components/AnimatedBackground";
import Hero from "@/components/Hero";
import Container from "@/components/Container";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="relative min-h-screen flex flex-col w-full">
      

      {/* Floating Capsule Header Navbar */}
      <Navbar
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        showProfile={showProfile}
        setShowProfile={setShowProfile}
      />

      {/* Absolute Portal Dropdown for User Profile Details */}
      <AnimatePresence>
        {isLoggedIn && showProfile && (
          <ProfilePopup
            onClose={() => setShowProfile(false)}
            onLogout={() => {
              setIsLoggedIn(false);
              setShowProfile(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* hero */}
      <Hero/>

      {/* container */}

      <Container/ >
    </div>
  );
}
