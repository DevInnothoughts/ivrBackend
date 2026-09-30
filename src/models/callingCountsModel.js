/* eslint-disable prettier/prettier */
/**
 * callingCountsModel.js
 *
 * Supplies the numbers for the Daily Callings dashboard.
 *
 * WHY A DEDICATED ENDPOINT
 * ------------------------
 * The obvious approach is to call the eight existing /callingList/* endpoints
 * and count the rows. That pulls every column of every row across eight
 * requests, through pools capped at 5 connections, just to read .length.
 *
 * This does the same job in three aggregate queries on a single connection.
 * Each queue's WHERE clause mirrors its list endpoint exactly, so the number
 * on the dashboard always matches what the user sees when they tap through.
 *
 * PARTIAL FAILURE IS FINE
 * -----------------------
 * Each query is guarded independently. If one table is missing or slow, that
 * queue reports null and the dashboard simply omits its count rather than the
 * whole screen failing.
 */

const { getConnectionByLocation } = require("../../databaseUtils");

const DAYS = "(3, 7, 15, 30)";

function queryOne(conn, sql) {
  return new Promise((resolve, reject) => {
    conn.query(sql, (err, rows) => {
      if (err) return reject(err);
      resolve(rows && rows[0] ? rows[0] : {});
    });
  });
}

/* Diagnosis-driven queues: Surgery, Medication, Test, MCDPA.
 * diagnosisAdvice is matched with a leading wildcard, so no index can be used
 * either way — one scan with conditional aggregation beats four scans. */
const DIAGNOSIS_SQL = `
  SELECT
    SUM(CASE WHEN diagnosisAdvice LIKE '%Surgery%'
              AND DATEDIFF(CURDATE(), date_diagnosis) IN ${DAYS} THEN 1 ELSE 0 END) AS surgery_due,
    SUM(CASE WHEN diagnosisAdvice LIKE '%Surgery%'
              AND callbackDate = CURDATE() THEN 1 ELSE 0 END) AS surgery_callback,

    SUM(CASE WHEN diagnosisAdvice LIKE '%Medication%'
              AND DATEDIFF(CURDATE(), date_diagnosis) IN ${DAYS} THEN 1 ELSE 0 END) AS medication_due,
    SUM(CASE WHEN diagnosisAdvice LIKE '%Medication%'
              AND callbackDate = CURDATE() THEN 1 ELSE 0 END) AS medication_callback,

    SUM(CASE WHEN diagnosisAdvice LIKE '%Test%'
              AND DATEDIFF(CURDATE(), date_diagnosis) IN ${DAYS} THEN 1 ELSE 0 END) AS test_due,
    SUM(CASE WHEN diagnosisAdvice LIKE '%Test%'
              AND callbackDate = CURDATE() THEN 1 ELSE 0 END) AS test_callback,

    SUM(CASE WHEN diagnosisAdvice LIKE '%MCDPA%'
              AND DATEDIFF(CURDATE(), date_diagnosis) IN ${DAYS} THEN 1 ELSE 0 END) AS mcdpa_due,
    SUM(CASE WHEN diagnosisAdvice LIKE '%MCDPA%'
              AND callbackDate = CURDATE() THEN 1 ELSE 0 END) AS mcdpa_callback
  FROM diagnosis
`;

/* Post-op queue, driven by discharge date. */
const IPD_SQL = `
  SELECT
    SUM(CASE WHEN DATEDIFF(CURDATE(), DOD) IN ${DAYS} THEN 1 ELSE 0 END) AS ipd_due,
    SUM(CASE WHEN callbackDate = CURDATE() THEN 1 ELSE 0 END) AS ipd_callback
  FROM discharge_card
`;

/* Appointment queues. Mirrors the COALESCE(confirm_time, 0) = 0 filter used by
 * getTodaysAppointment / getTomorrowsAppointment — unconfirmed only. */
const APPOINTMENT_SQL = `
  SELECT
    SUM(CASE WHEN DATE(appointment_timestamp) = CURDATE()
              AND COALESCE(confirm_time, 0) = 0 THEN 1 ELSE 0 END) AS today_due,
    SUM(CASE WHEN DATE(appointment_timestamp) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
              AND COALESCE(confirm_time, 0) = 0 THEN 1 ELSE 0 END) AS tomorrow_due
  FROM appointment
`;

const num = (v) => (v === null || v === undefined ? 0 : Number(v));

async function getCallingCounts(loc) {
  const { connection } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error(`Invalid location: ${loc}`);
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(async function (err, tempCon) {
      // Guard the release — calling .release() on an undefined connection
      // throws inside the callback and the promise never settles.
      if (err) {
        if (tempCon) tempCon.release();
        return reject(err);
      }

      const counts = {};

      const safe = async (sql, map) => {
        try {
          map(await queryOne(tempCon, sql));
        } catch (e) {
          console.error("[callingCounts] query failed:", e.message);
        }
      };

      try {
        await safe(DIAGNOSIS_SQL, (r) => {
          counts.surgeryAdvised = {
            due: num(r.surgery_due),
            callback: num(r.surgery_callback),
          };
          counts.medicationAdvised = {
            due: num(r.medication_due),
            callback: num(r.medication_callback),
          };
          counts.testAdvised = {
            due: num(r.test_due),
            callback: num(r.test_callback),
          };
          counts.mcdpa = {
            due: num(r.mcdpa_due),
            callback: num(r.mcdpa_callback),
          };
        });

        await safe(IPD_SQL, (r) => {
          counts.ipd = { due: num(r.ipd_due), callback: num(r.ipd_callback) };
        });

        await safe(APPOINTMENT_SQL, (r) => {
          counts.todaysAppointments = { due: num(r.today_due) };
          counts.tomorrowAppointments = { due: num(r.tomorrow_due) };
        });

        resolve(counts);
      } catch (e) {
        reject(e);
      } finally {
        tempCon.release();
      }
    });
  });
}

module.exports = { getCallingCounts };
