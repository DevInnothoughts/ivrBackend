// src/models/masterEnquiryDashboardModel.js
//
// Read-only queries for the Master Enquiry dashboard.
// Table: hhc_appointments.master_enquiry (doctor_id is never returned).

const { getConnectionByLocation } = require("../../databaseUtils");

// ---------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------

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

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// "a,b , c" | ["a","b"] -> ["a","b","c"]
function toList(v) {
  if (v == null || v === "") return [];
  const arr = Array.isArray(v) ? v : String(v).split(",");
  return arr
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 50);
}

function toDate(v) {
  return typeof v === "string" && DATE_RE.test(v) ? v : null;
}

/**
 * Normalise raw query-string filters.
 *   from, to      YYYY-MM-DD (inclusive)
 *   enquirytype   comma list
 *   source        comma list
 *   branch        comma list
 *   search        name or mobile (partial)
 */
function parseFilters(q = {}) {
  return {
    from: toDate(q.from),
    to: toDate(q.to),
    enquiryTypes: toList(q.enquirytype),
    sources: toList(q.source),
    branches: toList(q.branch),
    search: q.search ? String(q.search).trim().slice(0, 100) : "",
  };
}

/** Build a WHERE clause + params from parsed filters. */
function buildWhere(f, { skipDates = false } = {}) {
  const clauses = [];
  const params = [];

  if (!skipDates && f.from) {
    clauses.push("enquiry_date >= ?");
    params.push(f.from);
  }
  if (!skipDates && f.to) {
    clauses.push("enquiry_date <= ?");
    params.push(f.to);
  }
  if (f.enquiryTypes.length) {
    clauses.push("enquirytype IN (?)");
    params.push(f.enquiryTypes);
  }
  if (f.sources.length) {
    clauses.push("source_name IN (?)");
    params.push(f.sources);
  }
  if (f.branches.length) {
    clauses.push("branch_name IN (?)");
    params.push(f.branches);
  }

  if (f.search) {
    const digits = f.search.replace(/\D/g, "");
    // A mostly-numeric term is a mobile search: match on the last 10 digits
    // so "+91 98765 43210", "098765..." and "98765" all work.
    const looksLikePhone = digits.length > 0 && /^[\d\s+\-()]+$/.test(f.search);
    if (looksLikePhone) {
      const d = digits.length > 10 ? digits.slice(-10) : digits;
      clauses.push("(patient_phone LIKE ? OR patient_name LIKE ?)");
      params.push(`%${d}%`, `%${f.search}%`);
    } else {
      clauses.push("patient_name LIKE ?");
      params.push(`%${f.search}%`);
    }
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

// 'Appointment' counts as booked whether it came from /appointment/v2
// (record_type) or from the branch backup (enquirytype).
const BOOKED_SQL =
  "(record_type = 'Appointment' OR enquirytype = 'Appointment')";

// ---------------------------------------------------------------------
// list
// ---------------------------------------------------------------------

const SORTS = {
  newest: "enquiry_date DESC, master_enquiry_id DESC",
  oldest: "enquiry_date ASC, master_enquiry_id ASC",
  name: "patient_name ASC, enquiry_date DESC",
  branch: "branch_name ASC, enquiry_date DESC",
};

async function getEnquiries(q = {}) {
  const f = parseFilters(q);
  const { where, params } = buildWhere(f);

  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 25, 1), 200);
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  const offset = (page - 1) * limit;
  const orderBy = SORTS[q.sort] || SORTS.newest;

  const rowsSql = `
    SELECT
      master_enquiry_id AS id,
      source_name,
      branch_name,
      received_location,
      record_type,
      branch_enquiry_id,
      patient_type,
      enquirytype,
      patient_name,
      patient_phone,
      DATE_FORMAT(enquiry_date, '%Y-%m-%d') AS enquiry_date,
      enquiry_time,
      reference,
      FDE_Name,
      note,
      DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
    FROM master_enquiry
    ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?`;

  const countSql = `SELECT COUNT(*) AS total FROM master_enquiry ${where}`;

  const [rows, count] = await Promise.all([
    query(rowsSql, [...params, limit, offset]),
    query(countSql, params),
  ]);

  const total = count[0] ? Number(count[0].total) : 0;
  return {
    rows,
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  };
}

// ---------------------------------------------------------------------
// stats
// ---------------------------------------------------------------------

function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000) + 1;
}

