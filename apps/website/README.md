# 🌐 Smart Gen — Website

Aplicação front-end do Smart Gen, construída com **Vue 3.5**, **Vite 8**, **Tailwind CSS v4** e **ApexCharts**.

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
│   └── main.css     # Entry point do CSS (Tailwind v4 + Fontes)
│
├── components/      # Componentes reutilizáveis
│   ├── ui/          # Componentes de interface (Shadcn/UI)
│   └── generators/  # Componentes de monitoramento (Gráficos, Cards)
│
├── views/           # Páginas da aplicação (uma por rota)
│   ├── HomeView.vue
│   ├── LoginView.vue
│   └── DashboardView.vue
│
├── router/          # Configuração de rotas (Vue Router 5)
│   └── index.ts     # Guardas de rota e mapeamento de URLs
│
├── stores/          # Estado global da aplicação (Pinia 3)
│   └── auth.store.ts # Controle de autenticação e sessão
│
├── lib/             # Configurações de bibliotecas externas
│   ├── supabase.ts  # Instância do Supabase (usa @smart-gen/supabase)
│   └── utils.ts     # Utilitários de estilo (cn helper)
│
├── App.vue          # Componente raiz — shell da aplicação
└── main.ts          # Ponto de entrada — inicializa o app
```

### Quando usar o quê?

| Eu preciso... | Coloco em... |
| --- | --- |
| Criar uma nova página | `views/` + adicionar rota no `router/index.ts` |
| Criar um componente de monitoramento | `components/generators/` |
| Criar um componente de UI básico | `components/ui/` |
| Guardar estado compartilhado | `stores/` |

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

### 2. Monitoramento e Gráficos

Para exibir dados de sensores, utilize o componente de gráfico dedicado:

```vue
<script setup lang="ts">
import TemperatureChart from '@/components/generators/TemperatureChart.vue'
</script>

<template>
  <TemperatureChart generator-id="uuid-do-gerador" />
</template>
```

### 3. Usar a Store de Autenticação

```ts
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()
console.log(authStore.userEmail)
```

---

## 🎨 Adicionando Componentes (Shadcn UI)

Diferente de outras bibliotecas, o **Shadcn UI** não instala tudo de uma vez. Você "baixa" apenas o código do componente que precisa (ex: Botão, Card, Input) para dentro do seu projeto. Isso permite que você tenha controle total sobre o código visual.

### Como baixar um novo componente:

1. Acesse a [documentação oficial](https://www.shadcn-vue.com/docs/components/button.html) e escolha o que precisa.
2. No terminal, na raiz do monorepo, execute o comando abaixo (substituindo `nome-do-componente` pelo que você deseja, ex: `card`):

```bash
pnpm --filter @smart-gen/website dlx shadcn-vue@latest add nome-do-componente
```

### Como usar o componente baixado:

O comando criará os arquivos automaticamente na pasta `src/components/ui/`. Para usar em qualquer página:

```vue
<script setup lang="ts">
// 1. Importe o componente (sempre use o @/ para facilitar)
import { Button } from '@/components/ui/button'
</script>

<template>
  <!-- 2. Use como uma tag HTML normal -->
  <Button>Clique aqui</Button>
</template>
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
- **Extensão obrigatória:** [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- **DevTools:** Instale o [Vue DevTools](https://devtools.vuejs.org/) no browser.

---

## 🤝 Regras do Projeto

1. **Isolamento de Dados**: Nunca importe o Supabase SDK direto no componente — use a instância de `src/lib/supabase.ts` e as funções de `@smart-gen/supabase`.
2. **Estilização**: Use Tailwind CSS v4 para tudo. Evite `<style scoped>` a menos que seja estritamente necessário para animações complexas.
3. **Mobile First**: Desenvolva sempre pensando em telas menores primeiro.
4. **Gráficos**: Utilize o **ApexCharts** para visualizações de dados, preferencialmente criando wrappers para cada tipo de sensor.
