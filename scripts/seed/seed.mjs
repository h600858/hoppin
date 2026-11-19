// Writes the fictional Bjørkelia skole to the Firestore emulator.
//
// Run from functions/:
//   npm run seed                 write the seed data
//   npm run seed -- --reset      empty the emulator database first
//   npm run seed -- --dry-run    validate only, write nothing
//
// The data lives in shared/fixtures/bjorkelia and is checked against
// shared/schema before anything is written.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..", "..");
const dataDir = join(root, "shared", "fixtures", "bjorkelia");

// firebase-admin and the validator come from functions/, so this script
// needs no package.json of its own.
const require = createRequire(join(root, "functions", "package.json"));
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { validate } = require("./lib/schema/validate.js");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const reset = args.has("--reset");

// Safety: only ever write to a demo- project in the emulator.
const projectId = process.env.GCLOUD_PROJECT ?? "demo-innhopp";
if (!projectId.startsWith("demo-")) {
  console.error(`Refusing to seed ${projectId}: only demo- projects are allowed.`);
  process.exit(1);
}
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

const collections = [
  ["tenants", "tenant"],
  ["schools", "school"],
  ["schoolConfigs", "schoolConfig"],
  ["staff", "staff"],
  ["substitutes", "substitute"],
  ["timetable", "timetableEntry"],
];

const instantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/** ISO instants become Firestore Timestamps, as decisions/0006 says. */
function toFirestore(value) {
  if (typeof value === "string" && instantPattern.test(value)) {
    return Timestamp.fromDate(new Date(value));
  }
  if (Array.isArray(value)) {
    return value.map(toFirestore);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toFirestore(v)]));
  }
  return value;
}

// 1. Read and validate everything before writing anything.
const plan = [];
let invalid = 0;
for (const [collection, schema] of collections) {
  const docs = JSON.parse(readFileSync(join(dataDir, `${collection}.json`), "utf8"));
  for (const { id, data } of docs) {
    const result = validate(schema, data);
    if (!result.ok) {
      invalid++;
      console.error(`${collection}/${id}: ${result.errors.join("; ")}`);
    }
    plan.push({ collection, id, data });
  }
}
if (invalid > 0) {
  console.error(`${invalid} invalid documents. Nothing was written.`);
  process.exit(1);
}

const counts = collections.map(([c]) => `${c} ${plan.filter((p) => p.collection === c).length}`);
if (dryRun) {
  console.log(`Dry run: ${plan.length} valid documents (${counts.join(", ")}).`);
  process.exit(0);
}

// 2. Optionally empty the emulator database.
if (reset) {
  const url = `http://${emulatorHost}/emulator/v1/projects/${projectId}/databases/(default)/documents`;
  const response = await fetch(url, { method: "DELETE" });
  if (!response.ok) {
    console.error(`Could not reset the emulator (${response.status}). Is it running?`);
    process.exit(1);
  }
  console.log(`Emptied ${projectId} in the emulator.`);
}

// 3. Write.
initializeApp({ projectId });
const db = getFirestore();
const writer = db.bulkWriter();
for (const { collection, id, data } of plan) {
  void writer.set(db.collection(collection).doc(id), toFirestore(data));
}
await writer.close();
console.log(`Seeded ${projectId}: ${counts.join(", ")}.`);
