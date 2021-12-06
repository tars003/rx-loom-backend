const { Observable, interval, withLatestFrom } = require("rxjs");

var mqtt = require('mqtt');

// MQTT CLIENT CONFIG
const host = '192.168.1.102'
const port = '1883'
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const connectUrl = `mqtt://${host}:${port}`
const topic1 = '/nodejs/mqtt/STATION1'
const client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: 'emqx',
    password: 'public',
    reconnectPeriod: 1000,
});

// // MQTT CONFIG
client.on('connect', () => {
    console.log('Connected')
    client.subscribe([topic1], () => {
        console.log(`Subscribe to topic '${mainTopic}'`)
    })
});

var observer1 = {
    next: (value) => {
        console.log('Inside observer1 next');
        console.log(value); 
    },
    error: (err) => {
        console.log(err);
    }
}
var obsFunc1 ;
var obs1 = Observable.create((obs) => {
    obsFunc1  = (data) => {
        console.log('Inside Observable 1');
        obs.next(data);
    }
})


var obsFunc2 ;
var obs2 = Observable.create((obs) => {
    obsFunc2  = (data) => {
        console.log('Inside Observable 2');
        obs.next(data);
    }
});



let flag = 0;
const int1 = setInterval(() => {
    obsFunc1(`Data1: ${Math.floor(Math.random()*(999-100+1)+100)}`);
}, 3000);

const int2 = setInterval(() => {
    obsFunc2(`Data2: ${Math.floor(Math.random()*(999-100+1)+100)}`);

    flag ++;
    if(flag > 3) {
        clearInterval(int1);
        clearInterval(int2);
    }
}, 5000);



client.on('message', async (topic, payload) => {
    let inStr = [...payload.toString()].map(w => {if(w == "'") return ("\""); else return (w)}).join("");
    const data = JSON.parse(inStr);
    console.log('data', data);

    if(data.tags.length > 0) {

        switch(topic) {
            case topic1: 
                obsFunc1(data);
                break;
            case topic2:
                obsFunc12(data);
                break;
        }

    } else {
        console.log(`no tags found by station  :${stationId}`);
    }

});




// withLatestFrom
var result = obs2.pipe(withLatestFrom(obs1));
var subscription = result.subscribe(observer1);
// var subscription = obs1.subscribe(observer1);

















// INCOMING DATA FORMAT
// {
//     "stationId" : "STATION1",
//     "time": "12-11-2021-11:24:12",
//     "tags": [
//         {
//             "tagId": "TAG 1",
//             "rssi": 81
//         },
//         {
//             "tagId": "TAG 2",
//             "rssi": 40
//         },
//     ]
// }
