
Servo laserServoX;  
Servo laserServoY;  

class ServoLaserMotor{

  const double realLimitXY = 180;
  //I'm gona set a virtual center, to calculate the limit from this to positive and negative range
  double laserCenterX = 90;
  double laserCenterY = 90;
  // this is user to limit the range of motor to a specific margin
  double rangeX = 30;
  double rangeY = 30;
  //current virtual laser position
  double laserX, laserY;
  //current real servo motor grade position
  double servoX = 90, servoY = 90;
  int LASER_X_PIN = 10;
  int LASER_Y_PIN = 9;

  // Both axes are plain SG90 servos: 0-180 deg is the datasheet range, but
  // driving all the way to the mechanical end-stop stalls/strains the gears,
  // so the usable range is kept a safety margin inside it.
  const double servoMinDeg = 10;
  const double servoMaxDeg = 170;
  const double servoCenterDeg = 90;
  // deg/sec of servo travel at full joystick deflection
  const double maxSpeedDegPerSec = 120;

public:
  ServoLaserMotor(){

  }

  // Writes both servos to their safe center position - call once at boot,
  // before the servos are driven by anything else.
  void setup(){
    this->servoX = this->servoCenterDeg;
    this->servoY = this->servoCenterDeg;
    laserServoX.write(this->servoX);
    laserServoY.write(this->servoY);
  }

  // Rate control: nx/ny (-1..1, joystick deflection) drive the servos at a
  // speed proportional to the deflection, for as long as it is held, instead
  // of jumping to an absolute position - this is what lets the aim keep
  // moving while the stick stays pushed. dtSeconds is the time since the
  // last call, used to integrate deflection into degrees moved.
  void updateJoystick(float nx, float ny, float dtSeconds){
    this->servoX = constrain(this->servoX + nx * this->maxSpeedDegPerSec * dtSeconds, this->servoMinDeg, this->servoMaxDeg);
    this->servoY = constrain(this->servoY + ny * this->maxSpeedDegPerSec * dtSeconds, this->servoMinDeg, this->servoMaxDeg);
    laserServoX.write(this->servoX);
    laserServoY.write(this->servoY);
  }
  void setCenter(double newCenterX, double newCenterY){
    if(newCenterX+this->rangeX <= this->realLimitXY &&
        newCenterY+this->rangeY <= this->realLimitXY)
      {
        this->laserCenterX = newCenterX;
        this->laserCenterY = newCenterY;
        this->goTo(newCenterX, newCenterY);
     }else{
      SerialComunication::error("ServoLaserMotor", "setCenter", "New center move range out of phisic limits.");  
    }
  }
  void setRangeX(double newRangeX){
    if(this->laserCenterX+newRangeX <= this->realLimitXY)
    {
      this->rangeX = newRangeX;
    }else{
      SerialComunication::error("ServoLaserMotor", "setRangeX", "New range out of phisic limits.");  
    }
  }
  
  void setRangeY(double newRangeY){
    if(this->laserCenterY+newRangeY <= this->realLimitXY)
    {
      this->rangeY = newRangeY;
    }else{
      SerialComunication::error("ServoLaserMotor", "setRangeY", "New range out of phisic limits.");  
    }
  }
  void parseUDPMessage(String message ) {
    /**
     * Here the possible message  :
     *  r/X/Y             - Resettin Center 
     *  g/X/Y              - Goingto coordinate ( Accept  value from CenterX/Y-RangeX/Y to CenterX/Y+RangeX/Y
     *  l/RangeX/RangeY   - Limitin Virtual range
     */
     
    char action = message.charAt(0);
    String params = message.substring(message.indexOf('/')+1, message.length());
    SerialComunication::info("ServoLaserMotor", "parseUDPMessage", "ParsedUDPMessage, action :");  
    SerialComunication::info("ServoLaserMotor", "parseUDPMessage", String(action));  
    SerialComunication::info("ServoLaserMotor", "parseUDPMessage", "ParsedUDPMessage, params :");  
    SerialComunication::info("ServoLaserMotor", "parseUDPMessage", params);  
    float X = params.substring(0, params.indexOf('/')).toFloat();;
    float Y = params.substring(params.indexOf('/')+1, params.length()).toFloat();;
      switch(action){
        case 'g' : {
            Serial.print("Going to - X:");
            Serial.print(X);
            Serial.print(" Y : ");
            Serial.println(Y);
            this->goTo(X,Y);
            delay(50);
          break;
        }
      }
  }
  void goTo(double X, double Y){

      // Calculate the Real Limit of points
      double minLimitX = this->laserCenterX-this->rangeX;
      double maxLimitX = this->laserCenterX+this->rangeX;
      double minLimitY = this->laserCenterY-this->rangeY;
      double maxLimitY = this->laserCenterY+this->rangeY;

      // transform from Virtual Point coordinate ( with axis's 0 in middle of screen) to Real point  coordinate
      double realX = this->laserCenterX + X;
      double realY = this->laserCenterY + Y;

      //Check if Real coordinates are within the limits, orelse use the limit insted of coordinates
      if(realX < minLimitX)
         realX = minLimitX;
         
      if(realX > maxLimitX)
         realX = maxLimitX;
         
      if(realY < minLimitY)
         realY = minLimitY;
      if(realY > maxLimitY)
         realY = maxLimitY;
      
      
      laserServoX.write(realX);
      laserServoY.write(realY);
  }

  void executeCircle(){
    
  }
  void executeFullLine(){
   
  int Xdirect = 4;
  int Ydirect = 4;
  // Just an example to  visit all aviable limited coordinate
  for(int x = -30;x>=-30 && x <= 30; x=x+Xdirect)
  {
    for(int y = -30;y>=-30 && y<=30 ;y=y+Ydirect)
    {
      this->goTo(x,y);
      SerialComunication::info("Main", "setup", "GOTO : ");
      Serial.print("X : ");
      Serial.print(x);
      Serial.print(" Y : ");
      Serial.println(y);
      delay(20);
    }
    Ydirect=Ydirect*-1;
  }
  Xdirect=Ydirect*-1;
  }
  
  

};


