/**
 * patientLookupModel.js
 *
 * "Is this number already a registered patient at this branch?"
 *
 * Used by the slot-booking routes to block booking a registered patient as
 * "New", and by the app (IVR, helpline, web / bot / call leads) to grey out
 * "New" before the agent submits.
 *
 * Additive: the original GET /patient (patientModel.getPatient) is unchanged
 * for older app versions. Both checks here compare the last 10 digits, so
 * '9876543210', '09876543210', '+91 98765 43210' and '91-9876543210' are all
 * the same number. Which columns are matched depends on the caller:
 *   - patient details fetch (GET /appointment/registered-patient):
 *     phone OR mobile_2
 *   - booking check (slot-booking/v2 routes): phone only — mobile_2 is
 *     deliberately not checked when adding an appointment
 *
 * Only confirmed patients (ConfirmPatient = 1) count as registered — the same
 * rule as getPatient and the existing-patient branch of addAppointmentV1.
 * Provisional rows created by earlier bookings (ConfirmPatient = 0) do not.
 */

const { getConnectionByLocation } = require("../../databaseUtils");

// Same normalisation as enquiryCallingListModel.js. REPLACE chain rather than
// REGEXP_REPLACE so it runs on MySQL 5.7 as well as 8.0.
const normPhone = (col) => `
  RIGHT(
    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(${col}, ''), ' ', ''), '-', ''), '+', ''), '(', ''), ')', ''),
    10
  )`;

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/** Any phone format → last 10 digits, or null if fewer than 10 digits. */
function lastTenDigits(phone) {
  if (phone === null || phone === undefined) return null;
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

function queryPromise(con, sql, params) {
  return new Promise((resolve, reject) => {
    con.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

/**
 * Confirmed patients at `location` whose number matches `phone`.
 * Matches phone OR mobile_2 by default; pass {includeMobile2: false} to
 * match the phone column only.
 * Resolves to [{patient_id, name}], newest first — the same array-of-rows
 * shape as GET /patient, so app code written for that works unchanged.
 * Resolves to [] for an unusable number.
 */
async function findRegisteredPatients(
  phone,
  location,
  { includeMobile2 = true } = {},
) {
  const { connection } = getConnectionByLocation(location);
  if (!connection) {
    throw httpError(404, "Invalid location");
  }

  const ten = lastTenDigits(phone);
  if (!ten) return [];

  const numberClause = includeMobile2
    ? `(${normPhone("phone")} = ? OR ${normPhone("mobile_2")} = ?)`
    : `${normPhone("phone")} = ?`;
  const params = includeMobile2 ? [ten, ten] : [ten];

  const sql = `
    SELECT patient_id, name
    FROM patient
    WHERE ConfirmPatient = 1
      AND ${numberClause}
    ORDER BY date DESC
    LIMIT 5`;

  return queryPromise(connection, sql, params);
}

/**
 * Throws 422 when any appointment in the request is "New" for a number that
 * is already a registered patient at that branch. Otherwise resolves.
 *
 * Checks the phone column only — mobile_2 is not checked when adding an
 * appointment (it is only used by the patient details fetch).
 *
 * 422 (not 409) so the app can tell this apart from "slot is full".
 */
async function assertNotNewForRegistered(appointments) {
  const list = Array.isArray(appointments) ? appointments : [];

  for (const a of list) {
    if (!a || a.patient_type !== "New") continue;

    const { connection } = getConnectionByLocation(a.patient_location);
    if (!connection) continue; // the booking function reports invalid location

    const rows = await findRegisteredPatients(
      a.patient_phone,
      a.patient_location,
      { includeMobile2: false },
    );
    if (rows.length > 0) {
      const name = rows[0].name || a.patient_name || "This patient";
      throw httpError(
        422,
        `${name} is already registered at this branch. Choose Follow-up, Post-op, MCDPA or Other instead of New.`,
      );
    }
  }
}

module.exports = {
  findRegisteredPatients,
  assertNotNewForRegistered,
  lastTenDigits,
};
