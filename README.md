# Laser Gun - ESP driver

This is the driver of ESP8266 for the Laser Gun project, a remix of
[Remotely controlled torch robot](http://www.thingiverse.com/thing:1598813) by JJRobots.
It is an automatic/remote controlled toy to let you (or your cat) play with a laser pointer.
An ESP8266 drives the pan/tilt servo motors and a laser relay, and serves its own mobile web
control pad (see [Web control pad](#web-control-pad) below) — no companion app or separate
server needed. A RTC can also be used to schedule automatic events.


## Running on ESP NodeMCU

To programm the ESP, use the [Arduino IDE](https://www.arduino.cc/en/Main/Software), then follow this step :

* Go on **File** > **Preferences**, and change the URL of Board Manager with "http://arduino.esp8266.com/package_esp8266com_index.json", then click OK
* Now go on **Tools** > **Board:Arduino one** > **Board Managers**
* Search For "esp8266" and Click Install ( it will take a while )
* After installation go back on **Tools** > **Board:Arduino one** and click on **"NodeMCU 0.9 (ESP-12E Module)"**
* Install the extra libraries needed by the sketch, via **Sketch** > **Include Library** > **Manage Libraries**: `ArduinoJson` (v5.x), `WiFiManager` (tzapu), `PubSubClient`, `RtcDS3231`, and [`WebSockets`](https://github.com/Links2004/arduinoWebSockets) (Links2004) — used by the web control pad
* Now you can connect it and lunch the Load process


## Build Hardware
The hardware part is made by :

* x1 [ESP8266 NodeMCU](https://www.amazon.it/NodeMCU-Internet-delle-ESP8266-scheda-sviluppo/dp/B019PVI4IY)
* x2 [Servo motor 9g](https://www.amazon.it/MINI-MICRO-SERVO-AEREI-ELICOTTERI/dp/B00CHJUG3I)
* x1 [RTC](https://www.amazon.it/WINGONEER-piccolo-AT24C32-precisione-orologio/dp/B01H5NAFUY)

I used an RTC, to have a real timinig and schedule the event, but you can also use a Virtual RTC to simulate the timer
( obviously it will not be precise like RTC but you can every day sync with a remote server and it will be enough ).

[Here the class  I wrote](https://raw.githubusercontent.com/tommy-codex/laser-gun-IoT/master/example/VirtualRTC.ino) and here how to use it :
```
void setup(){
  //String TimeNow = YourCustomTimeService.getStringTime(); // this in case you have a service that provide this string date format dd/mm/yyyy HH:mm:ss
  String TimeNow = "dd/mm/yyyy HH:mm:ss";
  String d =  TimeNow.substring(0,2);
  String h =  TimeNow.substring(3,5);
  String m =  TimeNow.substring(6,8);
  String s =  TimeNow.substring(9,11);
  rtc_timer = Rtc();
  rtc_timer.setup(d.toInt(), h.toInt(),m.toInt(),s.toInt());
}
void loop() {
  rtc_timer.loopTime();
  int seconds = rtc_timer.getSeconds();
  int minutes = rtc_timer.getMinutes();
  int hours = rtc_timer.getHours();
  int days = rtc_timer.getDays();
  // here you will use it
}
```

I removed the soldered pins just to save space, but I think you can do it without desoldering, just force a little bit.
Use this ( I not if is ugly I'm not a painter :D ) datasheet to build the hardware, I just make a simple list of connection points:
##### Servo X
* GND  -> GND
* Vcc  -> Vcc ( +5 )
* Sign -> D6

##### Servo Y
* GND  -> GND
* Vcc  -> Vcc ( +5 )
* Sign -> D5

##### RTC
* GND  -> GND
* Vcc  -> Vcc ( +3 )
* SDA -> D2
* SCL -> D1

##### Laser relay
Not on the original datasheet below — this is the new addition needed for remote firing. Use a
digital relay module (opto-isolated, 5V-logic-compatible), wire its coil side to the ESP and its
NO (normally-open) contacts in parallel with the laser pointer's own physical push-button, so that
closing the relay is the same as a finger pressing the button.
* GND -> GND
* Vcc -> Vcc ( +5 )
* IN  -> D7
* COM/NO contacts -> in parallel with the laser pointer's push-button terminals

##### Battery
(do not plug microUSB and connect battery simultaneously, I didn't try but I suggest to do not try)

* Positive -> Vcc ( +5 )
* Negative -> GND

##### Here the datasheet
![alt tag](https://raw.githubusercontent.com/tommy-codex/laser-gun-IoT/master/build-datasheet.jpeg)

(this hand-drawn schematic predates the laser relay described above — the relay is a straightforward
addition on the free D7 pin, wired as described in the "Laser relay" section)

##### Here my result
![alt tag](https://raw.githubusercontent.com/tommy-codex/laser-gun-IoT/master/build-result.jpeg)


Then put all in the base case, use 2/3 mm screws ( I'm not sure ) to fix the ESP to the base, and that's it, program it and enjoy it.


## Web control pad

The ESP serves its own mobile control pad, no app or extra server needed:

1. Flash the `Laser_Gun` sketch as described above (make sure the `WebSockets` library is installed).
2. Upload the `WebUI/data` folder to the ESP's SPIFFS filesystem, using the Arduino IDE
   ["Sketch Data Upload"](https://github.com/esp8266/arduino-esp8266fs-plugin) tool (point it at the
   `Laser_Gun` sketch folder — the plugin looks for a sibling `data/` folder, so either use the
   `WebUI/data` folder directly as your sketch data folder or copy it into `Laser_Gun/data`).
3. Power on the gun and join the same WiFi network configured via WiFiManager (or its fallback
   `LaserGUN-Enrico` access point if it hasn't been configured yet).
4. On your phone, open `http://<esp-ip-address>/` in a browser.
5. The pad opens in **Demo** mode by default (safe, no hardware involved) — a virtual robot on
   screen reacts to the two sticks. Switch to **Hardware** mode to connect over WebSocket and
   drive the real servos and laser relay:
   * Right stick — aim: it's a **rate/speed control**, not a position control. Deflecting the
     stick moves the pan/tilt servos and keeps moving them for as long as it's held (releasing it
     stops the motion right where it is, it does not recenter). Both servos are plain SG90s, so
     travel is clamped to a safe 10°-170° range well inside their 180° mechanical limit, to avoid
     stalling the gears against the end-stop.
   * Left stick — hold to fire the laser relay, release to stop

The same page can also be opened straight from `WebUI/data/index.html` (e.g. via a local static
server) to preview/tweak the Demo mode without any ESP connected at all.
