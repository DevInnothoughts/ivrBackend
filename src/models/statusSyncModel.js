/* eslint-disable prettier/prettier */
/**
 * statusSyncModel.js
 *
 * Cross-source status sync.
 *
 * When a number is marked Appointment or Enquiry in one place (helpline call,
 * IVR call, web / bot / web-call lead), the same status and note are copied to
 * that number's other leads — so staff don't action the same person twice and
 * one person isn't booked twice.
 *
 * ADDITIVE. No existing model is modified: the screens call POST /statusSync
 * after their normal save succeeds. If this module fails, the original action
 * is already saved and nothing else breaks.
 *
 * Rules (agreed with Team HHC, Oct 2026)
 * --------------------------------------
 *   1. Same branch only. A lead is "at the branch" if that branch's own list
 *      would show it — the same LIKE / alias rules as getLeads, getChatBotLeads
 *      and getCallLeads.
 *   2. IVR: only the acting branch's own IVR collection, `0{mobile}`.
 *   3. Only leads dated ON OR AFTER the lead that was actioned.
 *   4. Never downgrade: Appointment overwrites empty or Enquiry; Enquiry
 *      overwrites only empty. Spam (and any other status) is left untouched.
 *   5. Status AND note are copied. The note is prefixed with the source
 *      ("Helpline call: ...") so staff can see where it came from.
 *   6. Status only — no appointment, enquiry or master_enquiry row is ever
 *      created, and actioned_at is not set, so TAT and booking counts are
 *      unaffected.
 *
 *   7. Helpline calls are SEND-ONLY: actioning a helpline call updates the
 *      targets above, but helpline calls are never updated from elsewhere.
 *
 * Targets: web leads, bot leads, web call leads, and this branch's IVR calls.
 * Every action is logged in `status_sync` as an audit trail.
 *
 * Needs status_sync_migration.sql.
 */

const { createPool } = require("../../dbconfig");
const {
  LOCATION_ALIASES,
  LOCATION_PATTERNS,
  LOCATION_EXCLUSIONS,
} = require("./callLeadsModel");
const { getFirestore, warmUpFirestore } = require("../util/firebaseAdmin");

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

/**
 * The sync's OWN pool on hhc_appointments, separate from the "lead" pool in
 * databaseUtils.js. That pool (5 connections) is shared by every lead list,
 * and right after a save the app reloads those lists — the sync was queueing
 * behind them. The sync holds at most one connection at a time.
 */
let syncPool = null;
const getSyncPool = () => {
  if (!syncPool) syncPool = createPool("hhc_appointments");
  return syncPool;
};

// Open Firestore while the server starts, not on the first sync.
warmUpFirestore();

const STATUSES = ["Appointment", "Enquiry"];

/** What each source is called on a synced note and in synced_from. */
const SOURCE_LABELS = {
  web: "Web lead",
  bot: "Bot lead",
  call: "Web call lead",
  ivr: "IVR call",
  helpline: "Helpline call",
};

/**
 * Set to false if status_sync_migration.sql has not been run yet: lookups
 * then use the normalising expression instead of the indexed phone10 column.
 * Works, but scans the table on every sync.
 */
const USE_PHONE10_COLUMN = true;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Last 10 digits, digits only. '091 98765-43210' -> '9876543210'. */
const toPhone10 = (raw) => {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : "";
};

/** Same expression as the generated column and normPhone() elsewhere. */
const normPhoneSql = (col) =>
  `RIGHT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(${col}, ''), ' ', ''), '-', ''), '+', ''), '(', ''), ')', ''), 10)`;

const isDateKey = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ""));

/** Unix seconds (IVR doc timestamp) -> 'YYYY-MM-DD' in India time. */
const istDateKeyFromSeconds = (seconds) => {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n <= 0) return null;
  // en-CA formats as YYYY-MM-DD.
  return new Date(n * 1000).toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
};

/**
 * Status guard, shared by the lead tables and IVR docs.
 * `current` is the status the target already has.
 */
const canOverwrite = (current, incoming) => {
  const c = current == null ? "" : String(current).trim();
  if (c === "") return true; // not actioned yet
  if (c === "Enquiry" && incoming === "Appointment") return true; // upgrade
  return false; // Appointment, Spam, anything else: leave it
};

const syncedNote = (source, note) => {
  const label = SOURCE_LABELS[source] || source;
  const text = note ? String(note).trim() : "";
  return text ? `${label}: ${text}` : `Marked via ${label}`;
};

