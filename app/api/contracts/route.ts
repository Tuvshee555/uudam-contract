import { NextResponse, type NextRequest } from "next/server";
import { listContracts, saveContract } from "@/lib/db";
import { refreshSession, requireApiAuth, unauthorized } from "@/lib/auth";
import { type ContractData } from "@/lib/types";

function contractNumber(data: ContractData) {
  return `Х-26-1-${data.contractNumberSuffix || ""}`;
}

function fallbackTitle(data: ContractData) {
  const name = data.touristName || data.travelerFullName || "Нэргүй гэрээ";
  const date = [data.contractYear, data.contractMonth, data.contractDay].filter(Boolean).join(".");
  return date ? `${name} - ${date}` : name;
}

export async function GET(request: NextRequest) {
  if (!requireApiAuth(request)) return unauthorized();
  const { searchParams } = new URL(request.url);
  const contracts = await listContracts(searchParams.get("q") ?? "");
  const response = NextResponse.json({ contracts });
  refreshSession(response);
  return response;
}

export async function POST(request: NextRequest) {
  if (!requireApiAuth(request)) return unauthorized();
  const body = (await request.json()) as { id?: string; title?: string; data: ContractData };
  const saved = await saveContract({
    id: body.id,
    title: body.title?.trim() || fallbackTitle(body.data),
    contractNumber: contractNumber(body.data),
    touristName: body.data.touristName || body.data.travelerFullName || "",
    data: body.data
  });
  if (!saved) return NextResponse.json({ error: "Гэрээ олдсонгүй." }, { status: 404 });
  const response = NextResponse.json({ contract: saved });
  refreshSession(response);
  return response;
}
