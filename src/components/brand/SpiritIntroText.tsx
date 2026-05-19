"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const TITLE = "Spirit Services";

type SpiritIntroTextProps = {
  visible: boolean;
  onTypingComplete?: () => void;
};

export function SpiritIntroText({
  visible,
  onTypingComplete,
}: SpiritIntroTextProps) {
  const [typed, setTyped] = useState("");
  const [showPresents, setShowPresents] = useState(false);

  useEffect(() => {
    if (!visible) {
      setTyped("");
      setShowPresents(false);
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setTyped(TITLE.slice(0, index));
      if (index >= TITLE.length) {
        clearInterval(interval);
        setTimeout(() => {
          setShowPresents(true);
          onTypingComplete?.();
        }, 200);
      }
    }, 70);

    return () => clearInterval(interval);
  }, [visible, onTypingComplete]);

  return (
    <div
      className={cn(
        "mt-8 flex flex-col items-center text-center transition-opacity duration-500",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <h1
        className="font-headline text-4xl font-bold tracking-tight text-white md:text-5xl"
        aria-label={TITLE}
      >
        {typed}
        {visible && typed.length < TITLE.length && (
          <span className="ml-0.5 inline-block w-[2px] animate-pulse bg-white/80">
            &nbsp;
          </span>
        )}
      </h1>
      <p
        className={cn(
          "mt-3 font-headline text-xs font-extralight uppercase text-white/90",
          showPresents ? "animate-presents-expand" : "opacity-0 tracking-[0.1em]"
        )}
      >
        Presents
      </p>
    </div>
  );
}
