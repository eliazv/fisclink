/**
 * Servizio Email per Magic Link
 * Usa Resend come provider (alternativa: Nodemailer + SMTP)
 */

import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export interface MagicLinkEmailParams {
  to: string;
  merchantName: string;
  merchantLogoUrl?: string | null;
  brandColor?: string;
  magicLinkUrl: string;
  purchaseDescription?: string;
  purchaseAmount?: string;
}

/**
 * Invia l'email con il magic link per il recupero dati fiscali.
 */
export async function sendMagicLinkEmail(
  params: MagicLinkEmailParams,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const fromEmail = process.env.EMAIL_FROM ?? "noreply@fisclink.it";
    const fromName = params.merchantName || "FiscLink";

    if (process.env.NODE_ENV === "development") {
      console.log("==========================================");
      console.log("DEV MODE: Magic Link Cliente (Email)");
      console.log(`To:    ${params.to}`);
      console.log(`URL:   ${params.magicLinkUrl}`);
      console.log("==========================================");
    }

    const { data, error } = await getResend().emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [params.to],
      subject: `Completa i tuoi dati fiscali – ${params.merchantName}`,
      html: buildMagicLinkHtml(params),
    });

    if (error) {
      console.error("Resend Error (Magic Link Email):", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Errore invio email";
    return { success: false, error: message };
  }
}

/**
 * Invia un reminder per il magic link.
 */
export async function sendMagicLinkReminder(
  params: MagicLinkEmailParams & { reminderNumber: number },
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const fromEmail = process.env.EMAIL_FROM ?? "noreply@fisclink.it";
    const fromName = params.merchantName || "FiscLink";

    if (process.env.NODE_ENV === "development") {
      console.log("==========================================");
      console.log("DEV MODE: Reminder Magic Link (Email)");
      console.log(`To:    ${params.to}`);
      console.log(`URL:   ${params.magicLinkUrl}`);
      console.log("==========================================");
    }

    const { data, error } = await getResend().emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [params.to],
      subject: `Promemoria: completa i dati fiscali – ${params.merchantName}`,
      html: buildReminderHtml(params),
    });

    if (error) {
      console.error("Resend Error (Reminder):", error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Errore invio email reminder";
    return { success: false, error: message };
  }
}

// ============================================================
// Template HTML Email
// ============================================================

function buildMagicLinkHtml(params: MagicLinkEmailParams): string {
  const color = params.brandColor ?? "#2563eb";

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;margin-top:20px;margin-bottom:20px;">
    <!-- Header -->
    <tr>
      <td style="background-color:${color};padding:24px;text-align:center;">
        ${
          params.merchantLogoUrl
            ? `<img src="${params.merchantLogoUrl}" alt="${params.merchantName}" style="max-height:48px;margin-bottom:8px;" />`
            : ""
        }
        <h1 style="color:#ffffff;margin:0;font-size:20px;">${params.merchantName}</h1>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:32px 24px;">
        <h2 style="color:#1a1a1a;margin:0 0 16px;">Completa i tuoi dati fiscali</h2>
        <p style="color:#4a4a4a;font-size:15px;line-height:1.6;">
          Grazie per il tuo acquisto${params.purchaseDescription ? ` di <strong>${params.purchaseDescription}</strong>` : ""}${params.purchaseAmount ? ` (${params.purchaseAmount})` : ""}!
        </p>
        <p style="color:#4a4a4a;font-size:15px;line-height:1.6;">
          Per emettere la fattura elettronica come richiesto dalla normativa italiana, abbiamo bisogno di alcuni dati fiscali aggiuntivi.
        </p>
        <p style="color:#4a4a4a;font-size:15px;line-height:1.6;">
          <strong>Ci vorranno meno di 30 secondi:</strong>
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
          <tr>
            <td align="center">
              <a href="${params.magicLinkUrl}" 
                 style="display:inline-block;background-color:${color};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:600;">
                Inserisci i dati fiscali →
              </a>
            </td>
          </tr>
        </table>
        <p style="color:#888888;font-size:13px;line-height:1.5;">
          Se il pulsante non funziona, copia e incolla questo link nel browser:<br/>
          <a href="${params.magicLinkUrl}" style="color:${color};word-break:break-all;">${params.magicLinkUrl}</a>
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:16px 24px;background-color:#f9f9f9;border-top:1px solid #eee;">
        <p style="color:#999999;font-size:12px;margin:0;text-align:center;">
          Questa email è stata inviata da ${params.merchantName} tramite FiscLink.<br/>
          Il link scadrà tra 7 giorni.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildReminderHtml(
  params: MagicLinkEmailParams & { reminderNumber: number },
): string {
  const color = params.brandColor ?? "#2563eb";

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;margin-top:20px;margin-bottom:20px;">
    <tr>
      <td style="background-color:${color};padding:24px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:20px;">${params.merchantName}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 24px;">
        <h2 style="color:#1a1a1a;margin:0 0 16px;">Promemoria: dati fiscali</h2>
        <p style="color:#4a4a4a;font-size:15px;line-height:1.6;">
          Ti ricordiamo che per completare l'emissione della tua fattura elettronica, 
          abbiamo ancora bisogno dei tuoi dati fiscali.
        </p>
        <p style="color:#4a4a4a;font-size:15px;line-height:1.6;">
          <strong>Bastano 30 secondi:</strong>
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
          <tr>
            <td align="center">
              <a href="${params.magicLinkUrl}" 
                 style="display:inline-block;background-color:${color};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:600;">
                Completa ora →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 24px;background-color:#f9f9f9;border-top:1px solid #eee;">
        <p style="color:#999999;font-size:12px;margin:0;text-align:center;">
          ${params.merchantName} tramite FiscLink
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
