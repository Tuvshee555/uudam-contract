import { NextResponse, type NextRequest } from "next/server";
import { deleteContract, getContract } from "@/lib/db";
import { refreshSession, requireApiAuth, unauthorized } from "@/lib/auth";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  if (!requireApiAuth(request)) return unauthorized();
  const { id } = await params;
  const contract = await getContract(id);
  if (!contract) return NextResponse.json({ error: "Гэрээ олдсонгүй." }, { status: 404 });
  const response = NextResponse.json({ contract });
  refreshSession(response);
  return response;
}

export async function DELETE(request: NextRequest, { params }: Params) {
  if (!requireApiAuth(request)) return unauthorized();
  const { id } = await params;
  await deleteContract(id);
  const response = NextResponse.json({ ok: true });
  refreshSession(response);
  return response;
}
