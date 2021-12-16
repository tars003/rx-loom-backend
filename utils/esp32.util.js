const moment = require('moment');

const RunningShift = require('../models/RunningShift.model');
const Shift = require('../models/Shift.model');
const Employee = require('../models/Employee.model');
const Zone = require('../models/Zone.model');

const { isShiftValid, findShift } = require('./shift.util');
const ZoneModel = require('../models/Zone.model');
const e = require('express');

const getTime = () => {
    return moment().format('HH:mm:ss');
}

// returns -> running shift employees object
const reportLiveStatus = async (data) => {
    console.log(data);
    let {
        dateTimeString,
        zoneName,
        tagId,
        detected,
        rssi,
        currStopTime
    } = data;
    console.log(
        'incoming values',
        dateTimeString,
        zoneName,
        tagId,
        rssi,
        detected,
        currStopTime
    );
    dateTimeString = moment(dateTimeString).utc().format('DD-MM-YY HH:mm:ss');
    const date = dateTimeString.split(' ')[0];
    const time = dateTimeString.split(' ')[1];

    // FIND EMPLOYEE OBJECT IN DB 
    let Emp = await Employee.find({ tagId: tagId });
    const zones = await Zone.find();
    Emp = Emp[0];
    // console.log('Emp found from db', Emp);

    if(Emp) {
        let employeesObj = [];  // KEEPS TRACK OF ALL EMPLOYEES IN RUNNING SHIFT
        let employees = [];
        let employee = {};
        let empIndex = -1;
        let runningShiftObj = {};
        let shiftObj = {};
        let points;

        // console.log('Emp found in db, time : ', time);
        // FINDING WHICH SHIFT IS GOING ON
        const foundShift = await findShift(time);
        // console.log('found shift', foundShift);

        // FINDING RUNNING SHIFT FOR SHIFT STRUCTURE FOR TODAY'S DATE
        const runningShift = await RunningShift.find({ date: date, shiftId: foundShift.id });
        // console.log('running shift', runningShift);
        
        // RUNNING SHIFT FOUND
        if (runningShift.length > 0) {
            runningShiftObj = runningShift[0];
            employeesObj = runningShiftObj.employees;
            // console.log('employeesObj', employeesObj);
        }
        // RUNNING SHIFT NOT FOUND
        else {
            // RUNNING SHIFT DOES NOT EXIST, CREATING ONE
            const empList = foundShift.employees.map((emp, index) => {
                const empData = {
                    _id: emp.id,
                    name: emp.name,
                    zoneName : zones[index]['name'],
                    activeTime: 0,
                    awayTime: 0,
                    idealTime: 0,
                    reportedTime: 'NA',
                    status: false
                };
                return empData;
            })
            runningShiftObj = await RunningShift.create({
                date: date,
                shiftId: foundShift.id,
                employees: empList
            });
            employeesObj = empList;
        }

        // FILTERING OUT THE EXPLOYEE FROM EMP LIST
        employee = employeesObj.filter(emp => emp.id == Emp.id);
        employee = employee[0];
        // console.log('employeeObj', employeesObj);
        // console.log('employee', employee);

        // IF FOUND UPDATING THE VALUES
        if (employee) {
            // CALCULATING THE LAST REPORTED TIME
            const currTime = moment(dateTimeString, 'DD-MM-YY HH:mm:ss');
            const lastReportedTime = moment(employee['reportedTime'], 'DD-MM-YY HH:mm:ss');
            const diff = currTime.diff(lastReportedTime, 'seconds');

            if (detected == 'true') {
                // employee['activeTime'] += 10;
                employee['activeTime'] += diff;
                employee['status'] = true;
                // save employee points
                let em = await Employee.findById(Emp.id);
                em.points += employee['activeTime'] * 0.00233;
                points  = em.points;
                await em.save();
                employee['points'] = points;
            } else {
                // employee['awayTime'] += 10;
                employee['awayTime'] += diff;
                employee['status'] = false;
                // let em = await Employee.findById(Emp.id);
                // em.points += employee['activeTime'] * 0.00233;
                // points  = em.points;
                // await em.save();
            }
            employee['reportedTime'] = dateTimeString;
            employee['lastRSSI'] = rssi;
            employee['idealTime'] = currStopTime;

            // CREATING EMPLOYEE LIST WITH UPDATED EMP OBJECT
            const newList =  employeesObj.map(emp => {
                // console.log('emp.id', emp.id);
                // console.log('employee.id', employee.id);    
                // RETURN UPDATED EMPLOYEE OBJECT FOR THE EMPLOYEE
                if(emp.id == employee.id) return employee;
                // DO NOTHING FOR OTHER EMPLOYEES
                else return emp;
            });
            // console.log('empObject', employeesObj);
            // console.log('newList', newList);

            // UPDATE THIS RUNNING SHIFT IN THE DB
            let newRunningShift = await RunningShift.findById(runningShiftObj.id);
            newRunningShift['employees'] = newList;
            await newRunningShift.save();
            let result = newRunningShift;

            return result;
        }
        // employee not found
        else {
            console.log('inside else, employee not found')
        }
    }
    else {
        console.log('EMPLOYEE NOT FOUND');
    }
}

module.exports = { reportLiveStatus };