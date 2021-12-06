const moment = require('moment');

const RunningShift = require('../models/RunningShift.model');
const Shift = require('../models/Shift.model');
const Employee = require('../models/Employee.model');

const {findRunningShift} = require('./shift.util');

const initialConnection = async (data) => {

    const runningShift = await findRunningShift(getDateTime());
    console.log('inside dashboard', runningShift);
    return runningShift;

}


const getDateTime = () => {
    return moment().format('DD-MM-YY HH:mm:ss');
}




module.exports = { initialConnection };