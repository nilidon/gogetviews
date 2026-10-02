import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { getCategoryOverrides, setCategoryOverride } from "@/lib/category-overrides";
import { getCategoryDisplayName } from "@/lib/display-names";

export async function PATCH(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const body = (await request.json()) as {
    category?: string;
    displayName?: string | null;
  };

  if (!body.category?.trim()) {
    return NextResponse.json({ error: "Category is required" }, { status: 400 });
  }

  if (body.displayName !== null && body.displayName !== undefined) {
    if (typeof body.displayName !== "string" || !body.displayName.trim()) {
      return NextResponse.json({ error: "Invalid display name" }, { status: 400 });
    }
  }

  const category = body.category.trim();
  const override = await setCategoryOverride(
    category,
    body.displayName === null ? null : (body.displayName ?? null),
  );

  const categoryOverrides = await getCategoryOverrides();

  return NextResponse.json({
    category,
    label: getCategoryDisplayName(category, categoryOverrides),
    hasCustomName: override?.displayName !== undefined,
  });
}
