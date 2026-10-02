import { config } from "./config";
import type { GoGetViewsService } from "@/types/service";

type ApiParams = Record<string, string | number>;

async function callApi<T>(params: ApiParams): Promise<T> {
  if (!config.apiKey) {
    throw new Error("GOGETVIEWS_API_KEY is not configured");
  }

  if (!config.apiUrl) {
    throw new Error("GOGETVIEWS_API_URL is not configured");
  }

  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    body.set(key, String(value));
  }
  body.set("key", config.apiKey);

  const response = await fetch(config.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  const data = (await response.json()) as T & { error?: string };

  if (!response.ok || data.error) {
    throw new Error(data.error ?? `GoGetViews API error (${response.status})`);
  }

  return data;
}

let servicesCache: { data: GoGetViewsService[]; expiresAt: number } | null = null;

export async function getServices(): Promise<GoGetViewsService[]> {
  const now = Date.now();
  if (servicesCache && servicesCache.expiresAt > now) {
    return servicesCache.data;
  }

  const data = await callApi<GoGetViewsService[]>({ action: "services" });
  servicesCache = { data, expiresAt: now + 5 * 60 * 1000 };
  return data;
}

export async function getBalance(): Promise<{ balance: string; currency: string }> {
  return callApi({ action: "balance" });
}

export interface AddOrderInput {
  service: number;
  link: string;
  quantity?: number;
  comments?: string;
}

export async function addOrder(
  input: AddOrderInput,
): Promise<{ order: number }> {
  const params: ApiParams = {
    action: "add",
    service: input.service,
    link: input.link,
  };

  if (input.comments) {
    params.comments = input.comments;
  } else if (input.quantity) {
    params.quantity = input.quantity;
  }

  return callApi(params);
}

export interface OrderStatusResponse {
  charge?: string;
  start_count?: string;
  status?: string;
  remains?: string;
  currency?: string;
  error?: string;
}

export async function getOrderStatus(
  orderId: number,
): Promise<OrderStatusResponse> {
  return callApi({ action: "status", order: orderId });
}
