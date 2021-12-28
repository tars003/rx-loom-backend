const { Observable, interval, withLatestFrom } = require("rxjs");
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);
require("dotenv").config();
const { Server } = require("socket.io");
const io = new Server(server, { cors: { origin: '*' }, allowEIO3: true });
var mqtt = require('mqtt');
const moment = require('moment');
const { parse } = require("path");
const { is } = require("express/lib/request");

const Zone = require('../models/Zone.model');
const Station = require('../models/Station.model');
const RunningShift = require('../models/RunningShift.model');
const Shift = require('../models/Shift.model');
const Employee = require('../models/Employee.model');
const connectDB = require('../utils/db');
const { reportLiveStatus } = require("../utils/esp32.util");
const { apiData } = require('../utils/machineData');
const {runningShift} = require('../utils/shift.util');
const {findRunningShift} = require('../utils/shift.util');

let connDB;
/****************************************** IIFE BEGINS    ***************************/
(async() => {
    connDB = await connectDB();


    // const connDB = connectDB();
    // const stations = require('../data/stations');
    // const zones = require('../data/zones');

    const stations = await Station.find();
    const zones = await Zone.find();


    // MQTT CLIENT CONFIG
    const host = '192.168.4.108'
    const port = '1883'
    const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
    const connectUrl = `mqtt://${host}:${port}`


    var observables = [];
    var observers = [];
    var results = [];
    var subscriptions = [];
    var obsFunctions = [];


    /****************************************** CONNECTING TO MQTT SERVER AND SUBSCRIBING TO TOPICS  ***************************/

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
        '/nodejs/mqtt/1.1',
        '/nodejs/mqtt/2',
        '/nodejs/mqtt/2.1',
        '/nodejs/mqtt/3',
        '/nodejs/mqtt/3.1',
        '/nodejs/mqtt/4',
        '/nodejs/mqtt/4.1',
        '/nodejs/mqtt/5',
        '/nodejs/mqtt/6',
        '/nodejs/mqtt/6.1',
        '/nodejs/mqtt/7',
        '/nodejs/mqtt/7.1',
        '/nodejs/mqtt/8',
        '/nodejs/mqtt/8.1',
        '/nodejs/mqtt/9',
        '/nodejs/mqtt/9.1',
        '/nodejs/mqtt/10',
    ]

    client.on('connect', () => {
        console.log('Connected')
        // const stations = await Station.find();
        // console.log('stations', stations);
        client.subscribe(topics, () => {
            console.log(`Subscribe to topic '${topics}'`)
        })
    });

    /****************************************** CONNECTING TO MQTT SERVER AND SUBSCRIBING TO TOPICS  ***************************/


    /****************************************** CREATING OBSERVAVBLE FOR MACHINE DATA | EVERY 5 SECS DATA UPDATED ***************************/
    var machineData = [];
    var stopTime = [];
    var zoneStationMap = [];
    var stationMachineMap = [];
    const intObserver = {
        next: async(value) => {
            machineData = await apiData();
            // console.log('machineData', machineData);
            machineData.map(machine => {
                var index = parseInt(machine['name'].split('-')[0]);
                stopTime[index - 1] = machine['current_stop_time'];
            })
        }
    }
    const intObs = interval(5000);
    const intSub = intObs.subscribe(intObserver);
    /****************************************** CREATING OBSERVAVBLE FOR MACHINE DATA | EVERY 5 SECS DATA UPDATED ***************************/



    /****************************************** DEBUGGING COMMENTS ***************************/
    // console.log('stations', stations);
    // console.log('stations len', stations.length);
    // console.log('zones', zones);
    // console.log('zones len', zones.length);

    /****************************************** DEBUGGING COMMENTS ***************************/




    /****************************************** CREATING 20 OBSERVABLES FOR 20 STATIONS  ***************************/

    // stations = await Station.find();
    for (let i = 0; i < stations.length; i++) {
        var station = stations[i];
        var machine1Index = parseInt(station['machine1'].slice(7));
        var machine2Index = parseInt(station['machine2'].slice(7));
        stationMachineMap[i] = [ machine1Index, machine2Index ];
        observables[i] = Observable.create((obs) => {
            obsFunctions[i] = (data) => {
                // console.log(`In  ${i}`);
                obs.next(data);
            }
        })
    }
    // console.log('obs functoions', obsFunctions);
    // console.log('obs functoions len', obsFunctions.length);
    // console.log('observables', observables);
    // console.log('observable len', observables.length);

    /****************************************** CREATING 20 OBSERVABLES FOR 20 STATIONS  ***************************/


    /****************************************** CREATING 10 OBSERVERS FOR 10 ZONES  ***************************/
    // FINDING 2 STATIONS AND SUBSCRIBING TO THEIR OPERATED on RESULT
    // zones = await Zone.find();
    for (let i = 0; i < zones.length; i++) {
        const zone = zones[i];
        var station1Index = -1, station2Index = -1;

        observers[i] = {
            next: (value) => {
                // console.log(`In Observer ${i}`);
                // console.log(value);
                
                processResult(value, i);
            },
            error: (err) => {
                console.log(err);
            }
        }

        // FINDING STATION1 & STATION2 INDEX FOR CREATING RESULTANT OBSERVABLE
        for (let j = 0; j < stations.length; j++) {
            let station = stations[j];
            // console.log('station', station);
            // console.log('index', i);
            if (station.id == zone['station1']) station1Index = j;
            else if (station.id == zone['station2']) station2Index = j;
        }

        // THERE IS PROBLEM IN FINDING STATION 1 & 2 IN STATION COLLECTION
        if (station1Index == -1 || station2Index == -1) {
            console.log('THERE IS PROBLEM IN FINDING STATION 1 & 2 IN STATION COLLECTION');
            console.log('station1Index', station1Index)
            console.log('station2Index', station2Index)
        }
        else {
            console.log(`pair for zone ${i} : ${stations[station1Index]['name']} & ${stations[station2Index]['name']}`);
            zoneStationMap[i] = [ station1Index, station2Index ];
            results[i] = observables[station2Index].pipe(withLatestFrom(observables[station1Index]));
            subscriptions[i] = results[i].subscribe(observers[i]);
        }
    }
    /****************************************** CREATING 10 OBSERVERS FOR 10 ZONES  ***************************/


    /****************************************** LISTENING TO MQTT MESSAGES  ***************************/
    client.on('message', async (topic, payload) => {
        let inStr = [...payload.toString()].map(w => { if (w == "'") return ("\""); else return (w) }).join("");
        const data = JSON.parse(inStr);
        // console.log('data', data);

        if (data.tags) {
            for (let i = 0; i < topics.length; i++) {
                if (topic == topics[i]) {
                    // console.log('topic', topics[i]);
                    obsFunctions[i](data);
                    break;
                }
            }
        } else {
            console.log(`no tags found by station  :${stationId}`);
        }

    });

    /****************************************** LISTENING TO MQTT MESSAGES  ***************************/




    /****************************************** PROCCESES DATA FROM    ***************************/
    const processResult = async (obsArray, i) => {
        const obs1 = obsArray[0];
        const obs2 = obsArray[1];
        const zone = zones[i];

        // console.log('zoneStationMap', zoneStationMap);
        // console.log('stationMachineMap', stationMachineMap);
        console.log()
        var currStopTime = 0;
        zoneStationMap[i].map(stationIndex => {
            stationMachineMap[stationIndex].map(machineIndex => {
                if(stopTime[machineIndex] != undefined)
                    currStopTime += parseInt(stopTime[machineIndex])
                console.log(`machine index : ${machineIndex}`, stopTime[machineIndex]);
            })
        })

        // const emp = await Employee.findById(zone['employeeId']);
        // console.log('zone[i]', zone);
        // console.log('obsArray', obsArray);
        // console.log('employees', employees);
        // var emp = {};
        // employees.map(empl => {
        //     if (empl['id'] == zone['employeeId']) {
        //         // console.log('Inside empl', empl);
        //         emp  = empl;
        //     }
        // });
        // console.log('emp', emp);
        const tagId = zone['tagId'];
        if (tagId) {
            var rssi1, rssi2;

            let isEmpDetected1 = false;
            let isEmpDetected2 = false;
            obs1["tags"].map(ele => {
                if (ele['tagId'] == tagId) {
                    isEmpDetected1 = true;
                    rssi1 = ele['rssi'];
                }
            });
            obs2["tags"].map(ele => {
                if (ele['tagId'] == tagId) {
                    isEmpDetected2 = true;
                    rssi2 = ele['rssi'];
                }
            });


            const data = {
                dateTimeString: obs2['time'],
                zoneName: zone['name'],
                tagId: tagId,
                detected: isEmpDetected1 || isEmpDetected2 ? 'true' : 'false',
                rssi: isEmpDetected1 ? rssi1 : rssi2,
                currStopTime: currStopTime
            }

            // EMP DETECTED IN BOTH SUB STATIONS
            if (isEmpDetected1 || isEmpDetected2) {

                // console.log('sending data to esp32.util', data);
                const runningShift = await reportLiveStatus(data);
                updateDash(runningShift);
            }

            // // EMP NOT DETECTED IN BOTH SUB STATIONS, THUS NOT DETECTED IN ZONE
            // else if (isEmpDetected1 || isEmpDetected2) {
            //     // console.log(`Employee ${zone['tagId']} present in only 1 station`);
            //     // console.log(`${obs1['stationId']} : ${isEmpDetected1},${obs2['stationId']} : ${isEmpDetected2}`);
            //     // console.log('data object : ', data);
            // }
            else {
                // console.log(`Employee ${zone['tagId']} not present in either of stations`);
                // console.log('data object : ', data);
            }
        }

    }

    /****************************************** IIFE ENDS    ***************************/
})();


