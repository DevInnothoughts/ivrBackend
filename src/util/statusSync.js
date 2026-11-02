/* eslint-disable prettier/prettier */
/**
 * statusSync.js
 *
 * Cross-source status sync, client side.
 *
 * When a number is marked Appointment or Enquiry on one screen (helpline call,
 * IVR call, web / bot / web-call lead), the same status and note are copied to
 * that number's other leads at the same branch, so staff don't action — or
 * book — the same person twice.
 *
 *   syncStatus()             call right after a save succeeds. Fire-and-forget:
 *                            never throws, never blocks the screen. The server
 *                            (POST /statusSync) updates the lead tables and this
 *                            branch's IVR calls, and logs the action.
 *
 *   pullHelplineStatuses()   helpline calls live only on this phone, so the
 *                            server can't write them. The helpline list calls
 *                            this on refresh; it reads the log for the numbers
 *                            on screen and returns patches for callActionStore.
 *
 * Rules (same on server and here):
 *   - same branch only; IVR = this branch's own collection
 *   - only leads dated on or after the one that was actioned
 *   - Appointment overwrites empty or Enquiry; Enquiry only overwrites empty
 *   - Spam and anything else is left untouched
 *   - status AND note are copied; the note says where it came from
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {toDateKey} from './appointmentSlots';

const BACKEND_URL = 'https://wedoc.in/ivr'; //'https://admin.wedoc.in/ivr';
const TIMEOUT_MS = 10000;
// The helpline lookup runs inside the list refresh, which has its own 10s
// "still loading" timer — keep well under it.
const LOOKUP_TIMEOUT_MS = 5000;

/** updateStatusPath in a lead screen's config -> sync source key. */
const LEAD_PATH_SOURCES = {
  '/leadManagement/updateStatus': 'web',
  '/leadManagement/updateStatus/bot': 'bot',
  '/leadManagement/updateStatus/call': 'call',
};

export const leadSourceFromPath = path => LEAD_PATH_SOURCES[path] || null;

/** Last 10 digits, digits only. Same as toPhone10() on the server. */
export const toPhone10 = raw => {
  const digits = String(raw ?? '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
};

/**
 * Anything date-like -> 'YYYY-MM-DD' in device (India) time.
 * Accepts a Date, an ISO string from MySQL, or a timestamp. Timestamps under
 * 1e12 are treated as seconds (IVR docs), larger ones as ms (device call log).
 */
export const toSyncDateKey = value => {
  if (value === null || value === undefined || value === '') return null;
  let d;
  if (value instanceof Date) {
    d = value;
  } else if (/^\d+$/.test(String(value))) {
    const n = Number(value);
    d = new Date(n < 1e12 ? n * 1000 : n);
  } else {
    d = new Date(value);
  }
  return isNaN(d.getTime()) ? null : toDateKey(d);
};

/** Same guard as canOverwrite() in statusSyncModel.js. */
export const canOverwrite = (current, incoming) => {
  const c = current == null ? '' : String(current).trim();
  if (c === '') return true;
  return c === 'Enquiry' && incoming === 'Appointment';
};

const readStored = async key => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const postJson = async (path, body, timeoutMs = TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(await response.text());
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Copy an Appointment / Enquiry to the same number's other leads.
 *
 * @param {object} p
 * @param {string} p.phone        the number that was actioned
 * @param {'Appointment'|'Enquiry'} p.status
 * @param {string} p.note
 * @param {string} [p.enquiryType]  Hot / Mild / Cold ... (enquiries)
 * @param {string} [p.patientName]
 * @param {'web'|'bot'|'call'|'ivr'|'helpline'} p.source
 * @param {string|number} p.sourceId   lead id / IVR doc id / call timestamp
 * @param {*} p.sourceDate         date of the actioned lead (any format)
 * @param {string} [p.location]    app branch name; defaults to the stored one
 */
export const syncStatus = p => {
  // Not awaited by callers on purpose — the original save already succeeded.
  (async () => {
    try {
      if (p.status !== 'Appointment' && p.status !== 'Enquiry') return;
      if (!p.source || !toPhone10(p.phone)) return;

      const sourceDate = toSyncDateKey(p.sourceDate) || toDateKey(new Date());
      const [storedLocation, mobile] = await Promise.all([
        readStored('location'),
        readStored('mobile'),
      ]);
      const location = p.location || storedLocation;
      if (!location) return;

      const result = await postJson('/statusSync', {
        phone: p.phone,
        status: p.status,
        note: p.note || '',
        enquiryType: p.enquiryType || null,
        patientName: p.patientName || null,
        source: p.source,
        sourceId: p.sourceId != null ? String(p.sourceId) : null,
        sourceDate,
        location,
        mobile,
      });
      console.log('statusSync:', result?.updated);
    } catch (e) {
      console.warn('statusSync failed (original save is unaffected):', e?.message);
    }
  })();
};

/**
 * Helpline: find logged actions that apply to calls on this phone.
 *
 * @param {Array} logs       merged call logs (with any saved actionTaken)
 * @param {string} location  app branch name
 * @returns {Promise<Object>} { [timestampKey]: patch } for callActionStore
 */
export const pullHelplineStatuses = async (logs, location) => {
  try {
    if (!location || !Array.isArray(logs) || logs.length === 0) return {};

    const phones = [
      ...new Set(logs.map(l => toPhone10(l.phoneNumber)).filter(Boolean)),
    ];
    if (phones.length === 0) return {};

    const entries = await postJson(
      '/statusSync/lookup',
      {location, phones},
      LOOKUP_TIMEOUT_MS,
    );
    if (!Array.isArray(entries) || entries.length === 0) return {};

    const byPhone = {};
    entries.forEach(e => {
      (byPhone[e.phone10] = byPhone[e.phone10] || []).push(e);
    });

    const patches = {};
    logs.forEach(log => {
      const list = byPhone[toPhone10(log.phoneNumber)];
      if (!list) return;

      const key = String(log.timestamp ?? '');
      const callDate = toSyncDateKey(log.timestamp);
      if (!callDate) return;

      // Entries that may apply: actioned on or before this call's date, and
      // not this very call. Newest first (server order); Appointment wins.
      const eligible = list.filter(
        e =>
          e.sourceDate <= callDate &&
          !(e.source === 'helpline' && String(e.sourceId) === key),
      );
      const best =
        eligible.find(e => e.status === 'Appointment') ||
        eligible.find(e => e.status === 'Enquiry');
      if (!best) return;

      // Spam is saved as actionTaken 'Note' — never overwritten.
      if (!canOverwrite(log.actionTaken, best.status)) return;

      patches[key] = {
        actionTaken: best.status,
        enquiryType:
          best.status === 'Appointment' ? 'Appointment' : best.enquiryType || '',
        patientName: log.patientName || best.patientName || '',
        FDE: log.FDE || '',
        note: best.note || '',
        syncedFrom: best.sourceLabel || best.source,
      };
    });

    return patches;
  } catch (e) {
    console.warn('Helpline status pull failed:', e?.message);
    return {};
  }
};

export default {
  syncStatus,
  pullHelplineStatuses,
  leadSourceFromPath,
  toPhone10,
  toSyncDateKey,
  canOverwrite,
};
