var express = require("express");
var router = express.Router();
const {
  getLeads,
  updateStatus,
  getChatBotLeads,
  updateStatusBot,
  transferToBranch,
  createSulekhaLead,
} = require("../models/leadManagementModel");

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
    const note = req.body.note ?? null;
    const leads = await updateStatus(id, status, note);
    res.status(200).send(leads);
  } catch (err) {
    next(err);
  }
});

router.get("/bot", async (req, res, next) => {
  try {
    const leads = await getChatBotLeads(req.query.location);
    res.status(200).send(leads);
  } catch (err) {
    next(err);
  }
});

router.post("/updateStatus/bot", async (req, res, next) => {
  try {
    const { id } = req.query;
    const { status } = req.body;
    const note = req.body.note ?? null;
    const leads = await updateStatusBot(id, status, note);
    res.status(200).send(leads);
  } catch (err) {
    next(err);
  }
});

router.post("/transferLead", async (req, res, next) => {
  try {
    const { id, toBranch } = req.body;
    console.log(id, toBranch);
    const leads = await transferToBranch(id, toBranch);
    res.status(200).send(leads);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/sulekha-leads
 */
router.post("/sulekha-leads", async (req, res, next) => {
  try {
    const {
      location,
      user_name,
      user_mobile,
      user_email,
      user_city,
      user_localities,
      user_comments,
      keywords,
    } = req.body;

    // Basic validation
    if (!user_mobile) {
      return res.status(400).send({
        success: false,
        message: "user_mobile is required",
      });
    }

    const result = await createSulekhaLead(location, {
      user_name,
      user_mobile,
      user_email,
      user_city,
      location,
      user_localities,
      user_comments,
      keywords,
    });

    res.status(200).send({
      success: true,
      message: "Lead saved successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
