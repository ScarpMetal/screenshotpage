import { error } from "firebase-functions/logger";
import { Response } from "firebase-functions/v1";
import { bucket } from "./firebase";

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
