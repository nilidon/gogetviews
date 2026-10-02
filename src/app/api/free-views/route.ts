import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/account-auth";
import { deliverFreeViews } from "@/lib/free-views";
import {
  findFreeViewsService,
  FREE_VIEWS_QUANTITY,
  freeViewsQuantityFits,
  placeFreeViewsOrder,
} from "@/lib/free-views-order";
import { createOrder } from "@/lib/orders";
import { resolveSocialProfile } from "@/lib/social-profile";
import { markAccountFreeViewsClaimed } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

const ALREADY_SENT = "Free views were already sent to this profile.";
const UNAVAILABLE = "Free views aren't available for this platform right now.";
const FAILED = "We couldn't send the free views. Try again.";

export async function POST(request: Request) {
  let body: { platform?: string; link?: string };
  try {
    body = (await request.json()) as { platform?: string; link?: string };
  } catch {
    return NextResponse.json({ error: "Paste a valid video link." }, { status: 400 });
  }

  const platform = body.platform?.trim() ?? "";
  const link = body.link?.trim() ?? "";
  if (!platform || !link) {
    return NextResponse.json({ error: "Pick a platform and paste the video link." }, { status: 400 });
  }

  try {
    const profile = await resolveSocialProfile(platform, link);
    if (!profile.ok) {
      return NextResponse.json({ error: profile.error }, { status: 400 });
    }

    const service = await findFreeViewsService(profile.platform);
    if (!service || !freeViewsQuantityFits(service)) {
      return NextResponse.json({ error: UNAVAILABLE }, { status: 503 });
    }

    const account = await getCurrentAccount();
    const claim = await deliverFreeViews({
      platform: profile.platform,
      profileKey: profile.profileKey,
      username: profile.username,
      link,
      userId: account?.id,
      send: () => placeFreeViewsOrder(service.service, link),
    });

    if (!claim.ok && claim.reason === "already_claimed") {
      return NextResponse.json({ code: "already_claimed", error: ALREADY_SENT }, { status: 409 });
    }

    if (!claim.ok) {
      return NextResponse.json({ error: FAILED }, { status: 502 });
    }

    try {
      await createOrder({
        id: randomUUID(),
        gogetviewsOrderId: claim.orderId,
        serviceId: service.service,
        serviceName: `${profile.platform} - Views`,
        platform: profile.platform,
        link,
        email: account?.email,
        userId: account?.id,
        quantity: FREE_VIEWS_QUANTITY,
        amountCents: 0,
        currency: "usd",
        status: "processing",
      });
    } catch {
      // The supplier order is already placed. A missing orders table should not block the gift.
    }

    if (account) {
      try {
        await markAccountFreeViewsClaimed(account.id);
      } catch {
        // The claim is already saved for this account.
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: FAILED }, { status: 500 });
  }
}
