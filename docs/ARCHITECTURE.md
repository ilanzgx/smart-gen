# Arquitetura do Smart Gen

Este documento descreve em profundidade a arquitetura técnica de todo o ecossistema **Smart Gen**, um sistema de monitoramento remoto de geradores de energia. A documentação abrange desde o hardware embarcado responsável pela aquisição de telemetria, passando pelos pacotes compartilhados de lógica e dados, até as aplicações cliente (web e mobile), o pipeline de CI/CD e o mecanismo de atualização over-the-air.

---

## Índice

- [Visão Geral do Ecossistema](#visão-geral-do-ecossistema)
- [Módulo 1 — Firmware (ESP32)](#módulo-1--firmware-esp32)
  - [Arquitetura de Classes](#arquitetura-de-classes)
  - [Ciclo de Vida do Loop Principal](#ciclo-de-vida-do-loop-principal)
  - [SmartGenSensors — Aquisição de Telemetria](#smartgensensors--aquisição-de-telemetria)
  - [SmartGenWifi — Conectividade Resiliente](#smartgenwifi--conectividade-resiliente)
  - [SmartGenSupabase — Persistência de Dados](#smartgensupabase--persistência-de-dados)
- [Módulo 2 — @smart-gen/shared](#módulo-2--smart-genshared)
  - [Schemas de Validação (Zod)](#schemas-de-validação-zod)
  - [Tradução de Erros de Autenticação](#tradução-de-erros-de-autenticação)
  - [Constantes de Domínio](#constantes-de-domínio)
- [Módulo 3 — @smart-gen/supabase](#módulo-3--smart-gensupabase)
  - [Client Factory](#client-factory)
  - [Resource: Auth](#resource-auth)
  - [Resource: Generators](#resource-generators)
  - [Resource: Readings](#resource-readings)
  - [Resource: Users](#resource-users)
  - [Serviço de Realtime (WebSockets)](#serviço-de-realtime-websockets)
- [Módulo 4 — @smart-gen/reports](#módulo-4--smart-genreports)
  - [Motor de Relatórios PDF](#motor-de-relatórios-pdf)
  - [Motor de Relatórios XLSX](#motor-de-relatórios-xlsx)
- [Módulo 5 — @smart-gen/tsconfig](#módulo-5--smart-gentsconfig)
- [Módulo 6 — apps/website (Vue 3)](#módulo-6--appswebsite-vue-3)
  - [Inicialização da Aplicação (main.ts)](#inicialização-da-aplicação-maints)
  - [Roteamento e Guards de Navegação](#roteamento-e-guards-de-navegação)
  - [Gerenciamento de Estado (Pinia Stores)](#gerenciamento-de-estado-pinia-stores)
  - [Views e Páginas](#views-e-páginas)
  - [Sistema de Componentes](#sistema-de-componentes)
  - [Integração com IA (Diagnóstico Inteligente)](#integração-com-ia-diagnóstico-inteligente)
  - [Serviço de Atualização OTA](#serviço-de-atualização-ota)
- [Módulo 7 — apps/mobile (Capacitor)](#módulo-7--appsmobile-capacitor)
- [Módulo 8 — Pipeline CI/CD (GitHub Actions)](#módulo-8--pipeline-cicd-github-actions)
  - [Jobs de Integração Contínua](#jobs-de-integração-contínua)
  - [Jobs de Entrega Contínua](#jobs-de-entrega-contínua)
  - [Notificações via Telegram](#notificações-via-telegram)
- [Módulo 9 — Script de Deploy OTA](#módulo-9--script-de-deploy-ota)
- [Fluxo de Dados End-to-End](#fluxo-de-dados-end-to-end)
- [Decisões Arquiteturais e Trade-offs](#decisões-arquiteturais-e-trade-offs)

---

## Visão Geral do Ecossistema

O Smart Gen é estruturado como um **monorepo gerenciado por pnpm workspaces**, organizando todos os artefatos de software sob uma única árvore de diretórios com dependências resolvidas localmente.

```
smart-gen/
├── firmware/                     # C++ embarcado para ESP32
├── apps/
│   ├── website/                  # Vue 3 + Vite + Tailwind CSS v4
│   └── mobile/                   # Capacitor (Android/iOS WebView)
├── packages/
│   ├── @smart-gen/shared         # Schemas Zod, constantes, utilitários
│   ├── @smart-gen/supabase       # Data Access Layer (DB + Realtime)
│   ├── @smart-gen/reports        # Geração de relatórios PDF e XLSX
│   └── @smart-gen/tsconfig       # Presets de configuração TypeScript
├── scripts/
│   └── upload-ota-bundle.mjs     # Empacotamento e upload OTA
└── .github/workflows/
    └── pipeline.yml              # CI/CD automatizado
```

A comunicação entre camadas obedece a uma regra rígida de inversão de dependência:

- **O firmware** se comunica exclusivamente com a API REST do Supabase via HTTP POST.
- **As aplicações cliente** (`apps/`) **nunca** importam `@supabase/supabase-js` diretamente — toda interação passa pela camada de abstração `@smart-gen/supabase`.
- **Regras de negócio compartilhadas** (constantes, schemas de validação, tradução de erros) vivem em `@smart-gen/shared`, que é independente de qualquer framework.

---

## Módulo 1 — Firmware (ESP32)

O módulo de firmware é escrito em **C++** utilizando o framework **Arduino** com suporte ao chip **ESP32-D0WD-V3**. Ele é responsável pela aquisição periódica de dados sensoriais e transmissão para a nuvem.

### Arquitetura de Classes

O firmware segue um design orientado a objetos com separação clara de responsabilidades em três classes:

| Classe | Arquivo | Responsabilidade |
|:---|:---|:---|
| `SmartGenSensors` | `smartgen_sensors.h/.cpp` | Inicialização, calibração e leitura dos sensores físicos |
| `SmartGenWifi` | `smartgen_wifi.h/.cpp` | Gerenciamento de conexão Wi-Fi com fallback |
| `SmartGenSupabase` | `smartgen_supabase.h/.cpp` | Serialização JSON e envio HTTP para a API REST |

As credenciais de rede e Supabase são definidas em `smartgen_credentials.h` como constantes estáticas em tempo de compilação.

### Ciclo de Vida do Loop Principal

O arquivo `firmware.ino` orquestra todo o ciclo de vida:

```
setup()
  ├── Conecta ao Wi-Fi (SmartGenWifi::connect)
  ├── Inicializa sensores (SmartGenSensors::init)
  └── Envia primeira leitura imediatamente (send)

loop() — executa a cada 1 segundo
  ├── Imprime nível de água no Serial Monitor
  └── A cada 5 MINUTOS:
      ├── Verifica conectividade Wi-Fi
      │   └── Se desconectado → SmartGenWifi::reconnect()
      └── Coleta e envia leitura (send)
```

A função `send()` implementa validação preventiva: se a temperatura retornada é `<= -120.0°C` (valor de erro do sensor DS18B20), a leitura é descartada e não é enviada ao banco de dados, evitando dados corrompidos.

### SmartGenSensors — Aquisição de Telemetria

Dois sensores são utilizados em paralelo:

**DS18B20 — Sensor de Temperatura:**
- Protocolo: **OneWire** (comunicação digital via barramento de fio único)
- Pino: GPIO 5
- Biblioteca: `DallasTemperature` (wrapper sobre `OneWire`)
- Precisão: ±0.5°C na faixa de -10°C a +85°C
- Inicialização: `requestTemperatures()` é chamado com `delay(750ms)` na inicialização para descartar leituras residuais da memória do sensor

**HC-SR04 — Sensor Ultrassônico (Nível de Água):**
- Pinos: Trigger (GPIO 25), Echo (GPIO 35)
- Princípio: emite um pulso ultrassônico e mede o tempo de retorno (`pulseIn`)
- Cálculo: `distanceCm = duration * 0.0343 / 2.0`
- Conversão para percentual:
  - `EMPTY_DISTANCE = 13.35 cm` → 0% (reservatório vazio)
  - `FULL_DISTANCE = 2 cm` → 100% (reservatório cheio)
  - Fórmula: `percentage = ((emptyDist - distCm) / (emptyDist - fullDist)) * 100`
- Proteções de borda: retorna `0%` se a distância é maior que o vazio, e `100%` se menor que o cheio

### SmartGenWifi — Conectividade Resiliente

O módulo implementa uma estratégia de conexão Wi-Fi em três camadas:

1. **Redes pré-cadastradas** (`WiFiMulti`): tenta até 10 vezes conectar nas SSIDs hardcoded em `smartgen_credentials.h` com delay de 300ms entre tentativas.
2. **Access Point de Configuração** (`WiFiManager`): se nenhuma rede conhecida responder, o ESP32 abre um AP chamado `SmartGen_Config` que permite ao usuário configurar credenciais de Wi-Fi via portal web captive.
3. **Reinicialização forçada**: se o AP também falhar, a placa executa `ESP.restart()` após 3 segundos, reiniciando o ciclo completo.

A reconexão (`reconnect()`) segue a mesma lógica de reiniciar a placa se a reconexão nativa do Wi-Fi falhar.

### SmartGenSupabase — Persistência de Dados

A classe encapsula toda a comunicação HTTP com a API REST do Supabase:

- **Endpoint**: Chama a RPC `inserir_leitura_por_mac` via `POST` (uma Stored Procedure do PostgreSQL)
- **Headers**: `Content-Type: application/json`, `apikey` e `Authorization: Bearer` com a chave anônima
- **Payload JSON**:
  ```json
  {
    "p_mac_address": "AA:BB:CC:DD:EE:FF",
    "p_temperatura": 42.5,
    "p_nivel_agua": 78.3
  }
  ```
- **Otimização de memória**: usa `String::reserve(128)` para pré-alocar memória e evitar fragmentação de heap no ESP32
- **Tratamento de erros**: o código HTTP de resposta é retornado e tratado com `switch/case` no loop principal, com mensagens descritivas para os cenários `200/201/204` (sucesso), `404` (placa não cadastrada) e `500` (erro interno)

---

## Módulo 2 — @smart-gen/shared

O pacote `@smart-gen/shared` é a camada de **lógica de negócio pura** do ecossistema. Ele não possui nenhuma dependência de framework (Vue, Supabase, etc.), sendo importável por qualquer outro pacote ou aplicação sem efeitos colaterais.

**Diretório**: `packages/shared/src/`

### Schemas de Validação (Zod)

Todos os contratos de dados de entrada do sistema são definidos como schemas Zod, garantindo validação em tempo de execução com tipagem estática inferida:

**`auth.schema.ts`** — Define quatro schemas:

| Schema | Campos | Validações |
|:---|:---|:---|
| `loginSchema` | `email`, `password` | Email válido, senha ≥ 6 caracteres |
| `registerSchema` | `name`, `email`, `password`, `confirmPassword` | Nome ≥ 3 chars, senhas coincidem (`.refine`) |
| `recoverPasswordSchema` | `email` | Email válido |
| `updatePasswordSchema` | `password`, `confirmPassword` | Senha ≥ 6 chars, senhas coincidem |

Cada schema exporta um tipo DTO correspondente (`LoginDTO`, `RegisterDTO`, etc.) via `z.infer<typeof schema>`.

**`create-generator.schema.ts`** — Schema para cadastro de geradores:

| Campo | Tipo | Validação |
|:---|:---|:---|
| `name` | `string` | Obrigatório, mínimo 1 caractere |
| `description` | `string?` | Opcional |
| `mac_address` | `string` | Obrigatório, mínimo 1 caractere |

Todas as mensagens de erro são localizadas em **português brasileiro** diretamente nos schemas.

### Tradução de Erros de Autenticação

O módulo `errors/auth-errors.ts` exporta a função `translateAuthError()`, que mapeia mensagens de erro do Supabase Auth (em inglês) para mensagens de exibição em português:

```typescript
translateAuthError("Invalid login credentials")
// → "E-mail ou senha incorretos."

translateAuthError("Email rate limit exceeded")
// → "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente."
```

Se a mensagem não possuir tradução mapeada, um `fallback` genérico é retornado. Esse módulo é consumido exclusivamente pelas stores de autenticação da aplicação web.

### Constantes de Domínio

O arquivo `constants.ts` centraliza limiares críticos do domínio de negócio:

```typescript
export const TEMP_CRITICA = 85       // °C — limiar de superaquecimento
export const NIVEL_AGUA_CRITICO = 10 // %  — limiar de nível mínimo seguro
```

Essas constantes são importadas tanto pela aplicação web (para renderização de alertas visuais) quanto pelo motor de relatórios (para cálculos estatísticos e marcação de alertas).

---

## Módulo 3 — @smart-gen/supabase

O pacote `@smart-gen/supabase` é a **Data Access Layer (DAL)** do ecossistema. Ele encapsula toda a comunicação com o Supabase (PostgreSQL, Auth, Realtime) e expõe uma API tipada para as aplicações consumidoras.

**Diretório**: `packages/supabase/src/`

**Princípio arquitetural fundamental**: nenhuma aplicação em `apps/` jamais importa `@supabase/supabase-js` diretamente. Toda interação com o banco de dados, autenticação e WebSockets é mediada por este pacote, que atua como um adaptador desacoplado.

### Client Factory

O arquivo `client.ts` exporta a função `createSupabaseInstance(url, key)`:

```typescript
export const createSupabaseInstance = (url: string, key: string): SupabaseClient => {
  if (!url || !key) throw new Error("URL e chave do Supabase são obrigatórios");
  return createClient(url, key);
};
```

A documentação enfatiza que a chave fornecida deve ser **exclusivamente a chave anônima** (`anon key`) com segurança RLS ativada. A chave `service_role` nunca é usada no lado do cliente.

O arquivo `database.types.ts` contém os tipos gerados automaticamente pelo CLI do Supabase, mapeando as tabelas PostgreSQL (`gerador`, `registro`, `usuario`) para interfaces TypeScript.

### Resource: Auth

**Arquivos**: `resources/auth/service.ts`, `resources/auth/types.ts`

O serviço de autenticação expõe 8 operações, todas recebendo uma instância de `SupabaseClient` como primeiro argumento (injeção de dependência):

| Função | Descrição |
|:---|:---|
| `signIn` | Login com email/senha via `signInWithPassword` |
| `signUp` | Cadastro de novo usuário |
| `signOut` | Encerramento de sessão |
| `getSession` | Recuperação da sessão atual armazenada localmente |
| `getUser` | Busca do usuário autenticado (verificação server-side) |
| `resetPasswordForEmail` | Envio de email de redefinição de senha |
| `updatePassword` | Atualização da senha do usuário logado |
| `updateProfile` | Atualização de metadados do perfil (`user_metadata`) |
| `updateEmail` | Atualização de email com sincronização dupla (Auth + tabela `usuario`) |

Os tipos são re-exportações do SDK do Supabase com aliases semânticos:

```typescript
export type SignInCredentials = SignInWithPasswordCredentials
export type AuthSession = Session
export type AuthUser = User
```

### Resource: Generators

**Arquivos**: `resources/generators/queries.ts`, `resources/generators/mutations.ts`, `resources/generators/types.ts`

**Queries:**
- `getGenerators()` — Lista todos os geradores do usuário, ordenados por data de criação (ascendente)
- `getGeneratorById(id)` — Busca um gerador específico por ID

**Mutations:**
- `createGenerator(data)` — Insere um novo gerador e retorna o registro criado (`.select().single()`)
- `updateGeneratorById(id, data)` — Atualiza campos de um gerador existente
- `deleteGeneratorById(id)` — Remove um gerador do banco

**Tipos derivados do banco:**
```typescript
export type Generator = Database["public"]["Tables"]["gerador"]["Row"]
export type GeneratorInsert = Database["public"]["Tables"]["gerador"]["Insert"]
export type GeneratorUpdate = Database["public"]["Tables"]["gerador"]["Update"]
```

### Resource: Readings

**Arquivos**: `resources/readings/queries.ts`, `resources/readings/service.ts`, `resources/readings/types.ts`

**Queries:**
- `getReadings()` — Retorna todas as leituras (sem filtro)
- `getReadingById(id)` — Busca uma leitura específica
- `getReadingsByGeneratorId(generatorId, startDate?, endDate?)` — Filtra leituras por gerador com suporte a intervalo de datas (via `gte`/`lte` no campo `timestamp`)
- `getLastReadingByGeneratorId(generatorId)` — Retorna apenas a leitura mais recente (via `order desc` + `limit(1)` + `maybeSingle()`)

**Tipos:**
```typescript
export type Leitura = Database["public"]["Tables"]["registro"]["Row"]
export type LeituraInsert = Database["public"]["Tables"]["registro"]["Insert"]
```

### Resource: Users

**Arquivos**: `resources/users/queries.ts`, `resources/users/mutations.ts`, `resources/users/types.ts`

**Queries:**
- `getUsers()` — Lista todos os perfis de usuário da tabela `usuario`
- `getUserById(id)` — Busca perfil por ID
- `getUserByEmail(email)` — Busca perfil por email

**Mutations:**
- `updateUserById(id, data)` — Atualiza campos do perfil (atualmente apenas `nome`)

**Tipos:**
```typescript
export type UserProfile = Database["public"]["Tables"]["usuario"]["Row"]
export type FullUser = UserProfile & { auth: SupabaseUser }
export type UpdateUserDTO = { nome?: string }
```

### Serviço de Realtime (WebSockets)

**Arquivo**: `resources/readings/service.ts`

A função `subscribeToGeneratorReadings()` é o coração da reatividade do sistema. Ela cria um canal de WebSocket que escuta eventos `INSERT` na tabela `registro`, filtrado por `gerador_id`:

```typescript
supabase.channel(channelName).on("postgres_changes", {
  event: "INSERT",
  schema: "public",
  table: "registro",
  filter: `gerador_id=eq.${generatorId}`,
}, callback)
```

**Mecanismos de resiliência implementados:**

1. **Sufixos únicos de canal**: cada instância de canal recebe um sufixo `Date.now()` no nome para evitar colisões com canais anteriores em estado `LEAVING` no multiplexador do Supabase.

2. **Retry com nomes distintos**: em caso de `CHANNEL_ERROR`, o sistema faz até `MAX_RETRIES` (3) tentativas, cada uma com um canal de nome diferente (`-r1`, `-r2`, etc.) e um delay de `RETRY_DELAY_MS` (1500ms).

3. **Callbacks diferenciados**: a função aceita dois callbacks opcionais:
   - `onSubscribed()` — chamado quando o canal **reconecta** (permite refetch de dados)
   - `onInitialSubscribe(success)` — chamado apenas na **primeira** conexão (controla skeleton loaders)

4. **Unsubscribe seguro**: o retorno da função é um objeto `{ unsubscribe }` que limpa timers, remove o canal e previne callbacks posteriores via flag `isUnsubscribed`.

---

## Módulo 4 — @smart-gen/reports

O pacote `@smart-gen/reports` é o **motor de geração de relatórios** do ecossistema. Ele é capaz de produzir documentos formatados para auditoria e análise operacional a partir dos dados de leitura armazenados no banco.

**Diretório**: `packages/reports/src/`

### Motor de Relatórios PDF

**Arquivo**: `formats/pdf/generator-report.ts` (978 linhas)

O gerador PDF é uma implementação de baixo nível usando a biblioteca `pdf-lib`, que constrói o documento programaticamente pixel a pixel, sem templates HTML intermediários. Ele é inteiramente server-side compatible (não depende de DOM).

**Estrutura do relatório gerado:**

1. **Cabeçalho**: Título "Relatório de Desempenho", nome do gerador, período selecionado e indicador de status geral (`Normal` ou `Atenção`).

2. **Seção de Diagnóstico por IA** (quando disponível): renderiza o texto de diagnóstico gerado por uma Edge Function do Supabase, com suporte a:
   - Parsing de markdown bold (`**texto**`)
   - Quebra automática de linhas (`wrapText`) respeitando a largura da página
   - Paginação automática quando o texto excede o espaço disponível
   - Crédito ao provedor de IA utilizado

3. **Gráfico de Barras Duplas**: visualiza temperatura média e nível mínimo de água por dia, com:
   - Barras de temperatura (azul/indigo) e nível de água (teal/verde)
   - Linhas pontilhadas de limiares críticos (`TEMP_CRITICA` e `NIVEL_AGUA_CRITICO`)
   - Labels inteligentes no eixo X que adaptam a frequência para evitar sobreposição
   - Escala dupla (temperatura à esquerda, percentual à direita)

4. **Gráfico de Linhas**: evolução temporal com pontos conectados, limiares críticos pontilhados e grade horizontal.

5. **Tabela de Resumo Diário**: dados consolidados por dia com temperatura média/máxima, nível mínimo de água, contagem de alertas e status do sensor.

**Funções auxiliares internas:**
- `groupReadingsByDay()` — Agrupa leituras por dia e pré-calcula estatísticas
- `wrapText()` — Quebra texto em linhas respeitando largura máxima
- `drawDiagnosticSection()` — Renderiza a seção de IA com paginação
- `drawBarChart()` — Gráfico de barras duplas com escala adaptativa
- `drawLineChart()` — Gráfico de linhas com pontos e limiares
- `drawChartLegend()` — Legenda reutilizável para gráficos

### Motor de Relatórios XLSX

**Arquivo**: `formats/xlsx/generator-report.ts` (195 linhas)

Utiliza a biblioteca `ExcelJS` para gerar planilhas Excel com três abas:

1. **Resumo**: Metadados do gerador (nome, ID, MAC address), status geral, período, total de leituras, capacidade do reservatório (2000 mL) e volume atual calculado.

2. **Resumo Diário**: Tabela com dados agregados por dia — número de leituras, temperatura média, pico de temperatura, nível mínimo de água, contagem de alertas e status do sensor.

3. **Dados Brutos**: Todas as leituras individuais com timestamp, temperatura e nível de água, formatadas para o locale `pt-BR`.

**Tipos compartilhados** (`types.ts`):
```typescript
interface ReportData {
  generator: ReportGenerator  // { id, name, esp32_id }
  readings: ReportReading[]   // { timestamp, temperatura, nivel_agua }
}
```

---

## Módulo 5 — @smart-gen/tsconfig

O pacote `@smart-gen/tsconfig` centraliza todas as configurações TypeScript do monorepo em presets reutilizáveis:

| Arquivo | Propósito | Consumidores |
|:---|:---|:---|
| `base.json` | Configuração base estrita (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`) | Todos os pacotes |
| `node.json` | Extensão para ambientes Node.js | `@smart-gen/supabase`, `@smart-gen/reports` |
| `vue.json` | Extensão para projetos Vue 3 (habilita JSX para templates Vue) | `apps/website` |
| `vitest.json` | Extensão para configuração de testes Vitest | Testes em todos os pacotes |

A uniformidade de configuração TypeScript garante que os mesmos padrões de resolução de módulos (`module: "preserve"`, `moduleResolution: "bundler"`) e rigor de tipos (`noEmit: true`) sejam aplicados consistentemente.

---

## Módulo 6 — apps/website (Vue 3)

A aplicação web é uma **Single Page Application** construída com **Vue 3** (Composition API + `<script setup>`), **Vite** como bundler, **Tailwind CSS v4** para estilização e **Pinia** para gerenciamento de estado.

**Diretório**: `apps/website/src/`

### Inicialização da Aplicação (main.ts)

O `main.ts` orquestra a inicialização em uma sequência precisa:

```
1. Cria a instância Vue e instala Pinia
2. Inicializa o plugin OTA (Capacitor) — apenas em plataformas nativas
   └── Verifica se há atualização disponível
       └── Se houver, notifica a OTA store com o bundle pendente
3. Inicializa a autenticação (authStore.initializeAuth)
   └── Registra listener de onAuthStateChange
   └── Recupera sessão existente
4. Instala o Vue Router
5. Monta a aplicação no DOM (#app)
6. Registra cleanup de listeners para quando a aplicação for desmontada
```

A inicialização de autenticação é feita **antes** da montagem do router, garantindo que os guards de navegação tenham acesso ao estado correto do usuário.

### Roteamento e Guards de Navegação

**Arquivo**: `router/index.ts`

O sistema define **10 rotas** organizadas em duas categorias:

**Rotas públicas** (acessíveis sem autenticação):
| Path | Nome | Aliases |
|:---|:---|:---|
| `/` | `home` | — |
| `/entrar` | `login` | `/signin`, `/login` |
| `/cadastrar` | `register` | `/cadastro`, `/signup`, `/register`, `/registrar` |
| `/recuperar-senha` | `recover-password` | `/recover-password`, `/forgot-password`, `/esqueci-minha-senha` |
| `/atualizar-senha` | `update-password` | `/update-password`, `/reset-password`, `/nova-senha`, `/new-password` |
| `/sobre` | `about` | `/about`, `/sobre-nos` |
| `/:pathMatch(.*)*` | `not-found` | — |

**Rotas privadas** (requerem autenticação):
| Path | Nome | Aliases |
|:---|:---|:---|
| `/dashboard` | `dashboard` | `/painel` |
| `/geradores` | `generators` | `/generators` |
| `/perfil` | `profile` | `/profile`, `/meu-perfil`, `/eu`, `/me` |

Os route aliases em português e inglês garantem que a aplicação funcione com URLs bilíngues.

**Guard `beforeEach`:**
1. Limpa erros de autenticação ao trocar de rota
2. Se a rota é privada e o usuário não está autenticado → redireciona para `/entrar`
3. Se o usuário está autenticado e tenta acessar login/register/home → redireciona para `/dashboard`

### Gerenciamento de Estado (Pinia Stores)

**`auth.store.ts`** — Store central de autenticação:

| Propriedade | Tipo | Descrição |
|:---|:---|:---|
| `user` | `ref<User \| null>` | Usuário autenticado atual |
| `session` | `ref<AuthSession \| null>` | Sessão ativa do Supabase |
| `loading` | `ref<boolean>` | Indica operação em andamento |
| `error` | `ref<string \| null>` | Mensagem de erro traduzida |
| `isAuthenticated` | `computed<boolean>` | Derivado de `!!user.value` |
| `userEmail` | `computed<string>` | Email do usuário logado |

Todas as ações (`signIn`, `signUp`, `signOut`, `recoverPassword`, `updatePassword`) seguem o mesmo padrão:
1. Ativa `loading`
2. Limpa `error`
3. Chama o serviço do `@smart-gen/supabase`
4. Atualiza estado local
5. Em caso de erro, traduz a mensagem via `translateAuthError` e armazena em `error`
6. Desativa `loading` (em `finally`)

A função `initializeAuth()` registra um listener `onAuthStateChange` no Supabase que sincroniza automaticamente `user` e `session` sempre que o estado de autenticação muda (login, logout, token refresh).

**`generators.store.ts`** — Store de geradores:

| Propriedade | Tipo | Descrição |
|:---|:---|:---|
| `generators` | `ref<Generator[]>` | Lista de geradores do usuário |
| `selectedGeneratorId` | `ref<string>` | ID do gerador selecionado |
| `selectedGenerator` | `computed<Generator \| null>` | Gerador selecionado derivado |

A action `fetchGenerators()` carrega todos os geradores e seleciona automaticamente o primeiro se nenhum estiver selecionado.

**`ota.store.ts`** — Store de atualização OTA:

| Propriedade | Tipo | Descrição |
|:---|:---|:---|
| `pendingBundle` | `ref<BundleInfo \| null>` | Bundle OTA baixado aguardando aplicação |
| `isApplying` | `ref<boolean>` | Indica que a atualização está sendo aplicada |
| `updateVersion` | `ref<string \| null>` | Versão do bundle pendente |

### Views e Páginas

**`DashboardView.vue`** — Painel principal de monitoramento (477 linhas):

É a view mais complexa do sistema. Combina:
- **Seleção de gerador** via dropdown reativo
- **Cards de indicadores** em grid responsivo (3 colunas):
  - Estado operacional (operando/parado) com ping animado
  - Temperatura atual com gauge termômetro SVG e delta de variação
  - Nível de água atual com gauge SVG e delta de variação
- **Gráficos históricos** (ApexCharts):
  - `TemperatureChart` — histórico de temperatura
  - `WaterLevelChart` — histórico de nível de água
- **Skeleton loaders** durante transição de canal realtime
- **Lógica de operação**: o gerador é considerado "operando" se a última leitura ocorreu nos últimos 30 minutos

O `watch` sobre `selectedGeneratorId` dispara:
1. Busca da última leitura via `getLastReadingByGeneratorId`
2. Setup de um novo canal Realtime via `subscribeToGeneratorReadings`
3. Animação de `isUpdatingData` por 500ms para feedback visual nos deltas

**`GeneratorsView.vue`** — Lista de geradores (122 linhas):

Exibe cards para todos os geradores com última leitura, status operacional e ações de gerenciamento. Utiliza `Promise.all` para fetch paralelo das últimas leituras de todos os geradores.

**`HomeView.vue`** — Landing page pública (91 linhas):

Exibe hero section com título, descrição do produto, CTAs para registro/contato, e gauges demonstrativos de temperatura e nível de água.

**Demais views**: `LoginView`, `RegisterView`, `RecoverPasswordView`, `UpdatePasswordView`, `ProfileView`, `AboutView`, `NotFoundView`.

### Sistema de Componentes

A aplicação possui uma hierarquia de componentes bem definida:

**Componentes de Layout:**
- `DashboardLayout.vue` — Layout compartilhado para as páginas autenticadas (sidebar + área de conteúdo)
- `HeaderComponent.vue` — Cabeçalho com navegação
- `SidebarComponent.vue` — Barra lateral com navegação, ações rápidas (registrar gerador, gerar relatório) e dialogs modais

**Componentes Visuais (Gauges):**
- `ThermometerGauge.vue` — Gauge SVG de termômetro com animação
- `WaterGauge.vue` — Gauge SVG de nível de água com animação

**Componentes de Dados:**
- `GeneratorCard.vue` — Card individual de gerador com métricas
- `generators/TemperatureChart.vue` — Gráfico ApexCharts de temperatura
- `generators/WaterLevelChart.vue` — Gráfico ApexCharts de nível de água

**Dialogs Modais:**
- `CreateGeneratorDialog.vue` — Formulário de cadastro de gerador com validação Zod
- `GenerateReportDialog.vue` — Wizard de geração de relatório com progresso por etapas
- `SettingsDialog.vue` — Configurações da conta (logout, preferências)

**UI Kit primitivo** (diretório `components/ui/`):
O projeto possui um design system primitivo construído sobre [Reka UI](https://reka-ui.com/) (headless components) com estilização via `class-variance-authority`:
- `Button`, `Dialog`, `Input`, `Label`, `Select`, `RadioGroup`, `Separator`, `Skeleton`, `Spinner`, `Switch`

### Integração com IA (Diagnóstico Inteligente)

O sistema possui uma integração com IA para geração de diagnósticos textuais que são embutidos nos relatórios PDF. O fluxo envolve dois módulos:

**`lib/generateResumeForLLM.ts`** — Prepara um resumo estatístico estruturado a partir dos dados brutos:

```typescript
interface ResumeForLLM {
  period: string
  readingsTotal: number
  temperature: { average, maxAbs, minAbs, alertsAboveLimit, hottestDay }
  waterLevel: { average, minAbs, detectedFalls }
  trend: string  // "Estável" | "Tendência de Aquecimento" | "Tendência de Resfriamento"
}
```

A detecção de tendência compara a média da primeira metade com a segunda metade dos dados. Quedas de nível de água >10% entre leituras consecutivas são contabilizadas como `detectedFalls`.

**`services/ai.service.ts`** — Invoca a Edge Function `generate-diagnostic` do Supabase:

```typescript
const { data, error } = await supabase.functions.invoke('generate-diagnostic', {
  body: reportData
})
// Retorna: { diagnostic: string, provider: string }
```

### Serviço de Atualização OTA

**Arquivo**: `services/ota-update.service.ts` (192 linhas)

A classe `OtaUpdateService` gerencia todo o ciclo de vida de atualizações over-the-air no aplicativo mobile:

**Inicialização:**
1. Verifica se está em plataforma nativa (`Capacitor.isNativePlatform()`)
2. Importa dinamicamente `@capgo/capacitor-updater`
3. Envia `notifyAppReady()` para confirmar que o bundle atual carregou corretamente
4. Detecta se é primeira instalação (bundle `builtin`)

**Verificação de atualização:**
1. Consulta a Edge Function `ota-version` para obter a versão mais recente
2. Compara com a versão atual do bundle em execução
3. Verifica `localStorage.pending_ota_version` para evitar downloads duplicados
4. Se nova versão disponível, faz download do ZIP via `capacitor-updater.download()`
5. Em primeira instalação, aplica silenciosamente para o próximo boot

**Aplicação da atualização:**
1. Marca o bundle como ativo via `updater.set({ id })`
2. Força recarregamento imediato via `updater.reload()`

O componente `OtaUpdateBanner.vue` é montado no `App.vue` e exibe um banner para o usuário quando há atualização pendente.

---

## Módulo 7 — apps/mobile (Capacitor)

**Diretório**: `apps/mobile/`

O aplicativo mobile é um **wrapper híbrido** que empacota o build de produção da aplicação web (`apps/website/dist`) dentro de uma WebView nativa via **Capacitor**.

**Configuração** (`capacitor.config.ts`):

```typescript
{
  appId: "com.smartgen.mobile",
  appName: "Smart Gen",
  webDir: "../website/dist",
  plugins: {
    Keyboard: { resize: KeyboardResize.Native, resizeOnFullScreen: true },
    CapacitorUpdater: { autoUpdate: false }  // Modo manual (controlado pelo OtaUpdateService)
  }
}
```

**Dependências nativas** (do `package.json`):
- `@capacitor/core` + `@capacitor/cli` — Core framework
- `@capacitor/android` + `@capacitor/ios` — Plataformas nativas
- `@capacitor/filesystem` — Acesso ao sistema de arquivos para salvar relatórios
- `@capacitor/keyboard` — Controle do teclado virtual
- `@capacitor/share` — Compartilhamento nativo
- `@capgo/capacitor-updater` — Motor de atualização OTA

**Plugin nativo customizado** (`NativeFileOpener`): registrado via `registerPlugin` para abrir arquivos PDF e XLSX no visualizador nativo do dispositivo após geração do relatório.

O build do APK Android é automatizado pelo CI/CD e utiliza Gradle (`assembleDebug`).

---

## Módulo 8 — Pipeline CI/CD (GitHub Actions)

**Arquivo**: `.github/workflows/pipeline.yml` (352 linhas)

O pipeline é disparado em pushes e pull requests nas branches `main` e `develop`, com filtro de paths inteligente que ignora alterações em arquivos irrelevantes (docs, readme, etc.).

A diretiva `concurrency` com `cancel-in-progress: true` garante que apenas a execução mais recente de cada branch permaneça ativa, evitando desperdício de recursos.

### Jobs de Integração Contínua

Os 4 jobs de CI executam em **paralelo**:

| Job | Comando | Propósito |
|:---|:---|:---|
| `ci-lint` | `pnpm -r --if-present run lint` | Validação de linting (OxLint + ESLint) em todos os pacotes |
| `ci-typecheck` | `pnpm -r --if-present run type-check` | Checagem de tipos TypeScript |
| `ci-test` | `pnpm -r --if-present run test:unit` | Execução de todos os testes unitários |
| `ci-build` | `pnpm -r --if-present run build` | Verificação de compilação de produção |

Todos usam: `ubuntu-latest`, PNPM v10, Node 22, `--frozen-lockfile`.

### Jobs de Entrega Contínua

Os 4 jobs de CD executam somente após **todos os 4 jobs de CI passarem** e apenas na branch `main`:

**`deploy-website`** — Deploy no Vercel:
1. Instala dependências
2. Puxa configuração de ambiente Vercel (`vercel pull`)
3. Faz build de produção pré-configurado (`vercel build --prod`)
4. Faz deploy do artefato pré-compilado (`vercel deploy --prebuilt --prod`)

**`deploy-ota`** — Upload do bundle OTA:
- Executa o script `upload-ota-bundle.mjs` que compila o website, gera `latest.zip` e `version.json`, e faz upload para o Supabase Storage

**`build-mobile`** — Build do APK Android:
1. Configura Java 21 (Zulu) e Gradle
2. Executa `pnpm build:web-mobile` (compila web + sincroniza Capacitor)
3. Executa `./gradlew assembleDebug`
4. Faz upload do APK como artefato do GitHub
5. Envia o APK diretamente para um grupo Telegram via bot

**`build-docker`** — Build e push da imagem Docker:
- Usa multi-stage build (4 estágios: base → dependencies → build → run)
- Publica em `ghcr.io` (GitHub Container Registry) com tags `latest` e `sha`
- Utiliza cache de layers via GitHub Actions cache (`type=gha`)

### Notificações via Telegram

O job `notify` executa **sempre** (`if: always()`) e envia um resumo completo para o Telegram com status individual de cada job:

```
📊 Status da Pipeline: ilanzgx/smart-gen
• CI (Lint)            : 🟢 Sucesso
• CI (TypeScript)      : 🟢 Sucesso
• CI (Testes)          : 🟢 Sucesso
• CI (Build)           : 🟢 Sucesso
• Website (Vercel)     : 🟢 Sucesso
• OTA (Supabase)       : 🟢 Sucesso
• Mobile (Android APK) : 🟢 Sucesso
• Docker (GHCR)        : 🟢 Sucesso
```

---

## Módulo 9 — Script de Deploy OTA

**Arquivo**: `scripts/upload-ota-bundle.mjs` (107 linhas)

Script Node.js que automatiza o fluxo de empacotamento e upload OTA:

```
1. Build do website (pnpm run build)
2. Compactação do diretório dist/ em latest.zip (via AdmZip)
3. Verificação/criação do bucket "ota-bundles" no Supabase Storage
4. Upload do latest.zip com upsert
5. Geração e upload de version.json com GITHUB_SHA como identificador
6. Remoção do arquivo ZIP temporário
```

O `version.json` é o mecanismo que permite ao app mobile comparar sua versão atual com a disponível na nuvem, decidindo se precisa baixar um novo bundle.

---

## Fluxo de Dados End-to-End

O percurso completo de um dado, desde a leitura do sensor até a exibição na tela do usuário:

```
ESP32 (firmware)
  ├── DS18B20.getTemperature() → 42.5°C
  ├── HC-SR04.getWaterLevel() → 78.3%
  └── HTTP POST → Supabase REST API (/rpc/inserir_leitura_por_mac)

PostgreSQL (Supabase)
  ├── Stored Procedure: inserir_leitura_por_mac
  │   ├── Resolve o MAC address para o ID do gerador
  │   └── Insere nova linha na tabela "registro"
  └── Supabase Realtime Engine
      └── Detecta INSERT e propaga via WebSocket

@smart-gen/supabase (pacote local)
  └── subscribeToGeneratorReadings()
      └── Canal WebSocket recebe payload e invoca callback

apps/website (Vue 3)
  ├── DashboardView.vue
  │   ├── updateDashboardFromReading() → Atualiza refs reativos
  │   ├── Calcula deltas (variação desde última leitura)
  │   ├── Determina status operacional (leitura < 30min = operando)
  │   └── Re-renderiza cards, gauges e gráficos
  └── Latência total: < 500ms do sensor ao pixel
```

---

## Decisões Arquiteturais e Trade-offs

### Por que um monorepo?

O monorepo com pnpm workspaces permite:
- **Compartilhamento de tipos** entre pacotes sem publicação no npm
- **Refatorações atômicas** que tocam múltiplos pacotes em um único commit
- **CI unificado** que valida todas as camadas em paralelo
- **Versionamento implícito** (`workspace:*`) que garante compatibilidade entre pacotes

### Por que o firmware usa HTTP POST e não WebSocket?

O ESP32 opera em modo **fire-and-forget**: lê sensores, envia e dorme por 5 minutos. Um WebSocket permanente consumiria energia desnecessariamente e aumentaria a complexidade de reconexão. O HTTP POST com chave anônima e RLS é suficiente e robusto.

### Por que canais Realtime com sufixo dinâmico?

O Supabase Realtime mantém canais em estado `LEAVING` brevemente após `removeChannel()`. Se um novo canal for criado com o mesmo nome antes da finalização, ocorre uma colisão silenciosa no multiplexador de WebSocket. O sufixo `Date.now()` (e `-rN` em retries) elimina esse problema de forma determinística.

### Por que Capacitor e não React Native/Flutter?

A escolha do Capacitor permite **reutilizar 100% do código web** (Vue 3 + Tailwind) como app mobile nativo, sem duplicação de lógica de interface. Combinado com o mecanismo OTA via `@capgo/capacitor-updater`, atualizações da interface são entregues instantaneamente sem re-submissão às lojas.

### Por que pdf-lib e não uma solução baseada em HTML-to-PDF?

O `pdf-lib` oferece controle pixel-perfect sobre o layout do PDF, permitindo gráficos vetoriais nativos (barras, linhas, círculos), tipografia precisa e paginação automática sem dependência de headless browser. O documento gerado é leve (~50KB) e compatível com qualquer leitor PDF.
