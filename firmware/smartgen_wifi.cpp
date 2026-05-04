#include "smartgen_credentials.h"
#include "smartgen_wifi.h"
#include <WiFiManager.h>

SmartGenWifi::SmartGenWifi() {}

/**
 * @brief Tenta conectar ao WiFi de forma inteligente.
 *
 *  1. Tenta conectar nas redes salvas (definidas em smartgen_credentials.h).
 *  2. Se não conseguir, abre um access point WiFi para configuração manual.
 *  3. Se não conseguir conectar no access point, reinicia a placa.
 *
 * @return void
 */
void SmartGenWifi::connect() {
  wifiMulti.addAP(WIFI_SSID_1, WIFI_PASS_1);
  wifiMulti.addAP(WIFI_SSID_2, WIFI_PASS_2);

  Serial.print("Testando redes conhecidas.\n");
  int attempts = 0;
  while(wifiMulti.run() != WL_CONNECTED && attempts < 10) {
    delay(300);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi conectado (Através das redes pré-cadastradas)!\n");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    return;
  }

  Serial.println("\nNenhuma rede conhecida. Abrindo access point para configuração manual...");
  WiFiManager wm;

  if (!wm.autoConnect("SmartGen_Config")) {
    Serial.println("Falha na conexão do access point. Reiniciando placa...");
    delay(3000);
    ESP.restart();
  }

  Serial.println("\nWiFi conectado (Através do WiFiManager)!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

/**
 * @brief Verifica se o WiFi está conectado.
 *
 * @return true Se o WiFi estiver conectado.
 * @return false Se o WiFi não estiver conectado.
 */
bool SmartGenWifi::isConnected() {
  return WiFi.status() == WL_CONNECTED;
}

/**
 * @brief Tenta reconectar ao WiFi.
 *  1. Tenta reconectar ao WiFi.
 *  2. Se não conseguir, reinicia a placa.
 *
 * @return void
 */
void SmartGenWifi::reconnect() {
  Serial.println("Tentando reconectar Wifi...");
  WiFi.reconnect();

  delay(3000);

  if(!isConnected()) {
    Serial.println("Falha na reconexão do Wifi. Reiniciando placa...");
    ESP.restart();
  }
}
