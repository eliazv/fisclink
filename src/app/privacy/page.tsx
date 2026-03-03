import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | FiscLink",
  description: "Informativa sulla privacy e trattamento dei dati personali di FiscLink.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="text-xl font-extrabold text-[#0f172a] tracking-tight">
            FiscLink
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-black text-[#0f172a] mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-12">Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")}</p>

        <div className="prose prose-gray prose-sm max-w-none space-y-8">
          <Section title="1. Titolare del Trattamento">
            <p>
              Il titolare del trattamento dei dati personali è FiscLink (di seguito "Titolare"),
              contattabile all'indirizzo email: <strong>privacy@fisclink.it</strong>.
            </p>
          </Section>

          <Section title="2. Dati Raccolti">
            <p>FiscLink raccoglie e tratta le seguenti categorie di dati:</p>
            <ul>
              <li><strong>Dati del Merchant:</strong> email, nome, ragione sociale, P.IVA, codice fiscale, regime fiscale</li>
              <li><strong>Dati dei Clienti Finali:</strong> nome, email, codice fiscale, P.IVA, indirizzo, codice SDI, PEC (raccolti tramite Magic Link)</li>
              <li><strong>Dati di Pagamento:</strong> importi, valute, ID transazione (da Stripe). Non raccogliamo numeri di carta di credito</li>
              <li><strong>Dati Tecnici:</strong> log di accesso, indirizzo IP, tipo di browser</li>
            </ul>
          </Section>

          <Section title="3. Finalità del Trattamento">
            <ul>
              <li>Creazione e invio di fatture elettroniche allo SDI tramite Fatture in Cloud</li>
              <li>Raccolta dati fiscali mancanti tramite Magic Link</li>
              <li>Gestione dell'account merchant e autenticazione</li>
              <li>Adempimenti fiscali e contabili obbligatori per legge</li>
              <li>Invio di comunicazioni di servizio (reminder Magic Link, notifiche errori)</li>
            </ul>
          </Section>

          <Section title="4. Base Giuridica">
            <ul>
              <li><strong>Esecuzione contrattuale:</strong> il trattamento è necessario per l'erogazione del servizio</li>
              <li><strong>Obbligo legale:</strong> adempimenti fiscali previsti dalla normativa italiana (D.Lgs. 127/2015)</li>
              <li><strong>Legittimo interesse:</strong> prevenzione frodi e sicurezza del servizio</li>
            </ul>
          </Section>

          <Section title="5. Sicurezza dei Dati">
            <p>
              Tutte le chiavi API sono cifrate con <strong>AES-256-GCM</strong> prima di essere salvate nel database.
              Le comunicazioni avvengono esclusivamente tramite HTTPS.
              L'autenticazione avviene tramite token JWT con scadenza.
            </p>
          </Section>

          <Section title="6. Condivisione dei Dati">
            <p>I dati personali vengono condivisi esclusivamente con:</p>
            <ul>
              <li><strong>Fatture in Cloud (TeamSystem):</strong> per la creazione e l'invio delle fatture elettroniche</li>
              <li><strong>Stripe:</strong> per la ricezione dei dati di pagamento tramite webhook</li>
              <li><strong>Resend:</strong> per l'invio delle email (Magic Link e notifiche)</li>
            </ul>
            <p>Non vendiamo né condividiamo dati con terze parti per finalità di marketing.</p>
          </Section>

          <Section title="7. Conservazione">
            <p>
              I dati fiscali vengono conservati per il periodo previsto dalla normativa italiana
              (10 anni ai sensi dell'art. 2220 del Codice Civile).
              I dati dell'account merchant vengono conservati per tutta la durata del contratto
              e cancellati entro 30 giorni dalla chiusura dell'account.
            </p>
          </Section>

          <Section title="8. Diritti dell'Interessato">
            <p>Ai sensi del GDPR (Regolamento UE 2016/679), hai diritto a:</p>
            <ul>
              <li>Accedere ai tuoi dati personali</li>
              <li>Rettificare dati inesatti</li>
              <li>Cancellare i tuoi dati (diritto all'oblio), salvo obblighi di legge</li>
              <li>Limitare il trattamento</li>
              <li>Portabilità dei dati</li>
              <li>Opporti al trattamento</li>
            </ul>
            <p>
              Per esercitare questi diritti, scrivi a <strong>privacy@fisclink.it</strong>.
            </p>
          </Section>

          <Section title="9. Cookie">
            <p>
              FiscLink utilizza esclusivamente cookie tecnici necessari al funzionamento
              del servizio (sessione di autenticazione). Non utilizziamo cookie di profilazione
              né di terze parti per finalità di marketing.
            </p>
          </Section>

          <Section title="10. Modifiche">
            <p>
              Ci riserviamo il diritto di aggiornare questa informativa. Le modifiche saranno
              pubblicate su questa pagina con l'aggiornamento della data in alto.
            </p>
          </Section>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100">
          <Link href="/" className="text-sm font-semibold text-blue-600 hover:underline">
            ← Torna alla home
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-[#0f172a] mb-3">{title}</h2>
      <div className="text-gray-600 leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-sm">
        {children}
      </div>
    </section>
  );
}
