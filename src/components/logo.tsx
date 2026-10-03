import { cn } from "@/lib/utils";
import { config } from "@/lib/config";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <a href="/" className="flex items-center gap-2.5" aria-label={`${config.siteName} home`}>
      <img
        src="/logo.png"
        alt=""
        width={62}
        height={36}
        className="h-9 w-auto"
      />
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
