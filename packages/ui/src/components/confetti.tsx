"use client";

import * as confettiLib from "canvas-confetti";
import * as React from "react";
import { Button, type ButtonProps } from "./button";

const confetti = confettiLib.default;
type Options = confettiLib.Options;

interface ConfettiRef {
  fire: (options?: Options) => void;
}

interface ConfettiProps {
  options?: Options;
  globalOptions?: Options;
  manualstart?: boolean;
  children?: React.ReactNode;
}

const Confetti = React.forwardRef<ConfettiRef, ConfettiProps>(
  ({ options, globalOptions = {}, manualstart = false, children }, ref) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const confettiRef = React.useRef<ReturnType<typeof confetti.create> | null>(null);

    React.useEffect(() => {
      if (canvasRef.current) {
        confettiRef.current = confetti.create(canvasRef.current, {
          resize: true,
          useWorker: true,
          ...globalOptions,
        });
      }

      return () => {
        confettiRef.current?.reset();
      };
    }, [globalOptions]);

    React.useImperativeHandle(ref, () => ({
      fire: (opts?: Options) => {
        confettiRef.current?.({ ...options, ...opts });
      },
    }));

    React.useEffect(() => {
      if (!manualstart && confettiRef.current) {
        confettiRef.current(options);
      }
    }, [manualstart, options]);

    return (
      <>
        <canvas
          ref={canvasRef}
          className="pointer-events-none fixed inset-0 z-50 h-full w-full"
        />
        {children}
      </>
    );
  }
);

Confetti.displayName = "Confetti";

// Preset confetti animations
function fireConfetti(intensity: "standard" | "enhanced" = "standard") {
  const defaults: Options = {
    spread: 360,
    ticks: 100,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    colors: ["#FFE400", "#FFBD00", "#E89400", "#FFCA6C", "#FDFFB8"],
  };

  if (intensity === "enhanced") {
    // Enhanced celebration for 80%+ scores
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Random bursts from both sides
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);
  } else {
    // Standard celebration for 60-79% scores
    confetti({
      ...defaults,
      particleCount: 50,
      scalar: 1.2,
      shapes: ["star"],
      origin: { y: 0.6 },
    });

    confetti({
      ...defaults,
      particleCount: 25,
      scalar: 0.75,
      shapes: ["circle"],
      origin: { y: 0.6 },
    });
  }
}

interface ConfettiButtonProps extends ButtonProps {
  options?: Options;
  intensity?: "standard" | "enhanced";
}

const ConfettiButton = React.forwardRef<HTMLButtonElement, ConfettiButtonProps>(
  ({ options, intensity = "standard", onClick, children, ...props }, ref) => {
    const handleClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      fireConfetti(intensity);
      onClick?.(event);
    };

    return (
      <Button ref={ref} onClick={handleClick} {...props}>
        {children}
      </Button>
    );
  }
);

ConfettiButton.displayName = "ConfettiButton";

export { Confetti, ConfettiButton, fireConfetti };
export type { ConfettiRef, ConfettiProps };
