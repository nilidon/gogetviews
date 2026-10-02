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

  await ensureBucket();
  const { data, error } = await createServiceClient().storage.from(BUCKET).download(filename);
  if (error || !data) {
    if (error && !/not found/i.test(error.message)) {
      throw new Error(error.message);
    }
    await writeCatalogDocument(filename, fallback);
    return fallback;
  }

  return JSON.parse(await data.text()) as T;
}

export async function writeCatalogDocument(filename: string, value: unknown): Promise<void> {
  if (!supabaseEnv().configured) {
    await writeLocal(filename, value);
    return;
  }

  await ensureBucket();
  const { error } = await createServiceClient()
    .storage.from(BUCKET)
    .upload(filename, JSON.stringify(value), {
      upsert: true,
      contentType: "application/json",
    });
  if (error) throw new Error(error.message);
}
