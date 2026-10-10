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
  return app.firestore();
}

/** users/0XXXXXXXXXX — same document id the mobile app reads */
async function getUserByMobile(mobile10) {
  const snap = await getFirestore()
    .collection("users")
    .doc(`0${mobile10}`)
    .get();
  return snap.exists ? snap.data() : null;
}

module.exports = { getUserByMobile };
