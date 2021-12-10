const { Observable, interval, withLatestFrom } = require("rxjs");
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);

const Zone = require('../models/Zone.model');
const Station = require('../models/Station.model');
const RunningShift = require('../models/RunningShift.model');
const Shift = require('../models/Shift.model');
const Employee = require('../models/Employee.model');

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
]

client.on('connect', () => {
    console.log('Connected')
    client.subscribe(topics, () => {
        console.log(`Subscribe to topic '${mainTopic}'`)
    })
});



var observables = [];
var obsFunctions = [];
var observers = [];
var results = [];
var subscriptions = [];

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

(async () => {
    // CREATING 10 OBSERVERS FOR 10 ZONES
    // FINDING 2 STATIONS AND SUBSCRIBING TO THEIR OPERATED RESULT
    zones = await Zone.find();
    for (let i = 0; i < zones.length; i++) {
        const zone = zones[i];
        var station1Index = -1, station2Index = -1;

        observers[i] = {
            next: (value) => {
                console.log('Inside observer1 next');
                console.log(value);
                processResult(value, i);
            },
            error: (err) => {
                console.log(err);
            }
        }

        // FINDING STATION1 & STATION2 INDEX FOR CREATING RESULTANT OBSERVABLE
        for (let j = 0; j < stations.length; i++) {
            let station = stations[i];
            if (station.id == zone['station1']) station1Index = i;
            else if (station.id == zone['station2']) station2Index = i;
        }
        
        // THERE IS PROBLEM IN FINDING STATION 1 & 2 IN STATION COLLECTION
        if(station1Index == -1 || station2Index == -1) {
            console.log('THERE IS PROBLEM IN FINDING STATION 1 & 2 IN STATION COLLECTION');
            console.log('station1Index', station1Index)
            console.log('station2Index', station2Index)
        }
        else {
            results[i] = observables[station2Index].pipe(withLatestFrom(observables[station1Index]));
            subscriptions[i] = results[i].subscribe(observers[i]);
        }
    }
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
        }

    } else {
        console.log(`no tags found by station  :${stationId}`);
    }

});




const processResult = async (obsArray, i) => {
    const obs1 = obsArray[0];
    const obs2 = obsArray[1];
    const zone = zones[i];
    const emp = await Employee.findById(zone['employeeId']);
    const tagId = emp['tagId'];
    var rssi;

    let isEmpDetected1 = false;
    let isEmpDetected2 = false;
    obs1["tags"].map(ele => {
        if (ele['tagId'] == tagId) isEmpDetected1 = true;
    });
    obs3["tags"].map(ele => {
        if (ele['tagId'] == tagId) {
            isEmpDetected2 = true;
            rssi = ele['rssi'];
        }
    });

    // EMP DETECTED IN BOTH SUB STATIONS
    if (isEmpDetected1 && isEmpDetected2) {
        const data = {
            dateTimeString: obs2['time'],
            zoneName: zone['name'],
            tagId: tagId,
            detected: detected,
            rssi: rssi
        }
        console.log('sending data to esp32.util', data);
        const runningShift = await reportLiveStatus(data);
    }

    // EMP NOT DETECTED IN BOTH SUB STATIONS, THUS NOT DETECTED IN ZONE
    else if (isEmpDetected1 || isEmpDetected2) {
        console.log(`Employee ${emp['name']} present in only 1 station`);
        console.log(`${obs1['stationId']} : ${isEmpDetected1},${obs2['stationId']} : ${isEmpDetected2}`);
    }
    else {
        console.log(`Employee ${emp['name']} not present in either of stations`);
    }

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
