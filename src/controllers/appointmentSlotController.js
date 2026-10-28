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
 *
 * Added later (Oct 2026) — "New" blocked for registered patients:
 *
 *   GET  /ivr/appointment/registered-patient?mobile=<any format>&location=<branch>
 *   POST /ivr/appointment/slot-booking/v2            (same body as POST /)
 *   POST /ivr/appointment/helpline/slot-booking/v2   (same body as POST /helpline)
 *
 * The v2 booking routes do everything slot-booking does, and first reject a
 * "New" booking with 422 when the number is already a confirmed patient at
 * the branch (phone column only, last-10-digit match). registered-patient
 * (the patient details fetch) also matches mobile_2. slot-booking itself is
 * left exactly as it was, so the app build already in use is unaffected.
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
const {
  findRegisteredPatients,
  assertNotNewForRegistered,
} = require("../models/patientLookupModel");

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

// ---------------------------------------------------------------------
// Registered-patient check (v2)
// ---------------------------------------------------------------------

// Returns [{patient_id, name}] — same array shape as GET /patient, [] if none.
router.get("/registered-patient", async (req, res, next) => {
  try {
    const rows = await findRegisteredPatients(
      req.query.mobile,
      req.query.location,
    );
    res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
});

// 422 if "New" for a registered patient, 409 if the slot is full.
router.post("/slot-booking/v2", async (req, res, next) => {
  try {
    await assertNotNewForRegistered(req.body);
    const result = await withSlotGuard(req.body, () =>
      addAppointmentV1(req.body),
    );
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

router.post("/helpline/slot-booking/v2", async (req, res, next) => {
  try {
    await assertNotNewForRegistered(req.body);
    const result = await withSlotGuard(req.body, () =>
      addHelplineAppointment(req.body),
    );
    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
