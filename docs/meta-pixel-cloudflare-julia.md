# Meta Pixel e Conversions API — Dra. Julia Maia

Este guia prepara exclusivamente a landing estática da Dra. Julia Maia. A rota
legada `/salons/dra-julia-maia-2` e todos os demais salões não participam deste
fluxo. Nenhum comando deste documento faz deploy automaticamente.

## Arquitetura

```text
Supabase (leitura durante exportação)
  └─ salon julia-maia-harmonizacao-facial
       └─ metadata.integrations.meta (somente configuração pública)
            └─ export:salon
                 └─ exports/julia-maia-harmonizacao-facial/latest/site
                      └─ Cloudflare Pages
                           ├─ Meta Pixel, após consentimento
                           └─ POST /meta-event, após consentimento
                                └─ julia-maia-meta-capi Worker
                                     └─ Meta Conversions API (token secreto)
```

O exportador consulta o Supabase apenas no computador que gera o pacote e grava
um DTO público em `static-export-app/data/salon.json` durante a compilação. O
site publicado não faz consulta ao Supabase para renderizar seu conteúdo. O
token da Meta nunca é lido, escrito ou exposto pelo app estático.

## Configuração do metadata da Julia

Não há migration. Depois de publicar o Worker e conhecer sua URL, adicione ao
`metadata` do registro com slug `julia-maia-harmonizacao-facial` a estrutura
abaixo por meio do fluxo administrativo normal do projeto ou do painel do
Supabase. Preserve os campos existentes de `metadata`; inclua somente
`integrations.meta`.

```json
{
  "integrations": {
    "meta": {
      "enabled": true,
      "pixelId": "SEU_PIXEL_ID_NUMERICO",
      "capiEndpoint": "https://julia-maia-meta-capi.SEU_SUBDOMINIO.workers.dev/meta-event",
      "pageViewEventName": "PageView",
      "contactEventName": "Contact"
    }
  }
}
```

`contactEventName` aceita apenas `Contact` ou `Lead`. Para mudar o evento de
contato, troque somente esse valor e gere uma nova exportação. A validação da
exportação aceita um `pixelId` numérico e endpoint HTTPS exato em
`/meta-event`; quando `enabled` for `true`, uma configuração inválida interrompe
a exportação em vez de publicar rastreamento incompleto. Nenhum campo de token
ou `accessToken` deve ser inserido no metadata.

Para desativar a integração sem remover código, altere `enabled` para `false`
(ou retire `metadata.integrations.meta`) e gere um novo pacote. Nesse caso não
há banner, Pixel nem chamadas à CAPI no site exportado.

## Criar e configurar o Worker

O Worker está em `cloudflare/meta-capi-worker`, chama-se
`julia-maia-meta-capi` e responde apenas a `POST /meta-event` e
`OPTIONS /meta-event`.

Instale as dependências e faça login manualmente na conta Cloudflare correta:

```powershell
npm --prefix cloudflare/meta-capi-worker install
npx --prefix cloudflare/meta-capi-worker wrangler login
```

Para desenvolvimento local, copie `.dev.vars.example` para `.dev.vars` e use
placeholders ou credenciais de teste somente nesta cópia ignorada pelo Git. O
localhost só é permitido quando estiver listado explicitamente em
`ALLOWED_ORIGINS`, por exemplo `http://localhost:4173`.

Cadastre as variáveis interativamente. A primeira é obrigatoriamente um secret;
as demais também podem ser inseridas como secrets para não deixar configuração
operacional em arquivos versionados. Nunca passe o token como argumento de linha
de comando.

```powershell
npx --prefix cloudflare/meta-capi-worker wrangler secret put META_ACCESS_TOKEN
npx --prefix cloudflare/meta-capi-worker wrangler secret put META_PIXEL_ID
npx --prefix cloudflare/meta-capi-worker wrangler secret put META_GRAPH_API_VERSION
npx --prefix cloudflare/meta-capi-worker wrangler secret put ALLOWED_ORIGINS
npx --prefix cloudflare/meta-capi-worker wrangler secret put META_TEST_EVENT_CODE
```

`META_TEST_EVENT_CODE` é opcional: não execute o último comando se não houver
código de teste. `ALLOWED_ORIGINS` recebe origens completas separadas por
vírgula, por exemplo
`https://dra-julia.example,https://www.dra-julia.example`; inclua um localhost
somente para desenvolvimento explícito. `META_GRAPH_API_VERSION` deve usar o
formato `vNN.N` escolhido na configuração da Meta.

Valide sem publicar e, somente quando o gestor aprovar, publique manualmente:

```powershell
npx --prefix cloudflare/meta-capi-worker wrangler deploy --dry-run
npx --prefix cloudflare/meta-capi-worker wrangler deploy
```

O comando de deploy mostrará a URL `workers.dev`. Use-a com o sufixo
`/meta-event` no metadata antes de exportar a Julia. Para remover o código de
teste após a aprovação:

