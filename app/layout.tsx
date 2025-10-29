import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/app/components/Navbar";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/lib/auth-context";
import MUIThemeProvider from "@/lib/mui-theme-provider";

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
        <MUIThemeProvider>
          <SessionProvider>
            <AuthProvider>
              <Navbar />
              {children}
            </AuthProvider>
          </SessionProvider>
        </MUIThemeProvider>
      </body>
    </html>
  );
}
