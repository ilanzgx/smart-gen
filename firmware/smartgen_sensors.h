#pragma once

#include <OneWire.h>
#include <DallasTemperature.h>

class SmartGenSensors {
public:
  SmartGenSensors(int oneWirePin, int triggerPin, int echoPin, float emptyDistanceCm, float fullDistanceCm);
  void init();
  float getTemperature();
  float getWaterLevel();
private:
  int _oneWirePin;
  int _triggerPin;
  int _echoPin;

  float _emptyDistanceCm;
  float _fullDistanceCm;

  OneWire _oneWire;
  DallasTemperature _sensors;
};
