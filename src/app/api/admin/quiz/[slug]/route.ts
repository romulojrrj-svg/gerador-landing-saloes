import { NextRequest, NextResponse } from "next/server";
import { getAdminAuthCookieName, isAdminSessionCookieValid } from "@/lib/admin-auth";
import { deleteQuizLead, listQuizLeads, updateQuizLeadStatus, type QuizLeadStatus } from "@/lib/interactive-quiz-server";

type Context = { params: Promise<{ slug: string }> };
const statuses: QuizLeadStatus[] = ["new", "contacted", "finished"];

export async function GET(request: NextRequest, context: Context) {
  const authError = await ensureAdminRequest(request);
  if (authError) return authError;
  const { slug } = await context.params;
  const status = request.nextUrl.searchParams.get("status");
  const result = await listQuizLeads(slug, statuses.includes(status as QuizLeadStatus) ? status as QuizLeadStatus : undefined);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  if (request.nextUrl.searchParams.get("format") === "csv") {
    const csv = ["id,nome,whatsapp,status,perguntas,criado_em", ...result.leads.map((lead) => [lead.id, lead.visitorName, lead.visitorWhatsapp, lead.status, lead.answers.length, lead.createdAt].map(csvValue).join(","))].join("\n");
    return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${slug}-leads.csv"` } });
  }
  return NextResponse.json({ ok: true, leads: result.leads });
}

export async function PATCH(request: NextRequest, context: Context) {
  const authError = await ensureAdminRequest(request);
  if (authError) return authError;
  const { slug } = await context.params;
  const body = (await request.json()) as { id?: string; status?: QuizLeadStatus };
  if (!body.id || !statuses.includes(body.status as QuizLeadStatus)) return NextResponse.json({ ok: false, error: "Status invalido." }, { status: 400 });
  const result = await updateQuizLeadStatus(slug, body.id, body.status as QuizLeadStatus);
  return result.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false, error: result.error }, { status: 400 });
}

export async function DELETE(request: NextRequest, context: Context) {
  const authError = await ensureAdminRequest(request);
  if (authError) return authError;
  const { slug } = await context.params;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Lead invalido." }, { status: 400 });
  const result = await deleteQuizLead(slug, id);
  return result.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false, error: result.error }, { status: 400 });
}

function csvValue(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

async function ensureAdminRequest(request: NextRequest) {
  const cookie = request.cookies.get(getAdminAuthCookieName())?.value;
  return await isAdminSessionCookieValid(cookie) ? null : NextResponse.json({ ok: false, error: "Acesso interno nao autenticado." }, { status: 401 });
}
