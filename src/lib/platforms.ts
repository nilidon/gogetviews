export const ALLOWED_PLATFORMS = [
  "Instagram",
  "TikTok",
  "Facebook",
  "YouTube",
  "Twitter",
  "Threads",
  "Twitch",
  "LinkedIn",
] as const;

export type AllowedPlatform = (typeof ALLOWED_PLATFORMS)[number];

/** Longer / more specific platform names first (e.g. Threads before Twitter). */
const PLATFORM_PATTERNS: { platform: AllowedPlatform; pattern: RegExp }[] = [
  { platform: "Instagram", pattern: /instagram|\binsta\b/i },
  { platform: "TikTok", pattern: /tiktok|\btik\s*tok\b/i },
  { platform: "Facebook", pattern: /facebook|\bfb\b/i },
  { platform: "YouTube", pattern: /youtube/i },
  { platform: "LinkedIn", pattern: /linkedin/i },
  { platform: "Threads", pattern: /\bthreads\b/i },
  { platform: "Twitch", pattern: /twitch/i },
  { platform: "Twitter", pattern: /twitter/i },
];

export function extractPlatform(category: string): AllowedPlatform | null {
  const text = category.trim();

  for (const { platform, pattern } of PLATFORM_PATTERNS) {
    if (pattern.test(text)) {
      return platform;
    }
  }

  return null;
}

export function isAllowedPlatform(platform: string): platform is AllowedPlatform {
  return (ALLOWED_PLATFORMS as readonly string[]).includes(platform);
}

export function platformIconKey(platform: string): string {
  return platform.toLowerCase().replace(/\s+/g, "-");
}
