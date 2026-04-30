#pragma once
#include <WiFi.h>
#include <WiFiMulti.h>

class SmartGenWifi {
private:
  WiFiMulti wifiMulti;
public:
  SmartGenWifi();
  void connect();
  void reconnect();
  bool isConnected();
};