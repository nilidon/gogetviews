import { Headphones, RefreshCw, ShieldCheck, Zap } from "lucide-react";
import { config } from "@/lib/config";

const reasons = [
  {
    icon: Zap,
    title: "Fast start",
    body: "Most orders begin delivering in under five minutes, around the clock.",
  },
  {
    icon: ShieldCheck,
    title: "Account-safe",
    body: "We only need a public link. No logins, no passwords, no risk to your account.",
  },
  {
    icon: RefreshCw,
    title: "Refill guarantee",
    body: "If anything drops within 30 days, we top it back up automatically — free.",
  },
  {
    icon: Headphones,
    title: "Real humans",
    body: "Live chat support 24/7 from people who actually know social media.",
  },
];

const testimonials = [
  {
    quote:
      "The free 100K views got my TikTok onto the For You page. I came back and ordered for every video since.",
    name: "Maya R.",
    role: "Lifestyle creator",
  },
  {
    quote: `We run 14 client accounts through ${config.siteName}. Pricing is clear and support answers in minutes.`,
    name: "Jordan K.",
    role: "Agency owner",
  },
];

export function WhyUs({ hasAccount = false }: { hasAccount?: boolean }) {
  const quotes = hasAccount
    ? testimonials.filter((item) => !/100k|100,000|free views/i.test(item.quote))
    : testimonials;
  return (
    <section id="why-us" className="scroll-mt-16 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 lg:grid-cols-2 lg:gap-20">
        <div>
          <p className="text-sm font-semibold text-primary">Why {config.siteName}</p>
          <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-balance md:text-5xl">
            Growth you can actually rely on.
          </h2>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {reasons.map((reason) => (
              <div key={reason.title} className="flex flex-col gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <reason.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-display text-lg font-bold">{reason.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{reason.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:pt-16">
          {quotes.map((item) => (
            <figure key={item.name} className="rounded-2xl border border-border bg-card p-7">
              <blockquote className="font-display text-xl font-medium leading-snug text-pretty">
                {`“${item.quote}”`}
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-10 items-center justify-center rounded-full bg-secondary font-display text-sm font-bold"
                >
                  {item.name.charAt(0)}
                </span>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold">{item.name}</span>
                  <span className="text-sm text-muted-foreground">{item.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
