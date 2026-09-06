const { getConnectionByLocation } = require("../../databaseUtils");

// calling_notes may be stored as '{}', NULL, or malformed JSON, but the client
// expects a JSON array string it can JSON.parse(...).map(...). Coerce anything
// that isn't a JSON array into '[]' so the UI never crashes.
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

async function getCallingList(loc) {
  const { connection, location } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error("Invalid location", loc);
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      const sql = `
        SELECT DISTINCT
          e.enquiry_id, 
          e.enquirytype, 
          e.patient_name, 
          e.patient_phone, 
          e.date, 
          e.note,
          e.calling_notes, 
          DATEDIFF(CURDATE(), e.date) AS days_since
        FROM 
          appointment_enquiry e
        LEFT JOIN 
          appointment a
        ON 
          e.patient_phone = a.patient_phone
        WHERE 
          e.enquirytype != 'Visited'
          AND (a.patient_phone IS NULL OR a.confirm_time = 0)
          AND DATEDIFF(CURDATE(), e.date) IN (3, 7, 15, 30) -- Only fetch specific days
        ORDER BY 
          e.enquiry_id ASC
      `;

      tempCon.query(sql, function (error, rows) {
        tempCon.release();
        if (error) {
          return reject(error);
        }

        // Group data by exact days
        const groupedData = rows.reduce((acc, row) => {
          const daysSince = row.days_since;
          if (!acc[daysSince]) {
            acc[daysSince] = [];
          }
          acc[daysSince].push(row);
          return acc;
        }, {});

        console.log(groupedData); // Log the grouped data
        resolve(groupedData);
      });
    });
  });
}

async function getCallingListV1(loc) {
  const { connection } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error("Invalid location", loc);
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      // 👉 Query 1: 3,7,15,30 days
      const daysQuery = `
        SELECT DISTINCT
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
        LEFT JOIN appointment a
          ON e.patient_phone = a.patient_phone
        WHERE 
          e.enquirytype != 'Visited'
          AND (a.patient_phone IS NULL OR a.confirm_time = 0)
          AND DATEDIFF(CURDATE(), e.date) IN (3, 7, 15, 30)
        ORDER BY e.enquiry_id ASC
      `;

      // 👉 Query 2: Callback today
      const callbackQuery = `
        SELECT DISTINCT
          e.enquiry_id, 
          e.enquirytype, 
          e.patient_name, 
          e.patient_phone, 
          e.date, 
          e.note,
          e.calling_notes,
          e.callbackDate
        FROM appointment_enquiry e
        LEFT JOIN appointment a
          ON e.patient_phone = a.patient_phone
        WHERE 
          e.enquirytype != 'Visited'
          AND (a.patient_phone IS NULL OR a.confirm_time = 0)
          AND e.callbackDate = CURDATE()
        ORDER BY e.enquiry_id ASC
      `;

      // 👉 Execute first query
      tempCon.query(daysQuery, function (err1, rows1) {
        if (err1) {
          tempCon.release();
          return reject(err1);
        }

        normalizeRowsNotes(rows1);

        // Group by days
        const groupedData = rows1.reduce((acc, row) => {
          const daysSince = row.days_since;
          if (!acc[daysSince]) {
            acc[daysSince] = [];
          }
          acc[daysSince].push(row);
          return acc;
        }, {});

        // 👉 Execute callback query
        tempCon.query(callbackQuery, function (err2, rows2) {
          tempCon.release();

          if (err2) {
            return reject(err2);
          }

          // 👉 Add callback group
          groupedData["callback"] = normalizeRowsNotes(rows2);

          resolve(groupedData);
        });
      });
    });
  });
}

