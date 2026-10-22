/**
 * appointmentSlotController.js
 *
 * New, slot-aware appointment routes (15-minute slots, max 3 per slot).
 *
 * Mounted on the same /ivr/appointment prefix as appointmentController.js,
 * but only adds NEW paths. The original routes (/, /helpline, /v2,
 * /helpline/v2) are not touched, so older app versions keep booking exactly
 * as before. Only the new app version calls the paths below.
 *
 *   GET  /ivr/appointment/slots?date=YYYY-MM-DD&location=<branch>
 *   POST /ivr/appointment/slot-booking            (same body as POST /)
 *   POST /ivr/appointment/helpline/slot-booking   (same body as POST /helpline)
 *
 * The booking routes call the existing addAppointmentV1 /
 * addHelplineAppointment unchanged, inside withSlotGuard(), which returns
 * 409 when the chosen slot already has 3 appointments.
 */

var express = require("express");
var router = express.Router();
const {
  addAppointmentV1,
  addHelplineAppointment,
} = require("../models/appointmentModel");
const {
  getSlotAvailability,
  withSlotGuard,
} = require("../models/appointmentSlotModel");

router.get("/slots", async (req, res, next) => {
  try {
    const result = await getSlotAvailability(
      req.query.date,
      req.query.location,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/slot-booking", async (req, res, next) => {
  try {
    const result = await withSlotGuard(req.body, () =>
      addAppointmentV1(req.body),
    );
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

router.post("/helpline/slot-booking", async (req, res, next) => {
  try {
    const result = await withSlotGuard(req.body, () =>
      addHelplineAppointment(req.body),
    );
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
