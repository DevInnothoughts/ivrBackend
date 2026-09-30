/* eslint-disable prettier/prettier */
/**
 * enquiryCallingListModel.js
 *
 * getCallingListV2 — Enquiry Calls, with converted leads removed.
 *
 * ADDITIVE. Nothing in callingListModel.js is modified. getCallingListV1 and
 * GET /callingList/v1 keep working exactly as before, so you can switch the
 * app back by changing one string if anything looks wrong.
 *
 * V2 excludes two groups V1 kept calling:
 *   1. Anyone whose mobile number already has an appointment.
 *   2. Anyone who has visited — detected by Uid_no on their patient record.
 *
 * Response shape is identical to V1: an object keyed by 3 / 7 / 15 / 30 plus
 * "callback", each an array of enquiry rows. The screen needs no changes
 * beyond pointing at the new endpoint.
 */

const { getConnectionByLocation } = require("../../databaseUtils");

/* ------------------------------------------------------------------ */
/* Column names                                                        */
/* ------------------------------------------------------------------ */
// Uid_no is issued when a patient is registered at the clinic, so its
// presence means they turned up.
//
// Still worth confirming the phone column if you have not already:
//   SHOW COLUMNS FROM patient LIKE '%phone%';
//
// If Uid_no lives on another table, change the second NOT EXISTS block only.
const PATIENT_UID_COLUMN = "Uid_no";
const PATIENT_PHONE_COLUMN = "phone";

/**
 * Set to false to suppress an enquiry on ANY appointment ever made against
 * that number, rather than only appointments dated on or after the enquiry.
 *
 * Default true means a patient who came two years ago and enquires again
 * today is still called — they have a new need. With false, one old
 * appointment silently suppresses every future enquiry from that number.
 */
const ONLY_APPOINTMENTS_AFTER_ENQUIRY = true;

/* ------------------------------------------------------------------ */
/* Local copy of the calling_notes normaliser                          */
/* ------------------------------------------------------------------ */
/**
 * callingListModel.js has its own copy but does not export it. Duplicated
 * here rather than modifying that file, which is the point of this module.
 *
 * calling_notes may be '{}', NULL or malformed JSON; the client expects a
 * JSON array string it can JSON.parse(...).map(...).
 */
function normalizeNotesString(raw) {
  if (!raw) return "[]";
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? JSON.stringify(parsed) : "[]";
  } catch {
    return "[]";
  }
}

function normalizeRowsNotes(rows) {
  if (Array.isArray(rows)) {
    for (const r of rows) {
      if (r && "calling_notes" in r) {
        r.calling_notes = normalizeNotesString(r.calling_notes);
      }
    }
  }
  return rows;
}

/* ------------------------------------------------------------------ */
/* Phone normalisation                                                 */
/* ------------------------------------------------------------------ */
/**
 * Phone numbers are not stored consistently across tables.
 *
 *   addEnquiry         strips '+91', '91' and a leading '0'
 *   addHelplineEnquiry strips only a leading '0'
 *
 * So the same person is '9876543210' in one table and '+919876543210' or
 * '09876543210' in another. A plain `=` misses those — and a missed match
 * here means a booked patient stays in the calling list, which is the whole
 * problem being solved. Comparing the last 10 digits of a stripped string
 * matches every observed format.
 *
 * REPLACE chain rather than REGEXP_REPLACE so this runs on MySQL 5.7 as well
 * as 8.0. On 8.0 you may prefer RIGHT(REGEXP_REPLACE(col, '[^0-9]', ''), 10).
 */
const normPhone = (col) => `
  RIGHT(
    REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(${col}, ''), ' ', ''), '-', ''), '+', ''), '(', ''),
    10
  )`;

const appointmentDateClause = ONLY_APPOINTMENTS_AFTER_ENQUIRY
  ? "AND DATE(a.appointment_timestamp) >= DATE(e.date)"
  : "";

/**
 * The two exclusions. `e` is the appointment_enquiry alias in the outer query.
 *
 * NOT EXISTS rather than a LEFT JOIN: a join emits one row per matching
 * appointment, so a patient with one confirmed and one unconfirmed booking
 * produces a row that passes a confirm_time filter and stays in the list.
 * That is the bug in V1. NOT EXISTS asks the question once and cannot
 * multiply rows, so no DISTINCT is needed either.
 */
const EXCLUSIONS = `
  AND NOT EXISTS (
    SELECT 1
    FROM appointment a
    WHERE ${normPhone("a.patient_phone")} = ${normPhone("e.patient_phone")}
      ${appointmentDateClause}
  )
  AND NOT EXISTS (
    SELECT 1
    FROM patient p
    WHERE ${normPhone(`p.${PATIENT_PHONE_COLUMN}`)} = ${normPhone("e.patient_phone")}
      AND p.${PATIENT_UID_COLUMN} IS NOT NULL
      AND TRIM(p.${PATIENT_UID_COLUMN}) <> ''
  )
`;

