# ⚙️ @smart-gen/tsconfig

Este pacote atua como a "**fonte da verdade**" para todas as configurações e regras de TypeScript do monorepo Smart-Gen.

Seu objetivo é garantir consistência de checagem de tipos (Type-Checking) e sintaxe em todas as aplicações (`apps/`) e bibliotecas (`packages/`).

---

## 🎯 Por que não criar `tsconfig.json` manuais?

Em grandes ecossistemas Node com TypeScript, duplicar regras ou ativar flags desnecessárias em pastas isoladas acaba gerando quebras em produção e lentidão no CI/CD.

Ao unificar, se decidirmos aumentar o nível de `strict` na base de código, basta alterar o `base.json` aqui e todo o projeto refletirá essa regra na mesma hora.

---

## 📦 Presets Disponíveis

Para usar qualquer configuração deste pacote, um cliente (ex: o Website) deve estender (`extends`) o JSON desejado em seu próprio `tsconfig.json`.

Existem quatro esquemas disponíveis:

1. **`base.json`**
   Alicerces compartilhados por todos os outros presets. Habilita `"strict": true`, `"noUncheckedIndexedAccess"`, resolução de módulos em modo `"bundler"`, target `"ESNext"`, e `"verbatimModuleSyntax"` (imports devem usar `type` explícito quando aplicável). Não emite arquivos (`"noEmit": true`).

2. **`vue.json`**
   Estende `base.json` adicionando libs do DOM (`DOM`, `DOM.Iterable`), suporte a JSX (`"jsx": "preserve"`) e registra os tipos do Vite (`"types": ["vite/client"]`) para que `import.meta.env` e imports de `.vue` funcionem corretamente.

3. **`node.json`**
   Estende `base.json` adicionando apenas `"types": ["node"]` para que APIs do Node.js (como `process`, `fs`, `path`) sejam reconhecidas. Ideal para os pacotes server-side (`@smart-gen/shared`, `@smart-gen/supabase`).

4. **`vitest.json`**
   Estende `vue.json` e configura o ambiente de testes: limpa a `"lib"` (o Vitest injeta os tipos em runtime) e registra `"types": ["node", "jsdom"]` para que APIs do DOM simulado (`document`, `window`) e do Node estejam disponíveis nos arquivos de teste.

---

## 🚀 Como Usar

Exemplo em um pacote genérico simulando a adoção do node:

```json
{
  "extends": "@smart-gen/tsconfig/node.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"]
}
```
