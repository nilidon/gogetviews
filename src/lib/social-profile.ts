import { ALLOWED_PLATFORMS, isAllowedPlatform, type AllowedPlatform } from "@/lib/platforms";

const PLATFORM_HOSTS: Record<AllowedPlatform, string[]> = {
  Instagram: ["instagram.com", "instagr.am"],
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
const PREVIEW_UA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

export type ProfileResolution =
  | { ok: true; platform: AllowedPlatform; username: string; profileKey: string; videoUrl: string }
  | { ok: false; error: string };

export async function resolveSocialProfile(
  platformName: string,
  rawLink: string,
): Promise<ProfileResolution> {
  if (!isAllowedPlatform(platformName)) {
    return { ok: false, error: "Pick a platform, then paste the video link." };
  }

  const trimmed = rawLink.trim();
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(candidate);
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
  const found = direct
    ? { username: direct, videoUrl: url.toString() }
    : await lookupUsername(platformName, url);
  if (!found) {
    return {
      ok: false,
      error: "We couldn't tell which profile this video belongs to. Paste the video link from that account.",
    };
  }

  return {
    ok: true,
    platform: platformName,
    username: found.username,
    videoUrl: found.videoUrl,
    profileKey: `${platformName.toLowerCase()}:${found.username.toLowerCase()}`,
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

async function lookupUsername(
  platform: AllowedPlatform,
  url: URL,
): Promise<{ username: string; videoUrl: string } | null> {
  const finalUrl = await followRedirects(url.toString(), platform);
  let resolved = url;
  try {
    resolved = new URL(finalUrl);
  } catch {
    resolved = url;
  }

  const fromRedirect = usernameFromUrl(platform, resolved);
  if (fromRedirect) return { username: fromRedirect, videoUrl: resolved.toString() };

  if (platform === "YouTube") {
    const username = await youtubeAuthor(resolved.toString());
    return username ? { username, videoUrl: resolved.toString() } : null;
  }
  if (platform === "TikTok") {
    return (await tiktokAuthor(url.toString())) ?? (resolved.toString() === url.toString() ? null : tiktokAuthor(resolved.toString()));
  }
  if (platform === "Instagram") return instagramOwner(url, resolved);
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

async function tiktokAuthor(videoUrl: string): Promise<{ username: string; videoUrl: string } | null> {
  const fromOembed = await tiktokOembed(videoUrl);
  if (fromOembed) return { username: fromOembed, videoUrl: tiktokVideoUrl(videoUrl) ?? videoUrl };

  const videoId = videoUrl.match(/\/video\/(\d+)/)?.[1];
  const canonical = videoId ? `https://www.tiktok.com/video/${videoId}` : null;
  if (canonical && canonical !== videoUrl) {
    const fromId = await tiktokOembed(canonical);
    if (fromId) return { username: fromId, videoUrl: canonical };
  }

  return tiktokUsernameFromPage(videoUrl);
}

function tiktokVideoUrl(videoUrl: string): string | null {
  const videoId = videoUrl.match(/\/video\/(\d+)/)?.[1];
  return videoId ? `https://www.tiktok.com/video/${videoId}` : null;
}

async function tiktokOembed(videoUrl: string): Promise<string | null> {
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

async function tiktokUsernameFromPage(videoUrl: string): Promise<{ username: string; videoUrl: string } | null> {
  try {
    const response = await fetch(videoUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": BROWSER_UA, Accept: "text/html" },
    });
    if (!response.ok) return null;
    const landed = tiktokVideoUrl(response.url) ?? response.url;
    try {
      const fromFinal = usernameFromUrl("TikTok", new URL(response.url));
      if (fromFinal) return { username: fromFinal, videoUrl: landed };
    } catch {
      // The page body can still name the account.
    }
    const html = await readLimited(response, 500_000);
    const uniqueId = html.match(/"uniqueId"\s*:\s*"([^"]+)"/);
    const fromId = uniqueId ? cleanUsername(uniqueId[1]) : null;
    if (fromId && !RESERVED.TikTok.has(fromId.toLowerCase())) {
      return { username: fromId, videoUrl: landed };
    }
    const canonical = html.match(/tiktok\.com\/@([^/"'?]+)/i);
    const fromHtml = canonical ? cleanUsername(canonical[1]) : null;
    return fromHtml ? { username: fromHtml, videoUrl: landed } : null;
  } catch {
    return null;
  }
}

async function instagramOwner(
  original: URL,
  resolved: URL,
): Promise<{ username: string; videoUrl: string } | null> {
  const targets: string[] = [];
  for (const url of [resolved, original]) {
    const canonical = instagramMediaUrl(url);
    if (canonical && !targets.includes(canonical)) targets.push(canonical);
  }
  for (const url of [resolved, original]) {
    const value = url.toString();
    if (!targets.includes(value)) targets.push(value);
  }

  for (const target of targets) {
    const found = await instagramUsernameFromPreview(target);
    if (found) return found;
  }
  return null;
}

function instagramMediaUrl(url: URL): string | null {
  const parts = segments(url);
  const kindIndex = parts.findIndex((part) => ["p", "reel", "reels", "tv"].includes(part.toLowerCase()));
  const code = kindIndex >= 0 ? parts[kindIndex + 1] : null;
  if (!code || !/^[\w-]+$/.test(code)) return null;
  const kind = parts[kindIndex].toLowerCase();
  const path = kind === "tv" ? "tv" : kind === "p" ? "p" : "reel";
  return `https://www.instagram.com/${path}/${encodeURIComponent(code)}/`;
}

async function instagramUsernameFromPreview(
  pageUrl: string,
): Promise<{ username: string; videoUrl: string } | null> {
  try {
    const response = await fetch(pageUrl, {
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": PREVIEW_UA, Accept: "text/html" },
    });
    if (!response.ok) return null;

    try {
      const finalUrl = new URL(response.url);
      const fromFinal = usernameFromUrl("Instagram", finalUrl);
      if (fromFinal) return { username: fromFinal, videoUrl: instagramMediaUrl(finalUrl) ?? pageUrl };
    } catch {
      // The preview body can still carry the owner.
    }

    const html = await readLimited(response, 1_200_000);
    const username = instagramUsernameFromHtml(html);
    if (!username) return null;
    return { username, videoUrl: instagramMediaUrl(new URL(pageUrl)) ?? pageUrl };
  } catch {
    return null;
  }
}

function instagramUsernameFromHtml(html: string): string | null {
  const links = [
    ...html.matchAll(/property=["']og:url["']\s+content=["']([^"']+)["']/gi),
    ...html.matchAll(/content=["']([^"']+)["']\s+property=["']og:url["']/gi),
    ...html.matchAll(/rel=["']canonical["']\s+href=["']([^"']+)["']/gi),
  ];
  for (const match of links) {
    const href = decodeHtml(match[1]);
    try {
      const username = usernameFromUrl("Instagram", new URL(href));
      if (username) return username;
    } catch {
      // Try the next link.
    }
  }

  const owner = html.match(/"username"\s*:\s*"([A-Za-z0-9._]{1,30})"/);
  const fromOwner = owner ? cleanUsername(owner[1]) : null;
  if (fromOwner && !RESERVED.Instagram.has(fromOwner.toLowerCase())) return fromOwner;
  return null;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
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
