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
# Teste Interativo

O Teste Interativo pertence exclusivamente ao Premium Editorial 2. Ele permanece opcional e desativado por padrão para registros novos e existentes que não tenham configuração.

## Notificações por e-mail

Quando `notificationEnabled` estiver ativo e `notificationRecipientEmail` contiver um endereço válido, o envio público segue esta ordem:

1. validar o payload no servidor;
2. persistir o lead no Supabase ou no armazenamento local de desenvolvimento;
3. enviar o e-mail transacional pelo SMTP configurado;
4. registrar o estado da notificação quando as colunas opcionais estiverem disponíveis.

O envio não é feito no navegador e nenhuma resposta é enviada para IA, analytics ou URL. Se o SMTP estiver indisponível, o lead já persistido permanece disponível no painel e o envio é marcado como falho quando a coluna de status estiver instalada.

### Configuração local

Copie as variáveis SMTP de `.env.example` para o ambiente local. Para Gmail, `SMTP_PASS` deve ser uma Senha de app, nunca a senha normal da conta. Não coloque essas variáveis em `NEXT_PUBLIC_*`.

O botão **Enviar e-mail de teste** aparece no editor de um salão quando ele tem slug e um destinatário válido configurado. Ele verifica a conexão e envia uma mensagem de teste sem criar um lead.

### Banco de dados

O arquivo `supabase/migrations/006_add_quiz_email_notification_status.sql` é uma proposta aditiva. Revise e aplique manualmente quando desejar registrar `pending`, `sent`, `skipped` e `failed` diretamente no Supabase. A aplicação continua funcionando sem essas colunas, mantendo o lead e tratando o status como opcional.

O destinatário é sempre lido da configuração salva do salão. O remetente é controlado somente por `MAIL_FROM_NAME` e `MAIL_FROM_EMAIL`; o visitante nunca escolhe o destinatário.
