"use client";

import { useState } from "react";
import { Faq } from "@/components/faq";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { OrderWizard } from "@/components/OrderWizard";
import { PlatformStrip } from "@/components/platform-strip";
import { ServicesSection } from "@/components/services-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WhyUs } from "@/components/why-us";
import type { PlatformGroup, ServiceWithPricing } from "@/types/service";

interface HomeExperienceProps {
  platforms: PlatformGroup[];
  services: ServiceWithPricing[];
  error: string | null;
  hasAccount?: boolean;
  freeViewsClaimed?: boolean;
}

const DISPLAY_ORDER = [
  "Instagram",
  "Facebook",
  "TikTok",
  "YouTube",
  "Threads",
  "Twitch",
  "LinkedIn",
  "Twitter",
];

export function HomeExperience({
  platforms,
  services,
  error,
  hasAccount = false,
  freeViewsClaimed = false,
}: HomeExperienceProps) {
  const orderedPlatforms = [...platforms].sort(
    (a, b) => DISPLAY_ORDER.indexOf(a.name) - DISPLAY_ORDER.indexOf(b.name),
  );
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [savedLink, setSavedLink] = useState("");
  const [startRequest, setStartRequest] = useState<{
    id: number;
    platform?: string;
    serviceId?: number;
    link?: string;
  } | null>(null);

  const beginOrder = (input: { platform?: string; serviceId?: number; link?: string }) => {
    setStartRequest({ id: Date.now(), ...input });
    requestAnimationFrame(() => {
      document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const claimViews = (input: { platform: string; link: string }) => {
    setSelectedPlatform(input.platform);
    setSavedLink(input.link);
    requestAnimationFrame(() => {
      document.getElementById("services")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <>
      <SiteHeader signedIn={hasAccount} freeViewsClaimed={freeViewsClaimed} />
      <main>
        {!freeViewsClaimed && <Hero platforms={orderedPlatforms} onClaim={claimViews} />}
        <PlatformStrip platforms={orderedPlatforms} />
        {error ? (
          <section className="mx-auto max-w-6xl px-5 py-20">
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950">
              <p className="font-semibold">Services unavailable</p>
              <p className="mt-2 text-sm">
                Check your API configuration in{" "}
                <code className="rounded bg-white px-1.5 py-0.5">.env.local</code> and restart the
                server.
              </p>
            </div>
          </section>
        ) : (
          <>
            <ServicesSection
              platforms={orderedPlatforms}
              services={services}
              selectedPlatform={selectedPlatform}
              onPlatformChange={setSelectedPlatform}
              onOrder={(service) =>
                beginOrder({
                  platform: service.platform,
                  serviceId: service.service,
                  link: savedLink,
                })
              }
            />
            <OrderWizard
              embedded
              platforms={orderedPlatforms}
              services={services}
              startRequest={startRequest}
              onReset={() => setStartRequest(null)}
            />
          </>
        )}
        <HowItWorks />
        <WhyUs hasAccount={freeViewsClaimed} />
        <Faq hasAccount={freeViewsClaimed} />
      </main>
      <SiteFooter platforms={orderedPlatforms} />
    </>
  );
}
