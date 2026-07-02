import { NextResponse, type NextRequest } from "next/server";
import { refreshSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!body?.password || body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Нууц үг буруу байна." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  refreshSession(response);
  return response;
}
