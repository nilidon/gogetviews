import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { getServices } from "@/lib/gogetviews";
import { extractPlatform } from "@/lib/platforms";
import { setBulkServiceEnabled } from "@/lib/service-overrides";

export async function POST(request: Request) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const body = (await request.json()) as {
    platform?: string;
    enabled?: boolean;
  };

  if (!body.platform || typeof body.enabled !== "boolean") {
    return NextResponse.json(
      { error: "platform and enabled are required" },
      { status: 400 },
    );
  }

  const apiServices = await getServices();
  const serviceIds = apiServices
    .filter((service) => extractPlatform(service.category) === body.platform)
    .map((service) => service.service);

  if (serviceIds.length === 0) {
    return NextResponse.json({ error: "No services found for platform" }, { status: 404 });
  }

  await setBulkServiceEnabled(serviceIds, body.enabled);

  return NextResponse.json({
    platform: body.platform,
    enabled: body.enabled,
    updated: serviceIds.length,
  });
}
