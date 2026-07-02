export type SalonStorageMode = "default" | "server-local";

export function getRequestedStorageMode(): SalonStorageMode {
  return process.env.NEXT_PUBLIC_STORAGE_MODE === "server-local"
    ? "server-local"
    : "default";
}

export function isProductionEnvironment() {
  return process.env.NODE_ENV === "production";
}

export function isServerLocalStorageEnabled() {
  return (
    process.env.NODE_ENV === "development" &&
    getRequestedStorageMode() === "server-local"
  );
}

export function shouldUseSupabaseInProduction() {
  return isProductionEnvironment();
}
