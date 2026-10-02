import { PlatformIcon } from "@/components/platform-icon";
import { platformIconKey } from "@/lib/platforms";
import type { PlatformGroup } from "@/types/service";

const fallback = [
  "Instagram",
  "Facebook",
  "TikTok",
  "YouTube",
  "Threads",
  "Twitch",
  "LinkedIn",
];

const COPIES = 6;

export function PlatformStrip({ platforms }: { platforms: PlatformGroup[] }) {
  const names = platforms.length > 0 ? platforms.map((item) => item.name) : fallback;
  const loop = Array.from({ length: COPIES }, () => names).flat();

  return (
    <section aria-label="Supported platforms" className="border-y border-border bg-card py-6">
      <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div
          className="flex w-max animate-marquee motion-reduce:animate-none"
          style={{ animationDuration: `${32 * COPIES}s` }}
        >
          <PlatformTrack names={loop} />
          <PlatformTrack names={loop} hidden />
        </div>
      </div>
    </section>
  );
}

function PlatformTrack({ names, hidden }: { names: string[]; hidden?: boolean }) {
  return (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center gap-14 pr-14">
      {names.map((name, index) => (
        <li
          key={`${name}-${index}`}
          className="flex items-center gap-3 whitespace-nowrap text-muted-foreground"
        >
          <PlatformIcon id={platformIconKey(name)} className="size-6 shrink-0" />
          <span className="font-display text-xl font-semibold">{name}</span>
        </li>
      ))}
    </ul>
  );
}
