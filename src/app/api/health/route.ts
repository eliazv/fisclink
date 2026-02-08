// ============================================================
// Health Check API - /api/health
// ============================================================
// Verifica stato dei servizi: DB, Redis, provider esterni

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const checks: Record<
    string,
    { status: string; latency?: number; error?: string }
  > = {};

  // Check Database
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latency: Date.now() - dbStart };
  } catch (error) {
    checks.database = {
      status: "error",
      latency: Date.now() - dbStart,
      error: error instanceof Error ? error.message : "DB non raggiungibile",
    };
  }

  // Check Redis (via BullMQ connection)
  const redisStart = Date.now();
  try {
    const IORedis = await import("ioredis");
    const redis = new IORedis.default(
      process.env.REDIS_URL || "redis://localhost:6379",
      {
        connectTimeout: 3000,
        maxRetriesPerRequest: 1,
      },
    );
    await redis.ping();
    await redis.quit();
    checks.redis = { status: "ok", latency: Date.now() - redisStart };
  } catch (error) {
    checks.redis = {
      status: "error",
      latency: Date.now() - redisStart,
      error: error instanceof Error ? error.message : "Redis non raggiungibile",
    };
  }

  // Overall status
  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      version: process.env.npm_package_version || "0.1.0",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    },
    { status: allOk ? 200 : 503 },
  );
}
