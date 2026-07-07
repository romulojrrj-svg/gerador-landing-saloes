import fs from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

type JsonRecord = Record<string, unknown>;

type ServiceLike = {
  title?: string;
  name?: string;
  label?: string;
  description?: string;
  [key: string]: unknown;
};

type SalonLike = {
  services?: unknown;
  copySuggestions?: unknown;
  generatedCopy?: unknown;
  copyHistory?: unknown;
  [key: string]: unknown;
};

type CleanupCounts = {
  salonsScanned: number;
  salonsChanged: number;
  serviceDescriptionsRemoved: number;
  copyDescriptionsRemoved: number;
};

const projectRoot = process.cwd();
loadEnvConfig(projectRoot);

const dryRun = process.env.DRY_RUN !== "false";
const localDataPath = path.join(projectRoot, ".local-data", "salons.json");

async function main() {
  const localResult = await cleanupLocalFile();
  const supabaseResult = await cleanupSupabase();

  console.log("");
  console.log("Resumo da limpeza");
  console.log("=================");
  console.log(
    `Modo: ${dryRun ? "DRY_RUN=true (sem gravar alteracoes)" : "DRY_RUN=false (alteracoes aplicadas)"}`,
  );
  console.log(
    `Local file: ${localResult.salonsScanned} saloes verificados, ${localResult.salonsChanged} alterados, ${localResult.serviceDescriptionsRemoved} descricoes de servico removidas, ${localResult.copyDescriptionsRemoved} copias removidas.`,
  );
  console.log(
    `Supabase: ${supabaseResult.salonsScanned} saloes verificados, ${supabaseResult.salonsChanged} alterados, ${supabaseResult.serviceDescriptionsRemoved} descricoes de servico removidas, ${supabaseResult.copyDescriptionsRemoved} copias removidas.`,
  );
}

async function cleanupLocalFile(): Promise<CleanupCounts> {
  try {
    const raw = await fs.readFile(localDataPath, "utf8");
    const parsed = JSON.parse(raw);
    const salons = resolveLocalSalons(parsed);

    if (!salons) {
      console.log("Arquivo local ignorado: .local-data/salons.json nao contem um array de saloes.");
      return emptyCounts();
    }

    const counts = emptyCounts();
    const nextSalons = salons.map((entry) => {
      counts.salonsScanned += 1;
      const result = cleanupSalon(entry as SalonLike);
      counts.salonsChanged += result.changed ? 1 : 0;
      counts.serviceDescriptionsRemoved += result.serviceDescriptionsRemoved;
      counts.copyDescriptionsRemoved += result.copyDescriptionsRemoved;
      return result.salon;
    });

    if (!dryRun && counts.salonsChanged > 0) {
      await fs.mkdir(path.dirname(localDataPath), { recursive: true });
      const nextPayload = Array.isArray(parsed)
        ? nextSalons
        : { ...(parsed as JsonRecord), salons: nextSalons };
      await fs.writeFile(localDataPath, JSON.stringify(nextPayload, null, 2), "utf8");
    }

    return counts;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      console.log("Arquivo local nao encontrado em .local-data/salons.json.");
      return emptyCounts();
    }

    throw error;
  }
}

function resolveLocalSalons(value: unknown): SalonLike[] | null {
  if (Array.isArray(value)) {
    return value as SalonLike[];
  }

  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Array.isArray((value as JsonRecord).salons)
  ) {
    return (value as JsonRecord).salons as SalonLike[];
  }

  return null;
}

