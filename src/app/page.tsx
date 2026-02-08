import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "Connettore Fiscale – Fatturazione elettronica automatica da Stripe e Shopify",
  description:
    "Trasforma ogni pagamento Stripe in una fattura elettronica SDI. Magic Link per raccogliere codice fiscale e P.IVA. Bollo automatico per forfettari. Prova gratis.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">
            ⚡ Connettore Fiscale
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#problemi" className="hover:text-gray-900 transition">
              Problemi
            </a>
            <a href="#come-funziona" className="hover:text-gray-900 transition">
              Come funziona
            </a>
            <a href="#magic-link" className="hover:text-gray-900 transition">
              Magic Link
            </a>
            <a href="#pricing" className="hover:text-gray-900 transition">
              Prezzi
            </a>
            <a href="#faq" className="hover:text-gray-900 transition">
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/api/auth/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition hidden sm:block"
            >
              Accedi
            </Link>
            <Link
              href="/dashboard/settings"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Prova gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full mb-6">
            <span>🇮🇹</span>
            <span>Per PMI italiane che usano Stripe / Shopify</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight">
            Smetti di rincorrere i clienti per il{" "}
            <span className="text-blue-600">Codice Fiscale</span>.
          </h1>
          <p className="text-lg md:text-xl text-gray-500 mt-6 leading-relaxed max-w-2xl">
            Il connettore che trasforma ogni pagamento Stripe in una{" "}
            <strong className="text-gray-700">
              fattura elettronica a norma SDI
            </strong>
            . Automaticamente. Anche se il cliente si dimentica i dati fiscali.
          </p>
          <div className="flex flex-wrap gap-4 mt-10">
            <Link
              href="/dashboard/settings"
              className="px-6 py-3.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-600/25"
            >
              Prova gratis per 14 giorni →
            </Link>
            <a
              href="#come-funziona"
              className="px-6 py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              Scopri come funziona
            </a>
          </div>
          <div className="flex items-center gap-6 mt-8 text-sm text-gray-400">
            <span className="flex items-center gap-1.5">
              ✓ Nessuna carta richiesta
            </span>
            <span className="flex items-center gap-1.5">
              ✓ Setup in 2 minuti
            </span>
            <span className="flex items-center gap-1.5">✓ Conforme SDI</span>
          </div>
        </div>
      </section>

      {/* Social proof / numeri */}
      <section className="border-y border-gray-100 py-10 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-gray-900">12 gg</p>
            <p className="text-sm text-gray-500 mt-1">
              Termine massimo fattura immediata
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">€250+</p>
            <p className="text-sm text-gray-500 mt-1">
              Multa per fattura in ritardo
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-600">30 sec</p>
            <p className="text-sm text-gray-500 mt-1">
              Il cliente compila il Magic Link
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-sm text-gray-500 mt-1">
              Fatture da compilare a mano
            </p>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section id="problemi" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            I problemi che risolviamo ogni giorno
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            Se vendi online con Stripe o Shopify e devi emettere fattura
            elettronica, conosci queste situazioni.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <PainCard
              icon="😤"
              title="Rincorsa al Codice Fiscale"
              description='Il cliente compra, ma non inserisce il CF. Tu passi ore a mandare email: "Scusi, mi serve il codice fiscale..."'
            />
            <PainCard
              icon="⏰"
              title="12 giorni e la sanzione"
              description="La legge ti dà 12 giorni per emettere fattura immediata. Se scadi, la sanzione parte da €250 a fattura."
            />
            <PainCard
              icon="🤯"
              title="Bozze da controllare"
              description='I connettori attuali creano "bozze" da completare a mano. Risultato: ogni giorno devi controllare cosa è rimasto appeso.'
            />
            <PainCard
              icon="🧾"
              title="Bollo da calcolare"
              description="Sei forfettario? Devi aggiungere il bollo da €2 per importi esenti IVA sopra €77.47. Ogni. Singola. Volta."
            />
            <PainCard
              icon="💸"
              title="Rimborsi e note di credito"
              description="Un cliente chiede il rimborso su Stripe. Tu devi andare su Fatture in Cloud, cercare la fattura, creare la nota di credito, inviarla..."
            />
            <PainCard
              icon="📊"
              title="Riconciliazione impossibile"
              description="A fine mese devi verificare che il totale Stripe corrisponda al totale fatturato SDI. Un incubo per te e il commercialista."
            />
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section id="come-funziona" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Come funziona
          </h2>
          <p className="text-gray-500 text-center mb-14 max-w-lg mx-auto">
            Tre passi per automatizzare completamente la tua fatturazione
            elettronica.
          </p>
          <div className="grid md:grid-cols-3 gap-10">
            <Step
              number={1}
              title="Colleghi Stripe"
              description="Inserisci le chiavi API nella dashboard. In 2 minuti sei operativo. Zero codice."
            />
            <Step
              number={2}
              title="Arriva il pagamento"
              description="Il connettore intercetta il pagamento e valida i dati fiscali. Se mancano, invia un Magic Link al cliente."
            />
            <Step
              number={3}
              title="Fattura inviata allo SDI"
              description="La fattura elettronica viene creata su Fatture in Cloud e inviata allo SDI. Tu non fai nulla."
            />
          </div>
        </div>
      </section>

      {/* Magic Link */}
      <section id="magic-link" className="bg-blue-600 py-20 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                ✨ Il Magic Link che ti cambia la vita
              </h2>
              <p className="text-blue-100 text-lg leading-relaxed mb-6">
                Se il cliente non inserisce il Codice Fiscale al checkout, il
                sistema gli invia automaticamente un link per completare i dati.
                Tu non devi fare nulla.
              </p>
              <ul className="space-y-3">
                {[
                  "Email automatica, brandizzata con il tuo logo",
                  "Il cliente compila in 30 secondi da mobile",
                  "Fino a 2 reminder automatici",
                  "Fattura parte da sola appena i dati arrivano",
                  "Presto anche via WhatsApp",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-blue-50">
                    <span className="mt-0.5 text-blue-200">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-left">
              <p className="font-semibold text-lg mb-3">
                📧 Email automatica al cliente:
              </p>
              <div className="bg-white/10 rounded-lg p-4 mb-4">
                <p className="text-blue-100 text-sm italic leading-relaxed">
                  &ldquo;Grazie per l&apos;acquisto! Per emettere la fattura
                  come richiesto dalla legge italiana, clicca il pulsante qui
                  sotto e inserisci i tuoi dati fiscali. Ci vogliono 30
                  secondi.&rdquo;
                </p>
              </div>
              <div className="bg-blue-500 rounded-lg py-3 text-center font-semibold text-sm">
                Completa i tuoi dati fiscali →
              </div>
              <p className="text-blue-200 text-xs mt-4 text-center">
                ⏱️ Link valido 7 giorni. Reminder dopo 2 e 5 giorni.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Tutto quello che serve al forfettario digitale
          </h2>
          <p className="text-gray-500 text-center mb-14 max-w-lg mx-auto">
            Nato per chi vende prodotti digitali, corsi e SaaS con Stripe.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon="🧾"
              title="Bollo automatico"
              description="Calcola e applica il bollo virtuale da €2 per importi esenti IVA > €77.47. Regime forfettario gestito nativamente."
            />
            <FeatureCard
              icon="✅"
              title="Validazione fiscale italiana"
              description="Codice Fiscale con check digit, P.IVA con Luhn, CAP, province. Niente più scarti SDI per dati errati."
            />
            <FeatureCard
              icon="🔐"
              title="Crittografia API key"
              description="Le tue chiavi Stripe e Fatture in Cloud sono cifrate con AES-256-GCM. Mai salvate in chiaro."
            />
            <FeatureCard
              icon="🔄"
              title="Retry automatici"
              description="Se qualcosa fallisce (rete, API down), il sistema riprova automaticamente con backoff esponenziale."
            />
            <FeatureCard
              icon="📱"
              title="Magic Link mobile-friendly"
              description="Il tuo cliente compila i dati da telefono in 30 secondi. Pagina brandizzata con il tuo logo e colori."
            />
            <FeatureCard
              icon="📊"
              title="Dashboard in tempo reale"
              description="Vedi lo stato di ogni fattura: in attesa, inviata, accettata, rifiutata. Tutto in un colpo d'occhio."
            />
          </div>
        </div>
      </section>

      {/* Per chi è */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Perfetto per
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <AudienceCard
              emoji="👩‍💻"
              title="Freelancer & Forfettari"
              items={[
                "Vendi corsi, consulenze, tool digitali",
                "Regime forfettario RF19",
                "Poche fatture ma zero tempo da perdere",
              ]}
            />
            <AudienceCard
              emoji="🛒"
              title="E-commerce digitali"
              items={[
                "Shopify, WooCommerce, Stripe Checkout",
                "Tante piccole vendite B2C",
                "Clienti che non inseriscono il CF",
              ]}
            />
            <AudienceCard
              emoji="🚀"
              title="SaaS & Creator"
              items={[
                "Abbonamenti ricorrenti su Stripe",
                "Vendite in Italia e UE",
                "Il commercialista non capisce Stripe",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Pricing semplice e trasparente
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-lg mx-auto">
            Inizia gratis. Nessuna carta di credito richiesta. Upgrade quando ti
            serve.
          </p>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <PriceCard
              name="Starter"
              price="15"
              description="Per forfettari e freelancer"
              features={[
                "Fino a 50 fatture/mese",
                "Stripe + Fatture in Cloud",
                "Magic Link automatico",
                "Calcolo bollo automatico",
                "Supporto email",
              ]}
            />
            <PriceCard
              name="Pro"
              price="29"
              description="Per e-commerce attivi"
              features={[
                "Fino a 500 fatture/mese",
                "Stripe + Shopify",
                "Note di credito automatiche",
                "Dashboard riconciliazione",
                "Supporto prioritario",
              ]}
              highlighted
            />
            <PriceCard
              name="Enterprise"
              price="59"
              description="Per grandi volumi"
              features={[
                "Fatture illimitate",
                "Multi-store / multi-merchant",
                "API dedicate",
                "Accesso commercialista",
                "SLA garantito",
              ]}
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Domande frequenti
          </h2>
          <div className="space-y-6">
            <FaqItem
              question="Come funziona il Magic Link?"
              answer="Quando un cliente paga su Stripe senza inserire il Codice Fiscale, il sistema invia automaticamente un'email con un link. Il cliente clicca, compila CF o P.IVA in 30 secondi, e la fattura parte da sola."
            />
            <FaqItem
              question="Funziona con il regime forfettario?"
              answer="Sì! Il connettore gestisce nativamente il regime forfettario (RF19): calcola il bollo virtuale da €2 automaticamente, aggiunge la dicitura obbligatoria e imposta correttamente la natura IVA."
            />
            <FaqItem
              question="Le mie chiavi API sono al sicuro?"
              answer="Assolutamente. Le chiavi Stripe e Fatture in Cloud vengono cifrate con AES-256-GCM prima di essere salvate nel database. Non sono mai memorizzate in chiaro."
            />
            <FaqItem
              question="Cosa succede se il cliente non compila il Magic Link?"
              answer="Il sistema invia fino a 2 reminder automatici (dopo 2 e 5 giorni). Se il cliente non risponde, la fattura resta in stato 'dati mancanti' e puoi gestirla manualmente dalla dashboard."
            />
            <FaqItem
              question="Posso usarlo con Shopify?"
              answer="L'integrazione Shopify è in fase di sviluppo e sarà disponibile a breve. Al momento il connettore supporta Stripe come sorgente pagamenti."
            />
            <FaqItem
              question="Come gestisce i rimborsi?"
              answer="Stiamo implementando la generazione automatica di Note di Credito (TD04) quando Stripe emette un refund. La nota viene inviata allo SDI senza intervento manuale."
            />
            <FaqItem
              question="Devo già avere Fatture in Cloud?"
              answer="Sì, il connettore usa Fatture in Cloud come gestionale di fatturazione. Ti serve un account con accesso API v2 e il codice azienda."
            />
          </div>
        </div>
      </section>

      {/* CTA finale */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto a eliminare il lavoro manuale?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
            Collega Stripe in 2 minuti. La prima fattura parte da sola. Prova
            gratis per 14 giorni, nessuna carta richiesta.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-block px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition shadow-lg"
          >
            Inizia gratis ora →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <p className="font-bold text-gray-900 mb-3">
                ⚡ Connettore Fiscale
              </p>
              <p className="text-sm text-gray-500 leading-relaxed">
                Fatturazione elettronica automatica per PMI italiane che usano
                Stripe e Shopify.
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-3 text-sm">
                Prodotto
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <a href="#come-funziona" className="hover:text-gray-900">
                    Come funziona
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-gray-900">
                    Prezzi
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-gray-900">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-3 text-sm">
                Risorse
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href="/dashboard" className="hover:text-gray-900">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Documentazione API
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Guida Setup
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-3 text-sm">Legale</p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Termini di Servizio
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-gray-900">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>
              © {new Date().getFullYear()} Connettore Fiscale. Fatturazione
              elettronica automatica per l&apos;Italia.
            </p>
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
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition">
      <span className="text-3xl">{icon}</span>
      <h3 className="text-base font-semibold text-gray-900 mt-3">{title}</h3>
      <p className="text-sm text-gray-500 mt-2 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 font-bold text-xl flex items-center justify-center mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-2 leading-relaxed">
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
    <div className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition">
      <span className="text-2xl">{icon}</span>
      <h3 className="text-base font-semibold text-gray-900 mt-3">{title}</h3>
      <p className="text-sm text-gray-500 mt-2 leading-relaxed">
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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <span className="text-4xl">{emoji}</span>
      <h3 className="text-lg font-semibold text-gray-900 mt-3">{title}</h3>
      <ul className="mt-4 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-500 flex gap-2">
            <span className="text-blue-500">→</span> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group bg-white rounded-xl border border-gray-200 p-5">
      <summary className="flex items-center justify-between cursor-pointer list-none">
        <h3 className="text-base font-semibold text-gray-900">{question}</h3>
        <span className="text-gray-400 group-open:rotate-45 transition-transform text-xl">
          +
        </span>
      </summary>
      <p className="text-sm text-gray-500 mt-3 leading-relaxed">{answer}</p>
    </details>
  );
}

function PriceCard({
  name,
  price,
  description,
  features,
  highlighted,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-6 ${
        highlighted
          ? "border-blue-600 ring-2 ring-blue-600 bg-blue-50"
          : "border-gray-200 bg-white"
      }`}
    >
      {highlighted && (
        <span className="inline-block px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full mb-3">
          Più popolare
        </span>
      )}
      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
      <p className="text-sm text-gray-500">{description}</p>
      <p className="mt-4">
        <span className="text-3xl font-bold text-gray-900">€{price}</span>
        <span className="text-gray-500">/mese</span>
      </p>
      <ul className="mt-6 space-y-2">
        {features.map((f, i) => (
          <li key={i} className="text-sm text-gray-600 flex gap-2">
            <span className="text-green-500">✓</span> {f}
          </li>
        ))}
      </ul>
      <Link
        href="/dashboard/settings"
        className={`block mt-6 text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${
          highlighted
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        Inizia ora
      </Link>
    </div>
  );
}
