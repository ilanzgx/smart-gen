#include "smartgen_wifi.h"
#include "smartgen_credentials.h"
#include <HTTPClient.h>

SmartGenWifi smartGenWifi;

void setup() {
  Serial.begin(115200);
  
  smartGenWifi.connect();

  HTTPClient http;
  http.begin(supabaseUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseKey);

  String body = R"({
    "gerador_id": "22222222-2222-2222-2222-222222222222",
    "temperatura": 23,
    "nivel_agua": 55
  })";

  int httpCode = http.POST(body);
  Serial.print("Status HTTP: ");
  Serial.println(httpCode);

  String response = http.getString();
  Serial.println(response);
  http.end();
}

void loop() {
  Serial.println("ESP32 OK - Funcionando!");
  delay(1000);
}