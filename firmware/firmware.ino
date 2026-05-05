#include "smartgen_credentials.h"
#include "smartgen_wifi.h"
#include "smartgen_supabase.h"
#include "smartgen_sensors.h"

#include <WiFi.h>

#define BAUD                 (115200)
#define SECONDS(s)           ((s) * 1000UL)
#define MINUTES(m)           ((m) * 60000UL)

#define ONE_WIRE_BUS         (5)
#define TRIGGER_PIN          (25)
#define ECHO_PIN             (35)

SmartGenWifi smartGenWifi;
SmartGenSupabase smartGenSupabase(supabaseUrl, supabaseKey);
SmartGenSensors smartGenSensors(ONE_WIRE_BUS, TRIGGER_PIN, ECHO_PIN);

unsigned long lastTime = 0;
const unsigned long timerDelay = MINUTES(5);

void setup() {
  Serial.begin(BAUD);
  smartGenWifi.connect();
  smartGenSensors.init();

  send();
}

void loop() {
  if((millis() - lastTime) > timerDelay) {
    lastTime = millis();

    if(!smartGenWifi.isConnected()) {
      Serial.println("Sem WiFi. Acontecera uma tentativa de reconexao");
      smartGenWifi.reconnect();
      return;
    }

    send();
  }
}

void send() {
  float temperature = smartGenSensors.getTemperature();
  if (temperature <= -120.0) {
    Serial.println("Leitura de temperatura inválida, ignorando...");
    return;
  }

  float water = smartGenSensors.getWaterLevel();

  int statusCode = smartGenSupabase.sendReading(WiFi.macAddress().c_str(), temperature, water);
  switch(statusCode) {
    case 200:
    case 201:
    case 204:
      Serial.println("Leitura enviada com sucesso!");
      break;
    case 404:
      Serial.println("Falha! Placa não cadastrada ou URL errada (404).");
      break;
    case 500:
      Serial.println("Falha ao enviar leitura! Erro interno do servidor (500)!");
      break;
    case -1:
      Serial.println("Falha ao enviar leitura! Erro na conexão WiFi!");
      break;
    default:
      Serial.printf("Falha ao enviar leitura! Status code: %d\n", statusCode);
      break;
  }
}