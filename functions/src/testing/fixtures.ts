import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Reads a JSON file from shared/fixtures. npm scripts run from functions/. */
export function readFixture(relativePath: string): unknown {
  const path = resolve(process.cwd(), "..", "shared", "fixtures", relativePath);
  return JSON.parse(readFileSync(path, "utf8"));
}
