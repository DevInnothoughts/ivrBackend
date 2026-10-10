// src/util/dashboardAuth.js
//
// Login + session tokens for the Master Enquiry dashboard.
//
// * Credentials are the mobile app's: Firestore users/0{mobile}, fields
//   Destination_Number and pin. Only role === 'admin' may sign in.
// * Admins see all enquiries and appointments; the user's ivrNum list is
//   deliberately not applied here.
// * The session token has no expiry (stays signed in until logout), but every
//   request re-checks the user in Firestore (cached for 5 minutes). So the
//   session ends by itself if the user is removed, loses the admin role, or
//   their PIN is changed — changing the PIN is how to sign someone out
//   everywhere.
//
// Server environment:
//   DASHBOARD_AUTH_SECRET   long random string used to sign tokens (required)
//   FIREBASE_SERVICE_ACCOUNT_PATH   see firebaseAdmin.js

const crypto = require("crypto");
const { getUserByMobile } = require("./firebaseAdmin");

const USER_CACHE_MS = 5 * 60 * 1000;
const MAX_FAILS = 5; // per mobile number
const MAX_FAILS_IP = 20; // per IP address
const LOCK_MS = 15 * 60 * 1000;

function secret() {
  const s =
    process.env.DASHBOARD_AUTH_SECRET ||
    "TPGipMmwZXFA0gPqAy3bJ4qFSdqAeCL2o62xeJgr0RKHhHyC+euEGecMscJXJ3j3";
  if (!s || s.length < 32) {
    const err = new Error(
      "Dashboard login is not configured: set DASHBOARD_AUTH_SECRET (32+ characters) on the server",
    );
    err.status = 500;
    throw err;
  }
  return s;
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const b64 = (buf) => Buffer.from(buf).toString("base64url");

// PIN fingerprint stored in the token, so a PIN change invalidates sessions.
// HMAC'd with the server secret: the token never carries anything usable to
// recover the PIN.
const pinTag = (mobile, pin) =>
  crypto
    .createHmac("sha256", secret())
    .update(`pin:${mobile}:${pin}`)
    .digest("base64url")
    .slice(0, 16);

function sign(payload) {
  const body = b64(JSON.stringify(payload));
  const sig = crypto
    .createHmac("sha256", secret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

function verify(token) {
  if (typeof token !== "string" || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  const expected = crypto
    .createHmac("sha256", secret())
    .update(body)
    .digest("base64url");
  const a = Buffer.from(sig || "");
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch (e) {
    return null;
  }
}

// Mobile app strips one leading 0; we also accept +91 / spaces.
function normalizeMobile(raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

function publicUser(mobile, u) {
  return {
    mobile,
    name: u.name || u.Destination_Name || u.userName || null,
    location: u.location || null,
    role: u.role,
  };
}

// ---------------------------------------------------------------------
// brute-force throttle (in memory; resets on server restart)
// ---------------------------------------------------------------------

const fails = new Map(); // key -> { n, until }

function isLocked(key) {
  const f = fails.get(key);
  if (!f || !f.until) return false;
  if (f.until > Date.now()) return true;
  fails.delete(key); // lock expired
  return false;
}

function recordFail(key, max) {
  const f = fails.get(key) || { n: 0, until: 0 };
  f.n += 1;
  if (f.n >= max) f.until = Date.now() + LOCK_MS;
  fails.set(key, f);
}

// ---------------------------------------------------------------------
// login
// ---------------------------------------------------------------------

async function login(rawMobile, rawPin, ip) {
  const mobile = normalizeMobile(rawMobile);
  const pin = rawPin == null ? "" : String(rawPin).trim();
  if (!mobile || !pin)
    throw httpError(400, "Enter your mobile number and PIN.");

  const mKey = `m:${mobile}`;
  const ipKey = `ip:${ip || "?"}`;
  if (isLocked(mKey) || isLocked(ipKey)) {
    throw httpError(429, "Too many failed attempts. Try again in 15 minutes.");
  }

  const user = await getUserByMobile(mobile);
  const ok =
    user &&
    user.Destination_Number === `0${mobile}` &&
    String(user.pin) === pin;

  if (!ok) {
    recordFail(mKey, MAX_FAILS);
    recordFail(ipKey, MAX_FAILS_IP);
    throw httpError(401, "Mobile number or PIN is incorrect.");
  }

  if (user.role !== "admin") {
    throw httpError(403, "Only admin users can sign in to this dashboard.");
  }

  fails.delete(mKey);
  userCache.set(mobile, { user, at: Date.now() });

  const token = sign({
    v: 1,
    m: mobile,
    p: pinTag(mobile, pin),
    iat: Date.now(),
  });
  return { token, user: publicUser(mobile, user) };
}

// ---------------------------------------------------------------------
// middleware
// ---------------------------------------------------------------------

const userCache = new Map(); // mobile -> { user, at }

async function currentUser(mobile) {
  const hit = userCache.get(mobile);
  if (hit && Date.now() - hit.at < USER_CACHE_MS) return hit.user;
  const user = await getUserByMobile(mobile);
  userCache.set(mobile, { user, at: Date.now() });
  return user;
}

/** Express middleware: only signed-in admins get through. */
async function requireDashboardAdmin(req, res, next) {
  try {
    const header = req.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    const payload = token ? verify(token) : null;
    if (!payload || !payload.m) return res.status(401).send("Please sign in.");

    const user = await currentUser(payload.m);
    if (
      !user ||
      user.role !== "admin" ||
      pinTag(payload.m, String(user.pin)) !== payload.p
    ) {
      userCache.delete(payload.m);
      return res
        .status(401)
        .send("Your session has ended. Please sign in again.");
    }

    req.dashboardUser = publicUser(payload.m, user);
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { login, requireDashboardAdmin, normalizeMobile };
