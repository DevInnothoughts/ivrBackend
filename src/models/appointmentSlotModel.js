/**
 * appointmentSlotModel.js
 *
 * 15-minute appointment slots, max 3 bookings per slot, per branch per day.
 *
 * Mirrors the React dashboard's getSlotAvailability() so the app, the IVR
 * backend and the dashboard all count the same rows the same way:
 *   - same table (appointment, in the branch DB)
 *   - same date match on appointment_timestamp
 *   - same is_deleted filter
 *   - any time is bucketed down to :00 / :15 / :30 / :45
 *
 * Additive: the existing add*Appointment functions are not modified. The
 * new slot controller wraps them in withSlotGuard(), which checks capacity under a
 * MySQL advisory lock so two agents can't both grab the last seat in a slot.
 *
 * Only the new routes in appointmentSlotController.js use this. The original
 * /appointment routes are untouched, so older app versions keep working.
 */

const { getConnectionByLocation } = require("../../databaseUtils");

const SLOT_MINUTES = 15;
const MAX_PER_SLOT = 3;

// Bookable window shown in the app: first slot 7:00 AM, last slot 11:45 PM.
// Change here only — the app reads these from the /slots response.
const OPEN_TIME = "07:00";
const LAST_SLOT_TIME = "23:45";

const LOCK_TIMEOUT_SECONDS = 10;

/* ------------------------------------------------------------------ */
/* Small promise helpers (the project uses the callback `mysql` lib)    */
/* ------------------------------------------------------------------ */

function getConnectionPromise(pool) {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, con) => {
      if (err) return reject(err);
      resolve(con);
    });
  });
}

