# Security Policy

FiscLink è self-hosted: ogni istanza gestisce le proprie chiavi API (Stripe, Fatture in Cloud, Resend) cifrate nel database con AES-256-GCM (vedi `src/lib/crypto.ts`).

## Segnalare una vulnerabilità

Non aprire una issue pubblica per vulnerabilità di sicurezza. Scrivi invece a **info@fisclink.it** descrivendo il problema e, se possibile, come riprodurlo. Rispondiamo appena possibile; non c'è un programma di bug bounty.

## Cosa è in scope

- Bypass dell'autenticazione (login, magic link merchant/cliente, accesso commercialista)
- Esposizione di chiavi API o dati fiscali cifrati
- Injection (SQL, XSS) negli endpoint API o nelle pagine pubbliche
- Bypass della verifica firma sui webhook (Stripe, Fatture in Cloud)

## Cosa NON è in scope

- Vulnerabilità che richiedono accesso fisico al server o al database di chi self-hosta
- Problemi nelle dipendenze di terze parti già segnalati upstream (apri invece una issue/PR per aggiornare la dipendenza)

## Buone pratiche per chi self-hosta

- Genera `AUTH_SECRET` e `ENCRYPTION_SECRET` con `openssl rand -base64 32`, non riusarli tra ambienti
- Usa sempre chiavi Stripe/Fatture in Cloud in modalità test in sviluppo
- Non committare mai `.env` (è già in `.gitignore`)
- Metti il database e Redis dietro rete privata in produzione, non esporli pubblicamente
