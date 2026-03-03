import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termini di Servizio | FiscLink",
  description: "Termini e condizioni d'uso del servizio FiscLink.",
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-black text-[#0f172a] mb-2">Termini di Servizio</h1>
        <p className="text-sm text-gray-400 mb-12">Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")}</p>

        <div className="prose prose-gray prose-sm max-w-none space-y-8">
          <Section title="1. Descrizione del Servizio">
            <p>
              FiscLink è un servizio SaaS che automatizza la creazione e l'invio di fatture
              elettroniche al Sistema di Interscambio (SDI) italiano, collegando piattaforme
              di pagamento (Stripe) con sistemi di fatturazione (Fatture in Cloud).
            </p>
          </Section>

          <Section title="2. Accettazione">
            <p>
              Utilizzando FiscLink, accetti integralmente i presenti Termini di Servizio.
              Se non accetti questi termini, non utilizzare il servizio.
            </p>
          </Section>

          <Section title="3. Account e Responsabilità">
            <ul>
              <li>Sei responsabile della correttezza delle credenziali API inserite (Stripe, Fatture in Cloud)</li>
              <li>Sei responsabile della correttezza dei dati fiscali della tua azienda (P.IVA, CF, regime fiscale)</li>
              <li>Devi mantenere riservate le credenziali di accesso al tuo account</li>
              <li>Devi avere l'autorizzazione legale per emettere fatture per conto della tua azienda</li>
            </ul>
          </Section>

          <Section title="4. Magic Link e Dati dei Clienti Finali">
            <p>
              FiscLink raccoglie dati fiscali dai clienti finali dei merchant tramite il
              sistema "Magic Link". Il merchant è e resta il Titolare del trattamento
              dei dati dei propri clienti. FiscLink agisce come Responsabile del trattamento
              ai sensi dell'art. 28 del GDPR.
            </p>
            <ul>
              <li>I dati raccolti tramite Magic Link sono utilizzati esclusivamente per la fatturazione</li>
              <li>Il merchant è responsabile di informare i propri clienti sulla raccolta dei dati</li>
              <li>FiscLink valida i dati (formato CF/P.IVA) ma non ne garantisce la veridicità sostanziale</li>
            </ul>
          </Section>

          <Section title="5. Limitazioni di Responsabilità">
            <p>
              FiscLink fornisce un servizio di automazione e <strong>non è uno studio commercialista</strong>.
            </p>
            <ul>
              <li>
                <strong>Non siamo responsabili</strong> per fatture scartate dallo SDI a causa di dati
                errati forniti dal merchant o dai suoi clienti
              </li>
              <li>
                <strong>Non siamo responsabili</strong> per sanzioni derivanti da ritardi nell'emissione
                delle fatture causati da downtime di servizi terzi (Stripe, Fatture in Cloud, SDI)
              </li>
              <li>
                <strong>Non siamo responsabili</strong> per errori nella configurazione del regime fiscale
                o delle aliquote IVA da parte del merchant
              </li>
              <li>
                Il merchant è tenuto a verificare la correttezza delle fatture emesse tramite il
                proprio gestionale (Fatture in Cloud)
              </li>
            </ul>
          </Section>

          <Section title="6. Disponibilità del Servizio">
            <p>
              FiscLink si impegna a garantire la massima disponibilità del servizio.
              Tuttavia, non garantiamo un uptime del 100%. Il servizio potrebbe essere
              temporaneamente non disponibile per manutenzione programmata o cause di forza maggiore.
            </p>
            <p>
              In caso di downtime prolungato, i webhook ricevuti vengono accodati e
              processati automaticamente al ripristino del servizio.
            </p>
          </Section>

          <Section title="7. Piani e Pagamenti">
            <ul>
              <li>Il piano gratuito include fino a 20 fatture al mese</li>
              <li>I piani a pagamento vengono fatturati mensilmente tramite Stripe</li>
              <li>Il superamento del limite fatture comporta la sospensione dell'emissione automatica fino al rinnovo</li>
              <li>I rimborsi sono gestiti secondo la politica di rimborso in vigore al momento dell'acquisto</li>
            </ul>
          </Section>

          <Section title="8. Proprietà Intellettuale">
            <p>
              FiscLink e il suo codice sorgente, design, logo e contenuti sono di proprietà
              del Titolare. L'utilizzo del servizio non conferisce alcun diritto di proprietà
              intellettuale sul software.
            </p>
          </Section>

          <Section title="9. Chiusura Account">
            <ul>
              <li>Puoi chiudere il tuo account in qualsiasi momento dalle impostazioni</li>
              <li>
                Alla chiusura, i dati fiscali vengono conservati per i 10 anni previsti
                dalla normativa italiana, dopodiché vengono cancellati
              </li>
              <li>
                Ci riserviamo il diritto di sospendere account che violino questi termini
                o utilizzino il servizio in modo fraudolento
              </li>
            </ul>
          </Section>

          <Section title="10. Legge Applicabile">
            <p>
              I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia
              è competente il Foro del luogo di residenza del Titolare.
            </p>
          </Section>

          <Section title="11. Contatti">
            <p>
              Per domande sui presenti Termini di Servizio, contattaci a: <strong>info@fisclink.it</strong>
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
