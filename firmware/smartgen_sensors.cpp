#include "smartgen_sensors.h"

/**
 * @brief Construtor da classe SmartGenSensors.
 *
 * @param oneWirePin - Pino digital onde o sensor DS18B20 está conectado.
 * @param triggerPin - Pino do trigger
 * @param echoPin - Pino do echo (entrada)
 */
SmartGenSensors::SmartGenSensors(int oneWirePin, int triggerPin, int echoPin)
  : _oneWirePin(oneWirePin),
    _triggerPin(triggerPin),
    _echoPin(echoPin),
    _oneWire(oneWirePin),
    _sensors(&_oneWire) {}

/**
 * @brief Inicializa os sensores de temperatura DS18B20.
 *
 * @note O sensor DS18B20 precisa de um tempo para fazer a leitura inicial. Para evitar leituras residuais
 * @return void
 */
void SmartGenSensors::init()
{
  _sensors.begin();

  // Inicializar o sensor ultrassonico
  pinMode(_triggerPin, OUTPUT);
  pinMode(_echoPin, INPUT);

  // Inicializar o sensor de temperatura
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

float SmartGenSensors::getWaterLevel()
{
  digitalWrite(_triggerPin, LOW);
  delayMicroseconds(2);

  digitalWrite(_triggerPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(_triggerPin, LOW);

  long duration = pulseIn(_echoPin, HIGH);

  float distanceCm = duration * 0.0343 / 2.0;

  return distanceCm;
}