```powershell
npx --prefix cloudflare/meta-capi-worker wrangler secret delete META_TEST_EVENT_CODE
```

## Gerar e publicar a landing estática

Com o metadata acima salvo e o Worker disponível, gere somente a Julia:

```powershell
npm run export:salon -- --slug julia-maia-harmonizacao-facial --source supabase --version 1.0.0
```

O diretório estático final mais recente é:

```text
exports/julia-maia-harmonizacao-facial/latest/site
```

Cada execução também preserva uma versão imutável em
`exports/julia-maia-harmonizacao-facial/<data>_<versao>/site` e gera ZIP,
manifest e relatório ao lado dela. Confira antes localmente:

```powershell
npm run preview:salon-export -- --slug julia-maia-harmonizacao-facial
```

Para a publicação manual futura na Cloudflare Pages, use um projeto dedicado:

```powershell
npx --prefix cloudflare/meta-capi-worker wrangler pages project create julia-maia-premium-editorial
npx --prefix cloudflare/meta-capi-worker wrangler pages deploy "exports/julia-maia-harmonizacao-facial/latest/site" --project-name julia-maia-premium-editorial
```

Teste primeiro o endereço `pages.dev`. Só depois conecte o domínio definitivo
no painel Cloudflare e acrescente suas origens finais em `ALLOWED_ORIGINS`.

## Consentimento e deduplicação

O banner de cookies é exibido apenas quando `integrations.meta.enabled` está
ativo. Por padrão, não há script da Meta e nenhum evento é enviado. `Aceitar`
salva a preferência local, carrega o Pixel apenas uma vez e envia exatamente um
`PageView`; `Rejeitar` mantém o site e o WhatsApp funcionando sem rastreamento.
O link **Preferências de cookies** no rodapé permite mudar a decisão.

Para cada evento, o navegador chama `crypto.randomUUID()` uma única vez. Esse
mesmo `event_id` e o mesmo `event_name` seguem para `fbq("track", ...)` e para
o Worker. Isso vale para `PageView` e para cada clique em um link de WhatsApp.
O clique não é aguardado nem interceptado: a navegação para o WhatsApp mantém
seu `href`, target e mensagem originais.

O Worker aceita somente `PageView`, `Contact` e `Lead`, limita o JSON a 4 KiB e
recusa campos inesperados. Ele monta a CAPI com URL da página, `event_id`, hora,
`action_source: website`, `CF-Connecting-IP`, `User-Agent` e, somente quando
válidos, `_fbp`/`_fbc`. Ele nunca recebe telefone, nome, respostas do quiz,
procedimento ou informação de saúde.

## Checklist com o gestor

1. Abra a versão de preview sem aceitar cookies e confirme que não há requisição
   a `connect.facebook.net`, `facebook.com` ou ao Worker.
2. Rejeite cookies, recarregue a página e confirme que WhatsApp continua abrindo
   com a mesma mensagem e que ainda não há eventos Meta.
3. Abra **Preferências de cookies**, aceite e confirme um único `PageView` no
   navegador e um POST ao Worker com o mesmo UUID.
4. Clique em cada botão/link de WhatsApp da landing. Confirme que cada clique
   abre normalmente e cria `Contact` (ou `Lead`) no Browser e Server com o
   mesmo `event_id`.
5. No Gerenciador de Eventos, use **Test Events** enquanto
   `META_TEST_EVENT_CODE` estiver configurado para confirmar chegada Browser e
   Server. Depois, verifique no diagnóstico que os pares foram deduplicados.
6. Remova `META_TEST_EVENT_CODE`, teste novamente em produção e confira que o
   evento de produção não aparece mais como teste.
7. Valide imagens, fontes, CSS, favicon, sliders antes/depois, galeria,
   depoimentos e todos os links no `pages.dev` antes de tocar no domínio.

## Rollback

Para o site, reaplique no Pages uma pasta `site` ou ZIP de versão anterior de
`exports/julia-maia-harmonizacao-facial/`. Para o Worker, use o rollback manual
de uma versão conhecida:

```powershell
npx --prefix cloudflare/meta-capi-worker wrangler versions list
npx --prefix cloudflare/meta-capi-worker wrangler rollback
```

Alternativamente, desative `metadata.integrations.meta.enabled` e gere uma nova
exportação: o visual da landing permanece, mas o banner e a Meta deixam de ser
incluídos.

## Arquivos envolvidos

- `scripts/export-salon-static.mjs`: lê somente o salão solicitado e filtra a
  configuração Meta pública para o DTO estático.
- `static-export-app/app/meta/MetaTracking.tsx`: consentimento, Pixel,
  `event_id`, CAPI e instrumentação de links WhatsApp.
- `cloudflare/meta-capi-worker/`: Worker CAPI independente, validação e testes.