/** Pool query as a promise. */
/**
 * Pool query as a promise, timed in two parts: waiting for a connection and
 * running the SQL. Anything over a second is logged with which part was slow,
 * so "pool busy" and "missing index" can be told apart from the log alone.
 */
const SLOW_QUERY_MS = 1000;

const query = (pool, sql, params = []) =>
  new Promise((resolve, reject) => {
    const t0 = Date.now();
    pool.getConnection((connErr, conn) => {
      if (connErr) {
        if (conn) conn.release();
        return reject(connErr);
      }
      const waited = Date.now() - t0;
      const t1 = Date.now();
      conn.query(sql, params, (err, rows) => {
        conn.release();
        const ran = Date.now() - t1;
        if (waited + ran > SLOW_QUERY_MS) {
          const what = sql.replace(/\s+/g, " ").trim().slice(0, 60);
          console.warn(
            `statusSync: slow query — waited ${waited}ms for a connection, ran ${ran}ms: ${what}`,
          );
        }
        return err ? reject(err) : resolve(rows);
      });
    });
  });

/* ------------------------------------------------------------------ */
/* "Same branch" — mirrors the three list queries                      */
/* ------------------------------------------------------------------ */

/** MySQL LIKE (case-insensitive, % and _) as a JS test. */
const like = (value, pattern) => {
  if (value == null) return false;
  const re = new RegExp(
    "^" +
      String(pattern)
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/%/g, ".*")
        .replace(/_/g, ".") +
      "$",
    "i",
  );
  return re.test(String(value));
};

const contains = (loc) => `%${loc}%`;
const KALYAN_NAGAR_PATTERN = "%Kalyan%Nagar%";

/**
 * Web leads (appointments.selected_area). Mirrors getLeads(): the default is
 * a substring match; the special branches use "ends with branch name" plus
 * their alternate spellings, exactly as written there.
 */
const WEB_RULES = {
  "DP Road": { any: ["%DP Road", "%Tilak Road%", "%Dhole Patil Road%"] },
  "Salunke Vihar": {
    any: ["%Salunke Vihar", "%Wanowrie%", "%Salunkhe Vihar%"],
  },
  Hinjewadi: { any: ["%Hinjewadi", "%Hinjawadi%"] },
  "JP Nagar": { any: ["%JP Nagar", "Bengaluru"] },
  Sarjapura: { any: ["%Sarjapura", "%Sarjapur%"] },
  "Rajaji Nagar": { any: ["%Rajaji Nagar", "%Rajajinagar%"] },
  Belgavi: { any: ["%Belgavi", "%Belagavi%"] },
  "Sahakar Nagar": { any: ["%Sahakar Nagar", "%Sahakarnagar%"] },
  "Gurgaon Sector 14": {
    any: ["%Gurgaon Sector 14", "%Gurugram - Sector 14%"],
  },
  "Gurgaon Sector 49": {
    any: ["%Gurgaon Sector 49", "%Gurugram - Sector 49%"],
  },
  Kalyan: { any: ["%Kalyan%"], not: [KALYAN_NAGAR_PATTERN] },
  "Kalyan Nagar": { any: [KALYAN_NAGAR_PATTERN] },
  Thane: { any: ["%Thane", "%Kapurbawdi%"] },
};

const matchWeb = (row, loc) => {
  const rule = WEB_RULES[loc] || { any: [contains(loc)] };
  const v = row.selected_area;
  return (
    rule.any.some((p) => like(v, p)) &&
    !(rule.not || []).some((p) => like(v, p))
  );
};

/**
 * Bot leads (chatbot_leads.branch OR chat_whatsapp_branch). Mirrors
 * getChatBotLeads(): default substring on either column, plus extras.
 */
const BOT_EXTRAS = {
  "DP Road": ["%Tilak Road%", "%Dhole Patil Road%"],
  "Salunke Vihar": ["%Salunkhe Vihar%", "%Salunke Vihar%", "%Wanowrie%"],
  Hinjewadi: ["%Hinjawadi%"],
  HSR: ["%HSR Layout%"],
  "Rajaji Nagar": ["%Rajajinagar%"],
  Belgavi: ["%Belagavi%"],
  Hyderabad: ["%Jubilee Hills%"],
  "Gurgaon Sector 14": ["%Gurugram - Sector 14%", "%Gurgaon Sector - 14%"],
  "Gurgaon Sector 49": ["%Gurugram - Sector 49%", "%Gurgaon Sector - 49%"],
  Chinchwad: ["%Pimpri-Chinchwad%"],
};

