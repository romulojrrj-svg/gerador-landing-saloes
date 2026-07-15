# Exportacao estatica por salao

Este fluxo cria um pacote completamente estatico para um unico salao publicado. Ele e separado do aplicativo principal: o painel, as APIs, o proxy, o Supabase e os previews da Vercel continuam usando o projeto Next.js principal.

## Pre-requisitos locais

- `.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
- O salao deve estar publicado, ter `customDomain` valido e usar uma versao de template suportada pelo exportador.
- Execute o comando somente em uma maquina local confiavel. A chave de service role e usada apenas pelo processo Node local para leitura e nunca entra no pacote gerado.

## Exportar uma versao

```powershell
npm run export:salon -- --slug dra-julia-maia-2 --source supabase --version 1.0.1
```

Sem `--version`, o comando gera uma versao local baseada em data e hora. Cada execucao cria uma nova pasta em `exports/<slug>/`; nunca substitui uma versao anterior. Tambem atualiza `exports/<slug>/latest/` para facilitar o preview local.

O exportador le somente o salao solicitado, prepara um DTO publico minimo e baixa exclusivamente imagens efetivamente usadas pelo template. Fotos sao convertidas para WebP responsivo; logos PNG, JPEG, WebP e SVG sao preservadas no formato apropriado. Nenhuma URL do Supabase Storage, Instagram, Vercel, `blob:` ou `localhost` permanece como dependencia em runtime.

## Conferir localmente

```powershell
npm run preview:salon-export -- --slug dra-julia-maia-2
```

O comando mostra uma URL local, normalmente `http://127.0.0.1:4173/`. Use essa URL, em vez de abrir `index.html` com `file://`.

## Publicar manualmente no Cloudflare Pages

1. Edite o salao no gerador e salve normalmente no Supabase.
2. Confira o preview do gerador.
3. Rode `export:salon` com uma versao nova.
4. Rode `preview:salon-export` e valide o pacote estatico.
5. Envie apenas o conteudo da pasta `site/` para o projeto Cloudflare Pages da cliente, ou use:

```powershell
npx wrangler pages deploy "exports/<slug>/<versao>/site"
```

6. Teste primeiro o endereco `pages.dev` gerado pelo Cloudflare. Promova a alteracao de dominio somente no painel do Cloudflare quando a validacao estiver aprovada.

O arquivo ZIP ao lado da pasta `site/` contem `index.html` diretamente na raiz, pronto para o upload manual. O processo nao faz deploy, nao altera DNS, nao chama a Vercel e nao muda dados no Supabase.

## Conteudo e versoes vendidas

O pacote usa a versao do template salva no salao. Para `premium_v1`, o visual e renderizado por `static-export-app/app/premium/v1/`, separado dos componentes visuais que poderao evoluir para versoes futuras. Atualizacoes de conteudo, como feedbacks, imagens e antes/depois, exigem apenas uma nova exportacao; nao alteram outro salao ou outro pacote.

## Validacoes automaticas

Antes de gerar o ZIP, o comando verifica arquivos essenciais, tamanho e MIME dos assets, ausencia de source maps e referencias proibidas. O relatorio da exportacao registra os assets, tamanho, hash SHA-256 do ZIP, versao, dados de origem e resultado das validacoes. O arquivo de manifest fica fora da pasta publica.
