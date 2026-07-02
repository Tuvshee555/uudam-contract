import { NextResponse, type NextRequest } from "next/server";
import { refreshSession, requireApiAuth, unauthorized } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!requireApiAuth(request)) return unauthorized();
  const response = NextResponse.json({ ok: true });
  refreshSession(response);
  return response;
}
