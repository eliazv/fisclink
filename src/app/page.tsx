import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FiscLink — Open source Stripe fiscal bridge for Italy",
  description:
    "Raccogli e valida dati fiscali italiani dai clienti Stripe. Open source, self-hosted e pensato per piccoli SaaS italiani.",
  keywords:
    "stripe fatturazione elettronica, dati fiscali stripe, codice fiscale stripe, partita iva stripe, sdi pec stripe, open source fatturazione italiana",
  alternates: { canonical: "/" },
  openGraph: {
    title: "FiscLink — Stripe fiscal bridge for Italy",
    description:
      "Un tool open source per collegare Stripe al tuo flusso di fatturazione italiana, senza promettere di sostituire il tuo gestionale fiscale.",
    type: "website",
  },
};

const features = [
  {
    title: "Webhook Stripe",
    description:
      "Riceve eventi Stripe e crea una coda di pagamenti/fatture da completare fiscalmente.",
  },
  {
    title: "Magic Link cliente",
    description:
      "Quando mancano CF, P.IVA, indirizzo, SDI o PEC, il cliente può completarli da una pagina mobile-first.",
  },
  {
    title: "Validazione italiana",
    description:
      "Controlli formali su Codice Fiscale, Partita IVA, CAP, provincia, codice destinatario e PEC.",
  },
  {
    title: "Export e integrazioni",
    description:
      "Base pronta per export CSV/JSON e integrazione opzionale con Fatture in Cloud.",
  },
];

const roadmap = [
  "Supporto completo a invoice.paid per Stripe Billing",
  "Export CSV/JSON per commercialista",
  "Payload intermedio per generazione FatturaPA",
  "Integrazione Fatture in Cloud più robusta",
  "Provider fiscali aggiuntivi solo dopo validazione reale",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-950">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-black tracking-tight">
            FiscLink
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-500 md:flex">
            <a href="#features" className="hover:text-slate-900">
              Funzioni
            </a>
            <a href="#roadmap" className="hover:text-slate-900">
              Roadmap
            </a>
            <a href="#disclaimer" className="hover:text-slate-900">
              Disclaimer
            </a>
          </nav>
          <Link
            href="/login"
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            Open source · self-hosted · early preview
          </div>
          <h1 className="text-5xl font-black tracking-tight md:text-7xl">
            Stripe incassa. FiscLink raccoglie i dati fiscali italiani.
          </h1>
          <p className="mt-8 text-xl leading-8 text-slate-600 md:text-2xl md:leading-9">
            Un piccolo tool per SaaS, freelance e developer italiani che usano
            Stripe e vogliono validare CF, P.IVA, SDI, PEC e indirizzi prima di
            portarli nel proprio flusso di fatturazione elettronica.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="rounded-2xl bg-slate-950 px-6 py-4 font-bold text-white shadow-xl shadow-slate-300/60 transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Prova in locale / self-hosted
            </Link>
            <a
              href="#features"
              className="rounded-2xl border border-slate-200 bg-white px-6 py-4 font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300"
            >
              Vedi cosa fa
            </a>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-14">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 md:grid-cols-3">
          <InfoCard
            title="Non è un gestionale fiscale"
            text="FiscLink prepara e normalizza i dati. La responsabilità fiscale resta a te, al tuo commercialista e ai provider che usi."
          />
          <InfoCard
            title="Non invia direttamente allo SdI"
            text="La strada consigliata è export o integrazione con provider come Fatture in Cloud. Niente canale SdI proprietario per ora."
          />
          <InfoCard
            title="Pensato per restare piccolo"
            text="Prima Stripe e dati fiscali. Solo dopo export, provider, note di credito e casi fiscali avanzati."
          />
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-black tracking-tight">Funzioni core</h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Il progetto è stato riposizionato come ponte tecnico, non come
            competitor di A-Cube o dei gestionali fiscali italiani.
          </p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
            >
              <h3 className="text-xl font-black">{feature.title}</h3>
              <p className="mt-3 leading-7 text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-black tracking-tight">
              Flusso consigliato
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Stripe resta il motore di pagamento. FiscLink diventa lo strato
              che recupera e controlla i dati fiscali prima di esportarli o
              passarli a un provider.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              "Stripe webhook",
              "Validazione dati",
              "Magic Link se mancano campi",
              "Export / provider fiscale",
            ].map((step, index) => (
              <div
                key={step}
                className="rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-black text-slate-950">
                  {index + 1}
                </div>
                <p className="font-bold">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="roadmap" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:items-start">
          <div>
            <h2 className="text-4xl font-black tracking-tight">
              Roadmap semplice
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              La direzione è togliere rumore e completare il caso d'uso Stripe
              prima di aggiungere altri canali o provider.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <ul className="space-y-4">
              {roadmap.map((item) => (
                <li key={item} className="flex gap-3 text-slate-700">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-slate-950" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section id="disclaimer" className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl bg-amber-50 p-8 text-amber-950 ring-1 ring-amber-200">
            <h2 className="text-2xl font-black">Disclaimer fiscale</h2>
            <p className="mt-4 leading-8">
              FiscLink è uno strumento tecnico. Non fornisce consulenza fiscale
              e non garantisce che una fattura sia corretta, emessa, trasmessa o
              conservata a norma. Prima dell'uso in produzione, verifica il
              flusso con commercialista, consulente fiscale o provider di
              fatturazione elettronica.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <h3 className="font-black">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
