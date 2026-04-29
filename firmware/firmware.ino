#include "smartgen_wifi.h"
#include "smartgen_credentials.h"
#include "smartgen_supabase.h"
#include "smartgen_sensors.h"

#define BAUD                 (115200)
#define SECONDS(s)           ((s) * 1000UL)
#define MINUTES(m)           ((m) * 60000UL)

#define ONE_WIRE_BUS         (5)

SmartGenWifi smartGenWifi;
SmartGenSupabase smartGenSupabase(supabaseUrl, supabaseKey);
SmartGenSensors smartGenSensors(ONE_WIRE_BUS);

unsigned long lastTime = 0;
const unsigned long timerDelay = MINUTES(10);

void setup() {
  Serial.begin(BAUD);
  smartGenWifi.connect();
  smartGenSensors.init();
}

void loop() {
  if((millis() - lastTime) > timerDelay) {
    lastTime = millis();

    if(!smartGenWifi.isConnected()) {
      Serial.println("Sem WiFi. Tentando reconectar...");
      smartGenWifi.connect();
      return;
    }

    float temperature = smartGenSensors.getTemperature();
    if (temperature <= -120.0) {
      Serial.println("Leitura de temperatura inválida, ignorando...");
      return;
    }

    float water = 37.2; // mock

    int statusCode = smartGenSupabase.sendReading("22222222-2222-2222-2222-222222222222", temperature, water);
    switch(statusCode) {
      case 201:
        Serial.println("Leitura enviada com sucesso!");
        break;
      case 500:
        Serial.println("Falha ao enviar leitura! Erro no servidor!");
        break;
      case -1:
        Serial.println("Falha ao enviar leitura! Erro na conexão WiFi!");
        break;
      default:
        Serial.printf("Falha ao enviar leitura! Status code: %d\n", statusCode);
        break;
    }
  }
}