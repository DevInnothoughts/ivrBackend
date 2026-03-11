var express = require("express");
var router = express.Router();
const {
  addAction,
  getRecords,
  getLeads,
  getBotLeads,
  getMetaLeads,
  getIvrLeads,
  getSalesExecutive,
  getStatusList,
  updateIvrLeadV1,
  updateWebLeadV1,
  updateMetaLeadV1,
  updateBotLeadV1,
  updateWebLeadV2,
  updateBotLeadV2,
  updateMetaLeadV2,
  updateIvrLeadV2,
  uploadJLRCallLogs,
  getCREList,
} = require("../models/actionJLRModel");

router.post("/", async (req, res, next) => {
  try {
    const result = await addAction(req.body);
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const records = await getRecords();
    //console.log(records);
    res.status(200).send(records);
  } catch (err) {
    next(err);
  }
});

router.get("/jlrIvrLeads", async (req, res, next) => {
  try {
    const records = await getIvrLeads();
    //console.log(records);
    res.status(200).send(records);
  } catch (err) {
    next(err);
  }
});

router.get("/jlrWebLeads", async (req, res, next) => {
  try {
    const records = await getLeads(req.query.location);
    //console.log(records);
    res.status(200).send(records);
  } catch (err) {
    next(err);
  }
});

router.get("/jlrBotLeads", async (req, res, next) => {
  try {
    const records = await getBotLeads(req.query.location);
    //console.log(records);
    res.status(200).send(records);
  } catch (err) {
    next(err);
  }
});

router.get("/jlrMetaLeads", async (req, res, next) => {
  try {
    const records = await getMetaLeads(req.query.location);
    //console.log(records);
    res.status(200).send(records);
  } catch (err) {
    next(err);
  }
});

router.get("/executives", async (req, res, next) => {
  try {
    const records = await getSalesExecutive();
    //console.log(records);
    res.status(200).send(records);
  } catch (err) {
    next(err);
  }
});

router.get("/statuses", async (req, res, next) => {
  try {
    const records = await getStatusList();
    //console.log(records);
    res.status(200).send(records);
  } catch (err) {
    next(err);
  }
});

router.get("/cre", async (req, res, next) => {
  try {
    const records = await getCREList();
    //console.log(records);
    res.status(200).send(records);
  } catch (err) {
    next(err);
  }
});

router.post("/updateV1", async (req, res, next) => {
  try {
    console.log("🔄 Received request to /updateV1 with body:", req.body);
    const result = await updateIvrLeadV1(req.body);
    res
      .status(200)
      .json({ message: "Lead updated successfully", data: result });
  } catch (err) {
    console.error("❌ Error in POST /updateV1:", err);
    next(err);
  }
});

router.post("/updateV2", async (req, res, next) => {
  try {
    console.log("🔄 Received request to /updateV2 with body:", req.body);
    const result = await updateIvrLeadV2(req.body);
    res
      .status(200)
      .json({ message: "Lead updated successfully", data: result });
  } catch (err) {
    console.error("❌ Error in POST /updateV2:", err);
    next(err);
  }
});

router.post("/updateWebLeadV1", async (req, res, next) => {
  try {
    console.log("🔄 Received request to /updateWebLeadV1 with body:", req.body);
    const result = await updateWebLeadV1(req.body);
    res
      .status(200)
      .json({ message: "Lead updated successfully", data: result });
  } catch (err) {
    console.error("❌ Error in POST /updateWebLeadV1:", err);
    next(err);
  }
});

router.post("/updateWebLeadV2", async (req, res, next) => {
  try {
    console.log("🔄 Received request to /updateWebLeadV2 with body:", req.body);
    const result = await updateWebLeadV2(req.body);
    res
      .status(200)
      .json({ message: "Lead updated successfully", data: result });
  } catch (err) {
    console.error("❌ Error in POST /updateWebLeadV2:", err);
    next(err);
  }
});

router.post("/updateMetaLeadV1", async (req, res, next) => {
  try {
    console.log(
      "🔄 Received request to /updateMetaLeadV1 with body:",
      req.body
    );
    const result = await updateMetaLeadV1(req.body);
    res
      .status(200)
      .json({ message: "Lead updated successfully", data: result });
  } catch (err) {
    console.error("❌ Error in POST /updateMetaLeadV1:", err);
    next(err);
  }
});
router.post("/updateMetaLeadV2", async (req, res, next) => {
  try {
    console.log(
      "🔄 Received request to /updateMetaLeadV2 with body:",
      req.body
    );
    const result = await updateMetaLeadV2(req.body);
    res
      .status(200)
      .json({ message: "Lead updated successfully", data: result });
  } catch (err) {
    console.error("❌ Error in POST /updateMetaLeadV2:", err);
    next(err);
  }
});

router.post("/updateBotLeadV1", async (req, res, next) => {
  try {
    console.log("🔄 Received request to /updateBotLeadV1 with body:", req.body);
    const result = await updateBotLeadV1(req.body);
    res
      .status(200)
      .json({ message: "Lead updated successfully", data: result });
  } catch (err) {
    console.error("❌ Error in POST /updateBotLeadV1:", err);
    next(err);
  }
});

router.post("/updateBotLeadV2", async (req, res, next) => {
  try {
    console.log("🔄 Received request to /updateBotLeadV2 with body:", req.body);
    const result = await updateBotLeadV2(req.body);
    res
      .status(200)
      .json({ message: "Lead updated successfully", data: result });
  } catch (err) {
    console.error("❌ Error in POST /updateBotLeadV2:", err);
    next(err);
  }
});

router.post("/helpline", async (req, res, next) => {
  try {
    const result = await uploadJLRCallLogs(req.body, req.query.mobile, "JLR");
    console.log("Helpline call logs uploaded:", result);
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