async function getDiagnosisCallingList(loc) {
  const { connection, location } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error("Invalid location", loc);
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      const sql = `
        SELECT DISTINCT
          d.patient_id,
          p.name AS patient_name,
          p.phone AS patient_phone,
          d.date_diagnosis,
          d.diagnosis,
          d.diagnosisAdvice,
          d.calling_notes,
          CASE 
            WHEN d.date_diagnosis >= DATE_SUB(CURDATE(), INTERVAL 3 DAY) THEN '3 days'
            WHEN d.date_diagnosis >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN '7 days'
            WHEN d.date_diagnosis >= DATE_SUB(CURDATE(), INTERVAL 15 DAY) THEN '15 days'
            WHEN d.date_diagnosis >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN '30 days'
          END AS date_group
        FROM 
          diagnosis d
        LEFT JOIN 
          patient p
        ON 
          d.patient_id = p.patient_id
        WHERE 
          d.date_diagnosis >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ORDER BY 
          d.patient_id ASC;
      `;

      tempCon.query(sql, function (error, rows) {
        tempCon.release();
        if (error) {
          return reject(error);
        }

        // Group the data by `date_group`
        const groupedData = rows.reduce((acc, row) => {
          if (!row.date_group) return acc;

          if (!acc[row.date_group]) {
            acc[row.date_group] = [];
          }
          acc[row.date_group].push(row);
          return acc;
        }, {});
        console.log(groupedData);
        resolve(groupedData);
      });
    });
  });
}

async function getSurgeryPatients(loc) {
  const { connection, location } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error("Invalid location", loc);
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      const sql = `
        SELECT DISTINCT
          d.diag_id,
          d.patient_id,
          p.name AS patient_name,
          p.phone AS patient_phone,
          d.date_diagnosis,
          d.diagnosis,
          d.diagnosisAdvice,
          d.calling_notes,
          DATEDIFF(CURDATE(), d.date_diagnosis) AS days_since
        FROM 
          diagnosis d
        LEFT JOIN 
          patient p
        ON 
          d.patient_id = p.patient_id
        WHERE 
          DATEDIFF(CURDATE(), d.date_diagnosis) IN (3, 7, 15, 30) -- Fetch specific days only
          AND d.diagnosisAdvice LIKE '%Surgery%'
        ORDER BY 
          d.patient_id ASC;
      `;

      tempCon.query(sql, function (error, rows) {
        tempCon.release();
        if (error) {
          return reject(error);
        }

        // Group the data by `days_since`
        const groupedData = rows.reduce((acc, row) => {
          const daysSince = row.days_since;
          if (!acc[daysSince]) {
            acc[daysSince] = [];
          }
          acc[daysSince].push(row);
          return acc;
        }, {});

        //console.log(groupedData); // Log the grouped data
        resolve(groupedData);
      });
    });
  });
}

/* =====================================================================
 * SURGERY CALLING LIST — calling_notes cleaner
 * =====================================================================
 * WHY THIS EXISTS
 * -------------------------------------------------------------------
 * The published mobile app renders the notes like this:
 *
 *     item.calling_notes && JSON.parse(item.calling_notes).map(n => n.note)
 *
 * So whatever we send back MUST obey two rules, or the screen crashes:
 *
 *   RULE 1  There ARE notes  -> send a JSON *string* of an array,
 *                               e.g. '[{"note":"Called","date":"2026-07-28T..."}]'
 *                               (a string, because the app calls JSON.parse on it)
 *
 *   RULE 2  There are NO notes -> send null, NOT '[]'.
 *                               '[]' is a non-empty string, so the app's
 *                               `item.calling_notes &&` check passes and it
 *                               draws an empty "Action Taken" heading.
 *                               null makes it skip the whole block.
 *
 * WHAT USED TO GO WRONG
 * -------------------------------------------------------------------
 * The `calling_notes` column comes back in different shapes depending on
 * how the row was written and which driver/column type is in play:
 *
 *     '[{"note":"..."}]'   a JSON string        <- the good case
 *     [{ note: "..." }]    a real JS array      <- JSON column, already parsed
 *     []                   a real empty array
 *     '{}' / '' / null     junk / never written
 *     '"[{...}]"'          stringified twice
 *
 * JSON.parse() only works on the first one. On a real array it silently
 * becomes JSON.parse("[object Object]") and throws, which is why notes
 * were disappearing and the screen was dying.
 *
 * These helpers are named `surgery*` on purpose: the other calling lists
 * still use the old shared normalizeRowsNotes() above, so nothing else in
 * this file changes behaviour.
 * ===================================================================== */