const matchBot = (row, loc) => {
  const cols = [row.branch, row.chat_whatsapp_branch];

  if (loc === "Kalyan") {
    return cols.some(
      (v) => like(v, "%Kalyan%") && !like(v, KALYAN_NAGAR_PATTERN),
    );
  }
  if (loc === "Kalyan Nagar") {
    return cols.some((v) => like(v, KALYAN_NAGAR_PATTERN));
  }

  const patterns = [contains(loc), ...(BOT_EXTRAS[loc] || [])];
  if (cols.some((v) => patterns.some((p) => like(v, p)))) return true;

  // DP Road also owns leads with no branch at all.
  return (
    loc === "DP Road" &&
    !String(row.branch ?? "").trim() &&
    !String(row.chat_whatsapp_branch ?? "").trim()
  );
};

/** Web call leads (call_leads.call_location). Uses callLeadsModel's own maps. */
const matchCall = (row, loc) => {
  const v = row.call_location;
  const aliases = (LOCATION_ALIASES[loc] || []).map((a) => a.toLowerCase());
  const included =
    like(v, contains(loc)) ||
    aliases.includes(String(v || "").toLowerCase()) ||
    (LOCATION_PATTERNS[loc] || []).some((p) => like(v, p));
  return included && !(LOCATION_EXCLUSIONS[loc] || []).some((p) => like(v, p));
};

/* ------------------------------------------------------------------ */
/* Lead tables                                                         */
/* ------------------------------------------------------------------ */

const LEAD_TABLES = [
  {
    source: "web",
    table: "appointments",
    idCol: "appointment_id",
    phoneCol: "phoneno",
    // When the form came in. NOT `date` — that is the patient's chosen
    // appointment date (Team HHC, Nov 2026), usually days later.
    dateCol: "created_at",
    branchCols: ["selected_area"],
    match: matchWeb,
  },
  {
    source: "bot",
    table: "chatbot_leads",
    idCol: "id",
    phoneCol: "contact",
    dateCol: "datetime",
    branchCols: ["branch", "chat_whatsapp_branch"],
    match: matchBot,
  },
  {
    source: "call",
    table: "call_leads",
    idCol: "id",
    phoneCol: "phoneno",
    dateCol: "created_at",
    branchCols: ["call_location"],
    match: matchCall,
  },
];

/** Status guard as SQL. Kept beside canOverwrite() — change both together. */
const STATUS_GUARD_SQL = `(status IS NULL OR TRIM(status) = '' OR (status = 'Enquiry' AND ? = 'Appointment'))`;

async function syncLeadTable(pool, t, ctx) {
  const phoneExpr = USE_PHONE10_COLUMN ? "phone10" : normPhoneSql(t.phoneCol);
  const skipSelf = ctx.source === t.source && ctx.sourceId != null;

  // 1. Candidates: same number, on/after the source date, overwritable.
  const rows = await query(
    pool,
    `
      SELECT ${t.idCol} AS id, ${t.branchCols.join(", ")}, status
      FROM ${t.table}
      WHERE ${phoneExpr} = ?
        AND DATE(${t.dateCol}) >= ?
        AND ${STATUS_GUARD_SQL}
        ${skipSelf ? `AND ${t.idCol} <> ?` : ""}
    `,
    [
      ctx.phone10,
      ctx.sourceDate,
      ctx.status,
      ...(skipSelf ? [ctx.sourceId] : []),
    ],
  );

  // 2. Same branch only — decided with the list screens' own rules.
  const ids = rows.filter((r) => t.match(r, ctx.location)).map((r) => r.id);
  if (ids.length === 0) return 0;

  // 3. Write. The guard is repeated so a lead actioned by someone else in
  //    the meantime is never overwritten.
  const result = await query(
    pool,
    `
      UPDATE ${t.table}
      SET status = ?, note = ?, synced_from = ?, synced_at = NOW()
      WHERE ${t.idCol} IN (?)
        AND ${STATUS_GUARD_SQL}
    `,
    [ctx.status, ctx.note, SOURCE_LABELS[ctx.source], ids, ctx.status],
  );
  return result.affectedRows || 0;
}

/* ------------------------------------------------------------------ */
/* IVR calls (Firestore)                                               */
/* ------------------------------------------------------------------ */

/**
 * The branch's own IVR collection is `0{mobile}` — the same one IVRCallList
 * reads. Caller_Number format comes from the IVR provider, so every common
 * spelling of the number is matched.
 *
 * Single-field `in` query on Caller_Number: uses Firestore's automatic index,
 * reads only that caller's docs. The date and status checks are done here
 * rather than in the query so no composite index is needed.
 */