function queryPromise(con, sql, params) {
  return new Promise((resolve, reject) => {
    con.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/* ------------------------------------------------------------------ */
/* Date / time helpers                                                 */
/* ------------------------------------------------------------------ */

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** Today's date in IST as YYYY-MM-DD (server may run in UTC). */
function todayIST() {
  const now = new Date(Date.now() + 330 * 60 * 1000);
  return `${now.getUTCFullYear()}-${pad2(now.getUTCMonth() + 1)}-${pad2(
    now.getUTCDate(),
  )}`;
}

/** Accepts YYYY-MM-DD (or anything starting with it). Returns YYYY-MM-DD or null. */
function normalizeDate(value) {
  if (!value) return null;
  const m = String(value).trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return null;
  return `${m[1]}-${pad2(m[2])}-${pad2(m[3])}`;
}

/** "HH:mm" → minutes since midnight. Accepts "HH:mm", "HH:mm:ss", "h:mm AM". */
function toMinutes(value) {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  const m = raw.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?\s*([AaPp][Mm])?$/);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const ampm = m[3] ? m[3].toUpperCase() : null;
  if (ampm === "PM" && hh < 12) hh += 12;
  if (ampm === "AM" && hh === 12) hh = 0;
  if (isNaN(hh) || isNaN(mm) || hh > 23 || mm > 59) return null;
  return hh * 60 + mm;
}

function fromMinutes(total) {
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

/** Any time → the start of its 15-minute slot, e.g. "10:22" → "10:15". */
function toSlot(value) {
  const mins = toMinutes(value);
  if (mins === null) return null;
  return fromMinutes(Math.floor(mins / SLOT_MINUTES) * SLOT_MINUTES);
}

/** All slot start times inside the bookable window. */
function buildDaySlots() {
  const open = toMinutes(OPEN_TIME);
  const last = toMinutes(LAST_SLOT_TIME);
  const slots = [];
  for (let t = open; t <= last; t += SLOT_MINUTES) {
    slots.push(fromMinutes(t));
  }
  return slots;
}

/* ------------------------------------------------------------------ */
/* Counting                                                            */
/* ------------------------------------------------------------------ */

const COUNT_SQL_WITH_DELETED = `
  SELECT appointment_time, COUNT(*) AS booked_count
  FROM appointment
  WHERE (DATE(appointment_timestamp) = ? OR appointment_timestamp LIKE CONCAT(?, '%'))
    AND (is_deleted IS NULL OR is_deleted = 0)
    AND appointment_time IS NOT NULL
    AND appointment_time != ''
  GROUP BY appointment_time`;

// Fallback for any branch DB whose appointment table has no is_deleted column.
const COUNT_SQL_NO_DELETED = `
  SELECT appointment_time, COUNT(*) AS booked_count
  FROM appointment
  WHERE (DATE(appointment_timestamp) = ? OR appointment_timestamp LIKE CONCAT(?, '%'))
    AND appointment_time IS NOT NULL
    AND appointment_time != ''
  GROUP BY appointment_time`;

/**
 * Returns { "HH:mm": count } for one branch and date, bucketed to 15 min.
 * `con` is a single connection or a pool — both expose .query().
 */
async function countBookedSlots(con, date) {
  let rows;
  try {
    rows = await queryPromise(con, COUNT_SQL_WITH_DELETED, [date, date]);
  } catch (err) {
    if (err && err.code === "ER_BAD_FIELD_ERROR") {
      rows = await queryPromise(con, COUNT_SQL_NO_DELETED, [date, date]);
    } else {
      throw err;
    }
  }

  const booked = {};
  for (const row of rows) {
    const slot = toSlot(row.appointment_time);
    if (!slot) continue;
    booked[slot] = (booked[slot] || 0) + (Number(row.booked_count) || 0);
  }
  return booked;
}

/* ------------------------------------------------------------------ */
/* GET /appointment/slots                                              */
/* ------------------------------------------------------------------ */

async function getSlotAvailability(dateParam, locationParam) {
  const { connection, location } = getConnectionByLocation(locationParam);
  if (!connection) {
    throw httpError(404, "Invalid location");
  }

  const date = normalizeDate(dateParam) || todayIST();
  const bookedSlots = await countBookedSlots(connection, date);

  const slots = buildDaySlots().map((time) => {
    const booked = bookedSlots[time] || 0;
    return {
      time,
      booked,
      remaining: Math.max(MAX_PER_SLOT - booked, 0),
      full: booked >= MAX_PER_SLOT,
    };
  });

  let totalBooked = 0;
  let fullSlotsCount = 0;
  for (const time in bookedSlots) {
    totalBooked += bookedSlots[time];
    if (bookedSlots[time] >= MAX_PER_SLOT) fullSlotsCount += 1;
  }

  return {
    date,
    location,
    slotMinutes: SLOT_MINUTES,
    maxPerSlot: MAX_PER_SLOT,
    openTime: OPEN_TIME,
    lastSlotTime: LAST_SLOT_TIME,
    slots,
    bookedSlots,
    totalBooked,
    fullSlotsCount,
  };
}

/* ------------------------------------------------------------------ */
/* Booking guard                                                       */
/* ------------------------------------------------------------------ */

/**
 * Runs `bookFn` only if every requested slot still has room.
 *
 * Holds a MySQL advisory lock (GET_LOCK) per branch+date+slot while it
 * counts and while `bookFn` inserts, so concurrent bookings for the same
 * slot are serialised. GET_LOCK is server-wide, so it works even though
 * the insert itself runs on a different pooled connection.
 *
 * Throws 409 when a slot is full. Requests without a date/time are passed
 * straight through so existing behaviour is unchanged for them.
 */
async function withSlotGuard(appointments, bookFn) {
  const list = Array.isArray(appointments) ? appointments : [];
  if (list.length === 0) return bookFn();

  // Group the request by branch + date + slot
  const wanted = new Map();
  for (const a of list) {
    const date = normalizeDate(a && a.date);
    const slot = toSlot(a && a.time);
    if (!date || !slot) continue;

    const { connection, location } = getConnectionByLocation(
      a.patient_location,
    );
    if (!connection) continue; // the booking function reports invalid location

    const key = `${location}|${date}|${slot}`;
    const entry = wanted.get(key) || {
      connection,
      location,
      date,
      slot,
      count: 0,
    };
    entry.count += 1;
    wanted.set(key, entry);
  }

  if (wanted.size === 0) return bookFn();

  // Lock in a fixed order so two multi-slot requests can't deadlock
  const entries = [...wanted.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, v]) => v);

  const held = [];
  try {
    for (const e of entries) {
      const con = await getConnectionPromise(e.connection);
      // MySQL lock names are capped at 64 chars
      const lockName = `slot:${e.location}:${e.date}:${e.slot}`.slice(0, 64);
      const [row] = await queryPromise(con, "SELECT GET_LOCK(?, ?) AS got", [
        lockName,
        LOCK_TIMEOUT_SECONDS,
      ]);
      if (!row || Number(row.got) !== 1) {
        con.release();
        throw httpError(
          503,
          "The slot is busy right now. Please try again in a moment.",
        );
      }
      held.push({ con, lockName });

      const booked = await countBookedSlots(con, e.date);
      const already = booked[e.slot] || 0;
      if (already + e.count > MAX_PER_SLOT) {
        const left = Math.max(MAX_PER_SLOT - already, 0);
        throw httpError(
          409,
          left === 0
            ? `The ${e.slot} slot on ${e.date} is full (${MAX_PER_SLOT} of ${MAX_PER_SLOT} booked). Please choose another slot.`
            : `Only ${left} place(s) left in the ${e.slot} slot on ${e.date}. Please choose another slot.`,
        );
      }
    }

    return await bookFn();
  } finally {
    for (const { con, lockName } of held.reverse()) {
      try {
        await queryPromise(con, "SELECT RELEASE_LOCK(?)", [lockName]);
      } catch (releaseErr) {
        console.error("RELEASE_LOCK failed:", releaseErr.message);
      } finally {
        con.release();
      }
    }
  }
}

module.exports = {
  SLOT_MINUTES,
  MAX_PER_SLOT,
  getSlotAvailability,
  withSlotGuard,
  toSlot,
};
