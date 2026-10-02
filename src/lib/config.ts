export const config = {
  siteName: process.env.NEXT_PUBLIC_SITE_NAME ?? "GoGetViews",
  siteTagline:
    process.env.NEXT_PUBLIC_SITE_TAGLINE ??
    "Premium social growth — order with your email, then save it to an account.",
  apiUrl: process.env.GOGETVIEWS_API_URL ?? "",
  apiKey: process.env.GOGETVIEWS_API_KEY ?? "",
  markupMultiplier: Number(process.env.MARKUP_MULTIPLIER ?? "2"),
  minimumChargeCents: Number(process.env.MINIMUM_CHARGE_CENTS ?? "50"),
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  adminSessionSecret:
    process.env.ADMIN_SESSION_SECRET ?? process.env.ADMIN_PASSWORD ?? "change-me-in-production",
};
