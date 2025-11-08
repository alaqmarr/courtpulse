// app/layout.tsx
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";
import { ensureUserLinks } from "@/lib/startup";

export const metadata: Metadata = {
  title: "Pulse Court",
  description: "Badminton and Tournament Portal",
};
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await ensureUserLinks();
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="min-h-screen bg-background text-foreground antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
