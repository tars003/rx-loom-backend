const { Observable, interval, withLatestFrom } = require("rxjs");
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
const axios = require('axios');

const Zone = require('../models/Zone.model');
const Station = require('../models/Station.model');
const RunningShift = require('../models/RunningShift.model');
const Shift = require('../models/Shift.model');
const Employee = require('../models/Employee.model');
const { stationTagMap, tagObj } = require('../utils/constants');

var mqtt = require('mqtt');
const { reportLiveStatus } = require("../utils/esp32.util");

// MQTT CLIENT CONFIG
const host = '192.168.1.102'
const port = '1883'
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
const connectUrl = `mqtt://${host}:${port}`

const client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    username: 'emqx',
    password: 'public',
    reconnectPeriod: 1000,
});

const topics = [
    '/nodejs/mqtt/1',
    '/nodejs/mqtt/2',
    '/nodejs/mqtt/3',
    '/nodejs/mqtt/4',
    '/nodejs/mqtt/5',
    '/nodejs/mqtt/6',
    '/nodejs/mqtt/7',
    '/nodejs/mqtt/8',
    '/nodejs/mqtt/9',
    '/nodejs/mqtt/10',
    '/nodejs/mqtt/1.1',
    '/nodejs/mqtt/2.1',
    '/nodejs/mqtt/3.1',
    '/nodejs/mqtt/4.1',
    '/nodejs/mqtt/5.1',
    '/nodejs/mqtt/6.1',
    '/nodejs/mqtt/7.1',
    '/nodejs/mqtt/8.1',
    '/nodejs/mqtt/9.1',
    '/nodejs/mqtt/10.1',
]

client.on('connect', () => {
    console.log('Connected')
    client.subscribe(topics, () => {
        console.log(`Subscribe to topic '${mainTopic}'`)
    })
});



var observables = [];
var obsFunctions = [];
var observer;
var resultObservable;
var subscription;

var stations, zones;

(async () => {
    // CREATING 20 OBSERVABLES FOR 20 STATIONS
    stations = await Station.find();
    for (let i = 0; i < stations.length; i++) {
        observables[i] = Observable.create((obs) => {
            obsFunctions[i] = (data) => {
                console.log('Inside Observable 1');
                obs.next(data);
            }
        })
    }
})();

// CREATING OBSERVER AND RESULTANT OBSERVABLE
(async () => {
    // CREATING 1 OBSERVER FOR GETTING 20 DATA FROM 20 STATIONS
    observer = {
        next: (value) => {
            console.log("Inside OBSERVER !!");
            console.log(value);
            const tagObjs = processResult(value);

        },
        error: (err) => {
            console.log('Inside err function !!');
            console.log(err);
        }
    }

    for (let i = 1; i < stations.length; i++) {
        if (i == 1)
            resultObservable = observables[i].pipe(withLatestFrom(observables[i - 1]));
        else
            resultObservable = observables[i].pipe(withLatestFrom(resultObservable));
    }

    subscription = resultObservable.subscribe(observer);

})();


client.on('message', async (topic, payload) => {
    let inStr = [...payload.toString()].map(w => { if (w == "'") return ("\""); else return (w) }).join("");
    const data = JSON.parse(inStr);
    console.log('data', data);

    if (data.tags.length > 0) {

        switch (topic) {
            case topics[0]:
                obsFunctions[0](data);
                break;
            case topics[1]:
                obsFunctions[1](data);
                break;
            case topics[2]:
                obsFunctions[2](data);
                break;
            case topics[3]:
                obsFunctions[3](data);
                break;
            case topics[4]:
                obsFunctions[4](data);
                break;
            case topics[5]:
                obsFunctions[5](data);
                break;
        }

    } else {
        console.log(`no tags found by station  :${stationId}`);
    }

});




const processResult = async (obsArray) => {
    let tagObjs = [];                           // STORES 20 OBJECTS FOR EACH TAG, TO BE SENT TO FLASK API
    const tagIds = Object.values(stationTagMap);
    
    // CONSTRUCTING EMPTY TAG OBJS
    for (let i = 0; i < stationTagMap.length; i++) {
        tagObjs[i] = tagObj;
    }

    for (let i = 0; i < obsArray; i++) {
        const obsData = obsArray[i];
        obsData['tags'].map(tag => {
            tagObjs[tagIds.indexOf(tag["tagId"])][obsData['stationId']] = tag['rssi'];
        });
    }
    let apiRequests = [];
    for (let i = 0; i < tagObjs.length; i++) {
        apiRequests.push(axios.post('http://localhost:5000/return_zone', tagObjs[i]));
    }

    Promise.all(apiRequests)
        .then((zones) => {
            zones.map((zone, i) => {
                console.log(`Response received from Model API for : ${tagIds[i]} tag => ${zone}`);
            })
        })

    return tagObjs;
}


server.listen(process.env.PORT || 3000, () => {
    console.log('listening on *:3000');
});



// let flag = 0;
// const int1 = setInterval(() => {
//     obsFunc1(`Data1: ${Math.floor(Math.random()*(999-100+1)+100)}`);
// }, 3000);

// const int2 = setInterval(() => {
//     obsFunc2(`Data2: ${Math.floor(Math.random()*(999-100+1)+100)}`);

//     flag ++;
//     if(flag > 3) {
//         clearInterval(int1);
//         clearInterval(int2);
//     }
// }, 5000);


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

// OUTGOING MODEL API DATA
// {
//     "station1" : "00",
//     "station2" : "00",
//     "station3" : "00",
//     "station4" : "00",
//     "station5" : "00",
//     "station6" : "00",
//     "station7" : "00",
//     "station8" : "00",
//     "station9" : "00",
//     "station10" : "00",
//     "station1.1" : "00",
//     "station2.1" : "00",
//     "station3.1" : "00",
//     "station4.1" : "00",
//     "station5.1" : "00",
//     "station6.1" : "00",
//     "station7.1" : "00",
//     "station8.1" : "00",
//     "station9.1" : "00",
//     "station10.1" : "00"
// }
