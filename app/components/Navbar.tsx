"use client";

import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

const Navbar = () => {
  const { data: session, status } = useSession();

  return (
    <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="flex max-w-7xl mx-auto px-8 py-6 items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          Nomadly
        </Link>

        <div className="flex items-center gap-4 space-x-4 text-sm font-medium text-gray-500">
          <Link href="/home" className="hover:text-gray-700">
            Home
          </Link>
          <Link href="/about" className="hover:text-gray-700">
            About
          </Link>
          <Link href="/contact" className="hover:text-gray-700">
            Contact
          </Link>

          {status === "loading" ? (
            <span className="text-gray-400">Loading...</span>
          ) : session ? (
            <div className="flex items-center gap-4">
              <Link href="/profile" className="hover:text-gray-700">
                Profile
              </Link>
              <button onClick={() => signOut()} className="hover:text-gray-700">
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" className="hover:text-gray-700">
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
