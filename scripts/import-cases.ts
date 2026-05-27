import { config as loadEnv } from "dotenv";

loadEnv();

import { getAllCaseFiles } from "@/lib/case-loader";

async function main() {
  const cases = await getAllCaseFiles();
  console.log(`Found ${cases.length} case file(s):`);
  for (const caseFile of cases) {
    console.log(`- ${caseFile.slug}: ${caseFile.title}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
