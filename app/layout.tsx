import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "RAG Detective Game",
  description: "Solve evidence-based classroom mysteries with grounded RAG answers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="glass-grid">{children}</body>
    </html>
  );
}
