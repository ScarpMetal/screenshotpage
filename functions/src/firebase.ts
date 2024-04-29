import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const app = initializeApp();
export const db = getFirestore(app);
export const bucket = getStorage(app).bucket(
  "screenshotpage-ee823.appspot.com"
);
