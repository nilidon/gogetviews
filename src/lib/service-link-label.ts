interface LinkLabelService {
  name: string;
  displayName?: string;
  category?: string;
  type?: string;
}

function serviceSearchText(service: LinkLabelService): string {
  return [service.displayName, service.name, service.category, service.type]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** Followers and story views need a profile link; everything else needs a post link. */
export function usesProfileUrl(service: LinkLabelService): boolean {
  const text = serviceSearchText(service);

  if (/\bfollowers?\b/.test(text)) return true;
  if (/story\s*views?/.test(text)) return true;

  return false;
}

export function getLinkFieldLabel(service: LinkLabelService): string {
  return usesProfileUrl(service) ? "Profile URL" : "Post URL";
}

export function getLinkFieldHint(service: LinkLabelService): string {
  return usesProfileUrl(service)
    ? "Paste the full link to your profile."
    : "Paste the full link to the post you want to boost.";
}
