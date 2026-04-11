# 🧩 @smart-gen/shared

Este pacote contém as lógicas utilitárias, tipagens (Types/Interfaces) genéricas e constantes que são compartilhadas por toda a aplicação.

O foco deste pacote é abraçar a ideia do monorepo de evitar **código duplicado**.

---

## 🎯 Objetivo

Se um bloco de código (que não envolve UI ou lógica de banco de dados direta) precisar ser usado no Website e em um Worker futuro, ele deve morar aqui.

**Exemplos do que deve vir para cá:**

- Funções utilitárias (ex: formatadores de data, validadores de string, parse de dados).
- Tipagens compartilhadas ou de domínio neutro.
- Constantes globais (ex: mensagens de aviso genéricas, timeouts).

## 🚫 O que NÃO colocar aqui

- **Código de front-end (UI):** Não coloque componentes `.vue` ou classes CSS.
- **Requisições de banco de dados:** Lógicas de Supabase devem ir apenas para o pacote `@smart-gen/supabase`.

---

## 🚀 Como Usar

Em qualquer outro pacote do projeto (como o App Website), basta importar do `@smart-gen/shared`:

```typescript
// Exemplo importando em qualquer app do monorepo
import { sharedMessage } from '@smart-gen/shared'

console.log(sharedMessage)
```

Sempre que adicionar uma nova função ou arquivo dentro de `src/`, lembre-se de **exportá-la** no arquivo principal `src/index.ts` para que fique acessível aos consumidores do pacote.
