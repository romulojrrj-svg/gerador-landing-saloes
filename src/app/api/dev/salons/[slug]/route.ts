import { NextResponse } from "next/server";
import {
  deleteDevSharedSalon,
  getDevSharedSalonBySlug,
  upsertDevSharedSalon,
} from "@/lib/dev-shared-salon-storage";
import { ensureCompleteSalon } from "@/lib/salon-storage";
import { isServerLocalStorageEnabled } from "@/lib/storage-mode";
import type { Salon } from "@/types/salon";

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function GET(_: Request, context: RouteContext) {
  if (!isServerLocalStorageEnabled()) {
    return disabledResponse();
  }

  try {
    const { slug } = await context.params;
    const salon = await getDevSharedSalonBySlug(slug);
    debugDevStorage("get", { slug, found: Boolean(salon) });

    if (!salon) {
      return NextResponse.json(
        {
          success: false,
          error: "Salao nao encontrado no armazenamento compartilhado.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      salon,
      source: "server-local",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Erro ao carregar salao compartilhado."),
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  if (!isServerLocalStorageEnabled()) {
    return disabledResponse();
  }

  try {
    const { slug } = await context.params;
    const payload = (await request.json()) as {
      salon?: Salon;
    };

    if (!payload.salon) {
      return NextResponse.json(
        {
          success: false,
          error: "Envie um salao para atualizar.",
        },
        { status: 400 },
      );
    }

    const salon = ensureCompleteSalon({
      ...payload.salon,
      slug,
    });
    const savedSalon = await upsertDevSharedSalon(salon);
    debugDevStorage("put", { slug, name: savedSalon.name });

    return NextResponse.json({
      success: true,
      salon: savedSalon,
      source: "server-local",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Erro ao atualizar salao compartilhado."),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  if (!isServerLocalStorageEnabled()) {
    return disabledResponse();
  }

  try {
    const { slug } = await context.params;
    const deleted = await deleteDevSharedSalon(slug);
    debugDevStorage("delete", { slug, deleted });

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: "Salao nao encontrado para exclusao.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      source: "server-local",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Erro ao excluir salao compartilhado."),
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
