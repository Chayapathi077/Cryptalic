"use client";

import { motion } from "framer-motion";
import { SquircleGlass } from "./SquircleGlass";
import { FireLogo } from "./FireLogo";
import { SsLogo } from "./SsLogo";

type BrandMarkProps = {
  size?: "sm" | "md" | "lg";
  phase?: "spirit" | "presents" | "crossfade" | "cryptalic" | "move" | "done";
  className?: string;
};

export function BrandMark({
  size = "md",
  phase = "done",
  className,
}: BrandMarkProps) {
  // FireLogo is visible during spirit and presents
  const isFireVisible = phase === "spirit" || phase === "presents";
  
  return (
    <SquircleGlass size={size} className={className}>
      <div className="relative flex h-full w-full items-center justify-center">
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          animate={{
            opacity: isFireVisible ? 1 : 0,
            scale: isFireVisible ? 1 : 0.5,
            filter: isFireVisible ? "blur(0px)" : "blur(10px)",
          }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          <FireLogo />
        </motion.div>
        
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }}
          animate={{
            opacity: !isFireVisible ? 1 : 0,
            scale: !isFireVisible ? 1 : 1.5,
            filter: !isFireVisible ? "blur(0px)" : "blur(10px)",
          }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          <SsLogo
            iconClassName={
              size === "sm"
                ? "h-5 w-5"
                : size === "lg"
                  ? "h-10 w-10"
                  : undefined
            }
          />
        </motion.div>
      </div>
    </SquircleGlass>
  );
}
