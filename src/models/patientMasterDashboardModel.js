// src/models/patientMasterDashboardModel.js
//
// Read-only queries for the Appointments page of the dashboard.
// Table: hhc_appointments.patientsMasterData
//   global_id, uid_no, name, date, phone, mobile_2, location
//
//   date    = date of the patient's first appointment (YYYY-MM-DD)
//   uid_no  = set once the patient has visited; NULL means the appointment
//             was taken but the patient hasn't visited yet

const { getConnectionByLocation } = require("../../databaseUtils");

function query(sql, params = []) {
  const { connection } = getConnectionByLocation("lead"); // hhc_appointments
  return new Promise((resolve, reject) => {
    connection.getConnection((err, con) => {
      if (err) return reject(err);
      con.query(sql, params, (qErr, rows) => {
        con.release();
        if (qErr) return reject(qErr);
        resolve(rows);
      });
    });
  });
}

// Visited = has a UID. Empty string and 0 are treated like NULL, since
// some inserts write 0 / '' for "no UID yet".
const VISITED_SQL = "(uid_no IS NOT NULL AND uid_no <> '' AND uid_no <> '0')";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function toList(v) {
  if (v == null || v === "") return [];
  const arr = Array.isArray(v) ? v : String(v).split(",");
  return arr
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 100);
}

function toDate(v) {
  return typeof v === "string" && DATE_RE.test(v) ? v : null;
}

/**
 *   from, to   YYYY-MM-DD, on the first-appointment date (inclusive)
 *   location   comma list
 *   status     'visited' | 'pending'
 *   search     name, mobile (phone or mobile_2) or UID
 */
function parseFilters(q = {}) {
  const status = q.status === "visited" || q.status === "pending" ? q.status : null;
  return {
    from: toDate(q.from),
    to: toDate(q.to),
    locations: toList(q.location),
    status,
    search: q.search ? String(q.search).trim().slice(0, 100) : "",
  };
}

function buildWhere(f, { skipStatus = false } = {}) {
  const clauses = [];
  const params = [];

  if (f.from) {
    clauses.push("`date` >= ?");
    params.push(f.from);
  }
  if (f.to) {
    clauses.push("`date` <= ?");
    params.push(f.to);
  }
  if (f.locations.length) {
    clauses.push("location IN (?)");
    params.push(f.locations);
  }
  if (!skipStatus && f.status === "visited") clauses.push(VISITED_SQL);
  if (!skipStatus && f.status === "pending") clauses.push(`NOT ${VISITED_SQL}`);

  if (f.search) {
    const digits = f.search.replace(/\D/g, "");
    const looksLikePhone = digits.length > 0 && /^[\d\s+\-()]+$/.test(f.search);
    if (looksLikePhone) {
      // last 10 digits, so "+91 98765 43210" and "098765..." both match
      const d = digits.length > 10 ? digits.slice(-10) : digits;
      clauses.push("(phone LIKE ? OR mobile_2 LIKE ? OR uid_no = ? OR name LIKE ?)");
      params.push(`%${d}%`, `%${d}%`, digits, `%${f.search}%`);
    } else if (/\d/.test(f.search)) {
      // letters + digits (e.g. a UID like "HHC123"): name or exact UID
      clauses.push("(name LIKE ? OR uid_no = ?)");
      params.push(`%${f.search}%`, f.search);
    } else {
      // plain text: name only (comparing text to a numeric uid_no would
      // match every row where uid_no = 0)
      clauses.push("name LIKE ?");
      params.push(`%${f.search}%`);
    }
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

// ---------------------------------------------------------------------
// list
// ---------------------------------------------------------------------

const SORTS = {
  newest: "`date` DESC, global_id DESC",
  oldest: "`date` ASC, global_id ASC",
  name: "name ASC, `date` DESC",
  location: "location ASC, `date` DESC",
};

async function getPatients(q = {}) {
  const f = parseFilters(q);
  const { where, params } = buildWhere(f);

  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 25, 1), 200);
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  const offset = (page - 1) * limit;
  const orderBy = SORTS[q.sort] || SORTS.newest;

  const rowsSql = `
    SELECT
      global_id,
      uid_no,
      name,
      DATE_FORMAT(\`date\`, '%Y-%m-%d') AS date,
      phone,
      mobile_2,
      location,
      ${VISITED_SQL} AS visited
    FROM patientsMasterData
    ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?`;

  const countSql = `SELECT COUNT(*) AS total FROM patientsMasterData ${where}`;

  const [rows, count] = await Promise.all([
    query(rowsSql, [...params, limit, offset]),
    query(countSql, params),
  ]);

  const total = count[0] ? Number(count[0].total) : 0;
  return {
    rows: rows.map((r) => ({ ...r, visited: Number(r.visited) === 1 })),
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  };
}