// STEP A: turn ANY shape of calling_notes into a plain JS array. Never throws.
function surgeryNotesToArray(raw) {
  let value = raw;

  // A JSON column can be stored double-encoded, so unwrap a few times.
  for (let i = 0; i < 3; i++) {
    if (value === null || value === undefined) return [];

    // Some drivers hand back a Buffer for TEXT/BLOB columns.
    if (Buffer.isBuffer(value)) value = value.toString("utf8");

    // Already a real array / object? Nothing left to unwrap.
    if (typeof value !== "string") break;

    const trimmed = value.trim();
    if (
      !trimmed ||
      trimmed === "null" ||
      trimmed === "undefined" ||
      trimmed === "[]"
    ) {
      return [];
    }

    // Doesn't start with [ { or " -> it's plain text, not JSON.
    // Old rows sometimes hold a bare note like: Patient will confirm
    if (!/^[\[{"]/.test(trimmed)) {
      return [{ note: trimmed, date: null }];
    }

    try {
      value = JSON.parse(trimmed);
    } catch (e) {
      // Broken JSON: keep the text as one note instead of losing it.
      return [{ note: trimmed, date: null }];
    }
  }

  // A single object { note, date } is wrapped so callers always get an array.
  return Array.isArray(value) ? value : [value];
}

// STEP B: the app puts note.note straight inside a <Text>. If that value is
// an object, React Native throws "Objects are not valid as a React child",
// so force it to a string here.
function surgeryNoteText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  try {
    return JSON.stringify(value);
  } catch (e) {
    return "";
  }
}

// STEP C: the app does new Date(note.date).toLocaleDateString('en-GB').
// Return an ISO string it can always read, or null if the date is unusable.
function surgeryIsoDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// STEP D: clean every row of a result set, in place, and return the rows.
// (The return matters: groupedData.callback is assigned from it.)
function normalizeSurgeryRows(rows) {
  if (!Array.isArray(rows)) return [];

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;

    const notes = surgeryNotesToArray(row.calling_notes)
      .filter((n) => n && typeof n === "object")
      .map((n) => ({
        // Accept whichever key name the note was saved under.
        note: surgeryNoteText(n.note !== undefined ? n.note : n.notes),
        // If a note has no usable date, fall back to the diagnosis date so
        // the app never prints "Invalid Date".
        date:
          surgeryIsoDate(n.date || n.createdAt || n.created_at) ||
          surgeryIsoDate(row.date_diagnosis),
      }))
      .filter((n) => n.note.length > 0); // drop blank notes

    // RULE 1 and RULE 2 from the header comment.
    row.calling_notes = notes.length > 0 ? JSON.stringify(notes) : null;

    // Small extra guard: handleWhatsapp() in the app calls
    // callNumber.startsWith('0'), which throws if phone is NULL in the DB.
    // Sending "" instead of null keeps that button from crashing the screen.
    row.patient_phone =
      row.patient_phone == null ? "" : String(row.patient_phone);
    row.patient_name = row.patient_name == null ? "" : String(row.patient_name);
    row.doctor_name = row.doctor_name == null ? "" : String(row.doctor_name);
    row.diagnosis = row.diagnosis == null ? "" : String(row.diagnosis);
  }

  return rows;
}

async function getSurgeryPatientsV1(loc) {
  const { connection } = getConnectionByLocation(loc);
  if (!connection) {
    // new Error(msg, loc) ignores the 2nd argument, so put loc in the message.
    const err = new Error(`Invalid location: ${loc}`);
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      // 👉 Query 1: rows diagnosed exactly 3 / 7 / 15 / 30 days ago
      const daysQuery = `
        SELECT DISTINCT
          d.diag_id,
          d.patient_id,
          p.name AS patient_name,
          p.phone AS patient_phone,
          dr.name AS doctor_name,
          d.date_diagnosis,
          d.diagnosis,
          d.diagnosisAdvice,
          d.calling_notes,
          d.callbackDate,
          DATEDIFF(CURDATE(), d.date_diagnosis) AS days_since
        FROM diagnosis d
        LEFT JOIN patient p ON d.patient_id = p.patient_id
         LEFT JOIN doctor dr
          ON d.assistanceDoctor = dr.doctor_id
        WHERE 
          DATEDIFF(CURDATE(), d.date_diagnosis) IN (3, 7, 15, 30)
          AND d.diagnosisAdvice LIKE '%Surgery%'
        ORDER BY d.patient_id ASC;
      `;

      // 👉 Query 2: rows whose callbackDate is today
      const callbackQuery = `
        SELECT DISTINCT
          d.diag_id,
          d.patient_id,
          p.name AS patient_name,
          p.phone AS patient_phone,
          dr.name AS doctor_name,
          d.date_diagnosis,
          d.diagnosis,
          d.diagnosisAdvice,
          d.calling_notes,
          d.callbackDate
        FROM diagnosis d
        LEFT JOIN patient p ON d.patient_id = p.patient_id
        LEFT JOIN doctor dr
          ON d.assistanceDoctor = dr.doctor_id
        WHERE 
          d.callbackDate = CURDATE()
          AND d.diagnosisAdvice LIKE '%Surgery%'
        ORDER BY d.patient_id ASC;
      `;

      // ================= STEP 1: run the "days" query =================
      tempCon.query(daysQuery, function (err1, rows1) {
        if (err1) {
          tempCon.release();
          return reject(err1);
        }

        // ===== STEP 2: clean calling_notes on every row ==================
        // Without this the app crashes on JSON.parse. See normalizeSurgeryRows.
        normalizeSurgeryRows(rows1);

        // ===== STEP 3: group rows into the app's tabs ====================
        // The keys here must match the tab keys in the app:
        //   '3', '7', '15', '30', 'callback'
        // Starting with empty arrays keeps the response shape predictable,
        // so a day with no patients still shows "No record available!".
        const groupedData = { 3: [], 7: [], 15: [], 30: [] };

        for (const row of rows1) {
          const daysSince = row.days_since;
          if (!groupedData[daysSince]) {
            groupedData[daysSince] = [];
          }
          groupedData[daysSince].push(row);
        }

        // ===== STEP 4: run the "callback today" query ====================
        tempCon.query(callbackQuery, function (err2, rows2) {
          tempCon.release(); // always give the pooled connection back

          if (err2) {
            return reject(err2);
          }

          // ===== STEP 5: clean those rows too, add them as the last tab ==
          groupedData.callback = normalizeSurgeryRows(rows2);

          // ===== STEP 6: log a short summary, not every single row =======
          console.log(
            "[surgeryAdvised]",
            Object.keys(groupedData)
              .map((key) => `${key}=${groupedData[key].length}`)
              .join("  "),
          );

          resolve(groupedData);
        });
      });
    });
  });
}

