const moment = require('moment');

const RunningShift = require('../models/RunningShift.model');
const Shift = require('../models/Shift.model');
const Employee = require('../models/Employee.model');

// time -> HH:mm  startTime -> HH:mm endTime -> HH:mm
const isShiftValid = async (startTime, endTime, time) => {
    var start = moment(startTime, 'HH:mm:ss');
    var end = moment(endTime, 'HH:mm:ss');
    var time = moment(time, 'HH:mm:ss');

    if (time.diff(start) > 0 && time.diff(end) < 0) {
        return true
    }
    else return false;
}

// time -> HH:mm
const findShift = async (timeString) => {
    let time  = moment(timeString, 'HH:mm:ss');
    const shifts = await Shift.find();
    const foundShift = shifts.map(shift => {
        let st = moment(shift.startTime, 'HH:mm:ss');
        let et = moment(shift.endTime, 'HH:mm:ss');
        if (time.diff(st) > 0 && time.diff(et) < 0)
            return shift
    });
    return foundShift[0];
}

// time -> moment()
const findRunningShift = async (time) => {
    var dateTime = moment('DD-MM-YY HH:mm:ss', time);
    var date = time.split(' ')[0];
    var time = time.split(' ')[1];

    const shift = findShift(time);
    // const runningShift = await RunningShift.find({ date: date, shiftId: shift.id });
    let runningShift = await RunningShift.find();


    runningShift = runningShift[runningShift.length-1];

    console.log('found running shift', runningShift);
    return runningShift;

} 

module.exports = { isShiftValid, findShift, findRunningShift }


