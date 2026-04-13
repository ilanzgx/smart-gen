<a id="topo"></a>

# ⚡​ Smart Gen - Monitoramento de geradores de energia

Aplicação responsável por monitorar geradores de energia através de microcontroladores ESP32 com dados adquiridos através de sensores. Monorepo construído com [PNPM Workspaces](https://pnpm.io/workspaces). Ele suporta múltiplas aplicações e concentra as lógicas reutilizáveis do projeto.

## Sumário

- [Visão Geral](#visão-geral)
- [Tech Stack](#tech-stack)
- [Pré-requisitos](#pré-requisitos)
- [Arquitetura](#arquitetura)
- [Começando](#começando)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Aplicações](#aplicações)
- [Pacotes Internos](#pacotes-internos)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Workflow da Equipe](#workflow-da-equipe)
- [Testes](#testes)
- [Deploy / CI-CD](#deploy--ci-cd)
- [Regras Rápidas da Equipe](#regras-rápidas-da-equipe)

## Tech Stack

- **Linguagem**: TypeScript
- **Gerenciador de Pacotes**: PNPM
- **Framework Frontend**: Vue 3 com Vite
- **Estilização**: Tailwind CSS v4
- **Gerenciamento de Estado**: Pinia
- **Roteamento**: Vue Router
- **Testes**: Vitest
- **Linting**: ESLint + OxLint + Prettier
- **Backend**: Supabase (PostgreSQL + Auth)

## Pré-requisitos

- [Node.js](https://nodejs.org/) (versão >= 20.0)
- [PNPM](https://pnpm.io/installation) (gerenciador de pacotes)
- [Git](https://git-scm.com/) (para versionamento)
- Conta no [Supabase](https://supabase.com/) (para backend)

## Arquitetura

Smart Gen é organizado como um monorepo usando PNPM Workspaces com a seguinte estrutura:

```bash
smart-gen/
├── apps/                     # Aplicações finais
│   └── website/             # Aplicação frontend principal (Vue 3)
├── packages/                # Pacotes reutilizáveis
│   ├── @smart-gen/shared    # Utilitários, tipos e constantes compartilhados
│   ├── @smart-gen/supabase  # Camada de acesso ao Supabase
│   └── @smart-gen/tsconfig  # Configurações TypeScript centralizadas
├── pnpm-workspace.yaml      # Configuração do PNPM Workspaces
└── package.json             # Scripts raiz e configurações
```

### Comunicação entre Camadas

1. **Frontend** (`apps/website`) nunca chama o Supabase diretamente
2. Toda comunicação com o banco ocorre através de `@smart-gen/supabase`
3. Lógica de negócio compartilhada fica em `@smart-gen/shared`
4. Configurações TypeScript são padronizadas em `@smart-gen/tsconfig`

## Começando

### 1. Clone o Repositório

```bash
git clone https://github.com/your-username/smart-gen.git
cd smart-gen
git checkout -b dev origin/dev
```

### 2. Instale as Dependências

```bash
pnpm install
```

Isso instala todas as dependências da raiz e de todos os pacotes/workspaces.

### 3. Configure as Variáveis de Ambiente

```bash
# Na pasta do website
cd apps/website
cp .env.example .env
# Edite .env e adicione suas credenciais do Supabase
```

_Veja a tabela detalhada de credenciais na seção abaixo._

### 4. Inicie o Desenvolvimento

```bash
# Na raiz do projeto
pnpm dev
```

Isso iniciará todas as aplicações em modo desenvolvimento em paralelo.

Para iniciar apenas o website:

```bash
pnpm --filter @smart-gen/website dev
```

## Variáveis de Ambiente

O projeto requer as seguintes variáveis de ambiente configuradas para que todas as partes rodem corretamente:

### Para o Website (`apps/website/.env`)

| Variável                 | Descrição                 | Exemplo                          |
| ------------------------ | ------------------------- | -------------------------------- |
| `VITE_SUPABASE_URL`      | URL do projeto Supabase   | `https://xyzcompany.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima do Supabase | `public-anon-key`                |

> ⚠️ Lembre-se sempre de copiar `.env.example` para `.env` e preencher seus valores secretos.

## Aplicações

### 🌐 Website (`@smart-gen/website`)

A aplicação front-end principal.

- **Stack**: Vue 3, Vite, Tailwind CSS v4, Pinia, Vue Router, Vitest
- **Para rodar localmente**: `pnpm --filter @smart-gen/website dev`
- **Para formatar / lint**: `pnpm --filter @smart-gen/website format` e `pnpm --filter @smart-gen/website lint`
- **Para testes e build**: `pnpm --filter @smart-gen/website test:unit` e `pnpm --filter @smart-gen/website build`

[Ver documentação completa do Website](apps/website/README.md)

## Pacotes Internos

### ⚙️ TSConfig (`@smart-gen/tsconfig`)

Presets TypeScript centralizados para todo o monorepo. Disponibiliza quatro configurações base:

- `base.json` — Configurações compartilhadas (strict, bundler, ESNext).
- `vue.json` — Extends `base` + DOM libs + suporte a Vue SFC (`.vue`).
- `node.json` — Extends `base` + Node.js types.
- `vitest.json` — Extends `vue` + jsdom para ambiente de testes.

[Ver documentação completa do TSConfig](packages/tsconfig/README.md)

### 🧩 Shared (`@smart-gen/shared`)

Local exclusivo para funções utilitárias genéricas, tipagens (types/interfaces) e constantes que não dependem de nada do front-end. O objetivo é evitar duplicação de lógicas.

[Ver documentação completa do Shared](packages/shared/README.md)

### 🗄️ Supabase (`@smart-gen/supabase`)

Camada isolada de backend. Toda e qualquer interação com o banco de dados via Supabase (autenticação, acesso a tabelas, policies) deve ocorrer **dentro deste pacote**.

A lógica interna é organizada por **Resources** (ex: `generators`, `users`), onde cada recurso possui:

- **Queries**: Funções exclusivas para leitura de dados (select).
- **Mutations**: Funções para escrita (insert, update, delete).
- **Services**: Local para regras de negócio complexas que orquestram múltiplas operações.

[Ver documentação completa do Supabase](packages/supabase/README.md)

## Scripts Disponíveis

### Na Raiz do Projeto

| Comando          | Descrição                                                              |
| ---------------- | ---------------------------------------------------------------------- |
| `pnpm dev`       | Inicia todas as aplicações em modo desenvolvimento                     |
| `pnpm build`     | Constrói todas as aplicações para produção                             |
| `pnpm test`      | Roda todos os testes unitários                                         |
| `pnpm check-all` | Executa lint e type-check em todos os pacotes                          |
| `pnpm run sync`  | **Início:** Puxa as novidades do Git (com autostash) e instala pacotes |
| `pnpm run ready` | **Fim:** Sincroniza e verifica erros antes de enviar seu código        |

## Workflow da Equipe

Para manter o projeto organizado e evitar conflitos, siga estes dois momentos:

1.  **Ao começar a trabalhar:** Rode `pnpm run sync`. Isso garante que você tem a versão mais recente do código dos seus colegas sem perder suas mudanças locais.
2.  **Antes de abrir um Pull Request (PR):** Rode `pnpm run ready`. Ele vai garantir que o seu código "se dá bem" com o código novo que chegou e que não existem erros de estilo ou de tipagem.

---

## Testes

| Comando                                       | Descrição                                  |
| --------------------------------------------- | ------------------------------------------ |
| `pnpm --filter @smart-gen/website dev`        | Servidor de desenvolvimento com hot-reload |
| `pnpm --filter @smart-gen/website build`      | Compila para produção com type-check       |
| `pnpm --filter @smart-gen/website test:unit`  | Testes unitários com Vitest                |
| `pnpm --filter @smart-gen/website lint`       | Executa ESLint + OxLint com auto-fix       |
| `pnpm --filter @smart-gen/website format`     | Formata código com Prettier                |
| `pnpm --filter @smart-gen/website type-check` | Verifica tipagem com vue-tsc               |

## Testes

### Executando Testes

```bash
# Todos os testes de todos os pacotes
pnpm test

# Testes apenas do website
pnpm --filter @smart-gen/website test:unit

# Testes apenas do supabase
pnpm --filter @smart-gen/supabase test:unit

# Testes apenas do shared
pnpm --filter @smart-gen/shared test:unit
```

### Estrutura de Testes

Cada pacote contém seus testes em:

- `__tests__/` para testes unitários
- Configuração específica em `vitest.config.ts` ou similar

## Deploy / CI-CD

O projeto conta com um pipeline automatizado com o **GitHub Actions**.

Qualquer Push ou Pull Request mesclado (merge) na branch `main` irá automaticamente:

1. Executar o **Lint** (para checar formatação/padronização).
2. Executar o **Type-check** (para validar tipos de dados no Typescript).
3. Executar os **Testes Unitários** no projeto.
4. Caso tudo passe sem falhas, realizar o build seguro e fazer **Deploy Automático para Produção no Vercel**.

_Nota: Se os testes ou a formatação falharem, o deploy na Vercel é cancelado para preservar a estabilidade da aplicação em si._

## Regras Rápidas da Equipe

1. **Pense globalmente**: Se um código for útil em outros lugares, ponha em `packages/shared`.
2. **Dados Isolados**: A aplicação Vue (`apps/website`) nunca deve chamar a API diretamente; use apenas o cliente exportado por `packages/supabase`.
3. **Mantenha o código limpo**: Sempre execute o _Linter_ (`lint`) e o _Prettier_ (`format`) antes dos seus commits.

---

[Voltar ao topo ⬆️](#sumário)
