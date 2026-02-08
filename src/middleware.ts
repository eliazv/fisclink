import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/", "/api/webhooks/stripe", "/api/magic-link", "/magic"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Le route pubbliche non richiedono auth
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Le risorse statiche passano sempre
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
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