function shiftDate(d, days) {
  const dt = new Date(`${d}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

async function getStats(q = {}) {
  const f = parseFilters(q);
  const { where, params } = buildWhere(f);

  const summarySql = `
    SELECT
      COUNT(*)                                        AS total,
      COUNT(DISTINCT patient_phone)                   AS uniquePatients,
      SUM(${BOOKED_SQL})                              AS appointments,
      SUM(patient_type = 'New')                       AS newPatients,
      SUM(enquiry_date = CURDATE())                   AS today,
      COUNT(DISTINCT branch_name)                     AS branches,
      DATE_FORMAT(MIN(enquiry_date), '%Y-%m-%d')      AS firstDate,
      DATE_FORMAT(MAX(enquiry_date), '%Y-%m-%d')      AS lastDate
    FROM master_enquiry ${where}`;

  const groupSql = (col, limit) => `
    SELECT COALESCE(NULLIF(${col}, ''), 'Unspecified') AS name,
           COUNT(*) AS count,
           SUM(${BOOKED_SQL}) AS appointments
    FROM master_enquiry ${where}
    GROUP BY name
    ORDER BY count DESC
    ${limit ? `LIMIT ${Number(limit)}` : ""}`;

  const trendSql = `
    SELECT DATE_FORMAT(enquiry_date, '%Y-%m-%d') AS date,
           COUNT(*) AS count,
           SUM(${BOOKED_SQL}) AS appointments
    FROM master_enquiry ${where}
    GROUP BY enquiry_date
    ORDER BY enquiry_date ASC`;

  const [summaryRows, bySource, byType, byBranch, trend] = await Promise.all([
    query(summarySql, params),
    query(groupSql("source_name"), params),
    query(groupSql("enquirytype", 15), params),
    query(groupSql("branch_name"), params),
    query(trendSql, params),
  ]);

  const s = summaryRows[0] || {};
  const num = (v) => Number(v || 0);

  const summary = {
    total: num(s.total),
    uniquePatients: num(s.uniquePatients),
    appointments: num(s.appointments),
    newPatients: num(s.newPatients),
    today: num(s.today),
    branches: num(s.branches),
    firstDate: s.firstDate || null,
    lastDate: s.lastDate || null,
    conversionRate: s.total ? +((num(s.appointments) / num(s.total)) * 100).toFixed(1) : 0,
    previousTotal: null,
    changePct: null,
  };

  // Same-length previous period, for the "vs previous period" delta
  if (f.from && f.to) {
    const len = daysBetween(f.from, f.to);
    const prev = buildWhere(f, { skipDates: true });
    const prevWhere = prev.where
      ? `${prev.where} AND enquiry_date BETWEEN ? AND ?`
      : "WHERE enquiry_date BETWEEN ? AND ?";
    const prevRows = await query(
      `SELECT COUNT(*) AS total FROM master_enquiry ${prevWhere}`,
      [...prev.params, shiftDate(f.from, -len), shiftDate(f.from, -1)],
    );
    const prevTotal = num(prevRows[0] && prevRows[0].total);
    summary.previousTotal = prevTotal;
    summary.changePct = prevTotal
      ? +(((summary.total - prevTotal) / prevTotal) * 100).toFixed(1)
      : null;
  }

  const clean = (rows) =>
    rows.map((r) => ({
      name: r.name,
      count: num(r.count),
      appointments: num(r.appointments),
    }));

  return {
    summary,
    bySource: clean(bySource),
    byType: clean(byType),
    byBranch: clean(byBranch),
    trend: trend.map((r) => ({
      date: r.date,
      count: num(r.count),
      appointments: num(r.appointments),
    })),
  };
}

// ---------------------------------------------------------------------
// filter options
// ---------------------------------------------------------------------

async function getFilterOptions() {
  const distinct = (col) =>
    query(
      `SELECT ${col} AS name, COUNT(*) AS count
         FROM master_enquiry
        WHERE ${col} IS NOT NULL AND ${col} <> ''
        GROUP BY ${col}
        ORDER BY ${col} ASC`,
    );

  const [sources, branches, enquiryTypes, range] = await Promise.all([
    distinct("source_name"),
    distinct("branch_name"),
    distinct("enquirytype"),
    query(
      `SELECT DATE_FORMAT(MIN(enquiry_date), '%Y-%m-%d') AS minDate,
              DATE_FORMAT(MAX(enquiry_date), '%Y-%m-%d') AS maxDate
         FROM master_enquiry`,
    ),
  ]);

  const clean = (rows) =>
    rows.map((r) => ({ name: r.name, count: Number(r.count || 0) }));

  return {
    sources: clean(sources),
    branches: clean(branches),
    enquiryTypes: clean(enquiryTypes),
    minDate: (range[0] && range[0].minDate) || null,
    maxDate: (range[0] && range[0].maxDate) || null,
  };
}

module.exports = {
  getEnquiries,
  getStats,
  getFilterOptions,
  // exported for tests
  parseFilters,
  buildWhere,
};
