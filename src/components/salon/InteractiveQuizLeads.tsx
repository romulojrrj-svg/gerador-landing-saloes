"use client";

import { useEffect, useMemo, useState } from "react";
import { Clipboard, ExternalLink, Trash2 } from "lucide-react";
import type { SalonInteractiveQuizConfig } from "@/types/salon";

type QuizLeadStatus = "new" | "contacted" | "finished";
type Lead = { id: string; visitorName: string; visitorWhatsapp: string; status: QuizLeadStatus; answers: Array<{ questionId: string; prompt: string; value: unknown; selectedOptions?: Array<{ label: string }> }>; createdAt: string };

export function InteractiveQuizLeads({ slug, config }: { slug: string; config: SalonInteractiveQuizConfig }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<"all" | QuizLeadStatus>("all");
  const [openId, setOpenId] = useState<string>();
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void fetch(`/api/admin/quiz/${encodeURIComponent(slug)}`)
      .then(async (response) => ({ response, body: await response.json().catch(() => ({})) }))
      .then(({ response, body }) => {
        if (!active) return;
        if (response.ok && Array.isArray(body.leads)) setLeads(body.leads);
        else setMessage(body.error || "Nao foi possivel carregar os leads.");
      })
      .catch(() => {
        if (active) setMessage("Nao foi possivel carregar os leads.");
      });
    return () => { active = false; };
  }, [slug]);

  async function updateStatus(id: string, status: QuizLeadStatus) {
    const response = await fetch(`/api/admin/quiz/${encodeURIComponent(slug)}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) });
    if (response.ok) setLeads((current) => current.map((lead) => lead.id === id ? { ...lead, status } : lead));
    else setMessage("Nao foi possivel atualizar o lead.");
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir este lead?")) return;
    const response = await fetch(`/api/admin/quiz/${encodeURIComponent(slug)}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response.ok) setLeads((current) => current.filter((lead) => lead.id !== id));
    else setMessage("Nao foi possivel excluir o lead.");
  }

  const visible = useMemo(() => filter === "all" ? leads : leads.filter((lead) => lead.status === filter), [filter, leads]);
  if (!config.enabled || !slug) return null;
  return <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-semibold text-zinc-950">Leads do teste</h4><p className="text-xs text-zinc-500">As respostas completas ficam sob demanda e nao aparecem na listagem.</p></div><div className="flex flex-wrap gap-2"><select className="rounded-xl border border-zinc-200 px-3 py-2 text-xs" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}><option value="all">Todos</option><option value="new">Novos</option><option value="contacted">Contatados</option><option value="finished">Finalizados</option></select><a className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold" href={`/api/admin/quiz/${encodeURIComponent(slug)}?format=csv`}><ExternalLink className="h-3.5 w-3.5" />CSV</a></div></div>{message ? <p className="mt-3 text-xs font-semibold text-rose-700">{message}</p> : null}<div className="mt-4 grid gap-2">{visible.map((lead) => <article key={lead.id} className="rounded-xl border border-zinc-200 p-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-zinc-900">{lead.visitorName || "Sem nome"}</p><p className="text-xs text-zinc-500">{lead.visitorWhatsapp} · {new Date(lead.createdAt).toLocaleString()}</p></div><div className="flex items-center gap-2"><select aria-label="Status do lead" className="rounded-lg border border-zinc-200 px-2 py-1 text-xs" value={lead.status} onChange={(event) => void updateStatus(lead.id, event.target.value as QuizLeadStatus)}><option value="new">Novo</option><option value="contacted">Contatado</option><option value="finished">Finalizado</option></select><button type="button" aria-label="Copiar WhatsApp" onClick={() => void navigator.clipboard.writeText(lead.visitorWhatsapp)} className="rounded-lg border border-zinc-200 p-2"><Clipboard className="h-3.5 w-3.5" /></button><a href={`https://wa.me/${lead.visitorWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" aria-label="Abrir WhatsApp" className="rounded-lg border border-zinc-200 p-2"><ExternalLink className="h-3.5 w-3.5" /></a><button type="button" aria-label="Excluir lead" onClick={() => void remove(lead.id)} className="rounded-lg border border-rose-200 p-2 text-rose-700"><Trash2 className="h-3.5 w-3.5" /></button></div></div><button type="button" className="mt-3 text-xs font-semibold text-teal-800" onClick={() => setOpenId((current) => current === lead.id ? undefined : lead.id)}>{lead.answers.length} respostas · {openId === lead.id ? "Ocultar" : "Ver respostas"}</button>{openId === lead.id ? <div className="mt-3 grid gap-2 border-t border-zinc-100 pt-3 text-sm text-zinc-700">{lead.answers.map((answer) => <div key={answer.questionId}><p className="font-semibold">{answer.prompt}</p><p>{Array.isArray(answer.value) ? answer.value.join(", ") : String(answer.value ?? "")}</p></div>)}</div> : null}</article>)}{!visible.length ? <p className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">Nenhum lead recebido ainda.</p> : null}</div></div>;
}
