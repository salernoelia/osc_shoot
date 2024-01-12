const osc = require('osc');
let mappedGyro = 0;
let buttonPressed = false;
let lastButtonPressTime = 0; // Timestamp of the last button press
const cooldownDuration = 500; // 0.5 seconds cooldown duration in milliseconds

let target = getTarget().abletonTargetPosition; // Initialize the target

function mapRange(value, from_min, from_max, to_min, to_max) {
  const mappedValue = (value - from_min) / (from_max - from_min) * (to_max - to_min) + to_min;
  return Math.max(Math.min(mappedValue, to_max), to_min);
}

const oscServer = new osc.UDPPort({
  localAddress: '0.0.0.0',
  localPort: 50001,
});

const gyroAddress = '/gyrosc/gyro';
const buttonAddress = '/gyrosc/button';

function startOSCServer() {
  oscServer.on('message', function (oscMessage) {
    try {
      data = oscMessage;
      const oscAddress = oscMessage.address;

      if (oscAddress === gyroAddress) {
        // Handle gyro data
        gyroData = oscMessage.args[2];
        mappedGyro = mapRange(gyroData, -3.15, 3.15, 0, 360);
        console.log({ type: 'gyro', value: mappedGyro });
      } else if (oscAddress === buttonAddress) {
        buttonData = oscMessage.args[0];

        // Check if the cooldown has passed since the last button press
        const currentTime = Date.now();
        if (buttonData === 1 && (currentTime - lastButtonPressTime) >= cooldownDuration) {
          buttonPressed = true;
          lastButtonPressTime = currentTime;
        }
      }

      if (buttonPressed) {
        // Call the shoot function only when the button is pressed
        shoot();
      }

    } catch (error) {
      console.error('Error processing OSC message:', error);
    }
  });

  oscServer.on('error', function (error) {
    console.error('OSC server error:', error);
  });

  oscServer.open();
}

const handleExit = () => {
  console.log('Closing OSC server');
  oscServer.close(() => {
    process.exit();
  });
};

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);

function getTarget() {
  const randomDecimal = Math.random();
  const targetPosition = Math.floor(randomDecimal * 361);
  
  // Remap targetPosition from 0 to 360 to -180 to 180
  const abletonTargetPosition = mapRange(targetPosition, 0, 360, -180, 180);

  return { targetPosition, abletonTargetPosition };
}

function shoot() {
  if (buttonPressed) {
    const shotAngle = mappedGyro;

    // Check if the shot is within +-10 of the target + needed Wrapping for 360 degrees
    const lowerBound = (targetPosition - 15 + 360) % 360;
    const upperBound = (targetPosition + 15) % 360;

    if (
      (lowerBound <= upperBound && (shotAngle >= lowerBound && shotAngle <= upperBound)) ||
      (lowerBound > upperBound && (shotAngle >= lowerBound || shotAngle <= upperBound))
      ) {
      console.log("Hit!");
      targetPosition = getTarget().targetPosition; // Update the target after a successful hit
      console.log("New Target:", targetPosition);
    } else {
      console.log("Miss!");
    }

    buttonPressed = false;
  } else {
    console.log("Button not pressed or cooldown active. Cannot shoot.");
  }
}


let { targetPosition, abletonTargetPosition } = getTarget();
console.log("Target Position:", targetPosition);
console.log("Ableton Target Position:", abletonTargetPosition);

startOSCServer();
