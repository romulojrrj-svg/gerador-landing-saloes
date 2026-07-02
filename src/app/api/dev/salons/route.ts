import { NextResponse } from "next/server";
import {
  listDevSharedSalons,
  upsertDevSharedSalon,
  upsertManyDevSharedSalons,
} from "@/lib/dev-shared-salon-storage";
import { ensureCompleteSalon } from "@/lib/salon-storage";
import { isServerLocalStorageEnabled } from "@/lib/storage-mode";
import type { Salon } from "@/types/salon";

export async function GET() {
  if (!isServerLocalStorageEnabled()) {
    return disabledResponse();
  }

  try {
    const salons = await listDevSharedSalons();
    debugDevStorage("list", { count: salons.length });

    return NextResponse.json({
      success: true,
      salons,
      count: salons.length,
      source: "server-local",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Erro ao listar saloes compartilhados."),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!isServerLocalStorageEnabled()) {
    return disabledResponse();
  }

  try {
    const payload = (await request.json()) as {
      salon?: Salon;
      salons?: Salon[];
    };

    if (Array.isArray(payload.salons) && payload.salons.length) {
      const salons = await upsertManyDevSharedSalons(
        payload.salons.map((salon) => ensureCompleteSalon(salon)),
      );
      debugDevStorage("bulk-upsert", { count: salons.length });

      return NextResponse.json({
        success: true,
        salons,
        count: salons.length,
        source: "server-local",
      });
    }

    if (!payload.salon) {
      return NextResponse.json(
        {
          success: false,
          error: "Envie um salao para salvar no armazenamento compartilhado.",
        },
        { status: 400 },
      );
    }

    const salon = await upsertDevSharedSalon(ensureCompleteSalon(payload.salon));
    debugDevStorage("upsert", { slug: salon.slug, name: salon.name });

    return NextResponse.json({
      success: true,
      salon,
      source: "server-local",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Erro ao salvar salao compartilhado."),
      },
      { status: 500 },
    );
  }
}

function disabledResponse() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        success: false,
        error: "Rota disponivel apenas em desenvolvimento local.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      success: false,
      error:
        "O armazenamento server-local esta desativado. Ative NEXT_PUBLIC_STORAGE_MODE=server-local em desenvolvimento.",
    },
    { status: 403 },
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function debugDevStorage(event: string, payload: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.debug("[dev-storage]", event, payload);
}
