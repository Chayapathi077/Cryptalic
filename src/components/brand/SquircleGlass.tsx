import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "h-10 w-10 p-2 rounded-xl",
  md: "h-[4.5rem] w-[4.5rem] p-3 rounded-2xl",
  lg: "h-20 w-20 p-4 rounded-2xl",
} as const;

type SquircleGlassProps = {
  children: React.ReactNode;
  size?: keyof typeof sizeMap;
  className?: string;
};

export function SquircleGlass({
  children,
  size = "md",
  className,
}: SquircleGlassProps) {
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center",
        "border border-white/25 bg-white/10 shadow-lg backdrop-blur-xl",
        "ring-1 ring-white/10",
        sizeMap[size],
        className
      )}
    >
      {children}
    </div>
  );
}
