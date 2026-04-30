#include "smartgen_sensors.h"

/**
 * @brief Construtor da classe SmartGenSensors.
 *
 * @param oneWirePin - Pino digital onde o sensor DS18B20 está conectado.
 */
SmartGenSensors::SmartGenSensors(int oneWirePin) : _oneWirePin(oneWirePin), _oneWire(oneWirePin), _sensors(&_oneWire) {}

/**
 * @brief Inicializa os sensores de temperatura DS18B20.
 *
 * @note O sensor DS18B20 precisa de um tempo para fazer a leitura inicial. Para evitar leituras residuais
 * @return void
 */
void SmartGenSensors::init()
{
  _sensors.begin();

  _sensors.requestTemperatures();
  delay(750);
}

/**
 * @brief Lê a temperatura atual do sensor de temperatura (DS18B20).
 *
 * @return float - A temperatura atual em graus Celsius.
 */
float SmartGenSensors::getTemperature()
{
  _sensors.requestTemperatures();
  return _sensors.getTempCByIndex(0);
}