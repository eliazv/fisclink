- nome app deve essere FiscLink

- scrivi un file di contesto per ai furure che analizzeranno l'app.
- cosa manca per setup e completamento app? che serivzi devo configurare e collegare?
- come testare il fuzionamento di tutto cio?
- cosa manca per pubblicaizone di questa app?
- come pubblico poi su appsotre stripe e shopify?
- analizza docs\analisi-v2.md per i prossimi passi da integrare nell'app e integrali
- dobbiamo configurare anche per PostgreSQL + Redis e altro su docker giusto?

prossimi passi:
Creare un .env locale e avviare PostgreSQL + Redis (usaimo docker direi(?))
npx prisma migrate dev --name init per creare le tabelle
Configurare un account Stripe test + webhook secret
Configurare Resend per l'invio email (devo farlo io non tu)

- Magic Link via WhatsApp (Twilio)

- nome app deve essere FiscLink
- Webhook multi-provider `/api/webhooks/[provider]`
- Validazione VIES (P.IVA reale, non solo formato)
- Accesso read-only commercialista
- Supporto vendite estere / OSS
- WooCommerce plugin
- Shopify integrazione + App Store
- Report PDF mensili
- leggi docs\analisi-v2.md, verifica il funzionamento del tutto, integra con tutti i servizi necessari

- integrazione con pagamenti paypal o lemon squeeze è da fare?
- hai integrato tutto cio che conisgliava docs\analisi-v2.md?
- ricerca altri servizi molto importanti da integrare in questa app e integrali
- devo creare quali servizi? db supabase? account di quali servizi? docs\TODO.md? in file .env cosa manca di essenziale?
- dimmi tutto cio che devo eseguire in locale per eseguire questa app e cosa devo fare per mandarela in produzione

Merchant medio (10k–100k ordini/anno) ✅ TARGET MIGLIORE

Problema: errori SDI, rimborsi, commercialista che rompe

Budget: 70–150€/mese

Capisce il valore delle tue feature killer