async function syncIvr(ctx) {
  const mobile10 = toPhone10(ctx.mobile);
  if (!mobile10) return 0;

  const db = getFirestore();
  const collection = db.collection(`0${mobile10}`);
  const n = ctx.phone10;

  const snap = await collection
    .where("Caller_Number", "in", [n, `0${n}`, `91${n}`, `+91${n}`])
    .get();

  const batch = db.batch();
  let count = 0;

  snap.forEach((doc) => {
    const d = doc.data() || {};
    if (ctx.source === "ivr" && String(doc.id) === String(ctx.sourceId)) return;

    // Spam is stored as Action 'Note' — canOverwrite leaves it alone.
    if (!canOverwrite(d.Action, ctx.status)) return;

    const callDate = istDateKeyFromSeconds(d.timestamp || doc.id);
    if (!callDate || callDate < ctx.sourceDate) return;

    batch.update(doc.ref, {
      Action: ctx.status,
      enquiryType:
        ctx.status === "Appointment"
          ? "Appointment"
          : ctx.enquiryType || "Other",
      note: ctx.note,
      ...(ctx.patientName && !d.name ? { name: ctx.patientName } : {}),
      syncedFrom: SOURCE_LABELS[ctx.source],
      syncedAt: new Date().toISOString(),
    });
    count += 1;
  });

  if (count > 0) await batch.commit();
  return count;
}

/* ------------------------------------------------------------------ */
/* Public                                                              */
/* ------------------------------------------------------------------ */

/**
 * Per-target time limit. The DB pool is shared with every list screen and
 * capped at 5 connections, and Firestore's first call on a cold process has
 * to fetch a token — either can stall. A stalled target is recorded as
 * "timeout" instead of holding up the others.
 */
const TARGET_TIMEOUT_MS = 15000;

const withTimeout = (promise, ms) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });

/**
 * POST /statusSync
 *
 * body {
 *   phone, status ('Appointment' | 'Enquiry'), note, enquiryType, patientName,
 *   source ('web' | 'bot' | 'call' | 'ivr' | 'helpline'),
 *   sourceId    id of the lead / IVR doc / call that was actioned (excluded),
 *   sourceDate  'YYYY-MM-DD' date of that lead,
 *   location    app branch name, e.g. 'DP Road',
 *   mobile      branch login number — its IVR collection is `0{mobile}`
 * }
 *
 * Validates synchronously (throws 400) and returns at once; the updates run
 * in the background. The app never waits on them — it used to time out
 * ("Aborted") while the sync was still working. The outcome of every run is
 * in status_sync.result and the server log.
 */
function startStatusSync(input) {
  const ctx = {
    phone10: toPhone10(input.phone),
    status: input.status,
    note: syncedNote(input.source, input.note),
    rawNote: input.note ? String(input.note).trim() : null,
    enquiryType: input.enquiryType || null,
    patientName: input.patientName || null,
    source: input.source,
    sourceId:
      input.sourceId != null && input.sourceId !== ""
        ? String(input.sourceId)
        : null,
    sourceDate: input.sourceDate,
    location: input.location ? String(input.location).trim() : "",
    mobile: input.mobile,
  };

  const bad = (msg) => {
    const err = new Error(msg);
    err.status = 400;
    return err;
  };
  if (!ctx.phone10) throw bad("A 10-digit phone number is required");
  if (!STATUSES.includes(ctx.status))
    throw bad("status must be Appointment or Enquiry");
  if (!SOURCE_LABELS[ctx.source]) throw bad("Unknown source");
  // Lead sources: the date is read from the lead's own row in runSync, so
  // the app's value is only a fallback and may be missing. IVR / helpline
  // calls have no row here, so their date must come from the app.
  const isLeadSource = LEAD_TABLES.some((t) => t.source === ctx.source);
  if (!isDateKey(ctx.sourceDate)) {
    if (isLeadSource && ctx.sourceId) ctx.sourceDate = null;
    else throw bad("sourceDate must be YYYY-MM-DD");
  }
  if (!ctx.location) throw bad("location is required");

  const pool = getSyncPool();

  runSync(pool, ctx).catch((e) =>
    console.error("statusSync: unexpected failure:", e && e.message),
  );
  return { accepted: true };
}

