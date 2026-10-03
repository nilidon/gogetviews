import { readCatalogDocument, writeCatalogDocument } from "@/lib/catalog-store";
import type { OrderStatus, StoredOrder } from "@/types/service";

const DOCUMENT = "orders.json";

let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readOrders(): Promise<StoredOrder[]> {
  const orders = await readCatalogDocument<StoredOrder[]>(DOCUMENT, []);
  return Array.isArray(orders) ? orders : [];
}

function sortNewest(orders: StoredOrder[]): StoredOrder[] {
  return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createOrder(
  order: Omit<StoredOrder, "createdAt" | "updatedAt">,
): Promise<StoredOrder> {
  return enqueue(async () => {
    const orders = await readOrders();
    const now = new Date().toISOString();
    const created: StoredOrder = { ...order, createdAt: now, updatedAt: now };
    const next = [created, ...orders.filter((item) => item.id !== created.id)];
    await writeCatalogDocument(DOCUMENT, next);
    return created;
  });
}

export async function getOrderById(id: string): Promise<StoredOrder | null> {
  const orders = await readOrders();
  return orders.find((order) => order.id === id) ?? null;
}

export async function listOrdersForAccount(
  userId: string,
  email: string,
): Promise<StoredOrder[]> {
  const normalized = email.trim().toLowerCase();
  const orders = await readOrders();
  return sortNewest(
    orders.filter(
      (order) =>
        order.userId === userId || (order.email ?? "").trim().toLowerCase() === normalized,
    ),
  );
}

export async function listAllOrders(): Promise<StoredOrder[]> {
  const orders = await readOrders();
  return sortNewest(orders).slice(0, 200);
}

export function attachOrdersToUser(email: string, userId: string): Promise<void> {
  return enqueue(async () => {
    const normalized = email.trim().toLowerCase();
    const orders = await readOrders();
    let changed = false;
    const next = orders.map((order) => {
      if ((order.email ?? "").trim().toLowerCase() !== normalized || order.userId === userId) {
        return order;
      }
      changed = true;
      return { ...order, userId, updatedAt: new Date().toISOString() };
    });
    if (changed) await writeCatalogDocument(DOCUMENT, next);
  });
}

export async function getOrderByStripeSession(
  sessionId: string,
): Promise<StoredOrder | null> {
  const orders = await readOrders();
  return orders.find((order) => order.stripeSessionId === sessionId) ?? null;
}

export function updateOrder(
  id: string,
  patch: Partial<StoredOrder>,
): Promise<StoredOrder | null> {
  return enqueue(async () => {
    const orders = await readOrders();
    const index = orders.findIndex((order) => order.id === id);
    if (index < 0) return null;
    const current = orders[index];
    const updated: StoredOrder = {
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };
    const next = [...orders];
    next[index] = updated;
    await writeCatalogDocument(DOCUMENT, next);
    return updated;
  });
}

export function mapDeliveryStatus(status?: string): OrderStatus {
  if (!status) return "processing";
  const value = status.toLowerCase();
  if (value === "completed") return "completed";
  if (value === "partial") return "partial";
  if (value === "in progress" || value === "processing") return "in_progress";
  if (value === "canceled" || value === "cancelled") return "cancelled";
  if (value === "pending") return "processing";
  return "in_progress";
}
