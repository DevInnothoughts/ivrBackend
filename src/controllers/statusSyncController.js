var express = require("express");
var router = express.Router();
const { startStatusSync } = require("../models/statusSyncModel");

/**
 * POST /ivr/statusSync
 *
 * Called by the app right after an Appointment or Enquiry is saved on any
 * source. Copies the status + note to the same number's other leads at the
 * same branch. Helpline calls are a source only, never a target.
 * See statusSyncModel.js for the rules and body shape.
 *
 * 202 { accepted: true } as soon as the body is valid; the updates then run
 * in the background (rows changed per target go to status_sync.result).
 * 400 if the body is invalid.
 */
router.post("/", (req, res, next) => {
  try {
    res.status(202).send(startStatusSync(req.body || {}));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
