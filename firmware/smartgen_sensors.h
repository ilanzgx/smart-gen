#pragma once

#include <OneWire.h>
#include <DallasTemperature.h>

class SmartGenSensors {
public:
  SmartGenSensors(int oneWirePin);
  void init();
  float getTemperature();
private:
  int _oneWirePin;
  OneWire _oneWire;
  DallasTemperature _sensors;
};