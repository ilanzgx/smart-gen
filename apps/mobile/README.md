# 📱 Smart Gen — Mobile

Este pacote é um **Thin Wrapper** (Envoltório Fino) utilizando [Capacitor](https://capacitorjs.com/). Ele transforma o build da aplicação web (`apps/website`) em um aplicativo nativo para Android e iOS sem duplicar lógica ou componentes.

---

## 🏗️ Estratégia

O projeto mobile **não possui código-fonte de UI próprio**. Ele aponta diretamente para a pasta `dist` do projeto vizinho (`apps/website`).

- **Vantagem:** 100% de reuso do site responsivo e de toda a base de código.
- **Desacoplamento:** As pastas nativas (`android/`, `ios/`) ficam isoladas neste workspace, mantendo a arquitetura web principal limpa.

---

## 📂 Estrutura de Pastas

```text
android/             # Projeto nativo Android (Android Studio / Gradle)
ios/                 # Projeto nativo iOS (Xcode / Swift)
capacitor.config.ts  # Configurações globais do wrapper Capacitor
package.json         # Dependências nativas (Plugins Capacitor)
```

---

## 🔄 Fluxo de Desenvolvimento

Sempre que alterar algo no frontend e quiser testar no dispositivo móvel, as alterações precisam fluir da web para o mobile:

### Maneira Rápida (Atalho Raiz)

Na raiz do monorepo, basta rodar o atalho que compila o site e sincroniza com o mobile automaticamente:

```bash
pnpm build:web-mobile
```

### Passo a Passo Manual

Caso precise executar os passos separadamente (na raiz do monorepo):

1. **Gerar Build do Website:** `pnpm --filter @smart-gen/website build`
2. **Sincronizar:** `pnpm --filter @smart-gen/mobile sync`

---

## ⚙️ Comandos Nativos

| Comando (na raiz do monorepo)                  | O que faz                                                             |
| ---------------------------------------------- | --------------------------------------------------------------------- |
| `pnpm build:web-mobile`                        | **[Atalho]** Faz o build web e já sincroniza a pasta nativa do mobile |
| `pnpm --filter @smart-gen/mobile sync`         | Copia a build web para o App nativo e sincroniza os plugins Capacitor |
| `pnpm --filter @smart-gen/mobile open:android` | Abre o projeto Android no **Android Studio**                          |
| `pnpm --filter @smart-gen/mobile open:ios`     | Abre o projeto iOS no **Xcode** (apenas macOS)                        |
| `pnpm --filter @smart-gen/mobile build:apk`    | Gera o APK em modo Debug via script local (se configurado)            |

---

## 📦 Geração do Arquivo (.apk)

Para gerar o arquivo `.apk` para envio e testes diretamente no celular (sem passar pela Play Store):

**Pelo Terminal (Terminal Gradle):**

```bash
# Entre na pasta Android e execute:
cd apps/mobile/android
.\gradlew assembleDebug
```

📌 _O arquivo ficará disponível em: `android/app/build/outputs/apk/debug/app-debug.apk`_

> 💡 **Dica (Melhor Caminho):** Você também pode gerar facilmente rodando o comando visual pelo **Android Studio**. Basta abrir o app, ignorar a linha de comando e acessar na barra superior: `Build > Build Bundle(s) / APK(s) > Build APK(s)`.

---

## 🤝 Requisitos e Observações Técnicas

### 1. Requisitos de Ambiente

Para compilação local (build) das aplicações nativas na sua máquina:

- **Node.js:** v20+.
- **Java:** JDK 21 (obrigatório para compilar via Gradle no Android).
- **Android SDK:** Versão 34+.

### 2. Comportamento do Teclado (Mobile)

Para evitar que o layout (`h-screen`) de telas de Login e Cadastro quebre ou o conteúdo seja empurrado para o topo indevidamente quando o teclado do dispositivo abre, este projeto utiliza as seguintes intercepções técnicas:

- **Android Manifest Native:** `android:windowSoftInputMode="adjustPan"`
- **Capacitor Config:** `resize: KeyboardResize.Native` e `resizeOnFullScreen: true`

### 3. Versão do Android Gradle Plugin (AGP)

O projeto foi fixado para usar **AGP 8.12.0** a fim de parear a compatibilidade exata com as versões estáveis recentes do Android Studio. Evite atualizar para `8.13.0+` a menos que seu ambiente local de JDK/SDK comporte.