async function getMedicationPatients(loc) {
  const { connection, location } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error("Invalid location", loc);
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      const sql = `
        SELECT DISTINCT
        d.diag_id,
          d.patient_id,
          p.name AS patient_name,
          p.phone AS patient_phone,
          d.date_diagnosis,
          d.diagnosis,
          d.diagnosisAdvice,
          d.calling_notes,
          DATEDIFF(CURDATE(), d.date_diagnosis) AS days_since
        FROM 
          diagnosis d
        LEFT JOIN 
          patient p
        ON 
          d.patient_id = p.patient_id
        WHERE 
          DATEDIFF(CURDATE(), d.date_diagnosis) IN (3, 7, 15, 30) -- Fetch specific days only
          AND d.diagnosisAdvice LIKE '%Medication%'
        ORDER BY 
          d.patient_id ASC;
      `;

      tempCon.query(sql, function (error, rows) {
        tempCon.release();
        if (error) {
          return reject(error);
        }

        // Group the data by `days_since`
        const groupedData = rows.reduce((acc, row) => {
          const daysSince = row.days_since;
          if (!acc[daysSince]) {
            acc[daysSince] = [];
          }
          acc[daysSince].push(row);
          return acc;
        }, {});

        //console.log(groupedData); // Log the grouped data
        resolve(groupedData);
      });
    });
  });
}

