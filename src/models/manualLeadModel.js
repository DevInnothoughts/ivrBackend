// src/models/manualLeadModel.js
//
// Manual "Add lead" from the Master Enquiry dashboard.
//
// A lead typed in on the dashboard is saved as a NEW, UNACTIONED lead in the
// central lead table for its source (database hhc_appointments):
//
//   Web Lead   -> appointments    (branch in selected_area)
//   Chatbot    -> chatbot_leads   (branch in branch, or chat_whatsapp_branch
//                                  for WhatsApp)
//   Call Lead  -> call_leads      (branch in call_location)
//
// The branch value is written as the Trackle app's branch name, so the lead
// shows up in that branch's Web / Bot / Call lead list exactly like a lead
// from the website or the bot, and the calling team actions it from there.
// status, note and actioned_at are left empty — TAT starts at the lead time
// entered on the form.
//
// Nothing is written to appointment_enquiry or master_enquiry.
//
// Column names: chatbot_leads and call_leads columns are the ones the list
// queries already use. appointments is only ever read with SELECT *, so its
// name / email / treatment / message columns are read from
// information_schema at runtime and only the columns that exist are used.
//
// Additive only: no existing model is changed.

const { getConnectionByLocation } = require("../../databaseUtils");

// ---------------------------------------------------------------------
// Branches — the names the Trackle app logs in with and passes to
// getLeads / getChatBotLeads / getCallLeads. Writing exactly this name
// satisfies every branch's list query (plain "contains", the "ends with"
// rules for DP Road / Salunke Vihar / ..., and the Kalyan vs Kalyan Nagar
// and Ellisbridge vs Bopal exclusions).
// ---------------------------------------------------------------------

const BRANCHES = [
  // Pune
  "DP Road",
  "Baner",
  "Chakan",
  "Chinchwad",
  "Dighi",
  "Hadapsar",
  "Hinjewadi",
  "Katraj",
  "Salunke Vihar",
  "Undri",
  // Maharashtra
  "Aurangabad",
  "Kolhapur",
  "Latur",
  "Nashik",
  // Mumbai
  "Andheri",
  "Kalyan",
  "Kemps Corner",
  "Navi Mumbai",
  "Thane",
  "Vashi",
  // Bengaluru
  "Electronic City",
  "HSR",
  "Indiranagar",
  "JP Nagar",
  "Kalyan Nagar",
  "Rajaji Nagar",
  "RR Nagar",
  "Sahakar Nagar",
  "Sarjapura",
  "Whitefield",
  // Karnataka
  "Belgavi",
  "Kalaburagi",
  "Mysore",
  // Hyderabad
  "Gachibowli",
  "Hyderabad",
  "Secunderabad",
  // Gujarat
  "Adajan",
  "Bopal",
  "Ellisbridge",
  "Surat",
  // North / Central
  "Gurgaon Sector 14",
  "Gurgaon Sector 49",
  "Indore",
  "Lucknow",
  "Ludhiana",
  "Mohali",
  "Raipur",
];

// ---------------------------------------------------------------------
// Source registry. `fields` are the source-specific inputs; `col` is the
// column they go into. For appointments, `cols` lists candidate column
// names and the first one that exists in the table is used (the field is
// hidden if none exists).
// ---------------------------------------------------------------------

