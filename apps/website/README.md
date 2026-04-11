# 🌐 Smart Gen — Website

Aplicação front-end do Smart Gen, construída com **Vue 3** + **Vite** + **Tailwind CSS v4**.

---

## 🚀 Início Rápido

```bash
# Na raiz do monorepo
pnpm install

# Rodar apenas o website
pnpm --filter @smart-gen/website dev
```

> ⚠️ Copie o `.env.example` para `.env` e preencha as variáveis do Supabase antes de rodar.

---

## 🧠 Introdução ao Vue 3

O Vue usa **Single File Components (SFC)** — arquivos `.vue` que encapsulam template, lógica e estilos num único arquivo:

```vue
<script setup lang="ts">
// Lógica do componente (Composition API)
import { ref } from 'vue'

const contador = ref(0)
</script>

<template>
  <!-- HTML do componente -->
  <button @click="contador++">Cliques: {{ contador }}</button>
</template>

<style scoped>
/* Estilos isolados ao componente */
button { padding: 8px 16px; }
</style>
```

### Conceitos-Chave

| Conceito | O que faz | Exemplo |
| --- | --- | --- |
| `ref()` | Cria uma variável reativa | `const nome = ref('João')` |
| `computed()` | Valor derivado que se atualiza sozinho | `const dobro = computed(() => count.value * 2)` |
| `@click` | Escuta um evento do DOM | `<button @click="salvar()">` |
| `{{ }}` | Interpolação — exibe dados no template | `<p>{{ nome }}</p>` |
| `v-if` / `v-for` | Condicionais e loops no template | `<li v-for="item in lista">` |

📖 Documentação oficial: [vuejs.org/guide](https://vuejs.org/guide/introduction.html)

---

## 📂 Estrutura de Pastas

```text
src/
├── assets/          # CSS global e arquivos estáticos
│   └── main.css     # Entry point do CSS (importa Tailwind)
│
├── components/      # Componentes reutilizáveis (botões, cards, inputs...)
│   └── MeuBotao.vue
│
├── views/           # Páginas da aplicação (uma por rota)
│   ├── HomeView.vue
│   └── NotFoundView.vue
│
├── router/          # Configuração de rotas (Vue Router)
│   └── index.ts     # Define quais URLs carregam quais views
│
├── stores/          # Estado global da aplicação (Pinia)
│   └── useAuthStore.ts  (exemplo futuro)
│
├── lib/             # Configurações de bibliotecas externas
│   └── supabase.ts  # Instância do Supabase (usa @smart-gen/supabase)
│
├── App.vue          # Componente raiz — shell da aplicação
└── main.ts          # Ponto de entrada — monta o app no DOM
```

### Quando usar o quê?

| Eu preciso... | Coloco em... |
| --- | --- |
| Criar uma nova página | `views/` + adicionar rota no `router/index.ts` |
| Criar um botão/card/input reutilizável | `components/` |
| Guardar estado compartilhado (auth, dados) | `stores/` |
| Adicionar CSS global | `assets/main.css` |
| Configurar lib externa | `lib/` |

---

## 🔄 Fluxo de Desenvolvimento

### 1. Criar uma nova página

```bash
# 1. Crie o arquivo da view
src/views/DashboardView.vue

# 2. Adicione a rota em src/router/index.ts
{
  path: '/dashboard',
  name: 'dashboard',
  component: () => import('../views/DashboardView.vue'),
}
```

### 2. Criar um componente reutilizável

```vue
<!-- src/components/GeneratorCard.vue -->
<script setup lang="ts">
defineProps<{
  nome: string
  status: 'online' | 'offline'
}>()
</script>

<template>
  <div class="rounded-lg border p-4">
    <h3>{{ nome }}</h3>
    <span>{{ status }}</span>
  </div>
</template>
```

Depois, use em qualquer view:

```vue
<script setup lang="ts">
import GeneratorCard from '@/components/GeneratorCard.vue'
</script>

<template>
  <GeneratorCard nome="Gerador #1" status="online" />
</template>
```

### 3. Criar uma store (Pinia)

```ts
// src/stores/useGeneratorStore.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabase'
import { getGenerators } from '@smart-gen/supabase'

export const useGeneratorStore = defineStore('generators', () => {
  const generators = ref([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    generators.value = await getGenerators(supabase)
    loading.value = false
  }

  return { generators, loading, fetchAll }
})
```

---

## ⚙️ Comandos

| Comando | O que faz |
| --- | --- |
| `pnpm dev` | Inicia o servidor de desenvolvimento (hot-reload) |
| `pnpm build` | Compila para produção com type-check |
| `pnpm test:unit` | Roda os testes unitários (Vitest) |
| `pnpm lint` | Executa OxLint + ESLint com auto-fix |
| `pnpm format` | Formata o código com Prettier |
| `pnpm type-check` | Verifica tipagem com vue-tsc |

---

## 🛠️ Setup do Editor

- **Editor:** [VS Code](https://code.visualstudio.com/)
- **Extensão obrigatória:** [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) — habilita IntelliSense para `.vue`
- **DevTools no browser:** Instale o [Vue DevTools](https://devtools.vuejs.org/) para inspecionar componentes e stores

---

## 🤝 Regras do Projeto

1. **Nunca importe o Supabase SDK direto** — use sempre a instância de `src/lib/supabase.ts` e as funções de `@smart-gen/supabase`.
2. **Use Tailwind CSS para estilização** — Evite escrever blocos `<style scoped>` de CSS puro a menos que seja estritamente necessário (ex: animações complexas não suportadas pelo Tailwind). Aproveite todas as classes utilitárias do Tailwind v4 para manter o padrão e a performance do projeto.
3. **Rode `lint` e `format` antes de commitar.**
4. **Componentes reutilizáveis vão em `components/`**, páginas vão em `views/`.
