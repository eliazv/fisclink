import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FiscLink – Fatturazione Elettronica Automatica da Stripe e Shopify",
  description:
    "Trasforma i pagamenti Stripe in fatture elettroniche SDI automaticamente. Magic Link per recupero Codice Fiscale, bollo €2 forfettari e PEC. Prova FiscLink gratis.",
  keywords:
    "fatturazione elettronica stripe, connettore fatture in cloud stripe, fatturazione automatica shopify sdi, recupero codice fiscale stripe, bollo 2 euro fatture in cloud, fattura elettronica forfettari stripe",
  alternates: { canonical: "/" },
  openGraph: {
    title:
      "FiscLink – La soluzione definitiva per la fatturazione elettronica Stripe",
    description:
      "Smetti di rincorrere i clienti per il Codice Fiscale. Automatizza l'invio allo SDI con FiscLink.",
    type: "website",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/fisclink.png"
              alt="FiscLink Logo"
              width={32}
              height={32}
              className="rounded-lg shadow-sm group-hover:scale-105 transition-transform"
            />
            <span className="text-xl font-extrabold text-[#0f172a] tracking-tight">
              FiscLink
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-500">
            <a
              href="#problemi"
              className="hover:text-blue-600 transition-colors"
            >
              Problemi
            </a>
            <a
              href="#come-funziona"
              className="hover:text-blue-600 transition-colors"
            >
              Come funziona
            </a>
            <a
              href="#magic-link"
              className="hover:text-blue-600 transition-colors"
            >
              Magic Link
            </a>
            <a
              href="#pricing"
              className="hover:text-blue-600 transition-colors"
            >
              Prezzi
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
            >
              Accedi
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 bg-[#2563eb] text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-500/10 active:scale-95"
            >
              Prova gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-blue-100 text-[#2563eb] text-xs font-bold rounded-full mb-8 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span>Novità: Supporto Shopify in Beta</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-[#0f172a] leading-[1.05] tracking-tight">
              Smetti di rincorrere i clienti per il{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Codice Fiscale
              </span>
              .
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 mt-8 leading-relaxed max-w-2xl font-medium">
              Il connettore inteligente che trasforma ogni pagamento Stripe in
              una{" "}
              <span className="text-gray-900 underline decoration-blue-500 decoration-4 underline-offset-4">
                fattura elettronica SDI
              </span>
              . Automaticamente. Anche se il cliente dimentica i dati.
            </p>
            <div className="flex flex-wrap gap-5 mt-12">
              <Link
                href="/login"
                className="px-8 py-4 bg-[#2563eb] text-white font-bold rounded-2xl hover:bg-blue-700 transition shadow-xl shadow-blue-600/20 active:scale-95 text-lg"
              >
                Inizia gratis ora →
              </Link>
              <a
                href="#come-funziona"
                className="px-8 py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition shadow-sm active:scale-95 text-lg"
              >
                Guarda come funziona
              </a>
            </div>
            <div className="flex items-center gap-8 mt-10 text-sm font-semibold text-gray-400">
              <span className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                Setup in 120 secondi
              </span>
              <span className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
                Per Forfettari & PMI
              </span>
            </div>
          </div>
        </div>

        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-50 -z-10"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-50 rounded-full blur-3xl opacity-50 -z-10"></div>
      </section>

      {/* Social proof / numeri */}
      <section className="bg-white border-y border-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div>
            <p className="text-4xl font-black text-[#0f172a] tracking-tight">
              12 gg
            </p>
            <p className="text-xs uppercase font-bold text-gray-400 mt-2 tracking-wider">
              Limite invio SDI
            </p>
          </div>
          <div>
            <p className="text-4xl font-black text-[#0f172a] tracking-tight">
              €250+
            </p>
            <p className="text-xs uppercase font-bold text-gray-400 mt-2 tracking-wider">
              Sanzione ritardo
            </p>
          </div>
          <div>
            <p className="text-4xl font-black text-blue-600 tracking-tight">
              30 sec
            </p>
            <p className="text-xs uppercase font-bold text-gray-400 mt-2 tracking-wider">
              Compilazione Magic Link
            </p>
          </div>
          <div>
            <p className="text-4xl font-black text-blue-600 tracking-tight">
              100%
            </p>
            <p className="text-xs uppercase font-bold text-gray-400 mt-2 tracking-wider">
              Automazione completa
            </p>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section id="problemi" className="py-24 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-[#0f172a] tracking-tight">
              Smetti di perdere tempo (e soldi)
            </h2>
            <p className="text-lg text-gray-500 mt-6 max-w-2xl mx-auto font-medium leading-relaxed">
              Vendere online con Stripe o Shopify è facile, gestire la
              burocrazia italiana no. Ecco i problemi che diventeranno un
              ricordo.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <PainCard
              icon={
                <path
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              }
              title="Rincorsa al Codice Fiscale"
              description='Il cliente compra, scappa e non inserisce il CF. Tu passi ore a mandare email infinite: "Scusi, mi serve il codice fiscale..."'
            />
            <PainCard
              icon={
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              }
              title="Sanzioni fino a €250"
              description="Lo sapevi? Hai solo 12 giorni per emettere fattura. Oltre questo termine, arrivano le sanzioni per ogni singola vendita."
            />
            <PainCard
              icon={
                <path
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              }
              title="Bozze manuali infinite"
              description="Dimentica i connettori che creano solo bozze. FiscLink automatizza l'intero ciclo, dall'ordine all'invio allo SDI."
            />
            <PainCard
              icon={
                <path
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              }
              title="Gestione Bollo €2"
              description="Sei forfettario o esente IVA? Calcoliamo noi il bollo virtuale sopra i €77.47 e lo aggiungiamo in automatico."
            />
            <PainCard
              icon={
                <path
                  d="M16 15v-2a4 4 0 00-4-4H4m0 0l4 4m-4-4l4-4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              }
              title="Rimborsi & Note di Credito"
              description="Un rimborso su Stripe? FiscLink crea automaticamente la nota di credito corrispondente. Senza che tu muova un dito."
            />
            <PainCard
              icon={
                <path
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              }
              title="Riconciliazione Automatica"
              description="Totali Stripe e fatturato SDI finalmente sincronizzati. Il tuo commercialista inizierà a volerti bene davvero."
            />
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section id="come-funziona" className="py-24 md:py-32 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-[#0f172a] tracking-tight">
              Così semplice che fa paura
            </h2>
            <p className="text-lg text-gray-500 mt-6 max-w-lg mx-auto font-medium">
              Zero codice, zero stress. Solo tre passaggi.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting lines for desktop */}
            <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 border-t-2 border-dashed border-blue-200 -z-0"></div>

            <Step
              number={1}
              title="Collega i tuoi account"
              description="Inserisci le API Key di Stripe e Fatture in Cloud. Bastano due minuti nel nostro wizard guidato."
              icon={
                <path
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              }
            />
            <Step
              number={2}
              title="Noi validiamo i dati"
              description="Ogni volta che vendi, verifichiamo CF e P.IVA. Se mancano, il Magic Link fa il lavoro sporco per te."
              icon={
                <path
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              }
            />
            <Step
              number={3}
              title="Fattura inviata"
              description="Senza alcun intervento umano, la fattura finisce dritta nello SDI. Tu ricevi solo la notifica del successo."
              icon={
                <path
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              }
            />
          </div>
        </div>
      </section>

      {/* Magic Link */}
      <section
        id="magic-link"
        className="py-24 md:py-32 bg-[#0f172a] relative overflow-hidden"
      >
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold rounded-full mb-6">
                <span>NEW</span>
                <span>Automazione Customer-First</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-8 text-white tracking-tight">
                Il Magic Link che ti
                <br />
                <span className="text-blue-500">cambia la vita</span>
              </h2>
              <p className="text-blue-100/70 text-xl leading-relaxed mb-10 font-medium">
                Clienti che non inseriscono i dati al checkout? Nessun problema.
                Inviato in automatico, brandizzato, risolve il problema alla
                radice.
              </p>
              <ul className="space-y-5">
                {[
                  "Email 100% automatica con il tuo logo",
                  "Form compilabile in 30 secondi da mobile",
                  "Reminder intelligenti (dopo 2 e 5 giorni)",
                  "Validazione CF e P.IVA in tempo reale",
                  "Supporto PEC e Codice Destinatario",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-4 text-white font-semibold"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
                      <svg
                        className="w-3.5 h-3.5 text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-600 rounded-[2rem] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative bg-[#1e293b] border border-gray-700 rounded-[2rem] p-8 md:p-10 shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-bold">Anteprima Email</p>
                    <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">
                      Inviata da: Tuo Brand
                    </p>
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 mb-8">
                  <p className="text-blue-100/90 text-sm leading-relaxed mb-6 italic">
                    &ldquo;Grazie per l&apos;acquisto! Per completare la fattura
                    ed evitare sanzioni, clicca qui sotto e inserisci i tuoi
                    dati fiscali. Bastano 30 secondi.&rdquo;
                  </p>
                  <div className="w-full py-4 bg-blue-600 text-white rounded-xl text-center font-bold text-sm shadow-xl shadow-blue-900/40">
                    Completa i Dati Fiscali →
                  </div>
                </div>
                <div className="flex justify-between items-center px-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-full border-2 border-[#1e293b] bg-gray-600`}
                      ></div>
                    ))}
                  </div>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-tight">
                    Eseguito 2,4k volte questo mese
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background glow */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-10"></div>
      </section>

      {/* Feature grid */}
      <section className="py-24 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-[#0f172a] tracking-tight">
              Tutto quello che ti serve
            </h2>
            <p className="text-lg text-gray-500 mt-6 max-w-lg mx-auto font-medium">
              Pensato per chi vende digitale, corsi e SaaS.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon="🧾"
              title="Bollo nativo"
              description="Calcolo e applicazione del bollo virtuale automatico. Perfetto per il regime forfettario."
            />
            <FeatureCard
              icon="✅"
              title="Dati validati"
              description="Verifica formale di CF, P.IVA, CAP e Province italiane. Zero errori di invio SDI."
            />
            <FeatureCard
              icon="🔐"
              title="Sicurezza bancaria"
              description="API Key cifrate con AES-256-GCM. Massima protezione per i tuoi dati e quelli dei clienti."
            />
            <FeatureCard
              icon="🔄"
              title="Retry automatici"
              description="Se le API di Fatture in Cloud sono lente, noi riproviamo finché la fattura non è emessa."
            />
            <FeatureCard
              icon="📱"
              title="Mobile First"
              description="Tutte le interfacce per i clienti sono ottimizzate per smartphone. Compilazione lampo."
            />
            <FeatureCard
              icon="📊"
              title="Analytics"
              description="Vedi in tempo reale quante fatture sono state inviate, accettate o se ci sono errori da gestire."
            />
          </div>
        </div>
      </section>

      {/* Per chi è */}
      <section className="py-24 md:py-32 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-black text-[#0f172a] text-center mb-20 tracking-tight">
            Perfetto per
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <AudienceCard
              emoji="👨‍💻"
              title="Freelance & SaaS"
              items={[
                "Vendi tool o consulenze digitali",
                "Abbonamenti ricorrenti Stripe",
                "Zero tempo per compilare fatture",
              ]}
            />
            <AudienceCard
              emoji="🎓"
              title="Creator & Academy"
              items={[
                "Vendi corsi e prodotti digitali",
                "Tante piccole vendite B2C",
                "Gestione automatica bollo €2",
              ]}
            />
            <AudienceCard
              emoji="🛒"
              title="E-commerce Pro"
              items={[
                "Shopify o Custom Checkout",
                "Volumi medio-alti di ordini",
                "Riconciliazione fiscale assistita",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-[#0f172a] tracking-tight">
              Pricing trasparente
            </h2>
            <p className="text-lg text-gray-500 mt-6 font-medium">
              Inizia gratis. Nessuna carta. Upgrade quando cresci.
            </p>
          </div>
          <div className="grid lg:grid-cols-4 gap-8">
            <PriceCard
              name="Starter"
              price="0"
              description="Per iniziare"
              features={[
                "20 fatture/mese",
                "Invio SDI base",
                "Bollo automatico",
                "Branding base",
              ]}
              cta="Inizia ora"
            />
            <PriceCard
              name="Growth"
              price="19"
              description="I più scelti"
              features={[
                "100 fatture/mese",
                "Magic Link illimitato",
                "Note di credito auto",
                "Custom Branding",
              ]}
              highlighted
              cta="Inizia Prova Gratis"
            />
            <PriceCard
              name="Pro"
              price="49"
              description="Per chi fa sul serio"
              features={[
                "500 fatture/mese",
                "Supporto Prioritario",
                "Mapping IVA avanzato",
                "Gestione OSS",
              ]}
              cta="Inizia Prova Gratis"
            />
            <PriceCard
              name="Elite"
              price="99"
              description="Senza limiti"
              features={[
                "Illimitate",
                "Multi-account",
                "Custom Integration",
                "SLA garantita",
              ]}
              cta="Contattaci"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 md:py-32 bg-[#f8fafc]">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-black text-[#0f172a] text-center mb-20 tracking-tight">
            FAQ
          </h2>
          <div className="space-y-4">
            <FaqItem
              question="Devo cambiare come vendo su Stripe?"
              answer="Assolutamente no. FiscLink lavora dietro le quinte. Tu continui a usare Stripe come sempre, noi intercettiamo i pagamenti e creiamo le fatture."
            />
            <FaqItem
              question="E se il cliente non compila mai il Magic Link?"
              answer="Il sistema invia reminder automatici. Se comunque i dati mancano, la fattura resta in 'bozza' nella tua dashboard e puoi decidere come procedere (es. emettere scontrino)."
            />
            <FaqItem
              question="Supportate il forfettario?"
              answer="È il nostro punto di forza. Gestiamo il bollo virtuale, la natura IVA N2.2 e le diciture obbligatorie in fattura automaticamente."
            />
            <FaqItem
              question="Posso annullare in ogni momento?"
              answer="Sì, non c'è alcun vincolo. Se decidi di smettere, le tue fatture rimangono su Fatture in Cloud come sempre."
            />
          </div>
        </div>
      </section>

      {/* CTA finale */}
      <section className="py-24 md:py-32 bg-[#2563eb] relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-black mb-8 text-white tracking-tight">
            Pronto ad automatizzare?
          </h2>
          <p className="text-blue-100/80 text-xl mb-12 font-medium">
            Collega Stripe in 2 minuti. La prima fattura parte da sola.
            <br />
            Prova gratis per 14 giorni, nessuna carta richiesta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-10 py-5 bg-white text-blue-600 font-black rounded-2xl hover:bg-blue-50 transition shadow-2xl active:scale-95"
            >
              Crea account gratis →
            </Link>
          </div>
        </div>

        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-24 pb-12 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <Image src="/fisclink.png" alt="Logo" width={28} height={28} />
                <span className="text-xl font-black text-[#0f172a]">
                  FiscLink
                </span>
              </Link>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Automazione fiscale per chi vende online. Trasformiamo Stripe in
                fatturato SDI senza fatica.
              </p>
            </div>
            <div>
              <p className="text-[#0f172a] font-bold mb-6 text-sm uppercase tracking-widest">
                Prodotto
              </p>
              <ul className="space-y-4 text-sm font-semibold text-gray-500">
                <li>
                  <a
                    href="#come-funziona"
                    className="hover:text-blue-600 transition"
                  >
                    Come funziona
                  </a>
                </li>
                <li>
                  <a
                    href="#magic-link"
                    className="hover:text-blue-600 transition"
                  >
                    Magic Link
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-blue-600 transition">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[#0f172a] font-bold mb-6 text-sm uppercase tracking-widest">
                Risorse
              </p>
              <ul className="space-y-4 text-sm font-semibold text-gray-500">
                <li>
                  <Link
                    href="/login"
                    className="hover:text-blue-600 transition"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition">
                    Documentazione
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition">
                    API Status
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-[#0f172a] font-bold mb-6 text-sm uppercase tracking-widest">
                Legale
              </p>
              <ul className="space-y-4 text-sm font-semibold text-gray-500">
                <li>
                  <Link href="/privacy" className="hover:text-blue-600 transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-blue-600 transition">
                    Termini di Servizio
                  </Link>
                </li>
                <li>
                  <Link href="/privacy#cookie" className="hover:text-blue-600 transition">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-100 gap-4">
            <p className="text-gray-400 text-xs font-bold">
              © {new Date().getFullYear()} FiscLink. Made in Italy 🇮🇹
            </p>
            <div className="flex gap-6">
              {/* Social icons placeholders */}
              <div className="w-5 h-5 bg-gray-100 rounded-full"></div>
              <div className="w-5 h-5 bg-gray-100 rounded-full"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
/* ── Component helpers ────────────────────────────────── */

function PainCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 group hover:-translate-y-1">
      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {icon}
        </svg>
      </div>
      <h3 className="text-lg font-bold text-[#0f172a] mb-3">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed font-medium">
        {description}
      </p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
  icon,
}: {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center relative z-10 group">
      <div className="w-20 h-20 rounded-[2rem] bg-white shadow-xl shadow-blue-500/10 flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform border border-gray-50">
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-lg">
          {number}
        </div>
        <svg
          className="w-10 h-10 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {icon}
        </svg>
      </div>
      <h3 className="text-xl font-extrabold text-[#0f172a] mb-4">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed font-medium max-w-xs">
        {description}
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-blue-100 transition shadow-sm">
      <span className="text-3xl mb-6 block">{icon}</span>
      <h3 className="text-lg font-bold text-[#0f172a] mb-3">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed font-medium">
        {description}
      </p>
    </div>
  );
}

function AudienceCard({
  emoji,
  title,
  items,
}: {
  emoji: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition">
      <span className="text-5xl border-b-4 border-blue-500 pb-2 inline-block mb-6">
        {emoji}
      </span>
      <h3 className="text-xl font-black text-[#0f172a] mb-6">{title}</h3>
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className="text-sm font-medium text-gray-500 flex gap-3">
            <span className="text-blue-500 font-bold shrink-0">→</span> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group bg-white rounded-2xl border border-gray-100 p-6 transition-all">
      <summary className="flex items-center justify-between cursor-pointer list-none">
        <h3 className="text-base font-bold text-[#0f172a]">{question}</h3>
        <span className="p-1 rounded-full bg-gray-50 text-gray-400 group-open:rotate-45 transition-transform">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
              d="M12 4v16m8-8H4"
            ></path>
          </svg>
        </span>
      </summary>
      <div className="pt-4 text-sm text-gray-500 font-medium leading-relaxed">
        {answer}
      </div>
    </details>
  );
}

function PriceCard({
  name,
  price,
  description,
  features,
  highlighted,
  cta = "Inizia ora",
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta?: string;
}) {
  const isFree = price === "0";
  return (
    <div
      className={`rounded-[2.5rem] border p-8 flex flex-col transition-all duration-300 ${
        highlighted
          ? "border-blue-600 bg-white ring-8 ring-blue-50 shadow-2xl scale-105 z-10"
          : "border-gray-100 bg-white hover:border-gray-200"
      }`}
    >
      {highlighted && (
        <span className="inline-block px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-6 w-fit">
          Più popolare
        </span>
      )}
      <h3 className="text-xl font-black text-[#0f172a] tracking-tight">
        {name}
      </h3>
      <p className="text-sm font-medium text-gray-400 mt-2">{description}</p>
      <div className="mt-8 flex items-baseline gap-1">
        {isFree ? (
          <span className="text-4xl font-black text-[#0f172a]">Gratis</span>
        ) : (
          <>
            <span className="text-4xl font-black text-[#0f172a]">€{price}</span>
            <span className="text-gray-400 font-bold">/mese</span>
          </>
        )}
      </div>
      <ul className="mt-10 space-y-4 flex-1">
        {features.map((f, i) => (
          <li
            key={i}
            className="text-sm font-semibold text-gray-600 flex gap-3"
          >
            <span className="text-green-500 font-bold shrink-0">✓</span> {f}
          </li>
        ))}
      </ul>
      <Link
        href="/login"
        className={`block mt-10 text-center py-4 rounded-2xl text-sm font-bold transition-all active:scale-95 ${
          highlighted
            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/30"
            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
