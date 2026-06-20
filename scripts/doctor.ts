import "dotenv/config";

import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

type CheckResult = {
  name: string;
  status: "ok" | "warn" | "error";
  message: string;
};

const checks: CheckResult[] = [];

function addCheck(result: CheckResult) {
  checks.push(result);
}

function requireEnv(name: string, options?: { minLength?: number }) {
  const value = process.env[name];
  if (!value) {
    addCheck({
      name,
      status: "error",
      message: "Missing environment variable",
    });
    return null;
  }

  if (options?.minLength && value.length < options.minLength) {
    addCheck({
      name,
      status: "warn",
      message: `Set, but shorter than ${options.minLength} characters`,
    });
    return value;
  }

  addCheck({ name, status: "ok", message: "Set" });
  return value;
}

function optionalEnv(name: string) {
  addCheck({
    name,
    status: process.env[name] ? "ok" : "warn",
    message: process.env[name] ? "Set" : "Optional and not set",
  });
}

function maskConnectionString(value: string) {
  try {
    const url = new URL(value);
    if (url.password) url.password = "***";
    return url.toString();
  } catch {
    return "<invalid url>";
  }
}

async function checkDatabase(connectionString: string) {
  process.env.DATABASE_URL = connectionString;
  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });
  const start = Date.now();

  try {
    await prisma.$queryRaw`select 1`;
    addCheck({
      name: "database",
      status: "ok",
      message: `Connected in ${Date.now() - start}ms`,
    });
  } catch (error) {
    addCheck({
      name: "database",
      status: "error",
      message:
        error instanceof Error
          ? `${error.message} (${maskConnectionString(connectionString)})`
      : "Database connection failed",
    });
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

async function checkRedis(redisUrl: string) {
  const redis = new IORedis(redisUrl, {
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });
  const start = Date.now();

  try {
    await redis.connect();
    await redis.ping();
    addCheck({
      name: "redis",
      status: "ok",
      message: `Connected in ${Date.now() - start}ms`,
    });
  } catch (error) {
    addCheck({
      name: "redis",
      status: "error",
      message: error instanceof Error ? error.message : "Redis connection failed",
    });
  } finally {
    redis.disconnect();
  }
}

function printResults() {
  const icon = {
    ok: "OK",
    warn: "WARN",
    error: "ERROR",
  } as const;

  console.log("\nFiscLink doctor\n");
  for (const check of checks) {
    console.log(`${icon[check.status].padEnd(5)} ${check.name.padEnd(24)} ${check.message}`);
  }

  const errors = checks.filter((check) => check.status === "error");
  const warnings = checks.filter((check) => check.status === "warn");

  console.log("");
  if (errors.length > 0) {
    console.log(
      `Doctor failed: ${errors.length} error(s), ${warnings.length} warning(s).`,
    );
    process.exitCode = 1;
    return;
  }

  console.log(`Doctor passed: 0 errors, ${warnings.length} warning(s).`);
}

async function main() {
  const databaseUrl = requireEnv("DATABASE_URL");
  const redisUrl = requireEnv("REDIS_URL");
  requireEnv("AUTH_SECRET", { minLength: 32 });
  requireEnv("ENCRYPTION_SECRET", { minLength: 32 });
  requireEnv("NEXT_PUBLIC_APP_URL");
  optionalEnv("RESEND_API_KEY");
  optionalEnv("EMAIL_FROM");

  if (databaseUrl) await checkDatabase(databaseUrl);
  if (redisUrl) await checkRedis(redisUrl);

  printResults();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
