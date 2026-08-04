import {
  MAX_PAYLOAD_BYTES,
  isAllowedOrigin,
  parseAllowedOrigins,
  readWorkerConfig,
  validateEventPayload,
} from "./validation.ts";

type WorkerEnv = {
  META_ACCESS_TOKEN?: string;
  META_PIXEL_ID?: string;
  META_TEST_EVENT_CODE?: string;
  META_GRAPH_API_VERSION?: string;
  ALLOWED_ORIGINS?: string;
};

const META_REQUEST_TIMEOUT_MS = 8_000;

const worker = {
  fetch(request: Request, env: WorkerEnv): Promise<Response> {
    return handleRequest(request, env);
  },
};

export default worker;

export async function handleRequest(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== "/meta-event") {
    return response({ ok: false, error: "Nao encontrado." }, 404);
  }

  const origin = request.headers.get("Origin");
  const allowedOrigins = parseAllowedOrigins(env.ALLOWED_ORIGINS ?? "");
  if (!isAllowedOrigin(origin, allowedOrigins)) {
    log("origin_rejected", { method: request.method });
    return response({ ok: false, error: "Origem nao autorizada." }, 403);
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (request.method !== "POST") {
    return response({ ok: false, error: "Metodo nao permitido." }, 405, origin);
  }
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return response({ ok: false, error: "Conteudo invalido." }, 415, origin);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_PAYLOAD_BYTES) {
    return response({ ok: false, error: "Envio muito grande." }, 413, origin);
  }

  const rawBody = await readBodyWithinLimit(request);
  if (rawBody === null) {
    return response({ ok: false, error: "Envio muito grande." }, 413, origin);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return response({ ok: false, error: "Conteudo invalido." }, 400, origin);
  }

  const validated = validateEventPayload(payload);
  if (!validated.ok) {
    log("payload_rejected", { method: request.method });
    return response({ ok: false, error: "Conteudo invalido." }, 400, origin);
  }

  const config = readWorkerConfig(env);
  if (!config) {
    log("configuration_missing", { eventName: validated.event.eventName });
    return response({ ok: false, error: "Integracao temporariamente indisponivel." }, 503, origin);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), META_REQUEST_TIMEOUT_MS);
  try {
    const metaResponse = await fetch(
      `https://graph.facebook.com/${encodeURIComponent(config.graphApiVersion)}/${encodeURIComponent(config.pixelId)}/events?access_token=${encodeURIComponent(config.accessToken)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          data: [
            {
              event_name: validated.event.eventName,
              event_time: Math.floor(Date.now() / 1_000),
              event_id: validated.event.eventId,
              event_source_url: validated.event.eventSourceUrl,
              action_source: "website",
              user_data: {
                ...clientNetworkData(request),
                ...(validated.event.fbp ? { fbp: validated.event.fbp } : {}),
                ...(validated.event.fbc ? { fbc: validated.event.fbc } : {}),
              },
            },
          ],
          ...(config.testEventCode ? { test_event_code: config.testEventCode } : {}),
        }),
        signal: controller.signal,
      },
    );

    if (!metaResponse.ok) {
      log(metaResponse.status === 401 || metaResponse.status === 403 ? "meta_authentication_failed" : "meta_event_rejected", {
        eventName: validated.event.eventName,
        status: metaResponse.status,
      });
      return response({ ok: false, error: "Evento nao aceito." }, 502, origin);
    }

    log("meta_event_forwarded", { eventName: validated.event.eventName, status: metaResponse.status });
    return response({ ok: true }, 202, origin);
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "AbortError";
    log(timedOut ? "meta_timeout" : "meta_connection_failed", {
      eventName: validated.event.eventName,
    });
    return response(
      { ok: false, error: timedOut ? "Tempo de envio excedido." : "Integracao temporariamente indisponivel." },
      timedOut ? 504 : 502,
      origin,
    );
  } finally {
    clearTimeout(timeout);
  }
}

function clientNetworkData(request: Request) {
  const clientIp = request.headers.get("CF-Connecting-IP")?.trim();
  const clientUserAgent = request.headers.get("User-Agent")?.trim();

  return {
    ...(clientIp && clientIp.length <= 64 ? { client_ip_address: clientIp } : {}),
    ...(clientUserAgent && clientUserAgent.length <= 512
      ? { client_user_agent: clientUserAgent }
      : {}),
  };
}

async function readBodyWithinLimit(request: Request) {
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_PAYLOAD_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

function response(payload: Record<string, unknown>, status: number, origin?: string | null) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(origin ? corsHeaders(origin) : {}),
    },
  });
}

function corsHeaders(origin: string | null) {
  return {
    "access-control-allow-origin": origin ?? "",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "600",
    vary: "Origin",
  };
}

function log(event: string, details: Record<string, unknown>) {
  console.info("[meta-capi-worker]", { event, ...details });
}
