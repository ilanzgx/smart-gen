<a id="topo"></a>

# ⚡​ Smart Gen - Monitoramento de geradores de energia

Aplicação responsável por monitorar geradores de energia através de microcontroladores ESP32 com dados adquiridos através de sensores. Monorepo construído com [PNPM Workspaces](https://pnpm.io/workspaces). Ele suporta múltiplas aplicações e concentra as lógicas reutilizáveis do projeto.

## Sumário

- [Visão Geral](#visão-geral)
- [Objetivos](#objetivos)
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

## Visão Geral

Smart Gen é um ecossistema completo para o monitoramento remoto de geradores de energia. Utilizando o poder do **ESP32** para coleta de dados e o **Supabase** como infraestrutura de backend, o projeto oferece uma visão clara e em tempo real da saúde operacional dos equipamentos, com suporte a atualizações **Over-the-Air (OTA)** que permitem entregar novas versões da interface mobile sem reinstalação do aplicativo.

## Objetivos

O projeto Smart Gen visa resolver o problema de monitoramento manual e reativo de geradores, focando em:

- **Monitoramento Preventivo**: Coletar dados de temperatura e níveis críticos de fluidos para evitar falhas catastróficas.
- **Visualização em Tempo Real**: Fornecer um dashboard intuitivo e mobile-first para que gestores acompanhem o status de qualquer lugar.
- **Baixo Custo e Alta Escalabilidade**: Utilizar microcontroladores acessíveis (ESP32) e uma arquitetura de monorepo que permite a expansão para múltiplos geradores e novas interfaces (Mobile/Desktop) sem duplicação de lógica.
- **Atualizações Contínuas**: Entregar melhorias na interface mobile via OTA, sem necessidade de publicar uma nova versão no app store.
- **Decisões Baseadas em Dados**: Criar um histórico confiável de leituras para análises futuras de manutenção e eficiência energética.

## Tech Stack

- **Linguagem**: TypeScript
- **Gerenciador de Pacotes**: PNPM
- **Framework Frontend**: Vue 3 com Vite
- **Estilização**: Tailwind CSS v4
- **Gerenciamento de Estado**: Pinia
- **Roteamento**: Vue Router
- **Testes**: Vitest
- **Linting**: ESLint + OxLint + Prettier
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Mobile**: Capacitor + `@capgo/capacitor-updater` (OTA)
- **Firmware**: C++ (Arduino/ESP-IDF) para ESP32
- **CI/CD**: GitHub Actions

## Pré-requisitos

- [Node.js](https://nodejs.org/) (versão >= 20.0)
- [PNPM](https://pnpm.io/installation) (gerenciador de pacotes)
- [Git](https://git-scm.com/) (para versionamento)
- Conta no [Supabase](https://supabase.com/) (para backend)

## Arquitetura

Smart Gen é organizado como um monorepo usando PNPM Workspaces com a seguinte estrutura:

```bash
smart-gen/
├── apps/                        # Aplicações finais
│   ├── website/                 # Aplicação frontend principal (Vue 3)
│   └── mobile/                  # App mobile com Capacitor (Android/iOS)
├── packages/                    # Pacotes reutilizáveis
│   ├── @smart-gen/shared        # Utilitários, tipos e constantes compartilhados
│   ├── @smart-gen/supabase      # Camada de acesso ao Supabase
│   └── @smart-gen/tsconfig      # Configurações TypeScript centralizadas
├── firmware/                    # Código C++ para o microcontrolador ESP32
├── scripts/                     # Scripts utilitários (ex: upload de bundle OTA)
├── .github/workflows/           # Pipelines do GitHub Actions
├── pnpm-workspace.yaml          # Configuração do PNPM Workspaces
└── package.json                 # Scripts raiz e configurações
```

### Comunicação entre Camadas

1. **Frontend** (`apps/website`) nunca chama o Supabase diretamente
2. Toda comunicação com o banco ocorre através de `@smart-gen/supabase`
3. Lógica de negócio compartilhada fica em `@smart-gen/shared`
4. Configurações TypeScript são padronizadas em `@smart-gen/tsconfig`

### Fluxo de Atualização OTA

```bash
Push para main
    └── GitHub Actions (CI)
            └── Build do Website
                    └── Upload do bundle .zip para o Supabase Storage
                            └── App Mobile detecta nova versão via Edge Function
                                    └── Download e aplicação automática sem reinstalar
```

## Começando

### 1. Clone o Repositório

```bash
git clone https://github.com/ilanzgx/smart-gen.git
cd smart-gen
git checkout -b develop origin/develop
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

### Para o Script de Upload OTA (`scripts/upload-ota-bundle.mjs`)

| Variável                    | Descrição                                         | Exemplo                          |
| --------------------------- | ------------------------------------------------- | -------------------------------- |
| `SUPABASE_URL`              | URL do projeto Supabase                           | `https://xyzcompany.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço com permissão total (não expor!) | `eyJhbGciOiJIUzI1NiIsInR5cCI...` |

> ⚠️ Lembre-se sempre de copiar `.env.example` para `.env` e preencher seus valores secretos. Nunca commite arquivos `.env`.
>
> 🔒 O `SUPABASE_SERVICE_ROLE_KEY` jamais deve ser exposto no frontend. Ele é usado apenas pelo script de upload e pelo GitHub Actions (como secret).

## Aplicações

### 🌐 Website (`@smart-gen/website`)

A aplicação front-end principal, que também é empacotada e distribuída como conteúdo web dentro do app mobile via Capacitor.

- **Stack**: Vue 3, Vite, Tailwind CSS v4, Pinia, Vue Router, Vitest
- **Para rodar localmente**: `pnpm --filter @smart-gen/website dev`
- **Para formatar / lint**: `pnpm --filter @smart-gen/website format` e `pnpm --filter @smart-gen/website lint`
- **Para testes e build**: `pnpm --filter @smart-gen/website test:unit` e `pnpm --filter @smart-gen/website build`

[Ver documentação completa do Website](apps/website/README.md)

### 📱 Mobile (`@smart-gen/mobile`)

App nativo para Android e iOS construído com Capacitor. Embala o website em uma WebView nativa e utiliza `@capgo/capacitor-updater` para receber atualizações OTA sem passar pela App Store.

- **Stack**: Capacitor, Android (Gradle/Java), iOS (Xcode/Swift)
- **Para gerar APK debug**: Requer Android Studio ou `./gradlew assembleDebug`
- **Atualização OTA**: Automática após qualquer deploy na `main`

[Ver documentação completa do Mobile](apps/mobile/README.md)

### ⚙️ Firmware (`firmware/`)

Código C++ que roda diretamente no microcontrolador ESP32. Responsável por coletar leituras dos sensores e enviá-las para o Supabase via HTTP/REST.

- **Stack**: C++ (Arduino framework), ESP-IDF
- **Sensores suportados**: Temperatura (DS18B20), Nível de Água
- **Conectividade**: Wi-Fi com suporte a múltiplas redes (WiFiMulti)
- **Identificação**: Baseada em MAC Address via RPC no Supabase

## Pacotes Internos

### ⚙️ TSConfig (`@smart-gen/tsconfig`)

Presets TypeScript centralizados para todo o monorepo. Disponibiliza quatro configurações base:

- `base.json` — Configurações compartilhadas (strict, bundler, ESNext).
- `vue.json` — Extends `base` + DOM libs + suporte a Vue SFC (`.vue`).
- `node.json` — Extends `base` + Node.js types.
- `vitest.json` — Extends `vue` + jsdom para ambiente de testes.

[Ver documentação completa do TSConfig](packages/tsconfig/README.md)

### 🧩 Shared (`@smart-gen/shared`)

Local exclusivo para funções utilitárias genéricas, tipagens (types/interfaces), schemas de validação (Zod) e constantes que não dependem de nada do front-end. O objetivo é evitar duplicação de lógicas.

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

### Script de OTA

```bash
# Faz build do website, empacota e envia para o Supabase Storage
SUPABASE_URL="..." SUPABASE_SERVICE_ROLE_KEY="..." node scripts/upload-ota-bundle.mjs
```

> Em produção, esse script é executado automaticamente pelo GitHub Actions após o CI passar na `main`.

## Workflow da Equipe

Para manter o projeto organizado e evitar conflitos, siga estes dois momentos:

1. **Ao começar a trabalhar:** Rode `pnpm run sync`. Isso garante que você tem a versão mais recente do código dos seus colegas sem perder suas mudanças locais.
2. **Antes de abrir um Pull Request (PR):** Rode `pnpm run ready`. Ele vai garantir que o seu código "se dá bem" com o código novo que chegou e que não existem erros de estilo ou de tipagem.

### Git Hooks (Husky)

O projeto utiliza **Husky** para garantir qualidade automática em cada operação Git:

- **`pre-commit`**: Executa lint nos arquivos staged antes de cada commit.
- **`pre-push`**: Verifica se a branch local está sincronizada com o remoto antes de enviar.

---

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

### Cobertura

| Pacote     | Áreas cobertas                                                    |
| ---------- | ----------------------------------------------------------------- |
| `website`  | Auth store, Router guards, `OtaUpdateService`                     |
| `supabase` | Auth service, `getLastReadingByGeneratorId`, recuperação de senha |
| `shared`   | Schemas Zod de autenticação e recuperação de senha                |

## Deploy / CI-CD

O projeto conta com pipelines automatizados via **GitHub Actions**.

### Pipelines disponíveis

| Workflow             | Trigger                       | Descrição                                                   |
| -------------------- | ----------------------------- | ----------------------------------------------------------- |
| `ci.yml`             | Push/PR em `main` e `develop` | Lint, type-check, testes e build de verificação             |
| `deploy-website.yml` | CI passou em `main`           | Build e deploy automático do website para o **Vercel**      |
| `deploy-ota.yml`     | CI passou em `main`           | Build, empacotamento e upload do bundle OTA para o Supabase |
| `build-mobile.yml`   | CI passou em `main`           | Geração do APK Android de debug e envio para o **Telegram** |

### Fluxo completo de uma PR mergeada em `main`

```bash
Merge → CI (lint + type-check + tests + build)
           ├── ✅ deploy-website → Vercel (website)
           ├── ✅ deploy-ota     → Supabase Storage (bundle mobile)
           └── ✅ build-mobile   → APK + Telegram notification
```

_Nota: Se os testes ou a formatação falharem no CI, nenhum deploy é realizado, preservando a estabilidade em produção._

## Regras Rápidas da Equipe

1. **Pense globalmente**: Se um código for útil em outros lugares, ponha em `packages/shared`.
2. **Dados Isolados**: A aplicação Vue (`apps/website`) nunca deve chamar a API diretamente; use apenas o cliente exportado por `packages/supabase`.
3. **Mantenha o código limpo**: Sempre execute o _Linter_ (`lint`) e o _Prettier_ (`format`) antes dos seus commits. O Husky garante isso automaticamente.
4. **Nunca exponha secrets**: O `SUPABASE_SERVICE_ROLE_KEY` só pertence ao GitHub Actions Secrets e ao ambiente de CI.
5. **OTA é produção**: Qualquer push na `main` com alterações no `apps/website` dispara um deploy OTA para dispositivos reais.

---

[Voltar ao topo ⬆️](#topo)
