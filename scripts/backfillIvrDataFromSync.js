/* eslint-disable no-console */
/**
 * scripts/backfillIvrDataFromSync.js
 *
 * ONE-TIME BACKFILL. Before the status sync mirrored IVR calls into MySQL,
 * it updated Firestore only. This copies those earlier synced statuses from
 * Firestore into each branch's MySQL IVRdata table, so MySQL matches what the
 * app shows.
 *
 * What it copies
 *   - Firestore docs in the branch IVR collections (`0{mobile}`, the ones the
 *     IVR list reads) that the sync touched: they carry `syncedAt`.
 *   - Only calls ON OR AFTER --from (default 2026-11-01), by the call's
 *     receipt timestamp in India time.
 *   - Only Action 'Enquiry' or 'Appointment' (spam / anything else skipped).
 *
 * What it writes — same as the live sync (statusSyncModel.syncIvrData)
 *   - IVRdata.status and IVRdata.note for the matching call:
 *       branch DB from the call's Destination_Name, then
 *       call_date + call_time + caller_no, latest row.
 *   - Never downgrades: status must be empty, or Enquiry -> Appointment.
 *   - Where IVRdata has no `status` column, writes `note` only.
 *   - No appointment_enquiry / appointment rows are created.
 *
 * Usage (from the ivrBackend folder, on the server — needs the same
 * FIREBASE_SERVICE_ACCOUNT_PATH / GOOGLE_APPLICATION_CREDENTIALS as the app):
 *
 *   node scripts/backfillIvrDataFromSync.js                 # dry run (default)
 *   node scripts/backfillIvrDataFromSync.js --apply         # write to MySQL
 *   node scripts/backfillIvrDataFromSync.js --from=2026-11-03 --apply
 *
 * Safe to run more than once: rows already matching are counted as
 * "already up to date" and left unchanged.
 */

const { getConnectionByLocation } = require("../databaseUtils");
const { getFirestore } = require("../src/util/firebaseAdmin");

/* ------------------------------------------------------------------ */
/* Options                                                             */
/* ------------------------------------------------------------------ */

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const fromArg = (args.find((a) => a.startsWith("--from=")) || "").split("=")[1];
const FROM_DATE = fromArg || "2026-11-01";

if (!/^\d{4}-\d{2}-\d{2}$/.test(FROM_DATE)) {
  console.error(`--from must be YYYY-MM-DD, got "${FROM_DATE}"`);
  process.exit(1);
}

/** Branch IVR collections are `0` + 10-digit login number, e.g. 07022503001. */
const IVR_COLLECTION = /^0\d{10}$/;

const STATUSES = ["Enquiry", "Appointment"];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Unix seconds -> 'YYYY-MM-DD' in India time. */
const istDateKey = (seconds) => {
  const n = Number(seconds);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n * 1000).toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
};

const query = (pool, sql, params) =>
  new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

/** Same guard as the live sync. */
const STATUS_GUARD_SQL = `(status IS NULL OR TRIM(status) = '' OR (status = 'Enquiry' AND ? = 'Appointment'))`;

/** Remember per database whether IVRdata has a status column. */
const hasStatusColumn = new Map();

async function checkStatusColumn(pool, line) {
  if (hasStatusColumn.has(pool)) return hasStatusColumn.get(pool);
  let has = true;
  try {
    const rows = await query(
      pool,
      "SHOW COLUMNS FROM IVRdata LIKE 'status'",
      [],
    );
    has = rows.length > 0;
  } catch (e) {
    console.warn(`  ! could not inspect IVRdata for "${line}": ${e.message}`);
  }
  if (!has)
    console.log(`  (IVRdata for "${line}" has no status column — note only)`);
  hasStatusColumn.set(pool, has);
  return has;
}

/**
 * Look at (dry run) or update (apply) the IVRdata row for one call.
 * Returns 'updated' | 'would-update' | 'up-to-date' | 'actioned' | 'not-found'.
 */
