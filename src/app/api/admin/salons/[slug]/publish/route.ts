import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthCookieName, isAdminSessionCookieValid } from "@/lib/admin-auth";
import { publishAdminSalon } from "@/lib/admin-salons";

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const cookieValue = request.cookies.get(getAdminAuthCookieName())?.value;

  if (!(await isAdminSessionCookieValid(cookieValue))) {
    return NextResponse.json(
      { success: false, error: "Acesso interno nao autenticado." },
      { status: 401 },
    );
  }

  const { slug } = await context.params;
  const result = await publishAdminSalon(slug);

  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, salon: result.salon });
}
