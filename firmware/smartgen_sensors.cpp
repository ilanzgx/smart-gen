#include "smartgen_sensors.h"

SmartGenSensors::SmartGenSensors(int oneWirePin) : _oneWirePin(oneWirePin), _oneWire(oneWirePin), _sensors(&_oneWire) {}

void SmartGenSensors::init() 
{
  _sensors.begin();
}

float SmartGenSensors::getTemperature()
{
  _sensors.requestTemperatures();
  return _sensors.getTempCByIndex(0);
}