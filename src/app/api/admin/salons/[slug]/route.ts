import { NextRequest, NextResponse } from "next/server";
import {
  deleteAdminSalon,
  getAdminSalonBySlug,
  updateAdminSalonFromInput,
  upsertAdminSalon,
} from "@/lib/admin-salons";
import { getAdminAuthCookieName, isAdminSessionCookieValid } from "@/lib/admin-auth";
import type { Salon, SalonFormInput } from "@/types/salon";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const authError = await ensureAdminRequest(request);

  if (authError) {
    return authError;
  }

  const { slug } = await context.params;
  const result = await getAdminSalonBySlug(slug);

  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    salon: result.salon,
    source: "supabase-admin",
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const authError = await ensureAdminRequest(request);

  if (authError) {
    return authError;
  }

  try {
    const { slug } = await context.params;
    const payload = (await request.json()) as {
      input?: SalonFormInput;
      salon?: Salon;
    };

    const result = payload.input
      ? await updateAdminSalonFromInput(slug, payload.input)
      : payload.salon
        ? await upsertAdminSalon({
            ...payload.salon,
            slug,
          })
        : null;

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: "Envie um input de formulario ou um salao para atualizar.",
        },
        { status: 400 },
      );
    }

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      salon: result.salon,
      source: "supabase-admin",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar o salao no Supabase.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authError = await ensureAdminRequest(request);

  if (authError) {
    return authError;
  }

  const { slug } = await context.params;
  const result = await deleteAdminSalon(slug);

  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    source: "supabase-admin",
  });
}

async function ensureAdminRequest(request: NextRequest) {
  const cookieValue = request.cookies.get(getAdminAuthCookieName())?.value;
  const authenticated = await isAdminSessionCookieValid(cookieValue);

  if (authenticated) {
    return null;
  }

  return NextResponse.json(
    {
      success: false,
      error: "Acesso interno nao autenticado.",
    },
    { status: 401 },
  );
}
