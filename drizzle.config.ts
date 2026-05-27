import { config as loadEnv } from "dotenv";
import type { Config } from "drizzle-kit";

loadEnv();

export default {
  schema: "./lib/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
