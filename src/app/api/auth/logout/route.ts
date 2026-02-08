import { NextRequest, NextResponse } from "next/server";

// POST /api/auth/logout — distrugge la sessione
export async function POST(req: NextRequest) {
  const response = NextResponse.json({ message: "Logout effettuato" });
  response.cookies.delete("cf-session");
  return response;
}
