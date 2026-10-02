import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { config } from "@/lib/config";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <a href="/" className="flex items-center gap-2" aria-label={`${config.siteName} home`}>
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <ArrowUpRight className="size-5" strokeWidth={2.75} aria-hidden="true" />
      </span>
      <span
        className={cn(
          "font-display text-xl font-bold tracking-tight",
          inverted ? "text-ink-foreground" : "text-foreground",
        )}
      >
        {config.siteName}
      </span>
    </a>
  );
}
