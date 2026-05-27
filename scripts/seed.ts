import { config as loadEnv } from "dotenv";

loadEnv();

import { seedCasesFromFiles } from "@/lib/game-service";

async function main() {
  const result = await seedCasesFromFiles();
  console.log(`Imported ${result.imported} case(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
