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
            phone,
            tagId
        } = obj;

        const empExists = await Employee.findOne({tagId: tagId});

        if(empExists) 
            return res.status(400).json({
                success: false,
                message: `A employee with tagId : ${tagId} already exists!`
            });

        const emp = await Employee.create({
            name,
            phone,
            tagId
        });

        return res.status(200).json({
            success: true,
            data: emp
        })


    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.get('/delete/:id', async(req, res) => {
    try {
        const empExists = await Employee.findById(req.params.id);

        if(!empExists) 
            return res.status(400).json({
                success: false,
                message: `No employee found with id : ${req.params.id}!`
            });

        await empExists.remove();

        return res.status(200).json({
            success: true,
            message: 'Employee removed !'
        })


    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.get('/get-info/:tagId', async(req, res) => {
    try {
        const empExists = await Employee.findOne({tagId: req.params.tagId});

        if(!empExists) 
            return res.status(400).json({
                success: false,
                message: `No employee found with tagId : {req.params.tagId}`
            });

        return res.status(200).json({
            success: true,
            data: empExists
        })


    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.get('/get-all', async (req, res) => {
    try {
        const emps = await Employee.find();

        return res.status(200).json({
            success: true,
            count: emps.length,
            data: emps
        })

    } catch (err) {
        console.log(err);
        return res.status(503).json({
            success: false,
            message: 'Server error'
        });
    }
})


module.exports = router;

