// ============================================================
// Report PDF Generation - Generazione report mensili PDF
// ============================================================

import PDFDocument from "pdfkit";

export interface MonthlyReportData {
  merchantName: string;
  merchantVat: string;
  period: string; // "2026-01" formato YYYY-MM
  generatedAt: string;

  // Summary
  totalInvoices: number;
  totalAccepted: number;
  totalRejected: number;
  totalPending: number;
  totalErrors: number;
  totalCreditNotes: number;

  // Financial
  totalRevenue: number;
  totalVat: number;
  totalBollo: number;
  totalRefunds: number;
  netRevenue: number;

  // Reconciliation
  stripeTotal: number;
  ficTotal: number;
  reconciliationStatus: "MATCH" | "WARNING" | "MISMATCH";
  gap: number;

  // OSS (if applicable)
  ossTransactions?: Array<{
    country: string;
    count: number;
    totalNet: number;
    totalVat: number;
    vatRate: number;
  }>;

  // Invoice list
  invoices: Array<{
    number: string;
    date: string;
    customer: string;
    amount: number;
    status: string;
    type: string;
  }>;
}

/**
 * Genera un report mensile in formato PDF come Buffer
 */
export async function generateMonthlyReportPDF(
  data: MonthlyReportData,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: `Report Mensile - ${data.period}`,
          Author: "FiscLink",
          Subject: `Report fatturazione ${data.period}`,
          Creator: "FiscLink - Fatturazione Automatica",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // === HEADER ===
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .fillColor("#1e40af")
        .text("⚡ FiscLink", 50, 50);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#6b7280")
        .text("Report Mensile Fatturazione Elettronica", 50, 80);

      doc.moveDown(0.5);
      doc
        .strokeColor("#e5e7eb")
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke();

      // === INFO MERCHANT ===
      doc.moveDown(1);
      doc.fontSize(11).font("Helvetica-Bold").fillColor("#111827");
      doc.text(`Merchant: ${data.merchantName}`);
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#4b5563")
        .text(`P.IVA: ${data.merchantVat}`);
      doc.text(
        `Periodo: ${formatPeriod(data.period)} | Generato: ${data.generatedAt}`,
      );

      // === RIEPILOGO FINANZIARIO ===
      doc.moveDown(1.5);
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#1e40af")
        .text("Riepilogo Finanziario");
      doc.moveDown(0.5);

      drawKeyValue(doc, "Fatturato Totale", formatCurrency(data.totalRevenue));
      drawKeyValue(doc, "IVA Totale", formatCurrency(data.totalVat));
      drawKeyValue(doc, "Bollo Virtuale", formatCurrency(data.totalBollo));
      drawKeyValue(doc, "Rimborsi", formatCurrency(data.totalRefunds));
      drawKeyValue(doc, "Fatturato Netto", formatCurrency(data.netRevenue), true);

      // === STATO FATTURE ===
      doc.moveDown(1.5);
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#1e40af")
        .text("Stato Fatture");
      doc.moveDown(0.5);

      drawKeyValue(doc, "Totale Emesse", String(data.totalInvoices));
      drawKeyValue(doc, "Accettate SDI", String(data.totalAccepted));
      drawKeyValue(doc, "Rifiutate SDI", String(data.totalRejected));
      drawKeyValue(doc, "In Attesa", String(data.totalPending));
      drawKeyValue(doc, "Errori", String(data.totalErrors));
      drawKeyValue(doc, "Note di Credito", String(data.totalCreditNotes));

      // === RICONCILIAZIONE ===
      doc.moveDown(1.5);
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#1e40af")
        .text("Riconciliazione Stripe vs SDI");
      doc.moveDown(0.5);

      drawKeyValue(doc, "Totale Stripe", formatCurrency(data.stripeTotal));
      drawKeyValue(doc, "Totale Fatturato", formatCurrency(data.ficTotal));
      drawKeyValue(doc, "Differenza", formatCurrency(data.gap));
      
      const statusEmoji =
        data.reconciliationStatus === "MATCH"
          ? "✅ Allineato"
          : data.reconciliationStatus === "WARNING"
            ? "⚠️ Discrepanza minore"
            : "❌ Disallineamento";
      drawKeyValue(doc, "Stato", statusEmoji, true);

      // === REPORT OSS (se presente) ===
      if (data.ossTransactions && data.ossTransactions.length > 0) {
        doc.moveDown(1.5);
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .fillColor("#1e40af")
          .text("Vendite Estere (OSS)");
        doc.moveDown(0.5);

        for (const ossTx of data.ossTransactions) {
          drawKeyValue(
            doc,
            `${ossTx.country} (IVA ${ossTx.vatRate}%)`,
            `${ossTx.count} vendite — Netto: ${formatCurrency(ossTx.totalNet)} — IVA: ${formatCurrency(ossTx.totalVat)}`,
          );
        }
      }

      // === NUOVA PAGINA: LISTA FATTURE ===
      if (data.invoices.length > 0) {
        doc.addPage();
        doc
          .fontSize(14)
          .font("Helvetica-Bold")
          .fillColor("#1e40af")
          .text("Dettaglio Fatture");
        doc.moveDown(0.5);

        // Header tabella
        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 130;
        const col3 = 200;
        const col4 = 360;
        const col5 = 430;
        const col6 = 500;

        doc.fontSize(8).font("Helvetica-Bold").fillColor("#6b7280");
        doc.text("N°", col1, tableTop);
        doc.text("Data", col2, tableTop);
        doc.text("Cliente", col3, tableTop);
        doc.text("Importo", col4, tableTop);
        doc.text("Tipo", col5, tableTop);
        doc.text("Stato", col6, tableTop);

        doc.moveDown(0.5);
        doc
          .strokeColor("#e5e7eb")
          .lineWidth(0.5)
          .moveTo(50, doc.y)
          .lineTo(545, doc.y)
          .stroke();
        doc.moveDown(0.3);

        doc.fontSize(8).font("Helvetica").fillColor("#374151");

        for (const inv of data.invoices.slice(0, 100)) {
          // Max 100 per pagina
          const y = doc.y;
          if (y > 750) {
            doc.addPage();
          }
          doc.text(inv.number || "—", col1, doc.y, { width: 75 });
          const currentY = doc.y - 10;
          doc.text(inv.date, col2, currentY, { width: 65 });
          doc.text(inv.customer || "—", col3, currentY, { width: 155 });
          doc.text(formatCurrency(inv.amount), col4, currentY, { width: 65 });
          doc.text(inv.type, col5, currentY, { width: 65 });
          doc.text(inv.status, col6, currentY, { width: 45 });
          doc.moveDown(0.2);
        }
      }

      // === FOOTER ===
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#9ca3af")
        .text(
          `Documento generato automaticamente da FiscLink — ${new Date().toISOString()}`,
          50,
          780,
          { align: "center" },
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// === HELPER ===

function drawKeyValue(
  doc: PDFKit.PDFDocument,
  key: string,
  value: string,
  bold = false,
) {
  const y = doc.y;
  doc.fontSize(10).font("Helvetica").fillColor("#6b7280").text(key, 50, y);
  doc
    .fontSize(10)
    .font(bold ? "Helvetica-Bold" : "Helvetica")
    .fillColor("#111827")
    .text(value, 250, y);
  doc.moveDown(0.4);
}

function formatCurrency(amount: number): string {
  return `€ ${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}

function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  const months = [
    "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
    "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
  ];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}
