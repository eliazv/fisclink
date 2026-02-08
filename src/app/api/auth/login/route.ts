import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SignJWT } from "jose";
import { nanoid } from "nanoid";
import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

// POST /api/auth/login — invia email login magic link al merchant
export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email richiesta" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Cerca o crea merchant
  let merchant = await prisma.merchant.findUnique({
    where: { email: normalizedEmail },
  });

  if (!merchant) {
    // Auto-registrazione: crea nuovo merchant
    merchant = await prisma.merchant.create({
      data: {
        email: normalizedEmail,
        name: normalizedEmail.split("@")[0],
      },
    });
  }

  // Genera token login
  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minuti

  await prisma.loginToken.create({
    data: {
      token,
      merchantId: merchant.id,
      email: normalizedEmail,
      expiresAt,
    },
  });

  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/verify?token=${token}`;

  await getResend().emails.send({
    from:
      process.env.EMAIL_FROM || "Connettore Fiscale <noreply@connettore.it>",
    to: normalizedEmail,
    subject: "Accedi a Connettore Fiscale",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1e40af;">Connettore Fiscale</h2>
        <p>Clicca il pulsante per accedere alla tua dashboard:</p>
        <a href="${loginUrl}" 
           style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Accedi ora
        </a>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          Il link scade tra 15 minuti. Se non hai richiesto l'accesso, ignora questa email.
        </p>
      </div>
    `,
  });

  return NextResponse.json({ message: "Email inviata. Controlla la inbox." });
}