// ---------------------------------------------------------------------
// stats
// ---------------------------------------------------------------------

async function getPatientStats(q = {}) {
  const f = parseFilters(q);
  const { where, params } = buildWhere(f);
  const num = (v) => Number(v || 0);

  const summarySql = `
    SELECT
      COUNT(*)                                            AS total,
      SUM(${VISITED_SQL})                                 AS visited,
      SUM(\`date\` = CURDATE())                           AS today,
      SUM(\`date\` > CURDATE() AND NOT ${VISITED_SQL})    AS upcoming,
      COUNT(DISTINCT location)                            AS locations,
      DATE_FORMAT(MIN(\`date\`), '%Y-%m-%d')              AS firstDate,
      DATE_FORMAT(MAX(\`date\`), '%Y-%m-%d')              AS lastDate
    FROM patientsMasterData ${where}`;

  const byLocationSql = `
    SELECT COALESCE(NULLIF(location, ''), 'Unspecified') AS loc,
           COUNT(*) AS cnt,
           SUM(${VISITED_SQL}) AS visited
    FROM patientsMasterData ${where}
    GROUP BY loc
    ORDER BY cnt DESC`;

  const trendSql = `
    SELECT DATE_FORMAT(\`date\`, '%Y-%m-%d') AS day,
           COUNT(*) AS cnt,
           SUM(${VISITED_SQL}) AS visited
    FROM patientsMasterData ${where}
    GROUP BY day
    ORDER BY day ASC`;

  const [summaryRows, byLocation, trend] = await Promise.all([
    query(summarySql, params),
    query(byLocationSql, params),
    query(trendSql, params),
  ]);

  const s = summaryRows[0] || {};
  const total = num(s.total);
  const visited = num(s.visited);

  return {
    summary: {
      total,
      visited,
      notVisited: total - visited,
      visitRate: total ? +((visited / total) * 100).toFixed(1) : 0,
      today: num(s.today),
      upcoming: num(s.upcoming),
      locations: num(s.locations),
      firstDate: s.firstDate || null,
      lastDate: s.lastDate || null,
    },
    byLocation: byLocation.map((r) => ({
      name: r.loc,
      count: num(r.cnt),
      visited: num(r.visited),
    })),
    trend: trend
      .filter((r) => r.day)
      .map((r) => ({
        date: r.day,
        count: num(r.cnt),
        visited: num(r.visited),
      })),
  };
}

// ---------------------------------------------------------------------
// filter options
// ---------------------------------------------------------------------

async function getPatientFilterOptions() {
  const [locations, range] = await Promise.all([
    query(
      `SELECT location AS loc, COUNT(*) AS cnt
         FROM patientsMasterData
        WHERE location IS NOT NULL AND location <> ''
        GROUP BY location
        ORDER BY location ASC`,
    ),
    query(
      `SELECT DATE_FORMAT(MIN(\`date\`), '%Y-%m-%d') AS minDate,
              DATE_FORMAT(MAX(\`date\`), '%Y-%m-%d') AS maxDate,
              COUNT(*) AS total
         FROM patientsMasterData`,
    ),
  ]);

  return {
    locations: locations.map((r) => ({ name: r.loc, count: Number(r.cnt || 0) })),
    minDate: (range[0] && range[0].minDate) || null,
    maxDate: (range[0] && range[0].maxDate) || null,
    total: Number((range[0] && range[0].total) || 0),
  };
}

module.exports = {
  getPatients,
  getPatientStats,
  getPatientFilterOptions,
  // exported for tests
  parseFilters,
  buildWhere,
};
