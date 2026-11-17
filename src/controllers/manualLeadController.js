// src/controllers/manualLeadController.js
//
// Manual lead entry from the Master Enquiry dashboard — mounted at
// /ivr/manualLead in app.js. Signed-in dashboard admins only.
//
//   GET  /ivr/manualLead/options   sources (Web Lead / Chatbot / Call Lead)
//                                  with their fields, branches, treatments
//   POST /ivr/manualLead           save one lead into appointments /
//                                  chatbot_leads / call_leads
//     body: { source, branch, phone, date, time, details: {...}, confirmDuplicate }
//     201 { id, source, table, branch, phone, name, leadAt }
//     400 { message, errors: { field: msg } }
//     409 { message, duplicates: [...] }   same number in that table in the
//                                          last 30 days; resend with
//                                          confirmDuplicate: true
//
// See src/models/manualLeadModel.js.

var express = require("express");
var router = express.Router();
const { requireDashboardAdmin } = require("../util/dashboardAuth");
const {
  getManualLeadOptions,
  addManualLead,
} = require("../models/manualLeadModel");

router.use(requireDashboardAdmin);

router.get("/options", async (req, res, next) => {
  try {
    res.status(200).json(await getManualLeadOptions());
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    res.status(201).json(await addManualLead(req.body, req.dashboardUser));
  } catch (err) {
    // Field errors / duplicate list go back as JSON for the form
    if (err.status && err.data) {
      return res.status(err.status).json({ message: err.message, ...err.data });
    }
    next(err);
  }
});

module.exports = router;
