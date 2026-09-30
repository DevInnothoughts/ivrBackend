var express = require("express");
var router = express.Router();
const {
  getCallingList,
  getDiagnosisCallingList,
  getSurgeryPatients,
  getMedicationPatients,
  getIPDPatients,
  getTomorrowsAppointment,
  getTodaysAppointment,
  getTestPatients,
  getMedicationPatientsV1,
  getSurgeryPatientsV1,
  getTestPatientsV1,
  getMCDPAPatients,
  getIPDPatientsV1,
  getCallingListV1,
} = require("../models/callingListModel");
const {
  getCallingListV2,
  getExcludedEnquiries,
} = require("../models/enquiryCallingListModel");

const { getCallingCounts } = require("../models/callingCountsModel");

router.get("/", async (req, res, next) => {
  try {
    console.log(req.query.location);
    const callingList = await getCallingList(req.query.location);
    res.status(200).send(callingList);
  } catch (err) {
    next(err);
  }
});

router.get("/v1", async (req, res, next) => {
  try {
    console.log(req.query.location);
    const callingList = await getCallingListV1(req.query.location);
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

router.get("/surgeryAdvised/v1", async (req, res, next) => {
  try {
    console.log(req.query.location);
    const callingList = await getSurgeryPatientsV1(req.query.location);
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

router.get("/medicationAdvised/v1", async (req, res, next) => {
  try {
    console.log(req.query.location);
    const callingList = await getMedicationPatientsV1(req.query.location);
    res.status(200).send(callingList);
  } catch (err) {
    next(err);
  }
});

router.get("/testAdvised", async (req, res, next) => {
  try {
    console.log(req.query.location);
    const callingList = await getTestPatients(req.query.location);
    res.status(200).send(callingList);
  } catch (err) {
    next(err);
  }
});

router.get("/testAdvised/v1", async (req, res, next) => {
  try {
    console.log(req.query.location);
    const callingList = await getTestPatientsV1(req.query.location);
    res.status(200).send(callingList);
  } catch (err) {
    next(err);
  }
});

router.get("/mcdpa", async (req, res, next) => {
  try {
    console.log(req.query.location);
    const callingList = await getMCDPAPatients(req.query.location);
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

router.get("/ipd/v1", async (req, res, next) => {
  try {
    console.log(req.query.location);
    const callingList = await getIPDPatientsV1(req.query.location);
    res.status(200).send(callingList);
  } catch (err) {
    next(err);
  }
});

router.get("/tomorrowAppointments", async (req, res, next) => {
  try {
    console.log(req.query.location);
    const callingList = await getTomorrowsAppointment(req.query.location);
    res.status(200).send(callingList);
  } catch (err) {
    next(err);
  }
});

router.get("/todaysAppointments", async (req, res, next) => {
  try {
    console.log(req.query.location);
    const callingList = await getTodaysAppointment(req.query.location);
    res.status(200).send(callingList);
  } catch (err) {
    next(err);
  }
});

router.get("/counts", async (req, res, next) => {
  try {
    const counts = await getCallingCounts(req.query.location);
    res.status(200).send(counts);
  } catch (err) {
    next(err);
  }
});

// Enquiry Calls, with booked and visited patients removed
router.get("/v2", async (req, res, next) => {
  try {
    res.status(200).send(await getCallingListV2(req.query.location));
  } catch (err) {
    next(err);
  }
});

// Diagnostic: what v2 drops that v1 kept, and why
router.get("/v2/excluded", async (req, res, next) => {
  try {
    res.status(200).send(await getExcludedEnquiries(req.query.location));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
