# ⚡​ Smart Gen - Monitoramento de geradores de energia

Aplicação responsável por monitorar geradores de energia através de microcontroladores ESP32 com dados adquiridos através de sensores. Monorepo construído com [PNPM Workspaces](https://pnpm.io/workspaces). Ele suporta múltiplas aplicações e concentra as lógicas reutilizáveis do projeto.

---

## 🛠️ Começando

**Pré-requisitos:** [Node.js](https://nodejs.org/) (>= 20.0) e [PNPM](https://pnpm.io/installation).

Para instalar todas as dependências (da raiz e de todos os pacotes), execute:

```bash
pnpm install
```

---

## 📱 Aplicações (`apps/`)

### 🌐 Website (`@smart-gen/website`)

A aplicação front-end principal.

- **Stack:** Vue 3, Vite, Tailwind CSS v4, Pinia, Vue Router, Vitest.
- **Para rodar localmente:** `pnpm --filter @smart-gen/website dev`
- **Para formatar / lint:** `pnpm --filter @smart-gen/website format` e `pnpm --filter @smart-gen/website lint`
- **Para testes e build:** `pnpm --filter @smart-gen/website test:unit` e `pnpm --filter @smart-gen/website build`

---

## 📦 Pacotes Internos (`packages/`)

Pacotes desenvolvidos pela equipe que podem ser importados por qualquer aplicação (`apps/`).

### 🧩 Shared (`@smart-gen/shared`)

Local exclusivo para funções utilitárias genéricas, tipagens (types/interfaces) e constantes que não dependem de nada do front-end. O objetivo é evitar duplicação de lógicas.

### 🗄️ Supabase (`@smart-gen/supabase`)

Camada isolada de backend. Toda e qualquer interação com o banco de dados via Supabase (autenticação, acesso a tabelas, policies) deve ocorrer **dentro deste pacote** e ser exportada para a aplicação principal.

---

## 🤝 Regras Rápidas da Equipe

1. **Pense globalmente:** Se um código for útil em outros lugares, ponha em `packages/shared`.
2. **Dados Isolados:** A aplicação Vue (`apps/website`) nunca deve chamar a API diretamente; use apenas o cliente exportado por `packages/supabase`.
3. **Mantenha o código limpo:** Sempre execute o _Linter_ (`lint`) e o _Prettier_ (`format`) antes dos seus commits.
