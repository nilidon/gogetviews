import { ALLOWED_PLATFORMS, isAllowedPlatform, type AllowedPlatform } from "@/lib/platforms";

const PLATFORM_HOSTS: Record<AllowedPlatform, string[]> = {
  Instagram: ["instagram.com"],
  TikTok: ["tiktok.com"],
  Facebook: ["facebook.com", "fb.com", "fb.watch"],
  YouTube: ["youtube.com", "youtu.be", "youtube-nocookie.com"],
  Twitter: ["twitter.com", "x.com"],
  Threads: ["threads.net", "threads.com"],
  Twitch: ["twitch.tv"],
  LinkedIn: ["linkedin.com"],
};

const RESERVED: Record<AllowedPlatform, Set<string>> = {
  Instagram: new Set([
    "p",
    "reel",
    "reels",
    "tv",
    "stories",
    "explore",
    "accounts",
    "direct",
    "about",
    "developer",
    "legal",
    "directory",
  ]),
  TikTok: new Set(["foryou", "following", "explore", "live", "discover", "tag", "music", "search"]),
  Facebook: new Set([
    "watch",
    "reel",
    "reels",
    "share",
    "sharer",
    "groups",
    "events",
    "pages",
    "stories",
    "login",
    "dialog",
    "people",
    "gaming",
    "marketplace",
    "photo.php",
    "story.php",
    "permalink.php",
    "profile.php",
  ]),
  YouTube: new Set([
    "watch",
    "shorts",
    "embed",
    "playlist",
    "feed",
    "results",
    "channel",
    "c",
    "user",
    "live",
    "clip",
    "attribution_link",
  ]),
  Twitter: new Set([
    "home",
    "explore",
    "search",
    "i",
    "intent",
    "share",
    "settings",
    "messages",
    "notifications",
    "compose",
    "hashtag",
  ]),
  Threads: new Set(["search", "intent", "login"]),
  Twitch: new Set([
    "videos",
    "directory",
    "downloads",
    "settings",
    "subscriptions",
    "inventory",
    "wallet",
    "drops",
    "search",
    "jobs",
    "clip",
  ]),
  LinkedIn: new Set(["feed", "posts", "in", "company", "jobs", "messaging", "login", "signup"]),
};

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

export type ProfileResolution =
  | { ok: true; platform: AllowedPlatform; username: string; profileKey: string }
  | { ok: false; error: string };

export async function resolveSocialProfile(
  platformName: string,
  rawLink: string,
): Promise<ProfileResolution> {
  if (!isAllowedPlatform(platformName)) {
    return { ok: false, error: "Pick a platform, then paste the video link." };
  }

  let url: URL;
  try {
    url = new URL(rawLink.trim());
  } catch {
    return { ok: false, error: "Paste a valid video link." };
  }

  if (!isSafePublicUrl(url)) {
    return { ok: false, error: "Paste a valid video link." };
  }

  const detected = platformForHost(url.hostname);
  if (!detected) {
    return { ok: false, error: "Paste a video link from the platform you picked." };
  }
  if (detected !== platformName) {
    const article = /^[aeiou]/i.test(platformName) ? "an" : "a";
    return {
      ok: false,
      error: `That link is for ${detected}. Pick ${detected}, or paste ${article} ${platformName} video link.`,
    };
  }

  const direct = usernameFromUrl(platformName, url);
  const username = direct ?? (await lookupUsername(platformName, url));
  if (!username) {
    return {
      ok: false,
      error: "We couldn't tell which profile this video belongs to. Paste the video link from that account.",
    };
  }

  return {
    ok: true,
    platform: platformName,
    username,
    profileKey: `${platformName.toLowerCase()}:${username.toLowerCase()}`,
  };
}