async function getMedicationPatientsV1(loc) {
  const { connection } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error("Invalid location", loc);
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      // 👉 Query 1: Existing days (3,7,15,30)
      const daysQuery = `
        SELECT DISTINCT
          d.diag_id,
          d.patient_id,
          p.name AS patient_name,
          p.phone AS patient_phone,
          dr.name AS doctor_name,
          d.date_diagnosis,
          d.diagnosis,
          d.diagnosisAdvice,
          d.calling_notes,
          d.callbackDate,
          DATEDIFF(CURDATE(), d.date_diagnosis) AS days_since
        FROM diagnosis d
        LEFT JOIN patient p ON d.patient_id = p.patient_id
         LEFT JOIN doctor dr
          ON d.assistanceDoctor = dr.doctor_id
        WHERE 
          DATEDIFF(CURDATE(), d.date_diagnosis) IN (3, 7, 15, 30)
          AND d.diagnosisAdvice LIKE '%Medication%'
        ORDER BY d.patient_id ASC;
      `;

      // 👉 Query 2: Callback today
      const callbackQuery = `
        SELECT DISTINCT
          d.diag_id,
          d.patient_id,
          p.name AS patient_name,
          p.phone AS patient_phone,
          dr.name AS doctor_name,
          d.date_diagnosis,
          d.diagnosis,
          d.diagnosisAdvice,
          d.calling_notes,
          d.callbackDate
        FROM diagnosis d
        LEFT JOIN patient p ON d.patient_id = p.patient_id
         LEFT JOIN doctor dr
          ON d.assistanceDoctor = dr.doctor_id
        WHERE 
          d.callbackDate = CURDATE()
          AND d.diagnosisAdvice LIKE '%Medication%'
        ORDER BY d.patient_id ASC;
      `;

      // 👉 Execute Query 1
      tempCon.query(daysQuery, function (err1, rows1) {
        if (err1) {
          tempCon.release();
          return reject(err1);
        }

        normalizeRowsNotes(rows1);

        // Group by days
        const groupedData = rows1.reduce((acc, row) => {
          const daysSince = row.days_since;
          if (!acc[daysSince]) {
            acc[daysSince] = [];
          }
          acc[daysSince].push(row);
          return acc;
        }, {});

        // 👉 Execute Query 2
        tempCon.query(callbackQuery, function (err2, rows2) {
          tempCon.release();

          if (err2) {
            return reject(err2);
          }

          // 👉 Add new group
          groupedData["callback"] = normalizeRowsNotes(rows2);
          console.log(groupedData); // Log the grouped data with callback group
          resolve(groupedData);
        });
      });
    });
  });
}

async function getTestPatients(loc) {
  const { connection, location } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error("Invalid location", loc);
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      const sql = `
        SELECT DISTINCT
          d.diag_id,
          d.patient_id,
          p.name AS patient_name,
          p.phone AS patient_phone,
          d.date_diagnosis,
          d.diagnosis,
          d.diagnosisAdvice,
          d.calling_notes,
          DATEDIFF(CURDATE(), d.date_diagnosis) AS days_since
        FROM 
          diagnosis d
        LEFT JOIN 
          patient p
        ON 
          d.patient_id = p.patient_id
        WHERE 
          DATEDIFF(CURDATE(), d.date_diagnosis) IN (3, 7, 15, 30) -- Fetch specific days only
          AND d.diagnosisAdvice LIKE '%Test%'
        ORDER BY 
          d.patient_id ASC;
      `;

      tempCon.query(sql, function (error, rows) {
        tempCon.release();
        if (error) {
          return reject(error);
        }

        // Group the data by `days_since`
        const groupedData = rows.reduce((acc, row) => {
          const daysSince = row.days_since;
          if (!acc[daysSince]) {
            acc[daysSince] = [];
          }
          acc[daysSince].push(row);
          return acc;
        }, {});

        //console.log(groupedData); // Log the grouped data
        resolve(groupedData);
      });
    });
  });
}

