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
