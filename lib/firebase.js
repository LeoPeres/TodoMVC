import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json";

const credentials = serviceAccount;

try {
  admin.initializeApp({
    credential: admin.credential.cert(credentials),
    databaseURL: "https://you-forever-a2b89.firebaseio.com",
  });
} catch (error) {
  if (!/already exists/u.test(error.message)) {
    console.error("Firebase admin initialization error", error.stack);
  }
}

export default admin.firestore();
export { admin };
