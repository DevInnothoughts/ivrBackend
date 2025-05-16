var express = require("express");
var router = express.Router();
const { getLeads, updateStatus } = require("../models/leadManagementModel");

router.get("/", async (req, res, next) => {
  try {
    const leads = await getLeads(req.query.location);
    res.status(200).send(leads);
  } catch (err) {
    next(err);
  }
});
router.post("/updateStatus", async (req, res, next) => {
  try {
    const { id } = req.query;
    const { status } = req.body;
    const leads = await updateStatus(id, status);
    res.status(200).send(leads);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