function usernameFromUrl(platform: AllowedPlatform, url: URL): string | null {
  const parts = segments(url);

  if (platform === "TikTok") {
    const match = url.pathname.match(/\/@([^/?#]+)/);
    return match ? cleanUsername(match[1]) : null;
  }

  if (platform === "Instagram") {
    if (parts[0]?.toLowerCase() === "stories" && parts[1]) return cleanUsername(parts[1]);
    if (
      parts[0] &&
      parts[1] &&
      ["p", "reel", "reels", "tv"].includes(parts[1].toLowerCase()) &&
      !RESERVED.Instagram.has(parts[0].toLowerCase())
    ) {
      return cleanUsername(parts[0]);
    }
    if (parts[0] && !parts[1] && !RESERVED.Instagram.has(parts[0].toLowerCase())) {
      return cleanUsername(parts[0]);
    }
    return null;
  }

  if (platform === "YouTube") {
    if (parts[0]?.startsWith("@")) return cleanUsername(parts[0].slice(1));
    if (parts[0] === "channel" && parts[1]) return cleanUsername(parts[1]);
    if ((parts[0] === "c" || parts[0] === "user") && parts[1]) return cleanUsername(parts[1]);
    return null;
  }

  if (platform === "Facebook") {
    const profileId = url.searchParams.get("id");
    if (url.pathname.replace(/\/+$/, "") === "/profile.php" && profileId) {
      return cleanUsername(`id:${profileId}`);
    }
    if (
      parts[0] &&
      parts[1] &&
      ["videos", "reel", "reels", "posts", "photos"].includes(parts[1].toLowerCase()) &&
      !RESERVED.Facebook.has(parts[0].toLowerCase())
    ) {
      return cleanUsername(parts[0]);
    }
    return null;
  }

  if (platform === "Threads") {
    const match = url.pathname.match(/\/@([^/?#]+)/);
    return match ? cleanUsername(match[1]) : null;
  }

  if (platform === "Twitter") {
    if (parts[0] && parts[1]?.toLowerCase() === "status" && !RESERVED.Twitter.has(parts[0].toLowerCase())) {
      return cleanUsername(parts[0]);
    }
    return null;
  }

  if (platform === "Twitch") {
    if (parts[0] && !RESERVED.Twitch.has(parts[0].toLowerCase())) {
      if (!parts[1] || ["clip", "videos", "video"].includes(parts[1].toLowerCase())) {
        return cleanUsername(parts[0]);
      }
    }
    return null;
  }

  if (parts[0] === "in" && parts[1]) return cleanUsername(parts[1]);
  if (parts[0] === "posts" && parts[1]) {
    const name = parts[1].split("_")[0];
    return cleanUsername(name);
  }
  return null;
}

async function lookupUsername(platform: AllowedPlatform, url: URL): Promise<string | null> {
  const finalUrl = await followRedirects(url.toString(), platform);
  let resolved: URL;
  try {
    resolved = new URL(finalUrl);
  } catch {
    return null;
  }

  const fromRedirect = usernameFromUrl(platform, resolved);
  if (fromRedirect) return fromRedirect;

  if (platform === "YouTube") return youtubeAuthor(resolved.toString());
  if (platform === "TikTok") return tiktokAuthor(resolved.toString());
  if (platform === "Instagram") return instagramOwner(resolved);
  return null;
}

async function youtubeAuthor(videoUrl: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(videoUrl)}`,
      { signal: AbortSignal.timeout(8000), headers: { Accept: "application/json" } },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { author_url?: string };
    if (!data.author_url) return null;
    const author = new URL(data.author_url);
    if (!hostAllowed("YouTube", author.hostname)) return null;
    return usernameFromUrl("YouTube", author);
  } catch {
    return null;
  }
}

async function tiktokAuthor(videoUrl: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`,
      { signal: AbortSignal.timeout(8000), headers: { Accept: "application/json" } },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { author_unique_id?: string; author_url?: string };
    if (data.author_unique_id) return cleanUsername(data.author_unique_id);
    if (!data.author_url) return null;
    const author = new URL(data.author_url);
    if (!hostAllowed("TikTok", author.hostname)) return null;
    return usernameFromUrl("TikTok", author);
  } catch {
    return null;
  }
}

async function instagramOwner(url: URL): Promise<string | null> {
  const parts = segments(url);
  const kindIndex = parts.findIndex((part) => ["p", "reel", "reels", "tv"].includes(part.toLowerCase()));
  const code = kindIndex >= 0 ? parts[kindIndex + 1] : null;
  if (!code || !/^[\w-]+$/.test(code)) return null;

  const kind = parts[kindIndex].toLowerCase() === "tv" ? "tv" : parts[kindIndex].toLowerCase() === "p" ? "p" : "reel";
  try {
    const response = await fetch(`https://www.instagram.com/${kind}/${encodeURIComponent(code)}/embed/`, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": BROWSER_UA, Accept: "text/html" },
    });
    if (!response.ok) return null;
    const html = await readLimited(response, 180_000);
    const canonical = html.match(/instagram\.com\/([A-Za-z0-9._]{1,30})\/(?:reel|reels|p|tv)\//i);
    const fromCanonical = canonical ? cleanUsername(canonical[1]) : null;
    if (fromCanonical && !RESERVED.Instagram.has(fromCanonical.toLowerCase())) return fromCanonical;

    const owner = html.match(/"username"\s*:\s*"([A-Za-z0-9._]{1,30})"/);
    const fromOwner = owner ? cleanUsername(owner[1]) : null;
    if (fromOwner && !RESERVED.Instagram.has(fromOwner.toLowerCase())) return fromOwner;
    return null;
  } catch {
    return null;
  }
}

async function followRedirects(start: string, platform: AllowedPlatform): Promise<string> {
  let current = start;
  for (let hop = 0; hop < 5; hop += 1) {
    try {
      const response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": BROWSER_UA, Accept: "text/html" },
      });
      await response.body?.cancel().catch(() => undefined);
      if (response.status < 300 || response.status >= 400) return current;
      const location = response.headers.get("location");
      if (!location) return current;
      const next = new URL(location, current);
      if (!isSafePublicUrl(next) || !hostAllowed(platform, next.hostname)) return current;
      current = next.toString();
    } catch {
      return current;
    }
  }
  return current;
}

async function readLimited(response: Response, max: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let text = "";
  try {
    while (text.length < max) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return text;
}

function segments(url: URL): string[] {
  return url.pathname
    .split("/")
    .filter(Boolean)
    .map((part) => {
      try {
        return decodeURIComponent(part);
      } catch {
        return part;
      }
    });
}

function cleanUsername(value: string): string | null {
  const username = value.trim().replace(/^@+/, "").replace(/\.+$/, "");
  if (!username || username.length > 80) return null;
  if (!/^[\p{L}\p{N}._:-]+$/u.test(username)) return null;
  return username;
}

function platformForHost(hostname: string): AllowedPlatform | null {
  for (const platform of ALLOWED_PLATFORMS) {
    if (hostAllowed(platform, hostname)) return platform;
  }
  return null;
}

function hostAllowed(platform: AllowedPlatform, hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return PLATFORM_HOSTS[platform].some((root) => host === root || host.endsWith(`.${root}`));
}

function isSafePublicUrl(url: URL): boolean {
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".local")) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":")) return false;
  return platformForHost(host) !== null;
}
