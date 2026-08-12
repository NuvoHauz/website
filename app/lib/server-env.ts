export function readServerEnv(name: string): string {
  const value = process.env[name];
  return typeof value === "string" ? value.replace(/\r/g, "").trim() : "";
}
