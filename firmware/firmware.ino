#include "smartgen_wifi.h"
#include "smartgen_credentials.h"
#include "smartgen_supabase.h"

SmartGenWifi smartGenWifi;
SmartGenSupabase smartGenSupabase(supabaseUrl, supabaseKey);

#define BAUD                 (115200)
#define SECONDS(s)           ((s) * 1000UL)
#define MINUTES(m)           ((m) * 60000UL)

unsigned long lastTime = 0;
const unsigned long timerDelay = MINUTES(10);

void setup() {
  Serial.begin(BAUD);
  smartGenWifi.connect();
}

void loop() {
  if((millis() - lastTime) > timerDelay) {
    lastTime = millis();

    if(!smartGenWifi.isConnected()) {
      Serial.println("Sem WiFi. Tentando reconectar...");
      smartGenWifi.connect();
      return;
    }

    // mock sensors values
    float temperature = 18.5;
    float water = 37.2;

    int statusCode = smartGenSupabase.sendReading("22222222-2222-2222-2222-222222222222", temperature, water);
    Serial.printf("\nDados enviados! Status code: %d", statusCode);
  }
}