# Worker de submissao do Teste Interativo

Este Worker atende somente `POST /quiz-submit` e `OPTIONS /quiz-submit` para
landings estaticas do Premium Editorial 2. A landing continua sendo um site
estatico: nao consulta Supabase, Vercel ou APIs ao carregar. A Worker so e
acionada quando a visitante envia o Teste Interativo.

## Arquitetura

1. A landing estatica envia o payload para a URL publica da Worker.
2. A Worker valida origem, tamanho, slug, configuracao ativa e respostas.
3. A Worker grava o lead em `salon_quiz_submissions` com um `submissionId` UUID.
4. Somente depois tenta a notificacao transacional pelo Brevo.
5. Uma falha de e-mail nao desfaz o lead salvo. As migrations `006` e `007`
   registram o estado e reservam cada tentativa de envio de forma atomica.

O idempotency key e o proprio `submissionId`: reenvios da mesma tentativa retornam
sucesso sem criar um segundo lead. A Worker envia o `submissionId` como
`Idempotency-Key` para a Brevo. Um e-mail `sent` nunca e reenviado; `failed` e
`pending` podem ser retomados dentro da janela segura de 15 minutos da Brevo.
Depois disso, ficam para revisao manual em vez de arriscar duplicidade. A Worker
nao usa rate limiting em memoria. Configure uma regra de rate limiting/WAF no painel da
Cloudflare antes de producao. Um token Turnstile pode ser adicionado depois sem
mudar o contrato atual.

## Segredos e variaveis

Nunca coloque valores reais no Git. Para desenvolvimento, copie
`.dev.vars.example` para `.dev.vars` e preencha localmente.

Em producao, configure manualmente os segredos no projeto Cloudflare Worker:

```powershell
npx --prefix cloudflare/quiz-worker wrangler secret put SUPABASE_URL
npx --prefix cloudflare/quiz-worker wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx --prefix cloudflare/quiz-worker wrangler secret put BREVO_API_KEY
npx --prefix cloudflare/quiz-worker wrangler secret put BREVO_SENDER_EMAIL
npx --prefix cloudflare/quiz-worker wrangler secret put BREVO_SENDER_NAME
npx --prefix cloudflare/quiz-worker wrangler secret put ALLOWED_ORIGINS
```

`ALLOWED_ORIGINS` deve conter uma lista separada por virgulas, sem curingas, por
exemplo `https://cliente.com,https://www.cliente.com`. Em desenvolvimento, use
apenas as origens locais necessarias. Inclua `www` e sem `www` quando ambos forem
atendidos. A chave `SUPABASE_SERVICE_ROLE_KEY` fica somente na Worker.

## Desenvolvimento e verificacao local

```powershell
npm --prefix cloudflare/quiz-worker install
npm --prefix cloudflare/quiz-worker run check
npm --prefix cloudflare/quiz-worker run test
npm --prefix cloudflare/quiz-worker run smoke
npm --prefix cloudflare/quiz-worker run dev
```

O comando de deploy abaixo e apenas referencia operacional. Esta implementacao nao
executa deploy automaticamente:

```powershell
npx --prefix cloudflare/quiz-worker wrangler deploy
```

## Exportacao estatica V2

Para uma landing com quiz ativo, informe a URL da Worker no momento da exportacao:

```powershell
npm run export:salon -- --slug nome-do-salao --source supabase --quiz-api-url https://seu-worker.seu-subdominio.workers.dev
```

Tambem e possivel definir `NEXT_PUBLIC_QUIZ_API_URL` apenas no ambiente local de
exportacao. O valor e uma URL publica, sem segredos. O exportador bloqueia uma
landing com quiz ativo quando essa URL nao foi informada, evitando publicar um
formulario que apontaria para a Vercel por acidente.

O resultado em `exports/<slug>/<versao>/site` continua pronto para Direct Upload
no Cloudflare Pages. Publique somente a pasta `site` ou o ZIP correspondente.
O pacote nao inclui credenciais, dados administrativos, e-mail de notificacao,
Supabase ou runtime da Vercel.

Para atualizar uma cliente: salve o conteudo no gerador, valide o preview,
exporte apenas aquele slug com a Worker desejada, valide o preview estatico e
publique uma nova versao no projeto Pages. Para rollback, reaplique o ZIP ou a
pasta da versao anterior ja guardada em `exports`; nenhuma outra landing e tocada.

## Fallback da Vercel

Enquanto `NEXT_PUBLIC_QUIZ_API_URL` nao estiver configurada no ambiente da Vercel,
as landings dinamicas continuam chamando `/api/public/quiz/[slug]/submit`, com o
fluxo SMTP atual. Isso permite adotar a Worker apenas nas exportacoes estaticas,
sem mudar os sites existentes.

## Schema

As migrations `004_create_salon_quiz_submissions.sql` e
`005_add_quiz_submission_city.sql` criam os campos de lead usados pela Worker.
Para envio de e-mail idempotente, aplique manualmente tambem a
`006_add_quiz_email_notification_status.sql` e a
`007_add_quiz_email_notification_claim.sql`, nesta ordem. Sem `006` e `007`, a
Worker ainda salva o lead, mas nao chama a Brevo: o estado duravel e necessario
para evitar envio duplicado. Nao execute migrations automaticamente a partir
deste repositorio.
