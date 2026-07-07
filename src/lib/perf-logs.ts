type PerfEvent = {
  route: string;
  step: string;
  ms?: number;
  id?: string;
  slug?: string;
  payloadKb?: number;
  imagesCount?: number;
  servicesCount?: number;
  count?: number;
  source?: string;
  error?: string;
};

export function logPerfEvent(event: PerfEvent) {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const parts = [
    `[perf] ${event.route}`,
    event.slug ? `slug=${event.slug}` : event.id ? `id=${event.id}` : undefined,
    `step=${event.step}`,
    event.ms !== undefined ? `ms=${event.ms}` : undefined,
    event.payloadKb !== undefined ? `payloadKb=${event.payloadKb}` : undefined,
    event.imagesCount !== undefined ? `images=${event.imagesCount}` : undefined,
    event.servicesCount !== undefined ? `services=${event.servicesCount}` : undefined,
    event.count !== undefined ? `count=${event.count}` : undefined,
    event.source ? `source=${event.source}` : undefined,
    event.error ? `error=${event.error}` : undefined,
  ].filter(Boolean);

  console.info(parts.join(" "));
}

export function estimatePayloadSize(value: unknown) {
  try {
    return Math.max(1, Math.round(new TextEncoder().encode(JSON.stringify(value)).length / 1024));
  } catch {
    return 0;
  }
}
