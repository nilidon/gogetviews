import { Link2, MousePointerClick, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: MousePointerClick,
    title: "Choose a service",
    body: "Select your platform and what you want to grow — followers, likes, views or more.",
  },
  {
    icon: Link2,
    title: "Paste your link",
    body: "Drop in the public link to your profile or post. We never ask for your password.",
  },
  {
    icon: TrendingUp,
    title: "Watch it grow",
    body: "Delivery starts within minutes. Track progress from your order page.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-16 bg-ink py-20 text-ink-foreground md:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-xl">
          <p className="text-sm font-semibold text-secondary">How it works</p>
          <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-balance md:text-5xl">
            Three steps. About thirty seconds.
          </h2>
        </div>

        <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
          {steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-4 border-t border-ink-foreground/15 pt-6">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-semibold text-ink-foreground/50">
                  Step {index + 1}
                </span>
                <step.icon className="size-6 text-secondary" aria-hidden="true" />
              </div>
              <h3 className="font-display text-2xl font-bold">{step.title}</h3>
              <p className="leading-relaxed text-ink-foreground/70">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
