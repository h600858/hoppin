import { defineConfig } from "vitest/config";

export default defineConfig({
 test: {
    environment: "node",
    projects: [
        {
            extends: true,
            test: {
                name: "unit",
                include: ["src/**/*.test.ts"],
                exclude: ["src/**/*.emulator.test.ts"],
            },
        },
        {
            extends: true,
            test: {
                name: "emulator",
                include: ["src/**/*.emulator.test.ts"],
                testTimeout: 15_000, 
            }// emulator tests can be slow
        },
    ],
}, 
});