import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaThreads,
  FaTiktok,
  FaTwitch,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import type { IconType } from "react-icons";

const icons: Record<string, IconType> = {
  instagram: FaInstagram,
  facebook: FaFacebookF,
  tiktok: FaTiktok,
  youtube: FaYoutube,
  threads: FaThreads,
  twitch: FaTwitch,
  linkedin: FaLinkedinIn,
  twitter: FaXTwitter,
};

export function PlatformIcon({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  const Icon = icons[id] ?? FaInstagram;
  return <Icon aria-hidden="true" className={className} />;
}
