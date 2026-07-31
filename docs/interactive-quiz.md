# Teste Interativo do Premium Editorial 2

O recurso fica salvo dentro de `premiumEditorial.interactiveQuiz` e somente o
template `premium_editorial_v2` o renderiza. A configuracao nasce ausente e a
secao nao ocupa espaco enquanto estiver desativada.

As respostas nao ficam no registro JSON do salao. Antes de usar o recurso em
producao, revise e execute manualmente a migration
`supabase/migrations/004_create_salon_quiz_submissions.sql`. O envio usa a rota
publica `POST /api/public/quiz/[slug]/submit`, mas a leitura e a gestao passam
por `GET/PATCH/DELETE /api/admin/quiz/[slug]` e exigem a sessao administrativa.

No modo `server-local`, os leads ficam em `.local-data/quiz-submissions.json`.
Em producao, o servidor usa `SUPABASE_SERVICE_ROLE_KEY`; nenhuma leitura
publica e nenhuma chave privada chegam ao navegador.

## Exportacao estatica futura

O exportador congelado do Premium Editorial 1 nao foi alterado. Para exportar
uma landing V2 com o teste, sera necessario configurar um endpoint externo
seguro em `submitEndpoint` e permitir explicitamente a origem do site exportado.
Nao envie respostas por query string e nao aponte uma exportacao para uma rota
relativa da Vercel sem essa decisao de infraestrutura.
