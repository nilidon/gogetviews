import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/lib/account-auth";
import { claimFreeView } from "@/lib/free-views";
import { resolveSocialProfile } from "@/lib/social-profile";
import { markAccountFreeViewsClaimed } from "@/lib/supabase-auth";

export const dynamic = "force-dynamic";

const ALREADY_SENT = "Free views were already sent to this profile.";

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

    const account = await getCurrentAccount();
    const claim = await claimFreeView({
      platform: profile.platform,
      profileKey: profile.profileKey,
      username: profile.username,
      link,
      userId: account?.id,
    });

    if (!claim.ok) {
      return NextResponse.json({ code: "already_claimed", error: ALREADY_SENT }, { status: 409 });
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
    return NextResponse.json(
      { error: "We couldn't check this profile. Try again." },
      { status: 500 },
    );
  }
}
