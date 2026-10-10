// src/controllers/patientMasterController.js
//
// Appointments (patient master) dashboard API — mounted at /ivr/patientMaster
//
//   GET /ivr/patientMaster/filters   location list, data date range
//   GET /ivr/patientMaster/stats     summary cards + chart data
//   GET /ivr/patientMaster           paginated patient list
//
// Query params for /stats and the list:
//   from, to     YYYY-MM-DD, first-appointment date (inclusive)
//   location     comma-separated, e.g. Baner,DP Road
//   status       visited | pending   (pending = uid_no is NULL)
//   search       name, mobile number (phone / mobile_2) or UID
// List only:
//   page (default 1), limit (default 25, max 200), sort (newest|oldest|name|location)

var express = require("express");
var router = express.Router();
const { requireDashboardAdmin } = require("../util/dashboardAuth");
const {
  getPatients,
  getPatientStats,
  getPatientFilterOptions,
} = require("../models/patientMasterDashboardModel");

// Signed-in admins only (see src/util/dashboardAuth.js)
router.use(requireDashboardAdmin);

router.get("/filters", async (req, res, next) => {
  try {
    res.status(200).json(await getPatientFilterOptions());
  } catch (err) {
    next(err);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    res.status(200).json(await getPatientStats(req.query));
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    res.status(200).json(await getPatients(req.query));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
