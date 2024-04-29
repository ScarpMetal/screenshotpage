import { Timestamp } from "firebase-admin/firestore";
import { getFunctions } from "firebase-admin/functions";
import { error, log } from "firebase-functions/logger";
import { Response } from "firebase-functions/v1";
import { GoogleAuth } from "google-auth-library";
import { bucket, db } from "./firebase";
import { DBPage } from "./types";

export function requestURLPathToPageId(urlPath: string) {
  const errStr = (message: string) =>
    `Error running requestURLPathToPageId(${urlPath}) - ${message}`;

  if (urlPath.at(0) !== "/") {
    throw new Error(
      errStr(`First character of urlPath should be the "/" character.`)
    );
  }

  if (urlPath.length <= 1) {
    throw new Error(errStr(`urlPath must contain a url.`));
  }

  return urlPath.slice(1);
}

export function pipeFromFile(res: Response, fileName: string) {
  try {
    const file = bucket.file(fileName);
    const readStream = file.createReadStream();
    res.setHeader("content-type", "png");
    readStream.pipe(res);
  } catch (err) {
    if (err instanceof Error) {
      error(err.message);
    }
  }
}

export async function enqueuePageScreenshotTask(pageId: string) {
  /**
   * Add document to firestore
   */
  log(`Adding pageId=${pageId} to firestore list`);
  const pageData: DBPage = { firstRequestedAt: Timestamp.now() };
  db.collection("pages").doc(pageId).set(pageData);

  /**
   * Enqueue new task
   */
  const queue = getFunctions().taskQueue("screenshotQueue");
  const uri = await getFunctionUrl("screenshotQueue");
  log(`Enqueueing screenshot action for pageId=${pageId}`);
  queue.enqueue({ pageId }, { uri });
}

let auth: GoogleAuth;
async function getFunctionUrl(name: string, location = "us-central1") {
  if (!auth) {
    auth = new GoogleAuth({
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });
  }
  const projectId = await auth.getProjectId();
  const url =
    "https://cloudfunctions.googleapis.com/v2beta/" +
    `projects/${projectId}/locations/${location}/functions/${name}`;

  const client = await auth.getClient();
  const res = await client.request<{ serviceConfig: { uri: string } }>({ url });
  const uri = res.data?.serviceConfig?.uri;
  if (!uri) {
    throw new Error(`Unable to retreive uri for function at ${url}`);
  }
  return uri;
}