/****************************************** STARTING SERVER, IMPORTANT FOR SOCKET CONN   ***************************/
server.listen(process.env.PORT || 3000, () => {
    console.log('listening on *:3000');
});
/****************************************** STARTING SERVER, IMPORTANT FOR SOCKET CONN   ***************************/


/****************************************** SOCKET CONFIG FOR SENDING DATA TO DASHBOARD  ***************************/
// UPDATES DASH WITH EMPLOYEE DATA INCOMING FROM ESP32
const updateDash = (runningShift) => {
    io.emit('dashboard-update', { 'runningShift': runningShift });
}
const initialConnection = async (data) => {

    const runningShift = await findRunningShift(getDateTime());
    console.log('inside dashboard', runningShift);
    return runningShift;

}
// SOCKET ON CONNECTION
io.on('connection', async (socket) => {
    console.log('A station connected');
    socket.on('error', console.error);
    // event name -> report-live-status
    // data = {
    //     stationId: 'STATION1',
    //     dateTime: '12-09/*  */-21 21:45:10',
    //     detected: true,
    //     rssi: 90,
    // }
    socket.on('report-live-status', (data) => {
        updateDash(data);
        const empData = reportLiveStatus(data);
    });

    // event name -> initial-connection-dashboard
    // data = {
    //     clientId: 'KJVKLBLSK89'
    // }
    socket.on('initial-connection-dashboard', async (data) => {
        console.log(data);
        socket.join(data.clientId);
        const runningShift = await initialConnection(data);
        io.to(data.clientId).emit('running-shift-data', { 'runningShift': runningShift });
    });

    socket.on('test-conn', (data) => {
        console.log(data);
    });

    socket.on('disconnect', () => {
        console.log('station disconnected');
    })
});
/****************************************** SOCKET CONFIG FOR SENDING DATA TO DASHBOARD  ***************************/



/****************************************** REFERENCE DATA ***************************/
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
