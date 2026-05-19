import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type SsLogoProps = {
  className?: string;
  iconClassName?: string;
};

export function SsLogo({ className, iconClassName }: SsLogoProps) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center",
        className
      )}
    >
      <Zap
        className={cn(
          "absolute text-white",
          iconClassName ?? "h-7 w-7 -translate-x-[0.35rem]"
        )}
      />
      <Zap
        className={cn(
          "absolute text-white",
          iconClassName ?? "h-7 w-7 translate-x-[0.35rem]"
        )}
      />
    </div>
  );
}
