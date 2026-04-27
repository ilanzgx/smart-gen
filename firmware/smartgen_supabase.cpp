#include "smartgen_supabase.h"
#include <HTTPClient.h>

SmartGenSupabase::SmartGenSupabase(const char* url, const char* key) : _url(url), _key(key) {}

void SmartGenSupabase::init() {}

int SmartGenSupabase::sendReading(const char* id, float temperature, float water) {
  HTTPClient http;

  http.begin(_url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", _key);
  http.addHeader("Authorization", String("Bearer ") + _key);

  String payload = "{";
  payload += "\"gerador_id\":\"" + String(id) + "\",";
  payload += "\"temperatura\":" + String(temperature) + ",";
  payload += "\"nivel_agua\":" + String(water);
  payload += "}";

  int httpCode = http.POST(payload);

  if(httpCode <= 0) {
    Serial.printf("Erro POST: %s\n", http.errorToString(httpCode).c_str());
  }
  
  http.end();
  return httpCode;
}