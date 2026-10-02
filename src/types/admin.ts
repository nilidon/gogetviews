export interface ServiceOverride {
  enabled: boolean;
  /** Custom retail price per 1,000 units (USD). */
  retailRatePer1000?: number;
  /** Custom display name shown to customers. */
  displayName?: string;
  /** Lower values appear first on the site. */
  sortOrder?: number;
  updatedAt: string;
}

export type ServiceOverridesMap = Record<string, ServiceOverride>;

export interface CategoryOverride {
  displayName?: string;
  /** Lower values appear first on the site. */
  sortOrder?: number;
  updatedAt: string;
}

export type CategoryOverridesMap = Record<string, CategoryOverride>;
