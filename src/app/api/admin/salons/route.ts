import { NextRequest, NextResponse } from "next/server";
import {
  createAdminSalonFromInput,
  listAdminSalons,
  upsertAdminSalon,
} from "@/lib/admin-salons";
import { isAdminSessionCookieValid, getAdminAuthCookieName } from "@/lib/admin-auth";
import type { Salon, SalonFormInput } from "@/types/salon";

export async function GET(request: NextRequest) {
  const authError = await ensureAdminRequest(request);

  if (authError) {
    return authError;
  }

  const result = await listAdminSalons();

  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        error: result.error,
        salons: [],
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    success: true,
    salons: result.salons,
    source: "supabase-admin",
  });
}

export async function POST(request: NextRequest) {
  const authError = await ensureAdminRequest(request);

  if (authError) {
    return authError;
  }

  try {
    const payload = (await request.json()) as {
      input?: SalonFormInput;
      salon?: Salon;
    };

    if (payload.input) {
      const result = await createAdminSalonFromInput(payload.input);

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
    }

    if (payload.salon) {
      const result = await upsertAdminSalon(payload.salon);

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
    }

    return NextResponse.json(
      {
        success: false,
        error: "Envie um input de formulario ou um salao para salvar.",
      },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel salvar o salao no Supabase.",
      },
      { status: 500 },
    );
  }
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
