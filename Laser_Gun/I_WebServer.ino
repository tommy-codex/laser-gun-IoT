
ESP8266WebServer webServer(80);
WebSocketsServer webSocket(81);

class LaserWebServer{

  public:

  // Expected payloads from the control pad:
  //  {"x":0.42,"y":-0.87}  -> right joystick, aim (normalized -1..1)
  //  {"fire":true|false}   -> left trigger, laser relay
  static void onWebSocketEvent(uint8_t clientId, WStype_t type, uint8_t * payload, size_t length){
    switch(type){
      case WStype_CONNECTED:
        SerialComunication::info("LaserWebServer", "onWebSocketEvent", "Client connected");
        break;

      case WStype_DISCONNECTED:
        SerialComunication::info("LaserWebServer", "onWebSocketEvent", "Client disconnected");
        laserTrigger.set(false);
        break;

      case WStype_TEXT: {
        StaticJsonBuffer<200> jsonBuffer;
        JsonObject& json = jsonBuffer.parseObject((char*)payload);
        if(!json.success()){
          SerialComunication::error("LaserWebServer", "onWebSocketEvent", "Invalid JSON payload");
          break;
        }
        if(json.containsKey("x") && json.containsKey("y")){
          laserController.handleJoystick(json["x"], json["y"]);
        }
        if(json.containsKey("fire")){
          laserTrigger.set(json["fire"]);
        }
        break;
      }

      default:
        break;
    }
  }

  static void setup(){
    if(!SPIFFS.begin()){
      SerialComunication::error("LaserWebServer", "setup", "Failed to mount SPIFFS");
    }
    webServer.serveStatic("/", SPIFFS, "/");
    webServer.begin();

    webSocket.begin();
    webSocket.onEvent(LaserWebServer::onWebSocketEvent);

    SerialComunication::info("LaserWebServer", "setup", "HTTP server on :80, WebSocket on :81");
  }

  static void loop(){
    webServer.handleClient();
    webSocket.loop();
  }
};
