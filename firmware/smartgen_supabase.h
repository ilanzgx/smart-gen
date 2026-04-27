#pragma once

class SmartGenSupabase {
  public:
    SmartGenSupabase(const char* url, const char* key);
    void init();
    int sendReading(const char* id, float temperature, float water);
  private:
    const char* _url;
    const char* _key;
};