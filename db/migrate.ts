import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./client";

export function runMigrations() {
  console.log("Running migrations...");
  migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations complete.");
}
