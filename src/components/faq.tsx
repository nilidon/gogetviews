import { Plus } from "lucide-react";

const faqs = [
  {
    q: "How do I get my 100,000 free views?",
    a: "Pick a platform and paste a public video link. Free views are sent once for that social media profile, even if you try another video on the same account.",
  },
  {
    q: "Do you need my password?",
    a: "Never. All services work with a public profile or post link only. Your account stays fully in your control.",
  },
  {
    q: "How fast will my order start?",
    a: "Most orders start within 5 minutes. Delivery speed for each service is listed on its card so you know exactly what to expect.",
  },
  {
    q: "What if my numbers drop?",
    a: "Every eligible service includes a 30-day refill guarantee. If counts drop, we automatically top them back up at no cost.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "All major credit and debit cards through secure Stripe checkout, including Apple Pay and Google Pay where available.",
  },
];

export function Faq({ hasAccount = false }: { hasAccount?: boolean }) {
  const items = hasAccount ? faqs.filter((item) => !item.q.includes("100,000")) : faqs;
  return (
    <section id="faq" className="scroll-mt-16 border-t border-border bg-card py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1fr_1.6fr] lg:gap-20">
        <div>
          <p className="text-sm font-semibold text-primary">FAQ</p>
          <h2 className="mt-2 font-display text-4xl font-bold tracking-tight text-balance md:text-5xl">
            Questions, answered.
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            {"Can't find what you need? "}
            <a href="/account" className="font-semibold text-foreground underline underline-offset-4 hover:text-primary">
              View your orders
            </a>
            .
          </p>
        </div>

        <div className="flex flex-col">
          {items.map((item) => (
            <details key={item.q} className="group border-b border-border py-5 first:pt-0">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus
                  className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-45"
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
