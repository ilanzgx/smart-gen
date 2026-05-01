# Smart-Gen | Firmware IoT (ESP32)

Este repositório contém o firmware embarcado escrito em C++ para os microcontroladores ESP32 que operam diretamente nos geradores do ecossistema Smart-Gen. Ele atua como a ponte vital entre o hardware físico (sensores do gerador) e a nuvem (Supabase), coletando telemetria e garantindo a entrega dos dados com extrema confiabilidade e segurança.

## Key Features

- **Zero-Config Authentication:** Utiliza o endereço MAC nativo do ESP32 para identificação. Basta ligar o dispositivo e autorizá-lo via painel web, eliminando a necessidade de "chumbar" (hardcode) IDs manuais a cada nova placa.
- **Conectividade Híbrida e Resiliente:** Prioriza conexão silenciosa via `WiFiMulti` com redes cadastradas. Caso falhe, levanta um portal cativo (`WiFiManager`) para configuração via smartphone. Lógica assíncrona garante que a placa não trave se o roteador de internet falhar.
- **Comunicação Segura via RPC:** Transmite leituras via HTTPS POST diretamente para o banco PostgreSQL (Supabase) utilizando chamadas RPC para proteção de dados e validação de existência física (autorização via MAC).
- **Arquitetura 100% C++ Orientada a Objetos:** Classes fortemente tipadas e desacopladas para manipulação de Sensores, Conexão Local e API Externa.

---

## Tech Stack

- **Linguagem**: C++ (Arduino Framework)
- **Microcontrolador**: ESP32 (Tensilica Xtensa Dual-Core)
- **Nuvem/Backend**: Supabase (PostgreSQL REST API)
- **Gerenciamento de Rede**: WiFiManager (tzapu)
- **Sensores**: DallasTemperature & OneWire

---

## Prerequisites

- Arduino IDE 2.0+ (ou VSCode com PlatformIO)
- Pacote de placas **esp32 by Espressif Systems** instalado na IDE
- Cabo Micro-USB/USB-C com suporte a transferência de dados
- Placa ESP32 Dev Module (NodeMCU-32S, WROOM-32, ou equivalente)

---

## Getting Started

### 1. Clonar o Repositório

```bash
git clone https://github.com/ilanzgx/smart-gen.git
cd smart-gen/firmware
```

### 2. Instalar Bibliotecas

Abra a Arduino IDE, vá em **Sketch > Include Library > Manage Libraries**, e pesquise e instale:

- `WiFiManager` (por tzapu)
- `OneWire` (por Paul Stoffregen)
- `DallasTemperature` (por Miles Burton)

### 3. Configurar Credenciais

Copie as credenciais e redes Wi-Fi criando (ou editando) o arquivo `smartgen_credentials.h` na raiz do firmware:

```cpp
#pragma once

// Credenciais Supabase
static const char* supabaseUrl = "https://SEU_PROJETO.supabase.co/rest/v1/rpc/inserir_leitura_por_mac";
static const char* supabaseKey = "SUA_ANON_KEY";

// Redes Wi-Fi da Empresa (Adicione quantas precisar)
#define WIFI_SSID_1 "REDE_1"
#define WIFI_PASS_1 "SENHA_1"
#define WIFI_SSID_2 "REDE_2"
#define WIFI_PASS_2 "SENHA_2"
```

### 4. Compilar e Gravar

1. Conecte o ESP32 ao computador via cabo USB.
2. Na Arduino IDE, selecione **Tools > Board > esp32 > ESP32 Dev Module**.
3. Selecione a porta COM correspondente em **Tools > Port**.
4. Clique no botão de **Upload** (ou pressione `Ctrl + U`).

---

## Architecture

A arquitetura foi projetada do zero para resolver problemas crônicos de IoT, como fragmentação de Heap, travamento em falhas de rede e inicialização prematura de sensores.

### Directory Structure

```bash
firmware/
├── firmware.ino              # Entry point e controle do loop temporal (Timer)
├── smartgen_credentials.h    # Segredos, Chaves de API e SSIDs (Ignorado pelo Git)
├── smartgen_sensors.cpp      # Implementação da leitura física de hardware
├── smartgen_sensors.h        # Interface para uso dos sensores
├── smartgen_supabase.cpp     # Montagem do Payload, Headers HTTPS e Client
├── smartgen_supabase.h       # Interface de comunicação web
├── smartgen_wifi.cpp         # Lógica de portal cativo e Multi-WiFi automático
└── smartgen_wifi.h           # Interface de gerenciamento de rede
```

### Request Lifecycle

1. **Boot (`setup`)**: O ESP32 inicia os barramentos de comunicação (Serial, 1-Wire) e faz uma primeira leitura cega do sensor (por 750ms) para estabilizar os componentes eletrônicos a frio.
2. **Conexão (`smartGenWifi`)**: Tenta conectar instantaneamente nas redes de `WIFI_SSID_1...`. Se não encontrar, levanta um hotspot temporário (Captive Portal) para o instalador digitar a senha via navegador.
3. **Loop (`10 minutos`)**: Verifica se a internet está ativa. Lê a temperatura via 1-Wire e efetua a volumetria de água (mock).
4. **Envio (`smartGenSupabase`)**: Constrói um payload JSON pré-alocado na RAM (evitando memory leaks), acopla os headers JWT do Supabase e executa um disparo HTTPS POST.
5. **Retorno**: Valida a resposta do banco de dados (204 = Sucesso, 404 = Placa bloqueada/não cadastrada, etc) e aguarda o tempo do próximo ciclo com matemática protegida contra Overflow (`millis`).

