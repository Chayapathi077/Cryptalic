import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

type FireLogoProps = {
  className?: string;
};

export function FireLogo({ className }: FireLogoProps) {
  return (
    <Flame
      className={cn(
        "h-8 w-8 fill-sky-400 text-sky-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.65)]",
        className
      )}
      strokeWidth={1.5}
    />
  );
}
