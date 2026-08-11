
#include <Servo.h>

#include <FS.h>                   //this needs to be first, or it all crashes and burns...

#include <ArduinoJson.h>  

#include <ESP8266WiFi.h>          //https://github.com/esp8266/Arduino

//needed for library
#include <DNSServer.h>
#include <ESP8266WebServer.h>
#include <WiFiManager.h>          //https://github.com/tzapu/WiFiManager
#include <Wire.h>               //I2C library
#include <RtcDS3231.h>    //RTC library
#include <PubSubClient.h>
#include <WebSocketsServer.h>   //https://github.com/Links2004/arduinoWebSockets - web control pad
   
