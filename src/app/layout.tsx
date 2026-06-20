import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeProvider from "@/components/layout/theme-provider";
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
    default: "FiscLink – Open source Stripe fiscal bridge per l'Italia",
    template: "%s | FiscLink",
  },
  description:
    "Raccogli e valida Codice Fiscale, Partita IVA, SDI e PEC dai pagamenti Stripe con un Magic Link al cliente. Open source, self-hosted, pensato per piccoli SaaS e freelance italiani.",
  keywords: [
    "stripe fatturazione elettronica",
    "dati fiscali stripe",
    "codice fiscale stripe",
    "partita iva stripe",
    "sdi pec stripe",
    "magic link dati fiscali",
    "open source fatturazione italiana",
    "self-hosted fattura elettronica",
    "stripe billing italia",
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
    title: "FiscLink – Open source Stripe fiscal bridge per l'Italia",
    description:
      "Stripe incassa, ma spesso mancano i dati fiscali italiani. FiscLink li raccoglie e li valida con un Magic Link al cliente, poi li prepara per il tuo flusso di fatturazione.",
    images: [
      {
        url: "/fisclink.png",
        width: 1200,
        height: 630,
        alt: "FiscLink",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FiscLink – Open source Stripe fiscal bridge per l'Italia",
    description:
      "Raccogli e valida CF, P.IVA, SDI e PEC dai pagamenti Stripe. Open source e self-hosted.",
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
    <html lang="it" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "FiscLink",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Self-hosted",
              description:
                "Tool open source e self-hosted che raccoglie e valida i dati fiscali italiani (Codice Fiscale, Partita IVA, SDI, PEC) dai pagamenti Stripe tramite un Magic Link al cliente.",
              license: "https://opensource.org/licenses/MIT",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "EUR",
              },
              featureList: [
                "Webhook Stripe",
                "Magic Link per dati fiscali mancanti",
                "Validazione Codice Fiscale e Partita IVA",
                "Export CSV/JSON",
                "Integrazione opzionale con Fatture in Cloud",
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
