// src/controllers/masterEnquiryController.js
//
// Master Enquiry dashboard API — mounted at /ivr/masterEnquiry in app.js
//
//   GET /ivr/masterEnquiry/filters   dropdown values (sources, branches, enquiry types, date range)
//   GET /ivr/masterEnquiry/stats     summary cards + chart data for the current filters
//   GET /ivr/masterEnquiry           paginated enquiry list for the current filters
//
// Common query params for /stats and the list:
//   from, to       YYYY-MM-DD (inclusive)
//   enquirytype    comma-separated, e.g. Piles,Fissure
//   source         comma-separated, e.g. IVR,Helpline
//   branch         comma-separated, e.g. Baner,DP Road
//   search         patient name or mobile number (partial match)
// List only:
//   page (default 1), limit (default 25, max 200), sort (newest|oldest|name|branch)

var express = require("express");
var router = express.Router();
const { requireDashboardAdmin } = require("../util/dashboardAuth");
const {
  getEnquiries,
  getStats,
  getFilterOptions,
} = require("../models/masterEnquiryDashboardModel");

// Signed-in admins only (see src/util/dashboardAuth.js)
router.use(requireDashboardAdmin);

router.get("/filters", async (req, res, next) => {
  try {
    res.status(200).json(await getFilterOptions());
  } catch (err) {
    next(err);
  }
});

router.get("/stats", async (req, res, next) => {
  try {
    res.status(200).json(await getStats(req.query));
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    res.status(200).json(await getEnquiries(req.query));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