async function getTestPatientsV1(loc) {
  const { connection } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error("Invalid location", loc);
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      // 👉 Query 1: Existing days (3,7,15,30)
      const daysQuery = `
        SELECT DISTINCT
          d.diag_id,
          d.patient_id,
          p.name AS patient_name,
          p.phone AS patient_phone,
          dr.name AS doctor_name,
          d.date_diagnosis,
          d.diagnosis,
          d.diagnosisAdvice,
          d.calling_notes,
          d.callbackDate,
          DATEDIFF(CURDATE(), d.date_diagnosis) AS days_since
        FROM diagnosis d
        LEFT JOIN patient p ON d.patient_id = p.patient_id
        LEFT JOIN doctor dr
          ON d.assistanceDoctor = dr.doctor_id
        
        WHERE 
          DATEDIFF(CURDATE(), d.date_diagnosis) IN (3, 7, 15, 30)
          AND d.diagnosisAdvice LIKE '%Test%'
        ORDER BY d.patient_id ASC;
      `;

      // 👉 Query 2: Callback today
      const callbackQuery = `
        SELECT DISTINCT
          d.diag_id,
          d.patient_id,
          p.name AS patient_name,
          p.phone AS patient_phone,
          dr.name AS doctor_name,
          d.date_diagnosis,
          d.diagnosis,
          d.diagnosisAdvice,
          d.calling_notes,
          d.callbackDate
        FROM diagnosis d
        LEFT JOIN patient p ON d.patient_id = p.patient_id
        LEFT JOIN doctor dr
          ON d.assistanceDoctor = dr.doctor_id
        WHERE 
          d.callbackDate = CURDATE()
          AND d.diagnosisAdvice LIKE '%Test%'
        ORDER BY d.patient_id ASC;
      `;

      // 👉 Execute Query 1
      tempCon.query(daysQuery, function (err1, rows1) {
        if (err1) {
          tempCon.release();
          return reject(err1);
        }

        normalizeRowsNotes(rows1);

        // Group by days
        const groupedData = rows1.reduce((acc, row) => {
          const daysSince = row.days_since;
          if (!acc[daysSince]) {
            acc[daysSince] = [];
          }
          acc[daysSince].push(row);
          return acc;
        }, {});

        // 👉 Execute Query 2
        tempCon.query(callbackQuery, function (err2, rows2) {
          tempCon.release();

          if (err2) {
            return reject(err2);
          }

          // 👉 Add new group
          groupedData["callback"] = normalizeRowsNotes(rows2);
          console.log(groupedData); // Log the grouped data with callback group
          resolve(groupedData);
        });
      });
    });
  });
}

async function getMCDPAPatients(loc) {
  const { connection } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error("Invalid location", loc);
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      // 👉 Query 1: Existing days (3,7,15,30)
      const daysQuery = `
        SELECT DISTINCT
          d.diag_id,
          d.patient_id,
          p.name AS patient_name,
          p.phone AS patient_phone,
          dr.name AS doctor_name,
          d.date_diagnosis,
          d.diagnosis,
          d.diagnosisAdvice,
          d.calling_notes,
          d.callbackDate,
          DATEDIFF(CURDATE(), d.date_diagnosis) AS days_since
        FROM diagnosis d
        LEFT JOIN patient p ON d.patient_id = p.patient_id
        LEFT JOIN doctor dr
          ON d.assistanceDoctor = dr.doctor_id
        
        WHERE 
          DATEDIFF(CURDATE(), d.date_diagnosis) IN (3, 7, 15, 30)
          AND d.diagnosisAdvice LIKE '%MCDPA%'
        ORDER BY d.patient_id ASC;
      `;

      // 👉 Query 2: Callback today
      const callbackQuery = `
        SELECT DISTINCT
          d.diag_id,
          d.patient_id,
          p.name AS patient_name,
          p.phone AS patient_phone,
          dr.name AS doctor_name,
          d.date_diagnosis,
          d.diagnosis,
          d.diagnosisAdvice,
          d.calling_notes,
          d.callbackDate
        FROM diagnosis d
        LEFT JOIN patient p ON d.patient_id = p.patient_id
        LEFT JOIN doctor dr
          ON d.assistanceDoctor = dr.doctor_id
        WHERE 
          d.callbackDate = CURDATE()
          AND d.diagnosisAdvice LIKE '%MCDPA%'
        ORDER BY d.patient_id ASC;
      `;

      // 👉 Execute Query 1
      tempCon.query(daysQuery, function (err1, rows1) {
        if (err1) {
          tempCon.release();
          return reject(err1);
        }

        normalizeRowsNotes(rows1);

        // Group by days
        const groupedData = rows1.reduce((acc, row) => {
          const daysSince = row.days_since;
          if (!acc[daysSince]) {
            acc[daysSince] = [];
          }
          acc[daysSince].push(row);
          return acc;
        }, {});

        // 👉 Execute Query 2
        tempCon.query(callbackQuery, function (err2, rows2) {
          tempCon.release();

          if (err2) {
            return reject(err2);
          }

          // 👉 Add new group
          groupedData["callback"] = normalizeRowsNotes(rows2);
          console.log(groupedData); // Log the grouped data with callback group
          resolve(groupedData);
        });
      });
    });
  });
}

