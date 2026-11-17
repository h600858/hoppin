import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-innhopp-test",
    firestore: {
      // npm scripts run from functions/, so the rules file is one level up
      rules: readFileSync(resolve(process.cwd(), "../firestore.rules"), "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

describe("firestore.rules: deny all", () => {
  it("denies unauthenticated reads and writes", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "schools/bjorkelia")));
    await assertFails(setDoc(doc(db, "schools/bjorkelia"), { name: "Bjørkelia skole" }));
  });

  it("denies signed-in users too", async () => {
    const db = env.authenticatedContext("kari").firestore();
    await assertFails(getDoc(doc(db, "shifts/s1")));
    await assertFails(setDoc(doc(db, "shifts/s1"), { status: "claimed" }));
  });
});