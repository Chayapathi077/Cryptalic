import Link from "next/link";
import { cn } from "@/lib/utils";
import { BrandMark } from "./BrandMark";

type AppHeaderBrandProps = {
  href?: string;
  className?: string;
  showTitle?: boolean;
};

/** Docked header logo + title used across authenticated pages */
export function AppHeaderBrand({
  href = "/dashboard",
  className,
  showTitle = true,
}: AppHeaderBrandProps) {
  const content = (
    <div className={cn("flex flex-row items-center gap-3", className)}>
      <BrandMark size="sm" phase="done" />
      {showTitle && (
        <span className="font-headline text-2xl font-bold text-white">
          Cryptalic
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
