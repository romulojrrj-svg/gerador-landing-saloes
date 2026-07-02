import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ensureCompleteSalon } from "@/lib/salon-storage";
import type { Salon } from "@/types/salon";

const LOCAL_DATA_DIR = path.join(process.cwd(), ".local-data");
const SALONS_FILE_PATH = path.join(LOCAL_DATA_DIR, "salons.json");

type SalonFilePayload = {
  salons: Salon[];
  updatedAt: string;
};

export function getDevSharedSalonsFilePath() {
  return SALONS_FILE_PATH;
}

export async function listDevSharedSalons() {
  const payload = await readSalonPayload();

  return payload.salons
    .map((salon) => ensureCompleteSalon(salon))
    .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
}

export async function getDevSharedSalonBySlug(slug: string) {
  const salons = await listDevSharedSalons();

  return salons.find((salon) => salon.slug === slug) ?? null;
}

export async function upsertDevSharedSalon(salon: Salon) {
  const salons = await listDevSharedSalons();
  const completeSalon = ensureCompleteSalon(salon);
  const nextSalons = [
    completeSalon,
    ...salons.filter((currentSalon) => currentSalon.slug !== completeSalon.slug),
  ].sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));

  await writeSalonPayload(nextSalons);

  return completeSalon;
}

export async function upsertManyDevSharedSalons(salons: Salon[]) {
  const currentSalons = await listDevSharedSalons();
  const nextSalonMap = new Map<string, Salon>();

  for (const salon of currentSalons) {
    nextSalonMap.set(salon.slug, salon);
  }

  for (const salon of salons) {
    const completeSalon = ensureCompleteSalon(salon);
    nextSalonMap.set(completeSalon.slug, completeSalon);
  }

  const nextSalons = Array.from(nextSalonMap.values()).sort((first, second) =>
    second.updatedAt.localeCompare(first.updatedAt),
  );

  await writeSalonPayload(nextSalons);

  return nextSalons;
}

export async function deleteDevSharedSalon(slug: string) {
  const salons = await listDevSharedSalons();
  const nextSalons = salons.filter((salon) => salon.slug !== slug);

  if (nextSalons.length === salons.length) {
    return false;
  }

  await writeSalonPayload(nextSalons);

  return true;
}

async function readSalonPayload(): Promise<SalonFilePayload> {
  try {
    const rawPayload = await readFile(SALONS_FILE_PATH, "utf-8");
    const parsedPayload = JSON.parse(rawPayload) as Partial<SalonFilePayload>;
    const salons = Array.isArray(parsedPayload.salons)
      ? parsedPayload.salons
      : [];

    return {
      salons: salons.map((salon) => ensureCompleteSalon(salon)),
      updatedAt:
        typeof parsedPayload.updatedAt === "string"
          ? parsedPayload.updatedAt
          : new Date().toISOString(),
    };
  } catch (error) {
    if (isMissingFileError(error)) {
      return {
        salons: [],
        updatedAt: new Date().toISOString(),
      };
    }

    throw error;
  }
}

async function writeSalonPayload(salons: Salon[]) {
  await mkdir(LOCAL_DATA_DIR, { recursive: true });
  const payload: SalonFilePayload = {
    salons,
    updatedAt: new Date().toISOString(),
  };

  await writeFile(SALONS_FILE_PATH, JSON.stringify(payload, null, 2), "utf-8");
}

function isMissingFileError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