async function getIPDPatients(loc) {
  const { connection, location } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error("Invalid location", loc);
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      const sql = `
        SELECT DISTINCT
        d.discharge_id,
          d.patient_id,
          p.name AS patient_name,
          p.phone AS patient_phone,
          d.DOD,
          d.diagnosis,
          d.surgical_procedure,
          d.calling_notes,
          DATEDIFF(CURDATE(), d.DOD) AS days_since
        FROM 
          discharge_card d
        LEFT JOIN 
          patient p
        ON 
          d.patient_id = p.patient_id
        WHERE 
         DATEDIFF(CURDATE(), d.DOD) IN (3, 7, 15, 30) -- Fetch specific days only
        ORDER BY 
          d.patient_id ASC;
      `;

      tempCon.query(sql, function (error, rows) {
        tempCon.release();
        if (error) {
          return reject(error);
        }

        // Group data by exact days
        const groupedData = rows.reduce((acc, row) => {
          const daysSince = row.days_since;
          if (!acc[daysSince]) {
            acc[daysSince] = [];
          }
          acc[daysSince].push(row);
          return acc;
        }, {});

        //console.log(groupedData); // Log the grouped data
        resolve(groupedData);
      });
    });
  });
}

async function getIPDPatientsV1(loc) {
  const { connection } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error("Invalid location", loc);
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      // 👉 Query 1: 3,7,15,30 days after discharge
      const daysQuery = `
        SELECT DISTINCT
          d.discharge_id,
          d.patient_id,
          p.name AS patient_name,
          p.phone AS patient_phone,
          dr.name AS doctor_name,
          d.DOD,
          d.diagnosis,
          d.surgical_procedure,
          d.calling_notes,
          d.callbackDate,
          DATEDIFF(CURDATE(), d.DOD) AS days_since
        FROM discharge_card d
        LEFT JOIN patient p
          ON d.patient_id = p.patient_id
        LEFT JOIN doctor dr
          ON d.consultantName = dr.doctor_id
        WHERE 
          DATEDIFF(CURDATE(), d.DOD) IN (3, 7, 15, 30)
        ORDER BY d.patient_id ASC;
      `;

      // 👉 Query 2: Callback today
      const callbackQuery = `
  SELECT DISTINCT
    d.discharge_id,
    d.patient_id,
    p.name AS patient_name,
    p.phone AS patient_phone,
    dr.name AS doctor_name,
    d.DOD,
    d.diagnosis,
    d.surgical_procedure,
    d.calling_notes,
    d.callbackDate
  FROM discharge_card d
  LEFT JOIN patient p
    ON d.patient_id = p.patient_id
  LEFT JOIN doctor dr
    ON d.consultantName = dr.doctor_id
  WHERE 
    d.callbackDate = CURDATE()
  ORDER BY d.patient_id ASC;
`;

      // 👉 Execute first query
      tempCon.query(daysQuery, function (err1, rows1) {
        if (err1) {
          tempCon.release();
          return reject(err1);
        }

        normalizeRowsNotes(rows1);

        // Group by days
        const groupedData = rows1.reduce((acc, row) => {
          const daysSince = row.days_since;
          if (!acc[daysSince]) {
            acc[daysSince] = [];
          }
          acc[daysSince].push(row);
          return acc;
        }, {});

        // 👉 Execute callback query
        tempCon.query(callbackQuery, function (err2, rows2) {
          tempCon.release();

          if (err2) {
            return reject(err2);
          }

          // 👉 Add callback group
          groupedData["callback"] = normalizeRowsNotes(rows2);

          resolve(groupedData);
        });
      });
    });
  });
}