const SOURCES = {
  "Web Lead": {
    // Columns confirmed from SHOW COLUMNS FROM appointments (Nov 2026).
    // Required (NOT NULL, no default): name, phoneno, selected_area, date,
    // pageurl, message — pageurl / message are written as '' when left blank.
    table: "appointments",
    idCol: "appointment_id",
    phoneCol: "phoneno",
    timeCol: "created_at", // when the form came in (appointments.date is the chosen appointment date)
    branchRequired: true,
    timeLabel: "Form submitted on",
    // Marks manual entries so they can be told apart from website leads
    fixed: { source: "Dashboard" },
    fields: [
      { key: "name", label: "Patient name", cols: ["name"], required: true },
      { key: "email", label: "Email", cols: ["email_id"], type: "email" },
      {
        key: "date",
        label: "Preferred appointment date",
        cols: ["date"],
        type: "date",
        required: true,
        notBeforeLead: true,
      },
      {
        key: "slot",
        label: "Preferred time slot",
        cols: ["appt_slot"],
        placeholder: "e.g. 11:00 AM - 12:00 PM",
      },
      // No treatment column — saved as the first line of the message
      {
        key: "treatment",
        label: "Treatment / problem",
        intoMessage: "Treatment",
        suggest: "treatments",
      },
      {
        key: "utmsource",
        label: "Came from (UTM source)",
        cols: ["utmsource"],
        placeholder: "e.g. google, facebook",
      },
      {
        key: "pageurl",
        label: "Landing page",
        cols: ["pageurl"],
        placeholder: "Page URL or name",
      },
      { key: "message", label: "Message", cols: ["message"], type: "textarea" },
    ],
  },
  Chatbot: {
    table: "chatbot_leads",
    idCol: "id",
    phoneCol: "contact",
    timeCol: "datetime",
    branchRequired: false, // empty = unassigned, shows in DP Road's list for transfer (existing behaviour)
    timeLabel: "Chat date",
    fields: [
      {
        key: "platform",
        label: "Chat platform",
        type: "select",
        options: ["Website", "WhatsApp"],
        required: true,
        // decides the branch column, not stored itself
      },
      { key: "name", label: "Patient name", cols: ["name"], required: true },
      {
        key: "disease",
        label: "Disease / problem",
        cols: ["disease"],
        suggest: "treatments",
      },
      {
        key: "query",
        label: "Patient's query",
        cols: ["query"],
        type: "textarea",
      },
    ],
  },
  "Call Lead": {
    table: "call_leads",
    idCol: "id",
    phoneCol: "phoneno",
    timeCol: "created_at",
    branchRequired: true,
    timeLabel: "Call requested on",
    fields: [
      {
        key: "utm_source",
        label: "Came from",
        cols: ["utm_source"],
        type: "select",
        // stored as the website writes it; the app shows google -> "Google Ads"
        options: ["google", "facebook", "instagram", "direct"],
      },
      {
        key: "pageUrl",
        label: "Page the request came from",
        cols: ["pageUrl"],
        placeholder:
          "e.g. https://healinghandsclinic.co.in/piles-treatment-pune",
      },
    ],
  },
};

const BRANCH_COL = {
  appointments: () => "selected_area",
  call_leads: () => "call_location",
  chatbot_leads: (details) =>
    details.platform === "WhatsApp" ? "chat_whatsapp_branch" : "branch",
};

// Suggestions for treatment / disease inputs (free text is still allowed)
const TREATMENTS = [
  "Piles",
  "Fissure",
  "Fistula",
  "Pilonidal sinus",
  "Hernia",
  "Varicose veins",
  "Gallstones",
  "Lipoma",
  "Circumcision",
  "Constipation",
  "Other",
];

// ---------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------

function httpError(status, message, data) {
  const err = new Error(message);
  err.status = status;
  if (data) err.data = data;
  return err;
}

function run(sql, params = []) {
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

const str = (v, max = 500) => (v == null ? "" : String(v).trim().slice(0, max));

function normalizePhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

/** Server local "now" (IST on the HHC servers) as YYYY-MM-DD HH:MM:SS. */
function nowLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}:${pad(d.getSeconds())}`;
}

function validDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || "")) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// ---------------------------------------------------------------------
// table columns (information_schema, cached per table for 10 minutes)
// ---------------------------------------------------------------------

const COLUMN_TTL_MS = 10 * 60 * 1000;
const columnCache = new Map(); // table -> { at, cols: Map(name -> info) }

async function getColumns(table) {
  const hit = columnCache.get(table);
  if (hit && Date.now() - hit.at < COLUMN_TTL_MS) return hit.cols;
  const rows = await run(
    `SELECT COLUMN_NAME AS name, IS_NULLABLE AS nullable, COLUMN_DEFAULT AS def,
            DATA_TYPE AS type, CHARACTER_MAXIMUM_LENGTH AS maxLen, EXTRA AS extra
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table],
  );
  const cols = new Map(
    rows.map((r) => [r.name.toLowerCase(), { ...r, name: r.name }]),
  );
  if (!cols.size) throw httpError(500, `Table ${table} not found`);
  columnCache.set(table, { at: Date.now(), cols });
  return cols;
}

/** First candidate column that exists (real-case name), or null. */
function pickCol(cols, candidates = []) {
  for (const c of candidates) {
    const hit = cols.get(c.toLowerCase());
    if (hit) return hit.name;
  }
  return null;
}

