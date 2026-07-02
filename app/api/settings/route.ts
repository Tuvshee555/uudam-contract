import { NextResponse, type NextRequest } from "next/server";
import { getSettings, saveSettings } from "@/lib/db";
import { refreshSession, requireApiAuth, unauthorized } from "@/lib/auth";
import { type ContractSettings } from "@/lib/types";

export async function GET(request: NextRequest) {
  if (!requireApiAuth(request)) return unauthorized();
  const settings = await getSettings();
  const response = NextResponse.json({ settings });
  refreshSession(response);
  return response;
}

export async function POST(request: NextRequest) {
  if (!requireApiAuth(request)) return unauthorized();
  const body = (await request.json()) as ContractSettings;
  const settings = await saveSettings(body);
  const response = NextResponse.json({ settings });
  refreshSession(response);
  return response;
}
