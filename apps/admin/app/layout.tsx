import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "../components/providers";
import { UserSync } from "../components/user-sync";
import "@repo/ui/globals.css";

export const metadata: Metadata = {
  title: "MockTest - Admin Portal",
  description: "Manage tests, questions, and content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ConvexClientProvider>
            <UserSync />
            {children}
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