/** Fields of a source with the column each one will use (null = hidden). */
async function resolveFields(sourceId) {
  const src = SOURCES[sourceId];
  const cols = await getColumns(src.table);
  return (
    src.fields
      .map((f) => ({ ...f, col: f.cols ? pickCol(cols, f.cols) : null }))
      .filter((f) => !f.cols || f.col) // drop fields whose column doesn't exist
      // intoMessage fields only make sense if the message column exists
      .filter((f) => !f.intoMessage || pickCol(cols, ["message"]))
  );
}

// ---------------------------------------------------------------------
// options for the form
// ---------------------------------------------------------------------

async function getManualLeadOptions() {
  const sources = [];
  for (const id of Object.keys(SOURCES)) {
    const src = SOURCES[id];
    // eslint-disable-next-line no-await-in-loop
    const fields = await resolveFields(id);
    sources.push({
      id,
      table: src.table,
      timeLabel: src.timeLabel,
      branchRequired: src.branchRequired,
      fields: fields.map(({ cols, col, ...f }) => f), // column names stay on the server
    });
  }
  return { sources, branches: BRANCHES, treatments: TREATMENTS };
}

// ---------------------------------------------------------------------
// validation
// ---------------------------------------------------------------------

async function parseLead(body = {}) {
  const errors = {};
  const sourceId = str(body.source, 30);
  const src = SOURCES[sourceId];
  if (!src) {
    throw httpError(400, "Please fix the highlighted fields.", {
      errors: { source: "Choose a lead source." },
    });
  }

  const fields = await resolveFields(sourceId);
  const details =
    body.details && typeof body.details === "object" ? body.details : {};

  const branch = str(body.branch, 60);
  if (branch && !BRANCHES.includes(branch)) errors.branch = "Unknown branch.";
  if (!branch && src.branchRequired) errors.branch = "Choose the branch.";

  const phone = normalizePhone(body.phone);
  if (!phone || !/^[6-9]\d{9}$/.test(phone))
    errors.phone = "Enter a valid 10-digit mobile number.";

  // Lead time (when it came in)
  const date = str(body.date, 10);
  let time = str(body.time, 8) || "00:00";
  if (!validDate(date)) errors.date = "Enter the date.";
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time)) errors.time = "Enter a valid time.";
  if (time.length === 5) time = `${time}:00`;
  const leadAt = `${date} ${time}`;
  if (!errors.date && !errors.time && leadAt > nowLocal())
    errors.date = "The lead time can't be in the future.";

  const values = {};
  let name = null;
  const prefixes = [];
  fields.forEach((f) => {
    const v = str(details[f.key], f.type === "textarea" ? 1000 : 250);
    if (f.required && !v) {
      errors[`details.${f.key}`] = `Enter ${f.label.toLowerCase()}.`;
      return;
    }
    if (!v) return;
    if (f.type === "select" && !f.options.includes(v)) {
      errors[`details.${f.key}`] = "Choose one of the options.";
      return;
    }
    if (f.type === "date" && !validDate(v)) {
      errors[`details.${f.key}`] = "Enter a valid date.";
      return;
    }
    if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      errors[`details.${f.key}`] = "Enter a valid email.";
      return;
    }
    if (f.notBeforeLead && !errors.date && v < date) {
      errors[`details.${f.key}`] = "Can't be before the lead date.";
      return;
    }
    if (f.intoMessage) prefixes.push(`${f.intoMessage}: ${v}`);
    else if (f.col) values[f.col] = v;
    if (f.key === "name") name = v;
  });

  // e.g. "Treatment: Piles" as the first line of the message
  if (prefixes.length) {
    const msgCol =
      Object.keys(values).find((k) => k.toLowerCase() === "message") ||
      "message";
    values[msgCol] = [...prefixes, values[msgCol]].filter(Boolean).join("\n");
  }

  if (Object.keys(errors).length) {
    throw httpError(400, "Please fix the highlighted fields.", { errors });
  }

  const branchCol = BRANCH_COL[src.table](details);
  return { sourceId, src, branch, branchCol, phone, leadAt, values, name };
}

// ---------------------------------------------------------------------
// duplicate check — same number in the same table, last 30 days
// ---------------------------------------------------------------------

