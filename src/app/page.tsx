import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            ⚡ Connettore Fiscale
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/settings"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Inizia gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="max-w-3xl">
          <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full mb-6">
            🇮🇹 Per PMI italiane che usano Stripe / Shopify
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Smetti di rincorrere i clienti per il{" "}
            <span className="text-blue-600">Codice Fiscale</span>.
          </h1>
          <p className="text-xl text-gray-500 mt-6 leading-relaxed">
            Il connettore che trasforma ogni pagamento Stripe in una fattura
            elettronica a norma SDI. Automaticamente. Anche se il cliente si
            dimentica i dati fiscali.
          </p>
          <div className="flex flex-wrap gap-4 mt-10">
            <Link
              href="/dashboard/settings"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Prova gratis per 14 giorni →
            </Link>
            <a
              href="#come-funziona"
              className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Come funziona
            </a>
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            I problemi che risolviamo ogni giorno
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <PainCard
              icon="😤"
              title="Rincorsa al Codice Fiscale"
              description='Il cliente compra, ma non inserisce il CF. Tu passi ore a mandare email: "Scusi, mi serve il codice fiscale..."'
            />
            <PainCard
              icon="⏰"
              title="12 giorni per la fattura"
              description="La legge ti dà 12 giorni per emettere fattura immediata. Se scadi, la sanzione parte da 250€ a fattura."
            />
            <PainCard
              icon="🤯"
              title="Bozze da controllare"
              description='I connettori attuali creano "bozze" da completare a mano. Risultato: controlli ogni giorno cosa è rimasto appeso.'
            />
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section id="come-funziona" className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            Come funziona
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-lg mx-auto">
            Tre passi per automatizzare completamente la tua fatturazione
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Step
              number={1}
              title="Colleghi Stripe"
              description="Inserisci le chiavi API. In 2 minuti sei operativo."
            />
            <Step
              number={2}
              title="Arriva il pagamento"
              description="Il connettore intercetta il pagamento e valida i dati fiscali. Se mancano, invia automaticamente un Magic Link al cliente."
            />
            <Step
              number={3}
              title="Fattura inviata"
              description="La fattura elettronica viene creata e inviata allo SDI tramite Fatture in Cloud. Tu non fai nulla."
            />
          </div>
        </div>
      </section>

      {/* Magic Link */}
      <section className="bg-blue-600 py-20 text-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            ✨ Il Magic Link che ti cambia la vita
          </h2>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
            Se il cliente non inserisce il Codice Fiscale al checkout, il
            sistema gli invia automaticamente un link per completare i dati. Tu
            non devi fare assolutamente nulla.
          </p>
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 max-w-md mx-auto text-left">
            <p className="font-medium mb-2">📧 Email automatica al cliente:</p>
            <p className="text-blue-100 text-sm italic">
              &ldquo;Grazie per l&apos;acquisto! Per emettere la fattura come
              richiesto dalla legge italiana, clicca qui e inserisci i tuoi dati
              fiscali.&rdquo;
            </p>
            <p className="text-blue-200 text-xs mt-3">
              ⏱️ Ci vogliono 30 secondi. La fattura parte da sola.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Pricing semplice e trasparente
          </h2>
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
                "Multi-integrazione",
                "Dashboard avanzata",
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
                "API dedicate",
                "White-label",
                "Account manager",
                "SLA garantito",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center text-sm text-gray-400">
          <p>
            © {new Date().getFullYear()} Connettore Fiscale. Fatturazione
            elettronica automatica per l&apos;Italia.
          </p>
        </div>
      </footer>
    </div>
  );
}

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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
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
      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-bold text-lg flex items-center justify-center mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-2">{description}</p>
    </div>
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
