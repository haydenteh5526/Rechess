import type { Metadata } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Rechess - Game Review & Analysis",
  description: "Analyze your chess games with Stockfish engine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg" suppressHydrationWarning>
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
