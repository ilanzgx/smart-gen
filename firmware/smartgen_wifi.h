#pragma once
#include <WiFi.h>

class SmartGenWifi {
public:
  SmartGenWifi();
  void connect();
  void reconnect();
  bool isConnected();
};