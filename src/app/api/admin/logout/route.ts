import { NextResponse } from "next/server";
import { getAdminAuthCookieName } from "@/lib/admin-auth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
  });

  response.cookies.set({
    name: getAdminAuthCookieName(),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