async function backfillOne(pool, withStatus, d) {
  const match = [d.Call_Date, d.Call_Time, d.Caller_Number];

  const rows = await query(
    pool,
    `
      SELECT ivr_id, note${withStatus ? ", status" : ""}
      FROM IVRdata
      WHERE call_date = ? AND call_time = ? AND caller_no = ?
      ORDER BY ivr_id DESC
      LIMIT 1
    `,
    match,
  );
  if (rows.length === 0) return "not-found";

  const row = rows[0];
  const sameNote = (row.note || "") === (d.note || "");
  const sameStatus = !withStatus || row.status === d.Action;
  if (sameNote && sameStatus) return "up-to-date";

  if (withStatus) {
    const s = row.status == null ? "" : String(row.status).trim();
    const allowed = s === "" || (s === "Enquiry" && d.Action === "Appointment");
    if (!allowed) return "actioned";
  }

  if (!APPLY) return "would-update";

  if (withStatus) {
    await query(
      pool,
      `
        UPDATE IVRdata
        SET status = ?, note = ?
        WHERE ivr_id = ? AND ${STATUS_GUARD_SQL}
      `,
      [d.Action, d.note, row.ivr_id, d.Action],
    );
  } else {
    await query(pool, "UPDATE IVRdata SET note = ? WHERE ivr_id = ?", [
      d.note,
      row.ivr_id,
    ]);
  }
  return "updated";
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  console.log(
    `Backfill synced IVR statuses -> MySQL IVRdata, calls on/after ${FROM_DATE} ` +
      `(${APPLY ? "APPLY — writing to MySQL" : "DRY RUN — nothing is written; add --apply"})\n`,
  );

  const db = getFirestore();
  const collections = (await db.listCollections()).filter((c) =>
    IVR_COLLECTION.test(c.id),
  );
  console.log(`${collections.length} branch IVR collections to check\n`);

  const totals = {};
  const bump = (k) => {
    totals[k] = (totals[k] || 0) + 1;
  };

  for (const col of collections) {
    // Docs the sync touched carry syncedAt (ISO string). Single-field
    // inequality: uses Firestore's automatic index, no composite needed.
    // eslint-disable-next-line no-await-in-loop
    const snap = await col.where("syncedAt", ">", "").get();
    if (snap.empty) continue;

    const docs = [];
    snap.forEach((doc) => {
      const d = doc.data() || {};
      if (!STATUSES.includes(d.Action))
        return bump("skipped: not Enquiry/Appointment");
      const day = istDateKey(d.timestamp || doc.id);
      if (!day || day < FROM_DATE) return bump(`skipped: before ${FROM_DATE}`);
      if (
        !d.Destination_Name ||
        !d.Call_Date ||
        !d.Call_Time ||
        !d.Caller_Number
      ) {
        return bump("skipped: missing call fields");
      }
      docs.push({ id: doc.id, day, ...d });
    });
    if (docs.length === 0) continue;

    console.log(`${col.id}: ${docs.length} synced call(s) to check`);

    for (const d of docs) {
      const { connection: pool } = getConnectionByLocation(d.Destination_Name);
      if (!pool) {
        console.warn(
          `  ! no database for line "${d.Destination_Name}" (doc ${d.id})`,
        );
        bump("skipped: unknown line");
        continue;
      }

      try {
        // eslint-disable-next-line no-await-in-loop
        const withStatus = await checkStatusColumn(pool, d.Destination_Name);
        // eslint-disable-next-line no-await-in-loop
        const outcome = await backfillOne(pool, withStatus, d);
        bump(outcome);
        if (
          outcome === "updated" ||
          outcome === "would-update" ||
          outcome === "not-found"
        ) {
          console.log(
            `  ${outcome.padEnd(12)} ${d.day} ${d.Call_Time} ${d.Caller_Number} ` +
              `${d.Action} "${d.note || ""}" (${d.Destination_Name})`,
          );
        }
      } catch (e) {
        console.error(`  ! ${d.Caller_Number} ${d.Call_Time}: ${e.message}`);
        bump("error");
      }
    }
  }

  console.log("\nSummary");
  const labels = {
    updated: "updated in IVRdata",
    "would-update": "would be updated (dry run)",
    "up-to-date": "already up to date",
    actioned: "left alone — IVRdata already has a status",
    "not-found": "no matching IVRdata row",
    error: "errors",
  };
  Object.keys(totals)
    .sort()
    .forEach((k) =>
      console.log(`  ${(labels[k] || k).padEnd(44)} ${totals[k]}`),
    );
  if (!APPLY && totals["would-update"]) {
    console.log("\nDry run only. Re-run with --apply to write these changes.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Backfill failed:", e.message);
    process.exit(1);
  });
