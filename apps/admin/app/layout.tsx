import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "../components/providers";
import { UserSync } from "../components/user-sync";
import { ThemeProvider } from "../components/theme-provider";
import { SonnerToaster } from "@repo/ui";
import "@repo/ui/globals.css";

export const metadata: Metadata = {
  title: "Nindo - Admin Portal",
  description: "Manage tests, questions, and content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        </head>
        <body>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ConvexClientProvider>
              <UserSync />
              {children}
              <SonnerToaster position="top-center" richColors />
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
