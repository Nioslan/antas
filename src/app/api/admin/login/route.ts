import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_NAME,
  SESSION_VALUE,
  getAdminPassword,
  isAdminAuthenticated,
} from "@/lib/auth";

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  return NextResponse.json({ authenticated });
}

export async function POST(request: NextRequest) {
  const { password } = (await request.json()) as { password?: string };

  if (!password || password !== getAdminPassword()) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
