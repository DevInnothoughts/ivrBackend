var express = require("express");
var router = express.Router();
const { getPatient } = require("../models/patientModel");

router.get("/", async (req, res, next) => {
  try {
    console.log(req.query.location);
    const patient = await getPatient(req.query.mobile, req.query.location);
    res.status(200).send(patient);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
