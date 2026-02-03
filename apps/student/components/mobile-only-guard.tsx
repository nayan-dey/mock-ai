"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { Smartphone } from "lucide-react";

export function MobileOnlyGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [origin, setOrigin] = useState("");
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isLandingPage = pathname === "/";

  useEffect(() => {
    // Skip mobile check for landing page
    if (isLandingPage) return;

    setOrigin(window.location.origin);

    // Evaluate UA once (it never changes)
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    const checkMobile = () => {
      const isMobileWidth = window.innerWidth < 768;
      setIsMobile(isTouchDevice && (isMobileWidth || isMobileUserAgent) || isMobileWidth);
    };

    checkMobile();

    const handleResize = () => {
      clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(checkMobile, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimerRef.current);
    };
  }, [isLandingPage]);

  // Landing page must work on all devices
  if (isLandingPage) return <>{children}</>;

  // Show loading spinner while checking instead of blank screen
  if (isMobile === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Show error on desktop
  if (!isMobile) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background p-8 text-center">
        <div className="mx-auto max-w-md">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-primary/10 p-6">
              <Smartphone className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="mb-3 text-lg font-semibold tracking-tight">
            Mobile App Only
          </h1>
          <p className="mb-6 text-muted-foreground">
            The Nindo student app is designed for mobile devices only. Please open this app on your smartphone or tablet for the best experience.
          </p>
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Scan the QR code or visit this URL on your mobile device:
            </p>
            <p className="mt-2 font-mono text-sm text-primary">
              {origin}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
