# 🔌 Smart-Gen — Firmware

Núcleo de hardware de IoT (Internet of Things) do **Smart-Gen**. Este pacote contém o código C++ nativo para microcontroladores **ESP32**, sendo responsável por realizar a leitura dos parâmetros físicos (sensores) do gerador e publicar a telemetria via HTTP REST de forma segura diretamente para a nuvem do Supabase.

---

## 🏛️ Arquitetura do Firmware (Hardware Abstraction Layer)

Mantendo a filosofia modular do restante do monorepo, o firmware não é um aglomerado de código num arquivo só. Ele é dividido em classes com responsabilidades singulares para garantir estabilidade de conexão, segurança de chaves e fácil debug:

### Estrutura de Arquivos

```text
firmware/
├── smartgen_wifi.h           # Header da abstração de conectividade
├── smartgen_wifi.cpp         # Implementação de Wi-Fi e Captive Portal
├── smartgen_supabase.h       # Header da camada de dados da API
├── smartgen_supabase.cpp     # Implementação de POSTs e Headers Seguros
├── smartgen_credentials.h    # Segredos (Ignorado pelo Git)
└── firmware.ino              # Orquestrador principal (Setup & Loop)
```

### O que cada módulo faz?

| Módulo                     | Responsabilidade                                                                                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`smartgen_wifi`**        | **Conectividade.** Gerencia a conexão. Usa a biblioteca `WiFiManager` para criar um portal (Captive Portal), evitando que as senhas de Wi-Fi dos clientes precisem ser inseridas diretamente no código (`hardcoded`) da placa. |
| **`smartgen_supabase`**    | **Camada de Dados.** Envelopa os dados em formato JSON, gerencia os cabeçalhos de segurança (`Authorization` / `apikey`) e se comunica com o endpoint `/rest/v1/...` do Supabase via `HTTPClient`.                             |
| **`smartgen_credentials`** | **Gestão de Segredos.** Contém a `supabaseUrl` e a `supabaseKey`. Trata-se de um arquivo local, protegido globalmente no repositório.                                                                                          |
| **`firmware.ino`**         | **Motor de Eventos.** Determina a velocidade (timing) com que os sensores físicos são lidos no loop principal e dispara as ações pros outros módulos.                                                                          |

---

## 🔒 Segurança

A segurança de IoT é crítica no Smart-Gen. Nunca comitar credenciais em arquivos rastreados é uma regra rígida de arquitetura:

1. **Gestão de Wi-Fi Dinâmica:** Senhas e endereços SSID não pertencem ao código C++. Se a placa for ligada em um novo ambiente ou a rede cair, ela abrirá sozinha uma Rede Wi-Fi chamada `SmartGen_Config`. O operador conectará seu celular ali e digitara a senha local em uma página web provida pela própria placa.
2. **Chaves de API do Supabase:** Precisam obrigatoriamente residir em `smartgen_credentials.h`. Em caso de clone do repositório, o desenvolvedor deve criar esse arquivo manualmente na sua máquina.

---

## 🚀 Como Compilar e Rodar o Firmware

Seja utilizando a **Arduino IDE** clássica ou a extensão **PlatformIO** no VS Code, preencha os pré-requisitos abaixo:

### 1. Criar o Arquivo de Credenciais

Na raiz de `firmware/`, crie o arquivo `smartgen_credentials.h` com o seguinte formato:

```cpp
#ifndef SMARTGEN_CREDENTIALS_H
#define SMARTGEN_CREDENTIALS_H

const char* supabaseUrl = "https://SEU-PROJETO.supabase.co/rest/v1/registro";
const char* supabaseKey = "SUA_CHAVE_PUBLICA_ANONIMA";

#endif
```

### 2. Baixar Dependências

Você precisará ter as seguintes bibliotecas C++ instaladas no gerenciador do seu ambiente:

- `WiFiManager` (por _tzapu_) — Responsável pela interface AP de Wi-Fi dinâmico.
- `HTTPClient` — (Nativa nas bibliotecas Board do ESP32).

### 3. Configurações da Placa de Desenvolvimento

Ao plugar a placa no seu cabo USB, garanta que os parâmetros de Build da IDE estejam assim:

- **Board:** `ESP32 Dev Module` (ou semelhante, baseado na WROOM32).
- **Flash Frequency:** `80MHz`.
- **Upload Speed:** `921600`.

### 4. Flashing e Primeiro Boot

Após compilar (Upload/Flash):

1. Abra o **Serial Monitor** (Velocidade do BAUD rate: `115200`).
2. Se for uma placa virgem sem rede gravada na memória, o monitor avisará que subiu o Access Point.
3. Conecte seu dispositivo na rede `SmartGen_Config`, digite a senha oficial do Wi-Fi ali e observe ele disparar o Payload final na tela.

---

## 📊 Formato de Telemetria

Os dados físicos coletados pela placa C++ chegam à nossa API do Supabase transformados rigorosamente no seguinte formato JSON, pronto para alimentar o Dashboard da aplicação web e mobile:

```json
{
  "gerador_id": "uuid-do-gerador",
  "temperatura": 18.5,
  "nivel_agua": 37.2
}
```
