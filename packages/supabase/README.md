# 🗄️ @smart-gen/supabase

A camada isolada de backend e acesso a dados do Smart-Gen. Toda comunicação, autenticação, política de leitura ou escrita (mutations) com o banco de dados Supabase ocorre **exclusivamente dentro deste pacote**.

---

## 🏛️ Arquitetura (Resource Pattern)

Para manter o código escalável, nós dividimos as lógicas por **Recursos (Resources)**. Cada subpasta dentro de `src/resources/` representa uma abstração do banco de dados (ex: `auth`, `generators`, `users`, `reading`):

### Anatomia de um Recurso

Cada recurso deve ter (se aplicável ao caso de uso) os seguintes arquivos:

- `queries.ts` — **Apenas Leitura.** Funções exclusivas para buscar dados (`select`).
- `mutations.ts` — **Apenas Escrita.** Funções para modificar estado (`insert`, `update`, `delete`).
- `service.ts` — **Lógicas de Negócio.** Quando uma operação exige orquestrar mais de uma tabela, bater em APIS terceiras junto da requisição, etc.
- `types.ts` — **Tipagens do Recurso.** Extensões ou apelidos dos tipos base do banco.
- `index.ts` — Ponto de exportação do recurso.

Exemplo da estrutura de um recurso completo:

```text
src/
└── resources/
    └── generators/
        ├── queries.ts
        ├── mutations.ts
        ├── service.ts
        ├── types.ts
        ├── index.ts
        └── __tests__/
            └── queries.test.ts
```

> **Nota:** Nem todo recurso precisa de todos os arquivos. Por exemplo, o recurso `auth` possui apenas `service.ts` e `types.ts`, pois toda a lógica passa pela API de autenticação do Supabase, sem queries ou mutations diretas em tabelas.

---

## 🛠️ Regra de Ouro

**Injeção de Dependências:** Nenhuma função aqui deve "criar" seu próprio client Supabase de forma invisível.
Todas as funções que acessarem dados (`queries`, `mutations`, `services`) **devem receber** no seu primeiro parâmetro a instância cliente (tipada como `SupabaseClient<Database>`).

- ✅ **Correto:** `export const getGenerators = async (supabase: SupabaseClient<Database>) => { ... }`
- ❌ **Errado:** `export const getGenerators = async () => { const supabase = supabaseInit(); supabase.from(...) }`

Isso nos permite interceptar requisições em testes escrevendo mocks perfeitos da instância supabase.

---

## 🧪 Testes Unitários

Todos os arquivos que modificam dados ou lidam com a regra de negócio central devem possuir testes. Eles ficam guardados nas pastas `__tests__` de cada recurso usando Vitest com Mocks padronizados.

Para testar isoladamente este pacote execute:

```bash
pnpm --filter @smart-gen/supabase test:unit
```

---

## 🧩 Tipagens

Use `src/database.types.ts` (tipos gerados pela CLI do Supabase) sempre que for representar as tabelas originais da base.
