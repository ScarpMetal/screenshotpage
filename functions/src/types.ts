import { Timestamp } from "firebase-admin/firestore";
import { info, warn } from "firebase-functions/logger";

export interface DBImage {
  screenshottedAt: Timestamp;
  url: string;
}

export function isDBImage(value: unknown): value is DBImage {
  if (!(value instanceof Object)) {
    warn("value is not an Object");
    return false;
  }
  if (
    !("screenshottedAt" in value && value.screenshottedAt instanceof Timestamp)
  ) {
    warn("screenshottedAt does not exist");
    return false;
  }
  if (!("url" in value && typeof value.url === "string")) {
    warn("url does not exist");
    return false;
  }
  return true;
}

export interface DBPage {
  firstRequestedAt: Timestamp;
  image?: DBImage;
}

export function isDBPage(value: unknown): value is DBPage {
  if (!(value instanceof Object)) {
    warn("value is not and Object");
    return false;
  }
  if (
    !(
      "firstRequestedAt" in value && value.firstRequestedAt instanceof Timestamp
    )
  ) {
    warn("No firstRequestedAt");
    return false;
  }
  if ("image" in value) {
    if (!isDBImage(value.image)) {
      warn("value.image is incorrectly formatted");
      return false;
    }
  } else {
    info("No image to check types for");
  }
  return true;
}
