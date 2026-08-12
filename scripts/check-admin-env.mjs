import { readFileSync } from "node:fs";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const rawLine =
  readFileSync(".env.local", "utf8").match(/^OWNER_DASHBOARD_PASSWORD=(.*)$/m)?.[1] ??
  "";
const loaded = process.env.OWNER_DASHBOARD_PASSWORD ?? "";

console.log(JSON.stringify({
  rawLength: rawLine.trim().length,
  loadedLength: loaded.length,
  valuesMatch: rawLine.trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1") === loaded,
  loadedStartsWithQuote: loaded.startsWith('"') || loaded.startsWith("'"),
  loadedEndsWithQuote: loaded.endsWith('"') || loaded.endsWith("'"),
  loadedContainsDollar: loaded.includes("$"),
  passwordMeetsMinimum: loaded.length >= 12,
  secretLength: (process.env.OWNER_SESSION_SECRET ?? "").length,
  secretMeetsMinimum: (process.env.OWNER_SESSION_SECRET ?? "").length >= 32,
}));
