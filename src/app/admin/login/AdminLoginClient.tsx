"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";

type AdminLoginClientProps = {
  nextPath?: string;
  passwordConfigured: boolean;
};

export function AdminLoginClient({
  nextPath,
  passwordConfigured,
}: AdminLoginClientProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!passwordConfigured) {
      setErrorMessage(
        "ADMIN_PASSWORD nao configurado. Defina a variavel de ambiente antes de usar o painel interno.",
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        setErrorMessage(payload.error || "Nao foi possivel autenticar o painel.");
        setIsSubmitting(false);
        return;
      }

      router.replace(nextPath && nextPath.startsWith("/") ? nextPath : "/salons");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel autenticar o painel.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7efe5_0%,#fbfaf8_48%,#ffffff_100%)] px-6 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-[2rem] border border-[#eadfce] bg-white/84 p-7 shadow-[0_28px_80px_rgba(83,57,33,0.1)] backdrop-blur sm:p-9">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff4e8] text-[#9a6b3d]">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-[#9a6b3d]">
            Painel protegido
          </p>
          <h1 className="mt-3 font-serif text-[2.3rem] font-semibold leading-tight text-zinc-950 sm:text-5xl">
            Acesso interno do projeto
          </h1>
          <p className="mt-4 text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8">
            Use a senha administrativa para abrir o painel, importar saloes,
            editar cadastros e publicar landings.
          </p>

          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-zinc-900">Senha</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                disabled={isSubmitting || !passwordConfigured}
                className="rounded-[1.2rem] border border-[#ddcfbd] bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[#9a6b3d] focus:ring-2 focus:ring-[#eadfce]"
                placeholder="Digite a senha administrativa"
              />
            </label>

            {errorMessage ? (
              <p className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || !passwordConfigured}
              className="btn btn-primary min-h-12 justify-center px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Entrando..." : "Entrar no painel"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>

        <aside className="rounded-[2rem] bg-zinc-950 p-7 text-white shadow-[0_32px_80px_rgba(24,24,27,0.22)] sm:p-9">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="mt-6 font-serif text-[2rem] font-semibold leading-tight sm:text-[2.6rem]">
            Publico fora, operacao dentro
          </h2>
          <p className="mt-4 text-sm leading-7 text-zinc-300 sm:text-base sm:leading-8">
            As rotas de painel ficam protegidas por senha simples. A vitrine
            publica continua aberta apenas em <code>/p/[slug]</code> para saloes
            publicados.
          </p>
          <div className="mt-7 rounded-[1.4rem] border border-white/10 bg-white/5 px-5 py-4 text-sm leading-7 text-zinc-300">
            {passwordConfigured
              ? "Senha configurada. Depois do login, o navegador recebe um cookie seguro para navegar pelas rotas internas."
              : "ADMIN_PASSWORD ainda nao configurado neste ambiente. Defina a variavel antes de colocar o painel no ar."}
          </div>
        </aside>
      </div>
    </main>
  );
}
