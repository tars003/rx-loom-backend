const { Router } = require('express');

const Zone = require('../models/Zone.model');
const Station = require('../models/Station.model');
const RunningShift = require('../models/RunningShift.model');
const Shift = require('../models/Shift.model');
const Employee = require('../models/Employee.model');
const req = require('express/lib/request');

const router =  Router();

router.post('/create', async(req, res) => {
    try {
        let obj = req.body;
        console.log(obj);
        obj = JSON.parse(JSON.stringify(obj).replace(/"\s+|\s+"/g, '"'));

        const {
            name,
            station1,
            station2,
            employeeId,
            tagId
        } = obj;

        const zoneExists = await Zone.findOne({name: name});

        if(zoneExists) 
            return res.status(400).json({
                success: false,
                message: `A zone with name : ${name} already exists!`
            });

        const zone = await Zone.create({
            name,
            station1,
            station2,
            tagId,
            employeeId
        });

        return res.status(200).json({
            success: true,
            data: zone
        })


    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;