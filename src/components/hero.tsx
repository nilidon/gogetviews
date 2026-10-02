import { ArrowRight } from "lucide-react";
import { FreeTrialCard } from "@/components/free-trial-card";
import type { PlatformGroup } from "@/types/service";

interface HeroProps {
  platforms: PlatformGroup[];
  onClaim: (input: { platform: string; link: string }) => void;
}

export function Hero({ platforms, onClaim }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-secondary">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 md:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        <div className="min-w-0">
          <h1 className="font-display font-black tracking-[-0.045em] text-foreground">
            <span className="block text-[clamp(4rem,16vw,6.75rem)] leading-[0.85] text-black">
              100,000
            </span>
            <span className="mt-1 block text-[clamp(2.6rem,10vw,4.75rem)] leading-none text-black">
              <span className="text-primary">FREE</span> VIEWS
            </span>
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-foreground/75 sm:text-lg">
            Try it for <span className="font-extrabold text-primary">FREE</span> on Instagram, Facebook, TikTok, YouTube, Threads, Twitch or LinkedIn.
          </p>

          <a
            href="#free-trial"
            className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5 hover:bg-ink"
          >
            Claim your free views
            <ArrowRight className="size-4" aria-hidden="true" />
          </a>
          <p className="mt-3 text-xs text-muted-foreground">No credit card required. Get started in seconds.</p>
        </div>

        <FreeTrialCard platforms={platforms} onClaim={onClaim} />
      </div>
    </section>
  );
}
