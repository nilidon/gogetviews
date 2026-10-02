export interface PlatformBrand {
  abbr: string;
  color: string;
  ring: string;
  gradient?: string;
}

export const PLATFORM_BRANDS: Record<string, PlatformBrand> = {
  Instagram: {
    abbr: "IG",
    color: "#E4405F",
    ring: "rgba(228, 64, 95, 0.35)",
    gradient: "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)",
  },
  TikTok: {
    abbr: "TT",
    color: "#111111",
    ring: "rgba(17, 17, 17, 0.28)",
  },
  Facebook: {
    abbr: "FB",
    color: "#1877F2",
    ring: "rgba(24, 119, 242, 0.35)",
  },
  YouTube: {
    abbr: "YT",
    color: "#FF0000",
    ring: "rgba(255, 0, 0, 0.3)",
  },
  Twitter: {
    abbr: "X",
    color: "#FFFFFF",
    ring: "rgba(255, 255, 255, 0.2)",
  },
  Threads: {
    abbr: "TH",
    color: "#FFFFFF",
    ring: "rgba(255, 255, 255, 0.2)",
  },
  Twitch: {
    abbr: "TW",
    color: "#9146FF",
    ring: "rgba(145, 70, 255, 0.35)",
  },
  LinkedIn: {
    abbr: "IN",
    color: "#0A66C2",
    ring: "rgba(10, 102, 194, 0.35)",
  },
};

export function getPlatformBrand(name: string): PlatformBrand {
  return (
    PLATFORM_BRANDS[name] ?? {
      abbr: name.slice(0, 2).toUpperCase(),
      color: "#818CF8",
      ring: "rgba(129, 140, 248, 0.35)",
    }
  );
}
