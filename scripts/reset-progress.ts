import { config as loadEnv } from "dotenv";

loadEnv();

import { resetProgress } from "@/lib/game-service";

async function main() {
  const studentId = process.argv[2];
  if (!studentId) {
    throw new Error("Usage: npm run reset:progress -- <studentDbId>");
  }

  await resetProgress({ type: "student", studentId });
  console.log(`Reset progress for student ${studentId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
