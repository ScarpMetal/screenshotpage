/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { DocumentData, DocumentSnapshot } from "firebase-admin/firestore";
import { error, log, warn } from "firebase-functions/logger";
import { onRequest } from "firebase-functions/v2/https";
import { fallbackImage } from "./constants";
import { db } from "./firebase";
import { isDBPage } from "./types";
import { pipeFromFile, requestURLPathToPageId } from "./utils";

export const image = onRequest(async (req, res) => {
  const urlPath = req.url;

  /**
   * Extract page id from url path
   */
  let pageId: string;
  try {
    pageId = requestURLPathToPageId(urlPath);
    log(`Getting screenshot for pageId=${pageId}`);
  } catch (err) {
    warn("Converting request URL to pageId failed.");
    if (err instanceof Error) {
      warn(err.message);
    }
    return pipeFromFile(res.status(404), fallbackImage["invalid-url"]);
  }

  /**
   * Get snapshot from DB
   */
  let snapshot: DocumentSnapshot<DocumentData>;
  try {
    snapshot = await db.collection("pages").doc(pageId).get();
  } catch (err) {
    error(`Could not fetch snapshot for pageId=${pageId}`);
    if (err instanceof Error) {
      error(err.message);
    }
    return pipeFromFile(res.status(500), fallbackImage[404]);
  }

  if (!snapshot.exists) {
    error(
      `Could not find corresponding document in database for pageId=${pageId}`
    );
    return pipeFromFile(res.status(500), fallbackImage[404]);
  }

  const data = snapshot.data();
  if (!isDBPage(data)) {
    error(`Database entry for pageId=${pageId} is incorrectly formatted.`);
    return pipeFromFile(res.status(500), fallbackImage[404]);
  }

  /**
   * Return processing image if file is still being processed
   */
  if (!data.image) {
    log(
      "Tried to use an unprocessed image, redirecting to fallback processing image."
    );
    return pipeFromFile(res, fallbackImage.processing);
  }

  /**
   * Return the image file
   */
  log("Returning image url: ", data.image.url);
  pipeFromFile(res, data.image.url);
});

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
