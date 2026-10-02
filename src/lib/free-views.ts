import { readCatalogDocument, writeCatalogDocument } from "@/lib/catalog-store";

const DOCUMENT = "free-views.json";

export interface FreeViewClaim {
  platform: string;
  profileKey: string;
  username: string;
  link: string;
  userId?: string;
  supplierOrderId?: number;
  createdAt: string;
}

async function readClaims(): Promise<FreeViewClaim[]> {
  const claims = await readCatalogDocument<FreeViewClaim[]>(DOCUMENT, []);
  return Array.isArray(claims) ? claims : [];
}

async function writeClaims(claims: FreeViewClaim[]): Promise<void> {
  await writeCatalogDocument(DOCUMENT, claims);
}

let queue: Promise<unknown> = Promise.resolve();

export async function accountHasClaimedFreeViews(userId: string): Promise<boolean> {
  try {
    const claims = await readClaims();
    return claims.some((claim) => claim.userId === userId);
  } catch {
    return false;
  }
}

export function deliverFreeViews(input: {
  platform: string;
  profileKey: string;
  username: string;
  link: string;
  userId?: string;
  send: () => Promise<number>;
}): Promise<
  { ok: true; orderId: number } | { ok: false; reason: "already_claimed" | "failed" }
> {
  const run = queue.then(() => deliverFreeViewsNow(input));
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function deliverFreeViewsNow(input: {
  platform: string;
  profileKey: string;
  username: string;
  link: string;
  userId?: string;
  send: () => Promise<number>;
}): Promise<
  { ok: true; orderId: number } | { ok: false; reason: "already_claimed" | "failed" }
> {
  const claims = await readClaims();
  const key = input.profileKey.toLowerCase();
  const userId = input.userId?.trim();
  if (claims.some((claim) => claim.profileKey.toLowerCase() === key)) {
    return { ok: false, reason: "already_claimed" };
  }
  if (userId && claims.some((claim) => claim.userId === userId)) {
    return { ok: false, reason: "already_claimed" };
  }

  const reservation: FreeViewClaim = {
    platform: input.platform,
    profileKey: key,
    username: input.username,
    link: input.link,
    userId,
    createdAt: new Date().toISOString(),
  };
  await writeClaims([...claims, reservation]);

  try {
    const orderId = await input.send();
    try {
      const latest = await readClaims();
      const saved = latest.map((claim) =>
        claim.profileKey.toLowerCase() === key ? { ...claim, supplierOrderId: orderId } : claim,
      );
      if (!saved.some((claim) => claim.profileKey.toLowerCase() === key)) {
        saved.push({ ...reservation, supplierOrderId: orderId });
      }
      await writeClaims(saved);
    } catch {
      // The views were already sent. Keep the reservation so this profile is not charged again.
    }
    return { ok: true, orderId };
  } catch {
    try {
      const latest = await readClaims();
      await writeClaims(
        latest.filter(
          (claim) => claim.profileKey.toLowerCase() !== key || claim.supplierOrderId !== undefined,
        ),
      );
    } catch {
      // Leave the reservation in place so a retry cannot place a second order.
    }
    return { ok: false, reason: "failed" };
  }
}
