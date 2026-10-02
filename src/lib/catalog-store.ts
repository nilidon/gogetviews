import { promises as fs } from "fs";
import path from "path";
import { createServiceClient, supabaseEnv } from "@/lib/supabase";

const BUCKET = "catalog";
const DATA_DIR = path.join(process.cwd(), "data");

let bucketReady: Promise<void> | null = null;

async function ensureBucket(): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { error } = await createServiceClient().storage.createBucket(BUCKET, { public: false });
      if (error && !/exists/i.test(error.message)) {
        bucketReady = null;
        throw new Error(error.message);
      }
    })();
  }
  await bucketReady;
}

async function readLocal<T>(filename: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, filename), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeLocal(filename: string, value: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(value, null, 2), "utf-8");
}

export async function readCatalogDocument<T>(filename: string, fallback: T): Promise<T> {
  if (!supabaseEnv().configured) return readLocal(filename, fallback);

  const env = supabaseEnv();
  const response = await fetch(
    `${env.url}/storage/v1/object/${BUCKET}/${filename}?t=${Date.now()}`,
    {
      headers: {
        Authorization: `Bearer ${env.service}`,
        apikey: env.service,
      },
      cache: "no-store",
    },
  );

  if (response.status === 400 || response.status === 404) {
    const message = await response.text();
    if (!/not found/i.test(message)) {
      throw new Error("Could not read the saved catalog.");
    }
    await writeCatalogDocument(filename, fallback);
    return fallback;
  }

  if (!response.ok) {
    throw new Error("Could not read the saved catalog.");
  }

  return JSON.parse(await response.text()) as T;
}

export async function writeCatalogDocument(filename: string, value: unknown): Promise<void> {
  if (!supabaseEnv().configured) {
    await writeLocal(filename, value);
    return;
  }

  await ensureBucket();
  const body = JSON.stringify(value);
  const storage = createServiceClient().storage.from(BUCKET);
  const options = { contentType: "application/json", cacheControl: "0" };
  const updated = await storage.update(filename, body, options);
  if (!updated.error) return;

  if (!/not found/i.test(updated.error.message)) {
    const uploaded = await storage.upload(filename, body, { ...options, upsert: true });
    if (!uploaded.error) return;
    throw new Error(uploaded.error.message);
  }

  const uploaded = await storage.upload(filename, body, options);
  if (uploaded.error) throw new Error(uploaded.error.message);
}
