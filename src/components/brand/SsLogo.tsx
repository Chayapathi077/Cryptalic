import { Codesandbox } from "lucide-react";
import { cn } from "@/lib/utils";

type SsLogoProps = {
  className?: string;
  iconClassName?: string;
};

export function SsLogo({ className, iconClassName }: SsLogoProps) {
  const sizeClass = iconClassName ?? "h-7 w-7";
  
  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center",
        className
      )}
    >
      <Codesandbox
        className={cn("text-white stroke-[2.5]", sizeClass)}
      />
    </div>
  );
}
