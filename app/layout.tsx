import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/app/components/Navbar";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "Nomadly",
  description: "Best platform for travel planning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionProvider>
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
