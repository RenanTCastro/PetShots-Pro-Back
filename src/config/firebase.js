const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "petshots-p.firebasestorage.app"
});

const bucket = admin.storage().bucket();

module.exports = bucket;