// Same normalisation as statusSyncModel.js (works on MySQL 5.7 too)
const normPhoneSql = (col) =>
  `RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(${col}, ''), ' ', ''), '-', ''), '+', ''), '(', ''), ')', ''), 10)`;

async function findRecent(src, phone) {
  const cols = await getColumns(src.table);
  // phone10 = the indexed generated column added for statusSync, if present
  const phoneExpr = cols.has("phone10")
    ? "phone10"
    : normPhoneSql(src.phoneCol);
  const branchExpr =
    src.table === "chatbot_leads"
      ? "CONCAT_WS(' / ', NULLIF(branch, ''), NULLIF(chat_whatsapp_branch, ''))"
      : BRANCH_COL[src.table]({});
  return run(
    `SELECT ${src.idCol} AS id,
            DATE_FORMAT(${src.timeCol}, '%Y-%m-%d %H:%i') AS lead_at,
            ${branchExpr} AS branch,
            status
       FROM ${src.table}
      WHERE ${phoneExpr} = ?
        AND ${src.timeCol} >= NOW() - INTERVAL 30 DAY
      ORDER BY ${src.idCol} DESC
      LIMIT 5`,
    [phone],
  );
}

// ---------------------------------------------------------------------
// save
// ---------------------------------------------------------------------

/**
 * @param {Object} body
 *   { source, branch, phone, date, time, details: {...}, confirmDuplicate }
 * @param {Object} user  req.dashboardUser (logged only — the lead tables
 *                       have no "added by" column)
 */
async function addManualLead(body, user = {}) {
  const lead = await parseLead(body);
  const { src } = lead;

  if (!body.confirmDuplicate) {
    const recent = await findRecent(src, lead.phone);
    if (recent.length) {
      throw httpError(
        409,
        `This number already has a ${lead.sourceId} in the last 30 days.`,
        {
          duplicates: recent,
        },
      );
    }
  }

  const row = {
    ...(src.fixed || {}),
    [src.phoneCol]: lead.phone,
    [src.timeCol]: lead.leadAt,
    [lead.branchCol]: lead.branch || "",
    ...lead.values,
  };

  const cols = await getColumns(src.table);

  // Optional form fields whose column is NOT NULL with no default (e.g.
  // appointments.pageurl / message): write '' rather than fail.
  const TEXT_TYPES = /char|text/i;
  (await resolveFields(lead.sourceId)).forEach((f) => {
    if (!f.col || row[f.col] != null) return;
    const info = cols.get(f.col.toLowerCase());
    if (
      info &&
      info.nullable === "NO" &&
      info.def == null &&
      TEXT_TYPES.test(info.type)
    )
      row[f.col] = "";
  });

  // Fit text to the real column sizes, and stop with a clear message if the
  // table has a required column this form doesn't fill (instead of a raw
  // MySQL error).
  Object.keys(row).forEach((k) => {
    const info = cols.get(k.toLowerCase());
    if (info && info.maxLen && typeof row[k] === "string")
      row[k] = row[k].slice(0, Number(info.maxLen));
  });
  const missing = [...cols.values()].filter(
    (c) =>
      c.nullable === "NO" &&
      c.def == null &&
      !/auto_increment|DEFAULT_GENERATED|GENERATED/i.test(c.extra || "") &&
      !Object.keys(row).some((k) => k.toLowerCase() === c.name.toLowerCase()),
  );
  if (missing.length) {
    throw httpError(
      500,
      `${src.table} needs a value for: ${missing.map((c) => c.name).join(", ")}. Add it to the form in manualLeadModel.js.`,
    );
  }

  const keys = Object.keys(row);
  const res = await run(
    `INSERT INTO ${src.table} (${keys.map((k) => `\`${k}\``).join(", ")}) VALUES (?)`,
    [keys.map((k) => row[k])],
  );

  console.log(
    `Manual lead by ${user.name || user.mobile || "dashboard"}: ${src.table} #${res.insertId}, ` +
      `${lead.branch || "no branch"}, ${lead.phone}`,
  );

  return {
    id: res.insertId,
    source: lead.sourceId,
    table: src.table,
    branch: lead.branch || null,
    phone: lead.phone,
    name: lead.name,
    leadAt: lead.leadAt,
  };
}

module.exports = {
  SOURCES,
  BRANCHES,
  getManualLeadOptions,
  addManualLead,
  // exported for tests
  parseLead,
};
