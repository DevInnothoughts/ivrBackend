// src/models/masterEnquiryModel.js
//
// Writes a copy of each enquiry / appointment lead into
// hhc_appointments.master_enquiry, tagged with source and branch.
// Used only by the *V2 functions; existing functions are untouched.

const { getConnectionByLocation } = require("../../databaseUtils");

// Canonical source names stored in master_enquiry.source_name
const SOURCES = {
  IVR: "IVR",
  HELPLINE: "Helpline",
  WEB_LEAD: "Web Lead",
  CHATBOT: "Chatbot",
  UNKNOWN: "Unknown",
};

// Accept a few spellings from the app and map them to one canonical name
const SOURCE_ALIASES = {
  ivr: SOURCES.IVR,
  helpline: SOURCES.HELPLINE,
  web: SOURCES.WEB_LEAD,
  weblead: SOURCES.WEB_LEAD,
  "web lead": SOURCES.WEB_LEAD,
  website: SOURCES.WEB_LEAD,
  bot: SOURCES.CHATBOT,
  chatbot: SOURCES.CHATBOT,
  "chat bot": SOURCES.CHATBOT,
};

/**
 * Resolve the source name for a request.
 * 1. `source` sent by the app wins (mapped through SOURCE_ALIASES; any other
 *    non-empty value is stored as sent, so new sources need no code change).
 * 2. Otherwise fall back to the endpoint's default (Helpline for /helpline).
 * 3. Otherwise, a payload carrying Call_Date came from an IVR call screen.
 */
function resolveSource(payload, fallback) {
  const raw = payload && payload.source ? String(payload.source).trim() : "";
  if (raw) return SOURCE_ALIASES[raw.toLowerCase()] || raw.slice(0, 50);
  if (fallback) return fallback;
  if (payload && payload.Call_Date) return SOURCES.IVR;
  return SOURCES.UNKNOWN;
}

function normalizeIndianPhone(phone) {
  if (!phone && phone !== 0) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(-10);
  return digits || null;
}

function queryMaster(sql, params) {
  const { connection } = getConnectionByLocation("lead"); // hhc_appointments
  return new Promise((resolve, reject) => {
    connection.getConnection((err, con) => {
      if (err) return reject(err);
      con.query(sql, params, (qErr, result) => {
        con.release();
        if (qErr) return reject(qErr);
        resolve(result);
      });
    });
  });
}

/**
 * Save enquiry rows to master_enquiry.
 *
 * @param {Array}  enquiries        request body items
 * @param {Object} opts
 * @param {string} opts.branchName  canonical location from getConnectionByLocation
 * @param {string} opts.source      resolved source name
 * @param {number} [opts.firstBranchEnquiryId] insertId of the branch insert;
 *                                  rows get consecutive ids from here
 */
async function saveEnquiriesToMaster(enquiries, opts) {
  const { branchName, source, firstBranchEnquiryId } = opts;

  let linked = 0;
  const toInsert = [];

  for (let i = 0; i < enquiries.length; i++) {
    const e = enquiries[i];
    const phone = normalizeIndianPhone(e.patient_phone);
    const branchEnquiryId =
      firstBranchEnquiryId != null ? firstBranchEnquiryId + i : null;

    // The app calls /enquiry with enquirytype 'Appointment' right after
    // booking a New patient. addAppointmentV2 has already written a master
    // row for that booking, so link to it instead of creating a duplicate.
    if (e.enquirytype === "Appointment" && branchEnquiryId != null) {
      const upd = await queryMaster(
        `UPDATE master_enquiry
            SET branch_enquiry_id = ?, enquirytype = ?, reference = ?
          WHERE branch_name = ?
            AND patient_phone = ?
            AND record_type = 'Appointment'
            AND branch_enquiry_id IS NULL
            AND created_at >= NOW() - INTERVAL 30 MINUTE
          ORDER BY master_enquiry_id DESC
          LIMIT 1`,
        [
          branchEnquiryId,
          e.enquirytype,
          e.reference || null,
          branchName,
          phone,
        ],
      );
      if (upd.affectedRows > 0) {
        linked++;
        continue;
      }
    }

    toInsert.push([
      source,
      branchName,
      e.patient_location || null,
      e.enquirytype === "Appointment" ? "Appointment" : "Enquiry",
      branchEnquiryId,
      e.patient_type || null,
      e.enquirytype || null,
      e.patient_name || null,
      phone,
      e.date || null,
      e.time || null,
      e.reference || null,
      e.FDE_Name || null,
      e.note || null,
      null, // doctor_id
    ]);
  }

  if (toInsert.length > 0) {
    await queryMaster(
      `INSERT IGNORE INTO master_enquiry
        (source_name, branch_name, received_location, record_type, branch_enquiry_id,
         patient_type, enquirytype, patient_name, patient_phone,
         enquiry_date, enquiry_time, reference, FDE_Name, note, doctor_id)
       VALUES ?`,
      [toInsert],
    );
  }

  return { inserted: toInsert.length, linked };
}

/**
 * Save appointment rows to master_enquiry (record_type = 'Appointment').
 * branch_enquiry_id stays NULL until the follow-up /enquiry/v2 call links it.
 */
async function saveAppointmentsToMaster(appointments, opts) {
  const { branchName, source } = opts;

  const rows = appointments.map((a) => [
    source,
    branchName,
    a.patient_location || null,
    "Appointment",
    null,
    a.patient_type || null,
    "Appointment",
    a.patient_name || null,
    normalizeIndianPhone(a.patient_phone),
    a.date || null,
    a.time || null,
    a.reference || null,
    a.FDE_Name || null,
    a.note || null,
    a.doctor_id != null ? String(a.doctor_id) : null,
  ]);

  await queryMaster(
    `INSERT INTO master_enquiry
      (source_name, branch_name, received_location, record_type, branch_enquiry_id,
       patient_type, enquirytype, patient_name, patient_phone,
       enquiry_date, enquiry_time, reference, FDE_Name, note, doctor_id)
     VALUES ?`,
    [rows],
  );

  return { inserted: rows.length };
}

module.exports = {
  SOURCES,
  resolveSource,
  saveEnquiriesToMaster,
  saveAppointmentsToMaster,
};
