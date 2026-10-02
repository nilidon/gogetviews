import { NextResponse } from "next/server";
import {
  createAdminSessionToken,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { config } from "@/lib/config";

export async function POST(request: Request) {
  if (!config.adminPassword) {
    return NextResponse.json(
      { error: "Admin password is not configured. Set ADMIN_PASSWORD in .env.local" },
      { status: 503 },
    );
  }

  const body = (await request.json()) as { password?: string };
  if (!body.password || !verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = createAdminSessionToken();
  const response = NextResponse.json({ success: true });
  setAdminSessionCookie(response, token);
  return response;
}
