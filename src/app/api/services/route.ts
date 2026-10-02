import { NextResponse } from "next/server";
import { buildCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const catalog = await buildCatalog();
    return NextResponse.json(catalog);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load services";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
