#pragma once

#include <OneWire.h>
#include <DallasTemperature.h>

class SmartGenSensors {
public:
  SmartGenSensors(int oneWirePin, int triggerPin, int echoPin);
  void init();
  float getTemperature();
  float getWaterLevel();
private:
  int _oneWirePin;
  int _triggerPin;
  int _echoPin;

  OneWire _oneWire;
  DallasTemperature _sensors;
};