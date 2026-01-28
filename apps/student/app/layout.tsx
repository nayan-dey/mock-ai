import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "../components/providers";
import { ThemeProvider } from "../components/theme-provider";
import { Navbar } from "../components/navbar";
import { BottomNav } from "../components/bottom-nav";
import { UserSync } from "../components/user-sync";
import { MobileOnlyGuard } from "../components/mobile-only-guard";
import { SonnerToaster } from "@repo/ui";
import "@repo/ui/globals.css";

export const metadata: Metadata = {
  title: "Nindo - Student Portal",
  description: "Take mock tests and improve your preparation",
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
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ConvexClientProvider>
              <MobileOnlyGuard>
                <UserSync />
                <Navbar />
                <main className="min-h-screen pt-14 pb-20 md:pb-0">{children}</main>
                <BottomNav />
              </MobileOnlyGuard>
              <SonnerToaster position="top-center" richColors />
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
