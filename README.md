# Gerador de Landing Pages para Salões

Projeto full stack desenvolvido para automatizar a criação e o gerenciamento de landing pages comerciais para salões de beleza.

A aplicação permite cadastrar salões, importar dados, organizar informações comerciais, gerenciar imagens, publicar páginas públicas responsivas e controlar o conteúdo por meio de um painel administrativo protegido.

## Objetivo do projeto

O objetivo é resolver um problema real: muitos pequenos negócios possuem boas fotos, avaliações e informações comerciais, mas não têm uma página profissional otimizada para conversão.

Este sistema centraliza essas informações e gera páginas públicas mobile-first para apresentação comercial dos salões.

## Funcionalidades

- Painel administrativo para gerenciamento de salões
- Cadastro, edição, publicação e visualização de páginas
- Página pública individual para cada salão em `/p/[slug]`
- Integração com Supabase para persistência dos dados
- Controle de status entre rascunho e publicado
- Importação de dados de salões
- Organização de fotos por finalidade:
  - Logo
  - Destaque inicial
  - Galeria
  - Nosso Espaço
  - Ignorar
- Curadoria assistida de imagens
- Landing pages responsivas com foco em mobile
- Proteção de rotas internas por senha administrativa
- Ambiente local de desenvolvimento com suporte a dados compartilhados

## Tecnologias utilizadas

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- React
- Git/GitHub

## Estrutura principal

- `/salons` — painel administrativo
- `/salons/new` — cadastro de salão
- `/salons/import` — importação de salões
- `/salons/[id]/edit` — edição de salão
- `/salons/[id]/preview` — prévia interna
- `/p/[slug]` — landing page pública

## Diferenciais técnicos

- Arquitetura separando painel interno e página pública
- Uso de Supabase em produção
- Fluxo de publicação com rascunho/publicado
- Curadoria simplificada de imagens para melhorar a apresentação visual
- Landing pages com foco em conversão e experiência mobile-first
- Validações para evitar exposição pública de páginas em rascunho
- Organização do código em componentes e bibliotecas reutilizáveis

## Como rodar localmente

```bash
npm install
npm run dev
```

## Publicação estática com Teste Interativo

O painel continua na Vercel. Uma landing estática do Premium Editorial 2 abre sem
Supabase, Worker ou Brevo: esses serviços só são chamados após o envio voluntário
do Teste Interativo. Para publicar uma landing estática com quiz, siga esta
sequência manual. Nenhum destes passos é executado pelo código do projeto.

1. Na Brevo, autentique o domínio do remetente e crie uma API key transacional.
2. No Supabase SQL Editor, revise e execute, nesta ordem, as migrations locais
   `004_create_salon_quiz_submissions.sql`, `005_add_quiz_submission_city.sql`,
   `006_add_quiz_email_notification_status.sql` e
   `007_add_quiz_email_notification_claim.sql`.
3. Autentique a CLI da Cloudflare no diretório da Worker:

   ```powershell
   npx --prefix cloudflare/quiz-worker wrangler login
   ```

4. Cadastre os secrets. Não grave nenhum deles em `wrangler.jsonc`, `.dev.vars`
   ou no repositório:

   ```powershell
   npx --prefix cloudflare/quiz-worker wrangler secret put SUPABASE_URL
   npx --prefix cloudflare/quiz-worker wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   npx --prefix cloudflare/quiz-worker wrangler secret put BREVO_API_KEY
   npx --prefix cloudflare/quiz-worker wrangler secret put BREVO_SENDER_EMAIL
   npx --prefix cloudflare/quiz-worker wrangler secret put BREVO_SENDER_NAME
   npx --prefix cloudflare/quiz-worker wrangler secret put ALLOWED_ORIGINS
   ```

   Para `ALLOWED_ORIGINS`, informe apenas origens completas, separadas por vírgula.
   Exemplo seguro: `https://dominiodacliente.com.br,https://www.dominiodacliente.com.br`.
   Espaços e barras finais são normalizados; curingas não são aceitos.

5. Faça o deploy manual da Worker e copie a URL pública retornada:

   ```powershell
   npx --prefix cloudflare/quiz-worker wrangler deploy
   ```

6. Exporte somente a landing desejada, apontando para essa URL absoluta:

   ```powershell
   npm run export:salon -- --slug nome-do-salao --source supabase --quiz-api-url https://sua-worker.workers.dev
   ```

7. Valide o preview estático e publique apenas a pasta `site` gerada no Cloudflare
   Pages. Faça um envio real de teste, confira o lead no painel e o e-mail na
   Brevo. Para rollback, reaplique no Pages o ZIP/pasta da versão anterior da
   mesma landing.

### Garantias de envio

`submissionId` é a chave única do lead. A Worker salva o lead antes de chamar a
Brevo. A migration `007` reserva atomicamente uma tentativa de e-mail: um lead
`sent` nunca é reenviado; um `failed` pode ser tentado novamente com o mesmo ID;
um `pending` só fica disponível após cinco minutos, evitando dois envios em
requisições simultâneas. A chamada à Brevo usa o mesmo `submissionId` como
`Idempotency-Key`; o retry automático é limitado aos primeiros 15 minutos, janela
segura suportada pela Brevo. Depois disso, um `pending` ou `failed` fica para
revisão manual em vez de arriscar e-mail duplicado. Sem as migrations `006` e
`007`, o lead ainda pode ser salvo, mas a Worker não envia e-mail para não correr
o risco de duplicidade.

### Verificações locais

```powershell
npm run smoke:quiz-worker
npm run check:quiz-worker
npm run test:quiz-worker
npm run lint
npm run build
npm --prefix static-export-app run build
```