/* ------------------------------------------------------------------ */
/* Query                                                               */
/* ------------------------------------------------------------------ */

async function getCallingListV2(loc) {
  const { connection } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error(`Invalid location: ${loc}`);
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      // Guard the release — calling .release() on an undefined connection
      // throws inside the callback and the promise never settles, so the
      // request hangs until the client's 10s timeout instead of erroring.
      if (err) {
        if (tempCon) tempCon.release();
        return reject(err);
      }

      // 👉 Query 1: enquiries logged exactly 3 / 7 / 15 / 30 days ago
      const daysQuery = `
        SELECT
          e.enquiry_id,
          e.enquirytype,
          e.patient_name,
          e.patient_phone,
          e.date,
          e.note,
          e.calling_notes,
          e.callbackDate,
          DATEDIFF(CURDATE(), e.date) AS days_since
        FROM appointment_enquiry e
        WHERE
          e.enquirytype != 'Visited'
          AND DATEDIFF(CURDATE(), e.date) IN (3, 7, 15, 30)
          ${EXCLUSIONS}
        ORDER BY e.enquiry_id ASC
      `;

      // 👉 Query 2: callback scheduled for today
      //
      // DATE(e.callbackDate) rather than a bare comparison — if the column is
      // DATETIME, `callbackDate = CURDATE()` matches only rows stored at
      // exactly midnight and silently drops the rest.
      const callbackQuery = `
        SELECT
          e.enquiry_id,
          e.enquirytype,
          e.patient_name,
          e.patient_phone,
          e.date,
          e.note,
          e.calling_notes,
          e.callbackDate
        FROM appointment_enquiry e
        WHERE
          e.enquirytype != 'Visited'
          AND DATE(e.callbackDate) = CURDATE()
          ${EXCLUSIONS}
        ORDER BY e.enquiry_id ASC
      `;

      tempCon.query(daysQuery, function (err1, rows1) {
        if (err1) {
          tempCon.release();
          return reject(err1);
        }

        normalizeRowsNotes(rows1);

        const groupedData = rows1.reduce((acc, row) => {
          const daysSince = row.days_since;
          if (!acc[daysSince]) {
            acc[daysSince] = [];
          }
          acc[daysSince].push(row);
          return acc;
        }, {});

        tempCon.query(callbackQuery, function (err2, rows2) {
          tempCon.release();
          if (err2) {
            return reject(err2);
          }

          groupedData["callback"] = normalizeRowsNotes(rows2);
          resolve(groupedData);
        });
      });
    });
  });
}

/**
 * Diagnostic: which enquiries V2 drops that V1 kept, and why.
 *
 * Use this to confirm the exclusions are behaving before switching the app
 * over, and to explain the drop in the tab count to staff.
 */
async function getExcludedEnquiries(loc) {
  const { connection } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error(`Invalid location: ${loc}`);
    err.status = 404;
    throw err;
  }

  const query = `
    SELECT
      e.enquiry_id,
      e.patient_name,
      e.patient_phone,
      e.date,
      DATEDIFF(CURDATE(), e.date) AS days_since,
      EXISTS (
        SELECT 1 FROM appointment a
        WHERE ${normPhone("a.patient_phone")} = ${normPhone("e.patient_phone")}
          ${appointmentDateClause}
      ) AS has_appointment,
      EXISTS (
        SELECT 1 FROM patient p
        WHERE ${normPhone(`p.${PATIENT_PHONE_COLUMN}`)} = ${normPhone("e.patient_phone")}
          AND p.${PATIENT_UID_COLUMN} IS NOT NULL
          AND TRIM(p.${PATIENT_UID_COLUMN}) <> ''
      ) AS has_visited
    FROM appointment_enquiry e
    WHERE
      e.enquirytype != 'Visited'
      AND DATEDIFF(CURDATE(), e.date) IN (3, 7, 15, 30)
    HAVING has_appointment = 1 OR has_visited = 1
    ORDER BY e.enquiry_id ASC
  `;

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        if (tempCon) tempCon.release();
        return reject(err);
      }

      tempCon.query(query, function (error, rows) {
        tempCon.release();
        if (error) return reject(error);

        rows.forEach((r) => {
          r.reason = r.has_appointment
            ? "Already booked an appointment"
            : "Already visited (has Uid_no)";
        });

        resolve(rows);
      });
    });
  });
}

module.exports = {
  getCallingListV2,
  getExcludedEnquiries,
};
