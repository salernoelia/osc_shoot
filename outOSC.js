const OSC = require('osc-js')

const osc = new OSC({
  plugin: new OSC.DatagramPlugin({ send: { port: 5311, host: '172.20.10.2' } })
});


osc.open()


setInterval(() => {
    const message = new OSC.Message('/target', Math.random());
    osc.send(message);
    console.log("message sent")
}, 1000);