#include "smartgen_supabase.h"
#include <HTTPClient.h>

/**
 * @brief Construtor da classe SmartGenSupabase.
 *
 * @param url - A URL do Supabase.
 * @param key - A chave do Supabase.
 */
SmartGenSupabase::SmartGenSupabase(const char* url, const char* key) : _url(url), _key(key) {}

void SmartGenSupabase::init() {}

/**
 * @brief Envia uma leitura para o Supabase.
 *
 * @param id - O endereço MAC da placa.
 * @param temperature - A temperatura atual.
 * @param water - O nível da água.
 * @return int - O código HTTP da resposta.
 */
int SmartGenSupabase::sendReading(const char* id, float temperature, float water) {
  HTTPClient http;

  http.begin(_url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", _key);
  http.addHeader("Authorization", String("Bearer ") + _key);

  String payload = "";

  // Reserva espaço na memória previamente para evitar fragmentação/alocação dinâmica de memória
  payload.reserve(128);

  payload += "{";
  payload += "\"p_mac_address\":\"" + String(id) + "\",";
  payload += "\"p_temperatura\":" + String(temperature) + ",";
  payload += "\"p_nivel_agua\":" + String(water);
  payload += "}";

  int httpCode = http.POST(payload);

  if(httpCode <= 0) {
    Serial.printf("HTTP POST error: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
  return httpCode;
}