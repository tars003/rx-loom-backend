const express = require('express');
require("dotenv").config();

const Zone = require('../models/Zone.model');
const Station = require('../models/Station.model');
const RunningShift = require('../models/RunningShift.model');
const Shift = require('../models/Shift.model');
const Employee = require('../models/Employee.model');
const connectDB = require('../utils/db');
const { reportLiveStatus } = require("../utils/esp32.util");
const { apiData } = require('../utils/machineData');
const {runningShift} = require('../utils/shift.util');

const connDB = connectDB();
const stations = require('../data/stations');
const zones = require('../data/zones');
const { parse } = require("path");
const { is } = require("express/lib/request");


const app = express();
app.use(express.json());

app.use("/server/employee", require('../routes/employee.route'));
app.use("/server/station", require('../routes/station.route'));
app.use("/server/zone", require('../routes/zone.route'));


const PORT =  5001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})
