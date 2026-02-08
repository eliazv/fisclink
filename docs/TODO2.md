- nome app deve essere FiscLink

- scrivi un file di contesto per ai furure che analizzeranno l'app.
- fai anche landing page promozionale con seo ottimizzata
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
