"use client";

import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";

export function MobileOnlyGuard({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      // Check if device is mobile using multiple methods
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileWidth = window.innerWidth < 768;
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

      // Consider it mobile if it's touch AND either mobile width OR mobile user agent
      setIsMobile(isTouchDevice && (isMobileWidth || isMobileUserAgent) || isMobileWidth);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Show nothing while checking
  if (isMobile === null) {
    return null;
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
          <h1 className="mb-3 text-2xl font-semibold tracking-tight">
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
              {typeof window !== "undefined" ? window.location.origin : ""}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
