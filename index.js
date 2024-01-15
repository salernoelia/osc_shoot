const osc = require('osc');
const OSC = require('osc-js');
const say = require('say');
const numberToWords = require('number-to-words');

// Constants
const GYRO_ADDRESS = '/gyrosc/gyro';
const BUTTON_ADDRESS = '/gyrosc/button';
const COOLDOWN_DURATION = 500;

// Variables
let mappedGyro = 0;
let buttonPressed = false;
let lastButtonPressTime = 0;
let targetPosition, abletonTargetPosition;

// OSC setup
const oscServer = new osc.UDPPort({ localAddress: '0.0.0.0', localPort: 50001 });
const oscOut = new OSC({ plugin: new OSC.DatagramPlugin({ send: { port: 8000, host: '192.168.1.9' } }) });
oscOut.open();

// Utility functions
const mapRange = (value, fromMin, fromMax, toMin, toMax) => {
  const mappedValue = (value - fromMin) / (fromMax - fromMin) * (toMax - toMin) + toMin;
  return Math.max(Math.min(mappedValue, toMax), toMin);
};

const speakText = (text) => {
  say.speak(`"${text}"`, 'Samantha', 1.02, (err) => {
    if (err) {
      console.error(err);
    }
  });
};

// Gyro and Button handlers
const handleGyroData = (gyroData) => {
  mappedGyro = mapRange(gyroData, -3.15, 3.15, 0, 360);
  console.log("Your Rotation:", mappedGyro);
};

const handleButtonData = (buttonData) => {
  const currentTime = Date.now();

  if (buttonData === 1 && (currentTime - lastButtonPressTime) >= COOLDOWN_DURATION) {
    buttonPressed = true;
    lastButtonPressTime = currentTime;
  }
};

// Main game functions
const getTarget = () => {
  const randomDecimal = Math.random();
  targetPosition = Math.floor(randomDecimal * 361);
  abletonTargetPosition = mapRange(targetPosition, 0, 360, 0, 1);

  speakText(`Target is ${numberToWords.toWords(targetPosition)}`);

  const message = new OSC.Message('/target', abletonTargetPosition);
  oscOut.send(message);

  return { targetPosition, abletonTargetPosition };
};

const shoot = () => {
  if (buttonPressed) {
    const shotAngle = mappedGyro;
    const lowerBound = (targetPosition - 15 + 360) % 360;
    const upperBound = (targetPosition + 15) % 360;

    if ((lowerBound <= upperBound && (shotAngle >= lowerBound && shotAngle <= upperBound)) ||
      (lowerBound > upperBound && (shotAngle >= lowerBound || shotAngle <= upperBound))) {
      console.log("Hit!");
      speakText("You hit the Cyber Threat!");
      targetPosition = getTarget().targetPosition;
      console.log("New Target:", targetPosition);
    } else {
      console.log("Miss!");
      speakText("You missed!");
    }

    buttonPressed = false;
  } else {
    console.log("Button not pressed or cooldown active. Cannot shoot.");
  }
};

// Initialization
const startOSCServer = () => {
  oscServer.on('message', (oscMessage) => {
    try {
      const oscAddress = oscMessage.address;

      if (oscAddress === GYRO_ADDRESS) {
        handleGyroData(oscMessage.args[2]);
      } else if (oscAddress === BUTTON_ADDRESS) {
        handleButtonData(oscMessage.args[0]);
      }

      if (buttonPressed) {
        shoot();
      }

    } catch (error) {
      console.error('Error processing OSC message:', error);
    }
  });

  oscServer.on('error', (error) => {
    console.error('OSC server error:', error);
  });

  oscServer.open();
};

const handleExit = () => {
  console.log('Closing OSC server');
  oscServer.close(() => process.exit());
};

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);

// Game start
getTarget();

console.log("Target Position:", targetPosition);
console.log("Ableton Target Position:", abletonTargetPosition);

startOSCServer();