async function getTomorrowsAppointment(loc) {
  const { connection, location } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error("Invalid location");
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      // Get tomorrow's date in YYYY-MM-DD format
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const formattedTomorrow = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD format

      const tomorrowsAppointmentQuery = `
        SELECT
          ap.appointment_id,
          ap.patient_phone,
          ap.patient_type,
          ap.appointment_timestamp,
          ap.appointment_time,
          ap.confirm_time,
          ap.FDE_Name,
          ap.note,
          d.name AS doctor_name,
          p.name AS patient_name
        FROM 
          appointment ap
        LEFT JOIN 
          patient p ON ap.patient_id = p.patient_id
        LEFT JOIN
          doctor d ON ap.doctor_id = d.doctor_id
        WHERE 
          DATE(ap.appointment_timestamp) = ?
        ORDER BY 
          ap.appointment_id ASC;
      `;

      tempCon.query(
        tomorrowsAppointmentQuery,
        [formattedTomorrow],
        function (error, rows) {
          tempCon.release();
          if (error) {
            return reject(error);
          }

          // console.log(rows); // Log the fetched appointments
          resolve(rows);
        },
      );
    });
  });
}

async function getTodaysAppointment(loc) {
  const { connection, location } = getConnectionByLocation(loc);
  if (!connection) {
    const err = new Error("Invalid location");
    err.status = 404;
    throw err;
  }

  return new Promise((resolve, reject) => {
    connection.getConnection(function (err, tempCon) {
      if (err) {
        return reject(err);
      }

      // Get tomorrow's date in YYYY-MM-DD format
      const today = new Date();
      //tomorrow.setDate(tomorrow.getDate() + 1);
      const formattedToday = today.toISOString().split("T")[0]; // YYYY-MM-DD format

      const todayAppointmentQuery = `
        SELECT
          ap.appointment_id,
          ap.patient_phone,
          ap.patient_type,
          ap.appointment_timestamp,
          ap.appointment_time,
          ap.confirm_time,
          ap.FDE_Name,
          ap.note,
          d.name AS doctor_name,
          p.name AS patient_name
        FROM 
          appointment ap
        LEFT JOIN 
          patient p ON ap.patient_id = p.patient_id
        LEFT JOIN
          doctor d ON ap.doctor_id = d.doctor_id
        WHERE 
          DATE(ap.appointment_timestamp) = ?
          AND COALESCE(ap.confirm_time, 0) = 0 -- Ensure confirm_time is treated as 0 if NULL
        ORDER BY 
          ap.appointment_id ASC;
      `;

      tempCon.query(
        todayAppointmentQuery,
        [formattedToday],
        function (error, rows) {
          tempCon.release();
          if (error) {
            return reject(error);
          }

          //console.log(rows); // Log the fetched appointments
          resolve(rows);
        },
      );
    });
  });
}

module.exports = {
  getCallingList,
  getDiagnosisCallingList,
  getSurgeryPatients,
  getMedicationPatients,
  getTestPatients,
  getIPDPatients,
  getTomorrowsAppointment,
  getTodaysAppointment,
  getMedicationPatientsV1,
  getSurgeryPatientsV1,
  getTestPatientsV1,
  getMCDPAPatients,
  getIPDPatientsV1,
  getCallingListV1,
};
