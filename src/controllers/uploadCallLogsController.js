var express = require("express");
var router = express.Router();
const { uploadCallLogs } = require("../models/uploadCallLogsModel");

router.post("/", async (req, res, next) => {
  try {
    const result = await uploadCallLogs(
      req.query.location,
      req.query.mobile,
      req.body
    );
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
