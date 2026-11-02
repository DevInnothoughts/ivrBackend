// src/util/firebaseAdmin.js
//
// Firestore access for the dashboard login (same "users" collection the
// mobile app uses). The service-account key is read from the server, never
// from the repo:
//
//   FIREBASE_SERVICE_ACCOUNT_PATH=/etc/hhc/trackle-service-account.json
//     (or the standard GOOGLE_APPLICATION_CREDENTIALS variable)
const path = require("path");
const admin = require("firebase-admin");

let app = null;
let db = null;

function getFirestore() {
  if (!app) {
    const keyPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      path.join(
        __dirname,
        "..",
        "..",
        "hhcivr-firebase-adminsdk-s39sf-170bc69305.json",
      );
    if (!keyPath) {
      const err = new Error(
        "Dashboard login is not configured: set FIREBASE_SERVICE_ACCOUNT_PATH on the server",
      );
      err.status = 500;
      throw err;
    }
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const serviceAccount = require(keyPath);
    app = admin.initializeApp(
      { credential: admin.credential.cert(serviceAccount) },
      "dashboard", // named app, so it can't clash with any other initializeApp()
    );
  }
  if (!db) {
    db = app.firestore();
    // REST instead of gRPC: no long-lived channel to open, so the first call
    // after a restart takes well under a second instead of ~10s. Must be set
    // before the first read/write, hence the cached instance.
    db.settings({ preferRest: true });
  }
  return db;
}

/**
 * Fetch the access token and open the connection ahead of time, so the first
 * real request (status sync, dashboard login) doesn't pay for it. Never
 * throws — a missing key is reported once and the server starts normally.
 */
function warmUpFirestore() {
  try {
    const started = Date.now();
    getFirestore()
      .collection("HHCLocations")
      .limit(1)
      .get()
      .then(() => console.log(`Firestore ready (${Date.now() - started}ms)`))
      .catch((e) => console.warn("Firestore warm-up failed:", e.message));
  } catch (e) {
    console.warn("Firestore not configured:", e.message);
  }
}

/** users/0XXXXXXXXXX — same document id the mobile app reads */
async function getUserByMobile(mobile10) {
  const snap = await getFirestore()
    .collection("users")
    .doc(`0${mobile10}`)
    .get();
  return snap.exists ? snap.data() : null;
}

// getFirestore is also used by statusSyncModel.js to update IVR call docs.
module.exports = { getUserByMobile, getFirestore, warmUpFirestore };
