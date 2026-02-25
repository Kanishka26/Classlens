const admin = require('firebase-admin');

let credential;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Production (Render) — use environment variable
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  credential = admin.credential.cert(serviceAccount);
} else {
  // Local development — use file
  const serviceAccount = require('../../serviceAccountKey.json');
  credential = admin.credential.cert(serviceAccount);
}

admin.initializeApp({ credential });

const db = admin.firestore();
module.exports = { admin, db };