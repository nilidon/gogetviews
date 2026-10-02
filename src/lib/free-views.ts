import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CLAIMS_FILE = path.join(DATA_DIR, "free-views.json");

export interface FreeViewClaim {
  platform: string;
  profileKey: string;
  username: string;
  link: string;
  userId?: string;
  createdAt: string;
}

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(CLAIMS_FILE);
  } catch {
    await fs.writeFile(CLAIMS_FILE, "[]", "utf-8");
  }
}

async function readClaims(): Promise<FreeViewClaim[]> {
  await ensureStore();
  const raw = await fs.readFile(CLAIMS_FILE, "utf-8");
  return JSON.parse(raw) as FreeViewClaim[];
}

let queue: Promise<unknown> = Promise.resolve();

export async function accountHasClaimedFreeViews(userId: string): Promise<boolean> {
  const claims = await readClaims();
  return claims.some((claim) => claim.userId === userId);
}

export function claimFreeView(input: {
  platform: string;
  profileKey: string;
  username: string;
  link: string;
  userId?: string;
}): Promise<{ ok: true } | { ok: false }> {
  const run = queue.then(() => claimFreeViewNow(input));
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function claimFreeViewNow(input: {
  platform: string;
  profileKey: string;
  username: string;
  link: string;
  userId?: string;
}): Promise<{ ok: true } | { ok: false }> {
  const claims = await readClaims();
  const key = input.profileKey.toLowerCase();
  const userId = input.userId?.trim();
  if (claims.some((claim) => claim.profileKey.toLowerCase() === key)) {
    return { ok: false };
  }
  if (userId && claims.some((claim) => claim.userId === userId)) {
    return { ok: false };
  }

  claims.push({
    platform: input.platform,
    profileKey: key,
    username: input.username,
    link: input.link,
    userId,
    createdAt: new Date().toISOString(),
  });
  await fs.writeFile(CLAIMS_FILE, JSON.stringify(claims, null, 2), "utf-8");
  return { ok: true };
}
