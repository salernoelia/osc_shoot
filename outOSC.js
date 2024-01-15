const OSC = require('osc-js')

const oscOut = new OSC({
  plugin: new OSC.DatagramPlugin({ send: { port: 8000, host: '192.168.1.9' } })
});


oscOut.open()

setInterval(() => {
    const message = new OSC.Message('/target', Math.random());
    oscOut.send(message);
    const message2 = new OSC.Message('/pepejones', Math.random());
    oscOut.send(message2);
    console.log("message sent")
}, 1000);