### Key Components

**Sensores Inteligentes (DS18B20)**
A classe `SmartGenSensors` possui lógica interna no método `init()` para forçar um aquecimento (`requestTemperatures()`) seguido de um `delay(750)`. Isso resolve um bug crônico de hardware do sensor retornar valores nulos ou `-127°C` imediatamente após receber energia do barramento.

**Segurança de Memória (Anti-Fragmentation)**
Em `smartgen_supabase.cpp`, as instâncias da classe nativa `String` utilizadas para formatar o JSON chamam a instrução `payload.reserve(128)` instantes antes da concatenação. Isso aloca um bloco de tamanho fixo contíguo de memória RAM em vez de re-alocar dinamicamente bytes fracionados. Prevenindo completamente a fragmentação de heap ao longo de dezenas de milhares de execuções.

**Reconexão Resiliente**
O `smartgen_wifi.cpp` abstrai a classe `WiFiManager`. Para evitar que uma queda de rede de 30 segundos no meio do dia abra um portal cativo infinito (travando a placa), chamadas de `reconnect()` apenas testam o estado, tentam religar no background e forçam um `ESP.restart()`, delegando ao setup original a re-abertura controlada das conexões.

---

## Environment Variables (Credentials)

Como aplicações C++ compiladas não lêem arquivos `.env` dinamicamente no runtime do chip, utilizamos o arquivo de cabeçalho estático `smartgen_credentials.h`.

| Variável / Constante | Descrição                             | Exemplo                                 |
| -------------------- | ------------------------------------- | --------------------------------------- |
| `supabaseUrl`        | Endpoint RPC (REST) completo do banco | `https://x.supabase.co/rest/v1/rpc/...` |
| `supabaseKey`        | Chave JWT anon (public) do projeto    | `sb_publishable_xxxx`                   |
| `WIFI_SSID_1`        | Nome da rede corporativa principal    | `WIFI_BASE`                             |
| `WIFI_PASS_1`        | Senha da rede corporativa principal   | `senhasecreta123`                       |

_(⚠️ **Aviso de Segurança**: Nunca faça commit do `smartgen_credentials.h`. Verifique seu `.gitignore` antes de empurrar o código)._

---

## Deployment (Hardware em Produção)

O processo de instalação em campo ("Deployment") para colocar a placa em operação industrial segue o diagrama de pinagem abaixo.

### Pinagem Padrão

| Dispositivo / Pneu           | Pino no ESP32 | Notas Elétricas                                                                                         |
| ---------------------------- | ------------- | ------------------------------------------------------------------------------------------------------- |
| DS18B20 (Cabo Amarelo/Dados) | `D5` (GPIO 5) | **Obrigatório** o uso de Resistor Pull-up de 4.7kΩ ligando o Cabo de Dados (Amarelo) e o VCC (Vermelho) |
| DS18B20 (Cabo Vermelho/VCC)  | `3V3`         | Operação em 3.3V nativa na placa                                                                        |
| DS18B20 (Cabo Preto/GND)     | `GND`         | Ground/Terra em comum com o ESP32                                                                       |

Para a produção e deploy em larga escala (dezenas de geradores):

1. Use a Arduino IDE para extrair o binário final via **Sketch > Export Compiled Binary**.
2. Utilize scripts Python como o `esptool.py` para gravar o arquivo `.bin` de forma super rápida via linha de comando, saltando os longos processos de compilação da IDE para cada unidade.

---

## Troubleshooting

### Leitura Corrompida (-127°C ou -120°C)

**Sintoma:** O Serial Monitor exibe a mensagem de ignorar leitura térmica ("Leitura de temperatura inválida").
**Resolução Física:**

1. Verifique a tensão (se a tensão cair muito, o chip desarma).
2. Certifique-se de que o **resistor de 4.7kΩ** está soldado de forma robusta e bem estanhada. Em ambientes com forte vibração mecânica do motor do gerador, o resistor pode quebrar no meio da operação. Sem ele, a arquitetura 1-Wire zera os bits (-127°C).

### Erro "Placa não cadastrada" ou 404/400 HTTP

**Sintoma:** A conexão foi efetuada e a placa tentou enviar leitura, mas o banco retornou Erro.
**Resolução do Sistema:**
A arquitetura é estritamente Zero-Config. A placa está gritando o seu endereço MAC físico pelo payload JSON. O erro ocorre porque o Banco de Dados se negou a receber telemetria de um MAC não mapeado. Você deve ir no seu painel de controle (Vue.js / Banco Supabase), acessar os Geradores e adicionar a nova unidade exatamente com o MAC Address que apareceu na tela do Serial Monitor (Ex: `A0:20:A6...`).

### Placa Isolada no Portal de Configuração

**Sintoma:** O gerador está sem acesso no painel e apareceu uma nova rede Wi-Fi visível chamada `SmartGen_Config`.
**Resolução Local:**
O equipamento perdeu contato de longo prazo com todas as redes cadastradas (ex: mudança física do gerador, ou troca de provedor local). Conecte seu celular à rede `SmartGen_Config`. Abrirá um navegador na tela. Insira a nova senha de internet local no formulário. A placa gravará as redes na memória de estado e resetará para operação normal instantaneamente.