/** Runs one target, recording its count (or why it failed) and duration. */
async function runTarget(summary, key, fn) {
  const started = Date.now();
  try {
    summary[key] = await withTimeout(fn(), TARGET_TIMEOUT_MS);
  } catch (e) {
    const msg = (e && e.message) || String(e);
    summary[key] = msg === "timeout" ? "timeout" : "error";
    console.error(
      `statusSync: ${key} failed after ${Date.now() - started}ms:`,
      msg,
    );
  }
  const ms = Date.now() - started;
  if (ms > 3000) console.warn(`statusSync: ${key} slow (${ms}ms)`);
}

/**
 * For a web / bot / web-call lead, the date of the actioned lead straight
 * from its row, as MySQL sees it — the same DATE() the target comparisons
 * use, so both sides of "on or after" share one clock and one format.
 *
 * Why not trust the app: it sent appointments.date for web leads — the
 * patient's chosen appointment date, usually days after the form came in —
 * so earlier leads were skipped (web -> bot failed, bot -> web worked).
 * The row is the single source of truth for when the lead arrived.
 */
async function resolveSourceDate(pool, ctx) {
  const t = LEAD_TABLES.find((x) => x.source === ctx.source);
  if (!t || !ctx.sourceId) return ctx.sourceDate;
  const rows = await query(
    pool,
    `SELECT DATE_FORMAT(DATE(${t.dateCol}), '%Y-%m-%d') AS d FROM ${t.table} WHERE ${t.idCol} = ? LIMIT 1`,
    [ctx.sourceId],
  );
  // Row not found (deleted?) — fall back to the app's value.
  if (!rows || rows.length === 0) return ctx.sourceDate;

  const d = rows[0].d;
  if (isDateKey(d)) {
    if (ctx.sourceDate && ctx.sourceDate !== d) {
      console.warn(
        `statusSync: ${ctx.source} #${ctx.sourceId} app date ${ctx.sourceDate} != DB date ${d}; using DB date`,
      );
    }
    return d;
  }

  // Row found but its arrival column is NULL (or not a date). Do NOT fall
  // back to the app's value: for web leads that could be appointments.date,
  // the patient's chosen appointment date, which would wrongly skip earlier
  // leads. With no arrival date the "on or after" rule can't be applied, so
  // this action is not synced (runSync logs why).
  console.warn(
    `statusSync: ${ctx.source} #${ctx.sourceId} has no ${t.dateCol}; not syncing`,
  );
  return null;
}

async function runSync(pool, ctx) {
  const started = Date.now();
  const summary = {};

  try {
    ctx.sourceDate = await withTimeout(
      resolveSourceDate(pool, ctx),
      TARGET_TIMEOUT_MS,
    );
  } catch (e) {
    console.error("statusSync: could not read source date:", e && e.message);
  }
  if (!isDateKey(ctx.sourceDate)) {
    console.error(
      `statusSync: no arrival date for ${ctx.source} #${ctx.sourceId}; nothing synced`,
    );
    return { error: "no source date" };
  }
  summary.date = ctx.sourceDate;

  // Firestore runs alongside; the three lead tables run one after another so
  // the sync holds at most one of the pool's 5 connections at a time.
  const ivr = runTarget(summary, "ivr", () => syncIvr(ctx));
  for (const t of LEAD_TABLES) {
    // eslint-disable-next-line no-await-in-loop
    await runTarget(summary, t.source, () => syncLeadTable(pool, t, ctx));
  }
  await ivr;

  summary.ms = Date.now() - started;
  console.log(
    `statusSync: ${ctx.source} ${ctx.status} ${ctx.phone10} @ ${ctx.location} ->`,
    JSON.stringify(summary),
  );

  // Audit log, written last with the outcome — even if every target failed.
  try {
    await withTimeout(
      query(
        pool,
        `
          INSERT INTO status_sync
            (branch, phone10, status, enquiry_type, note, patient_name,
             source, source_id, source_date, result)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          ctx.location,
          ctx.phone10,
          ctx.status,
          ctx.enquiryType,
          ctx.rawNote,
          ctx.patientName,
          ctx.source,
          ctx.sourceId,
          ctx.sourceDate,
          JSON.stringify(summary),
        ],
      ),
      TARGET_TIMEOUT_MS,
    );
  } catch (e) {
    console.error("statusSync: log insert failed:", e.message);
  }
  return summary;
}

module.exports = {
  startStatusSync,
  runSync, // exported for tests
  // exported for tests
  toPhone10,
  canOverwrite,
  matchWeb,
  matchBot,
  matchCall,
};
