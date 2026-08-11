
class LaserTrigger{

  const int LASER_TRIGGER_PIN = 13; // D7 - relay IN, wired in parallel with the laser's physical button
  bool firing = false;

  public:
  LaserTrigger(){
  }

  void setup(){
    pinMode(this->LASER_TRIGGER_PIN, OUTPUT);
    this->set(false);
  }

  void set(bool on){
    this->firing = on;
    digitalWrite(this->LASER_TRIGGER_PIN, on ? HIGH : LOW);
  }

  bool isFiring(){
    return this->firing;
  }

};

LaserTrigger laserTrigger;
