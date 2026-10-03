import { randomUUID } from "crypto";
import { readCatalogDocument, writeCatalogDocument } from "@/lib/catalog-store";
import type { SupportMessage } from "@/types/support";

const DOCUMENT = "support-messages.json";

export type { SupportMessage };

let queue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readMessages(): Promise<SupportMessage[]> {
  const messages = await readCatalogDocument<SupportMessage[]>(DOCUMENT, []);
  return Array.isArray(messages) ? messages : [];
}

export async function listSupportMessages(): Promise<SupportMessage[]> {
  const messages = await readMessages();
  return [...messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listSupportMessagesForAccount(
  userId: string,
  email: string,
): Promise<SupportMessage[]> {
  const normalized = email.trim().toLowerCase();
  const messages = await listSupportMessages();
  return messages.filter(
    (message) => message.userId === userId || message.email.trim().toLowerCase() === normalized,
  );
}

export function createSupportMessage(input: {
  email: string;
  message: string;
  name?: string;
  userId?: string;
}): Promise<SupportMessage> {
  return enqueue(async () => {
    const messages = await readMessages();
    const created: SupportMessage = {
      id: randomUUID(),
      email: input.email.trim().toLowerCase(),
      message: input.message.trim(),
      name: input.name?.trim() || undefined,
      userId: input.userId,
      createdAt: new Date().toISOString(),
    };
    await writeCatalogDocument(DOCUMENT, [created, ...messages]);
    return created;
  });
}

export function replyToSupportMessage(id: string, reply: string): Promise<SupportMessage | null> {
  return enqueue(async () => {
    const messages = await readMessages();
    const index = messages.findIndex((message) => message.id === id);
    if (index < 0) return null;
    const updated: SupportMessage = {
      ...messages[index],
      reply: reply.trim(),
      repliedAt: new Date().toISOString(),
    };
    const next = [...messages];
    next[index] = updated;
    await writeCatalogDocument(DOCUMENT, next);
    return updated;
  });
}
