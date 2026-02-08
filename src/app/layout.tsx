import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default:
      "FiscLink – Fatturazione elettronica automatica da Stripe",
    template: "%s | FiscLink",
  },
  description:
    "Trasforma ogni pagamento Stripe in una fattura elettronica a norma SDI. Magic Link per raccogliere dati fiscali, bollo automatico, regime forfettario. Per PMI italiane.",
  keywords: [
    "fattura elettronica automatica",
    "Stripe fattura elettronica Italia",
    "fatturazione elettronica Stripe",
    "connettore Stripe Fatture in Cloud",
    "fattura elettronica forfettario",
    "SDI automatico",
    "Shopify fattura elettronica",
    "e-commerce fatturazione Italia",
    "codice fiscale checkout",
    "bollo virtuale automatico",
    "Magic Link dati fiscali",
  ],
  authors: [{ name: "FiscLink" }],
  creator: "FiscLink",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://fisclink.it",
  ),
  openGraph: {
    type: "website",
    locale: "it_IT",
    url: "/",
    siteName: "FiscLink",
    title: "FiscLink – Fatturazione elettronica automatica da Stripe",
    description:
      "Smetti di rincorrere i clienti per il Codice Fiscale. Ogni pagamento Stripe diventa fattura SDI in automatico.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FiscLink – Fatturazione automatica",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FiscLink – Fattura elettronica da Stripe in automatico",
    description:
      "Collega Stripe a Fatture in Cloud. Magic Link per dati fiscali mancanti. Bollo calcolato. SDI inviata.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "FiscLink",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "Middleware SaaS che collega Stripe alla fatturazione elettronica italiana SDI tramite Fatture in Cloud.",
              offers: {
                "@type": "AggregateOffer",
                lowPrice: "15",
                highPrice: "59",
                priceCurrency: "EUR",
                offerCount: 3,
              },
              featureList: [
                "Fatturazione elettronica automatica",
                "Magic Link per dati fiscali",
                "Bollo virtuale automatico",
                "Regime forfettario",
                "Dashboard merchant",
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
