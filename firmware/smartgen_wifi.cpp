#include "smartgen_wifi.h"
#include <WiFiManager.h>

SmartGenWifi::SmartGenWifi() {}

void SmartGenWifi::connect() {
  WiFiManager wm;

  if (!wm.autoConnect("SmartGen_Config")) {
    Serial.println("Falha na conexão. Resetando...");
    delay(3000);
    ESP.restart();
  }

  Serial.println("\nWiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

bool SmartGenWifi::isConnected() {
  return WiFi.status() == WL_CONNECTED;
}

void SmartGenWifi::reconnect() {
  Serial.println("Tentando reconectar Wifi...");
  WiFi.reconnect();

  delay(5000);

  if(!isConnected()) {
    Serial.println("Falha na reconexão do Wifi. Reiniciando placa...");
    ESP.restart();
  }
}