"use client";

import { SquircleGlass } from "./SquircleGlass";
import { FireLogo } from "./FireLogo";
import { SsLogo } from "./SsLogo";

type BrandMarkProps = {
  size?: "sm" | "md" | "lg";
  fireOpacity?: number;
  ssOpacity?: number;
  className?: string;
};

export function BrandMark({
  size = "md",
  fireOpacity = 0,
  ssOpacity = 1,
  className,
}: BrandMarkProps) {
  return (
    <SquircleGlass size={size} className={className}>
      <div className="relative flex h-full w-full items-center justify-center">
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-[1200ms] ease-in-out"
          style={{ opacity: fireOpacity }}
        >
          <FireLogo />
        </div>
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-[1200ms] ease-in-out"
          style={{ opacity: ssOpacity }}
        >
          <SsLogo
            iconClassName={
              size === "sm"
                ? "h-4 w-4 -translate-x-[0.15rem]"
                : size === "lg"
                  ? "h-10 w-10 -translate-x-2"
                  : undefined
            }
          />
        </div>
      </div>
    </SquircleGlass>
  );
}
