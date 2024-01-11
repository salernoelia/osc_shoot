const osc = require('osc');
let pressureData;

// Create an OSC Server listening on port 50001
const oscServer = new osc.UDPPort({
  localAddress: '0.0.0.0',
  localPort: 50001,
});


const pressureAddress = '/bfc940db-fb78-4d83-822b-2f05666aaf06/pressure';
const gravityAddress = '/bfc940db-fb78-4d83-822b-2f05666aaf06/gravity';

oscServer.on('message', function (oscMessage) {
  try {
    data = oscMessage;


    pressureData = oscMessage.args[0]*100 -97700;
    console.log("Pressure:",pressureData);
   
   if (!isNaN(oscMessage.args[2])) {
    gravityData = oscMessage.args[2] * 100;
    console.log("Gravity:", gravityData);
}

    

  } catch (error) {
    console.error('Error processing OSC message:', error);
  }
});

// Handle all 'error' events on the UDP port
oscServer.on('error', function (error) {
  console.error('OSC server error:', error);
});

// Start the OSC Server
oscServer.open();

// Handle exit gracefully
const handleExit = () => {
  console.log('Closing OSC server');
  oscServer.close(() => {
    process.exit();
  });
};

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
