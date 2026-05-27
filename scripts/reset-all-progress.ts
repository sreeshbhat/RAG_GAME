import { config as loadEnv } from "dotenv";

loadEnv();

import { resetProgress } from "@/lib/game-service";

async function main() {
  await resetProgress({ type: "all" });
  console.log("All student progress, scores, accusations, reports, and chat history cleared.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
