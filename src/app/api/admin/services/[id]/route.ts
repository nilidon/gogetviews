import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { getServices } from "@/lib/gogetviews";
import { extractPlatform } from "@/lib/platforms";
import { getServiceDisplayName } from "@/lib/display-names";
import {
  defaultRetailRatePer1000,
  getRetailRatePer1000,
  wholesalePrice,
} from "@/lib/pricing";
import { getServiceOverrides, isServiceEnabled, setServiceOverride } from "@/lib/service-overrides";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const unauthorized = await requireAdminApi();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const serviceId = Number.parseInt(id, 10);
  if (!Number.isFinite(serviceId)) {
    return NextResponse.json({ error: "Invalid service ID" }, { status: 400 });
  }

  const body = (await request.json()) as {
    enabled?: boolean;
    retailRatePer1000?: number | null;
    displayName?: string | null;
  };

  const apiServices = await getServices();
  const service = apiServices.find((item) => item.service === serviceId);
  if (!service || !extractPlatform(service.category)) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const patch: Parameters<typeof setServiceOverride>[1] = {};

  if (body.enabled !== undefined) {
    patch.enabled = body.enabled;
  }

  if (body.retailRatePer1000 === null) {
    patch.retailRatePer1000 = null;
  } else if (body.retailRatePer1000 !== undefined) {
    if (!Number.isFinite(body.retailRatePer1000) || body.retailRatePer1000 < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }
    patch.retailRatePer1000 = body.retailRatePer1000;
  }

  if (body.displayName === null) {
    patch.displayName = null;
  } else if (body.displayName !== undefined) {
    if (typeof body.displayName !== "string" || !body.displayName.trim()) {
      return NextResponse.json({ error: "Invalid display name" }, { status: 400 });
    }
    patch.displayName = body.displayName;
  }

  await setServiceOverride(serviceId, patch);
  const overrides = await getServiceOverrides();
  const override = overrides[String(serviceId)];
  const displayName = getServiceDisplayName(service, overrides);

  return NextResponse.json({
    service: serviceId,
    name: displayName,
    displayName,
    apiName: service.name,
    enabled: isServiceEnabled(serviceId, overrides),
    wholesaleRatePer1000: wholesalePrice(service, 1000),
    defaultRetailRatePer1000: defaultRetailRatePer1000(service),
    retailRatePer1000: getRetailRatePer1000(service, overrides),
    hasCustomPrice: override?.retailRatePer1000 !== undefined,
    hasCustomName: override?.displayName !== undefined,
  });
}
