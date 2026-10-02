import bundledCategories from "@/catalog/category-overrides.json";
import { readCatalogDocument, writeCatalogDocument } from "@/lib/catalog-store";
import type { CategoryOverride, CategoryOverridesMap } from "@/types/admin";

const DOCUMENT = "category-overrides.json";

export async function getCategoryOverrides(): Promise<CategoryOverridesMap> {
  return readCatalogDocument(DOCUMENT, bundledCategories as CategoryOverridesMap);
}

export async function saveCategoryOverrides(overrides: CategoryOverridesMap): Promise<void> {
  await writeCatalogDocument(DOCUMENT, overrides);
}

export async function setCategoryOverride(
  category: string,
  displayName: string | null,
): Promise<CategoryOverride | null> {
  const overrides = await getCategoryOverrides();
  const existing = overrides[category];
  const now = new Date().toISOString();

  if (displayName === null || displayName.trim() === "") {
    if (existing?.sortOrder !== undefined) {
      const updated: CategoryOverride = {
        sortOrder: existing.sortOrder,
        updatedAt: now,
      };
      overrides[category] = updated;
      await saveCategoryOverrides(overrides);
      return updated;
    }

    delete overrides[category];
    await saveCategoryOverrides(overrides);
    return null;
  }

  const updated: CategoryOverride = {
    ...existing,
    displayName: displayName.trim(),
    updatedAt: now,
  };

  overrides[category] = updated;
  await saveCategoryOverrides(overrides);
  return updated;
}
