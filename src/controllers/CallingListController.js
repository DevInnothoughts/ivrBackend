var express = require("express");
var router = express.Router();
const {
  getCallingList,
  getDiagnosisCallingList,
  getSurgeryPatients,
  getMedicationPatients,
  getIPDPatients,
} = require("../models/callingListModel");

router.get("/", async (req, res, next) => {
  try {
    console.log(req.query.location);
    const callingList = await getCallingList(req.query.location);
    res.status(200).send(callingList);
  } catch (err) {
    next(err);
  }
});

router.get("/surgeryAdvised", async (req, res, next) => {
  try {
    console.log(req.query.location);
    const callingList = await getSurgeryPatients(req.query.location);
    res.status(200).send(callingList);
  } catch (err) {
    next(err);
  }
});

router.get("/medicationAdvised", async (req, res, next) => {
  try {
    console.log(req.query.location);
    const callingList = await getMedicationPatients(req.query.location);
    res.status(200).send(callingList);
  } catch (err) {
    next(err);
  }
});

router.get("/ipd", async (req, res, next) => {
  try {
    console.log(req.query.location);
    const callingList = await getIPDPatients(req.query.location);
    res.status(200).send(callingList);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