async function cleanupSupabase(): Promise<CleanupCounts> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    console.log("Supabase nao configurado para este script. Pulando limpeza remota.");
    return emptyCounts();
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const counts = emptyCounts();
  const pageSize = 200;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("salons")
      .select("id, slug, name, services, copy_suggestions, generated_copy, copy_history, metadata, created_at")
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Falha ao ler saloes do Supabase: ${error.message}`);
    }

    if (!data?.length) {
      break;
    }

    for (const row of data) {
      counts.salonsScanned += 1;
      const result = cleanupSupabaseRow(row as JsonRecord);
      counts.salonsChanged += result.changed ? 1 : 0;
      counts.serviceDescriptionsRemoved += result.serviceDescriptionsRemoved;
      counts.copyDescriptionsRemoved += result.copyDescriptionsRemoved;

      if (!dryRun && result.changed) {
        const { error: updateError } = await supabase
          .from("salons")
          .update(result.row)
          .eq("id", String(row.id));

        if (updateError) {
          throw new Error(
            `Falha ao atualizar ${String(row.slug ?? row.id)} no Supabase: ${updateError.message}`,
          );
        }
      }
    }

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return counts;
}

function cleanupSupabaseRow(row: JsonRecord) {
  let changed = false;
  let serviceDescriptionsRemoved = 0;
  let copyDescriptionsRemoved = 0;
  const nextRow: JsonRecord = {};

  const servicesResult = cleanupServices(row.services);
  if (servicesResult.changed) {
    changed = true;
    serviceDescriptionsRemoved += servicesResult.removed;
    nextRow.services = servicesResult.value;
  }

  const copySuggestionResult = cleanupCopyContainer(row.copy_suggestions);
  if (copySuggestionResult.changed) {
    changed = true;
    copyDescriptionsRemoved += copySuggestionResult.removed;
    nextRow.copy_suggestions = copySuggestionResult.value;
  }

  const generatedCopyResult = cleanupCopyContainer(row.generated_copy);
  if (generatedCopyResult.changed) {
    changed = true;
    copyDescriptionsRemoved += generatedCopyResult.removed;
    nextRow.generated_copy = generatedCopyResult.value;
  }

  const copyHistoryResult = cleanupCopyHistory(row.copy_history);
  if (copyHistoryResult.changed) {
    changed = true;
    copyDescriptionsRemoved += copyHistoryResult.removed;
    nextRow.copy_history = copyHistoryResult.value;
  }

  const metadataResult = cleanupMetadata(row.metadata);
  if (metadataResult.changed) {
    changed = true;
    serviceDescriptionsRemoved += metadataResult.serviceDescriptionsRemoved;
    copyDescriptionsRemoved += metadataResult.copyDescriptionsRemoved;
    nextRow.metadata = metadataResult.value;
  }

  return {
    changed,
    serviceDescriptionsRemoved,
    copyDescriptionsRemoved,
    row: nextRow,
  };
}

function cleanupSalon(salon: SalonLike) {
  let changed = false;
  let serviceDescriptionsRemoved = 0;
  let copyDescriptionsRemoved = 0;

  const nextSalon: SalonLike = { ...salon };

  const servicesResult = cleanupServices(salon.services);
  if (servicesResult.changed) {
    changed = true;
    serviceDescriptionsRemoved += servicesResult.removed;
    nextSalon.services = servicesResult.value;
  }

  const copySuggestionResult = cleanupCopyContainer(salon.copySuggestions);
  if (copySuggestionResult.changed) {
    changed = true;
    copyDescriptionsRemoved += copySuggestionResult.removed;
    nextSalon.copySuggestions = copySuggestionResult.value;
  }

  const generatedCopyResult = cleanupCopyContainer(salon.generatedCopy);
  if (generatedCopyResult.changed) {
    changed = true;
    copyDescriptionsRemoved += generatedCopyResult.removed;
    nextSalon.generatedCopy = generatedCopyResult.value;
  }

  const copyHistoryResult = cleanupCopyHistory(salon.copyHistory);
  if (copyHistoryResult.changed) {
    changed = true;
    copyDescriptionsRemoved += copyHistoryResult.removed;
    nextSalon.copyHistory = copyHistoryResult.value;
  }

  return {
    salon: nextSalon,
    changed,
    serviceDescriptionsRemoved,
    copyDescriptionsRemoved,
  };
}

function cleanupServices(value: unknown) {
  if (!Array.isArray(value)) {
    return { value, changed: false, removed: 0 };
  }

  let changed = false;
  let removed = 0;

  const nextValue = value.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return entry;
    }

    const service = { ...(entry as ServiceLike) };
    const hadDescription =
      typeof service.description === "string" && service.description.trim().length > 0;

    if (hadDescription) {
      removed += 1;
      changed = true;
    }

    if ("description" in service || hadDescription) {
      service.description = "";
    }

    return service;
  });

  return { value: nextValue, changed, removed };
}

function cleanupCopyContainer(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { value, changed: false, removed: 0 };
  }

  const copySuggestion = { ...(value as JsonRecord) };
  const serviceDescriptions = Array.isArray(copySuggestion.serviceDescriptions)
    ? copySuggestion.serviceDescriptions
    : [];

  if (!serviceDescriptions.length) {
    return { value, changed: false, removed: 0 };
  }

  return {
    value: {
      ...copySuggestion,
      serviceDescriptions: [],
    },
    changed: true,
    removed: serviceDescriptions.length,
  };
}

function cleanupCopyHistory(value: unknown) {
  if (!Array.isArray(value)) {
    return { value, changed: false, removed: 0 };
  }

  let changed = false;
  let removed = 0;

  const nextHistory = value.map((entry) => {
    const result = cleanupCopyContainer(entry);
    if (result.changed) {
      changed = true;
      removed += result.removed;
    }
    return result.value;
  });

  return { value: nextHistory, changed, removed };
}

function cleanupMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      value,
      changed: false,
      serviceDescriptionsRemoved: 0,
      copyDescriptionsRemoved: 0,
    };
  }

  const metadata = { ...(value as JsonRecord) };
  let changed = false;
  let serviceDescriptionsRemoved = 0;
  let copyDescriptionsRemoved = 0;

  if (metadata.salon && typeof metadata.salon === "object" && !Array.isArray(metadata.salon)) {
    const result = cleanupSalon(metadata.salon as SalonLike);
    if (result.changed) {
      metadata.salon = result.salon as unknown as JsonRecord;
      changed = true;
      serviceDescriptionsRemoved += result.serviceDescriptionsRemoved;
      copyDescriptionsRemoved += result.copyDescriptionsRemoved;
    }
  }

  return {
    value: metadata,
    changed,
    serviceDescriptionsRemoved,
    copyDescriptionsRemoved,
  };
}

function emptyCounts(): CleanupCounts {
  return {
    salonsScanned: 0,
    salonsChanged: 0,
    serviceDescriptionsRemoved: 0,
    copyDescriptionsRemoved: 0,
  };
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
