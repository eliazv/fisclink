import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  checkRateLimit,
  RATE_LIMITS,
  type RateLimitConfig,
} from "@/lib/rate-limit";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/api/auth",
  "/api/webhooks/stripe",
  "/api/webhooks/shopify",
  "/api/webhooks/woocommerce",
  "/api/webhooks/paypal",
  "/api/magic-link",
  "/magic",
  "/api/accountant",
  "/accountant",
  "/api/health",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Le risorse statiche passano sempre
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // --- Rate Limiting ---
  if (pathname.startsWith("/api/")) {
    const ip = getClientIP(req);
    let rlConfig: RateLimitConfig = RATE_LIMITS.api;

    if (pathname.startsWith("/api/webhooks/")) {
      rlConfig = RATE_LIMITS.webhook;
    } else if (pathname.startsWith("/api/auth/")) {
      rlConfig = RATE_LIMITS.auth;
    } else if (pathname.startsWith("/api/magic-link")) {
      rlConfig = RATE_LIMITS.magicLink;
    } else if (pathname.startsWith("/api/reports")) {
      rlConfig = RATE_LIMITS.reports;
    }

    const rlResult = checkRateLimit(`${ip}:${pathname}`, rlConfig);

    if (!rlResult.allowed) {
      return NextResponse.json(
        { error: "Troppe richieste. Riprova tra qualche minuto." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rlResult.retryAfter ?? 60),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rlResult.resetAt),
          },
        },
      );
    }
  }

  // Le route pubbliche non richiedono auth
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Controlla cookie di sessione
  const sessionToken = req.cookies.get("cf-session")?.value;

  if (!sessionToken) {
    // Se è un API call, ritorna 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }
    // Altrimenti redirect alla landing
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || "dev-secret-change-me",
    );

    const { payload } = await jwtVerify(sessionToken, secret);

    // Inietta merchantId nell'header per le API route
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-merchant-id", payload.merchantId as string);
    requestHeaders.set("x-merchant-email", payload.email as string);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch {
    // Token invalido/scaduto
    const response = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Sessione scaduta" }, { status: 401 })
      : NextResponse.redirect(new URL("/", req.url));

    // Rimuovi cookie invalido
    response.cookies.delete("cf-session");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
