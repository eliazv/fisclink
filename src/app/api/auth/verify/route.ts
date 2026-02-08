import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SignJWT } from "jose";

// GET /api/auth/verify?token=xxx — verifica token login e crea sessione
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/?error=missing-token", req.url));
  }

  const loginToken = await prisma.loginToken.findUnique({
    where: { token },
    include: { merchant: true },
  });

  if (!loginToken) {
    return NextResponse.redirect(new URL("/?error=invalid-token", req.url));
  }

  if (loginToken.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/?error=expired-token", req.url));
  }

  if (loginToken.usedAt) {
    return NextResponse.redirect(new URL("/?error=already-used", req.url));
  }

  // Marca come usato
  await prisma.loginToken.update({
    where: { id: loginToken.id },
    data: { usedAt: new Date() },
  });

  // Crea JWT di sessione
  const secret = new TextEncoder().encode(
    process.env.AUTH_SECRET || "dev-secret-change-me",
  );

  const jwt = await new SignJWT({
    merchantId: loginToken.merchantId,
    email: loginToken.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  // Redirect alla dashboard con cookie di sessione
  const response = NextResponse.redirect(new URL("/dashboard", req.url));
  response.cookies.set("cf-session", jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 giorni
    path: "/",
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      merchantId: loginToken.merchantId,
      action: "LOGIN",
      level: "INFO",
      details: `Login da ${loginToken.email}`,
    },
  });

  return response;
}
