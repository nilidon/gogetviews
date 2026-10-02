import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { reorderCategory, reorderService } from "@/lib/reorder";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const body = (await request.json()) as {
    platform?: string;
    type?: "category" | "service";
    category?: string;
    serviceId?: number;
    direction?: "up" | "down";
    enabledOnly?: boolean;
  };

  if (!body.platform?.trim()) {
    return NextResponse.json({ error: "Platform is required" }, { status: 400 });
  }

  if (body.type !== "category" && body.type !== "service") {
    return NextResponse.json({ error: "Invalid reorder type" }, { status: 400 });
  }

  if (!body.category?.trim()) {
    return NextResponse.json({ error: "Category is required" }, { status: 400 });
  }

  if (body.direction !== "up" && body.direction !== "down") {
    return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
  }

  const enabledOnly = body.enabledOnly !== false;

  if (body.type === "service") {
    if (!Number.isFinite(body.serviceId)) {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
    }

    const moved = await reorderService(
      body.platform.trim(),
      body.category.trim(),
      body.serviceId!,
      body.direction,
      enabledOnly,
    );

    if (!moved) {
      return NextResponse.json({ error: "Unable to reorder service" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  }

  const moved = await reorderCategory(
    body.platform.trim(),
    body.category.trim(),
    body.direction,
    enabledOnly,
  );

  if (!moved) {
    return NextResponse.json({ error: "Unable to reorder category" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
