import { NextResponse } from "next/server";
import {
  getAdminAuthCookieName,
  getAdminSessionToken,
  isAdminPasswordConfigured,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error:
          "ADMIN_PASSWORD nao configurado. Defina a variavel antes de usar o painel interno.",
      },
      { status: 503 },
    );
  }

  try {
    const payload = (await request.json()) as {
      password?: string;
    };

    if (!payload.password || !(await verifyAdminPassword(payload.password))) {
      return NextResponse.json(
        {
          success: false,
          error: "Senha invalida.",
        },
        { status: 401 },
      );
    }

    const sessionToken = await getAdminSessionToken();

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Nao foi possivel criar a sessao administrativa.",
        },
        { status: 500 },
      );
    }

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set({
      name: getAdminAuthCookieName(),
      value: sessionToken,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel autenticar o painel.",
      },
      { status: 500 },
    );
  }
}
