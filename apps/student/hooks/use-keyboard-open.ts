"use client";

import { useEffect, useState } from "react";

export function useKeyboardOpen() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      const keyboardOpen = viewport.height < window.innerHeight * 0.75;
      setIsKeyboardOpen(keyboardOpen);
    };

    viewport.addEventListener("resize", handleResize);
    return () => viewport.removeEventListener("resize", handleResize);
  }, []);

  return isKeyboardOpen;
}
