# FiscLink - Guida Deploy

## Avvio Locale (Dev)

### Prerequisiti
- Node.js 20+
- Docker Desktop (per PostgreSQL + Redis)
- Stripe CLI (per testare webhook)

### Setup rapido

```bash
# 1. Clona e installa
git clone <repo-url>
cd connettore-fiscale
npm install

# 2. Configura environment
cp .env.example .env
# Modifica .env con le tue chiavi

# 3. Avvia tutto (PostgreSQL + Redis + migrazioni)
bash scripts/dev-start.sh

# 4. In terminale 1: app Next.js
npm run dev

# 5. In terminale 2: workers BullMQ
npm run worker

# 6. (Opzionale) In terminale 3: webhook Stripe
stripe listen --forward-to localhost:3000/api/webhooks/stripe?merchant=TUO_MERCHANT_ID
```

App disponibile su http://localhost:3000

### Script disponibili

| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia Next.js in dev mode |
| `npm run worker` | Avvia i 5 workers BullMQ |
| `npm run build` | Build produzione |
| `npm run start` | Avvia app in produzione |
| `npm run db:migrate` | Esegui migrazioni (produzione) |
| `npm run db:migrate:dev` | Crea nuove migrazioni (dev) |
| `npm run db:generate` | Rigenera Prisma Client |
| `npm run db:studio` | Apri Prisma Studio (GUI database) |

---

## Deploy su Railway (Consigliato)

Railway supporta processi long-running, perfetto per i workers BullMQ.

### Passo 1: Crea account e progetto

1. Vai su https://railway.app e accedi con GitHub
2. Clicca "New Project" → "Deploy from GitHub repo"
3. Seleziona il repo `connettore-fiscale`
4. Railway rileva automaticamente Next.js

### Passo 2: Aggiungi database e Redis

1. Nel progetto Railway, clicca "New" → "Database" → "PostgreSQL"
2. Clicca "New" → "Database" → "Redis"
3. Railway crea automaticamente le variabili `DATABASE_URL` e `REDIS_URL`

### Passo 3: Configura il servizio Next.js (app)

1. Clicca sul servizio della tua app
2. Vai su "Settings":
   - Build Command: `npm run build`
   - Start Command: `npm run start`
3. Vai su "Variables" e aggiungi:

```
ENCRYPTION_SECRET=<openssl rand -base64 32>
AUTH_SECRET=<openssl rand -base64 32>
RESEND_API_KEY=re_...
EMAIL_FROM=FiscLink <noreply@fisclink.it>
NEXT_PUBLIC_APP_URL=https://tuodominio.com
NEXT_PUBLIC_APP_NAME=FiscLink
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Nota: `DATABASE_URL` e `REDIS_URL` vengono iniettate automaticamente se hai collegato i database al servizio.

### Passo 4: Aggiungi il servizio Workers

1. Nel progetto, clicca "New" → "GitHub Repo" → stesso repo
2. Settings:
   - Start Command: `npm run worker`
3. Collega lo stesso PostgreSQL e Redis (clicca sul DB → "Connect" → seleziona il servizio worker)
4. Copia le stesse variabili d'ambiente del servizio app

### Passo 5: Esegui le migrazioni

Railway esegue il build automaticamente. Per le migrazioni:

1. Vai sul servizio app → "Settings"
2. Cambia Build Command a: `npx prisma migrate deploy && npm run build`

Oppure usa la Railway CLI:
```bash
railway run npx prisma migrate deploy
```

### Passo 6: Dominio custom

1. Vai sul servizio app → "Settings" → "Networking" → "Custom Domain"
2. Aggiungi il tuo dominio (es. `fisclink.it`)
3. Railway ti da un record CNAME da configurare nel tuo DNS
4. SSL automatico

### Passo 7: Configura webhook Stripe produzione

1. Vai su https://dashboard.stripe.com/webhooks
2. Clicca "Add endpoint"
3. URL: `https://tuodominio.com/api/webhooks/stripe?merchant=TUO_MERCHANT_ID`
4. Eventi da selezionare:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `charge.refunded`
5. Copia il Webhook Signing Secret (`whsec_...`)
6. Aggiornalo nelle variabili Railway come `STRIPE_WEBHOOK_SECRET`

### Costi Railway

- **Free trial**: $5 di credito
- **Hobby plan**: $5/mese (include $5 di credito uso)
- PostgreSQL + Redis + 2 servizi: circa $5-10/mese totali

---

## Alternative Gratuite

### Render.com

```
1. render.com → New Web Service → connetti GitHub
2. Build: npm run build
3. Start: npm start
4. New → PostgreSQL (free 256MB)
5. New → Redis (free)
6. New → Background Worker (per i workers BullMQ)
   Start: npm run worker
7. Configura le stesse variabili d'ambiente
```

Free tier: web service dorme dopo 15 min. Si risveglia al primo request (~30s cold start).
I workers restano attivi per 750h/mese gratuite.

### Fly.io

```bash
# Installa CLI
curl -L https://fly.io/install.sh | sh
fly auth signup

# Deploy app
fly launch
fly postgres create --name fisclink-db
fly redis create --name fisclink-redis

# Segreti
fly secrets set ENCRYPTION_SECRET=... AUTH_SECRET=... RESEND_API_KEY=...

# Deploy
fly deploy
```

Free tier: 3 VM, 1GB Postgres, 256MB Redis.

### Coolify (Self-hosted, gratis)

Se hai un VPS (Hetzner €4/mese):
1. Installa Coolify: `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash`
2. Aggiungi repo GitHub
3. Configura PostgreSQL + Redis + App + Workers
4. Tutto autogestito, zero costi ricorrenti

---

## Checklist Pre-Lancio

### Obbligatori
- [ ] Dominio registrato e DNS configurato
- [ ] SSL attivo (automatico su Railway/Render/Fly)
- [ ] Database migrato (`npx prisma migrate deploy`)
- [ ] Variabili d'ambiente produzione configurate
- [ ] Stripe live keys configurate
- [ ] Webhook Stripe endpoint produzione attivo
- [ ] Workers BullMQ in esecuzione
- [ ] Test: simula pagamento Stripe → verifica fattura su FiC

### Consigliati
- [ ] Resend: verifica dominio per email personalizzate
- [ ] Monitoring errori (Sentry free tier)
- [ ] Backup database automatico (Railway lo fa di default)
- [ ] Privacy Policy e Terms of Service pagine

### Test end-to-end prima del lancio
```
1. Vai su /login → inserisci email → ricevi magic link → accedi
2. Vai su /dashboard/settings → configura Stripe + FiC keys
3. Configura webhook su Stripe Dashboard
4. Simula un pagamento (Stripe test mode)
5. Verifica: fattura creata su Fatture in Cloud?
6. Se dati mancanti: magic link inviato al cliente?
7. Compila il magic link → fattura completata?
8. Simula un rimborso → nota di credito creata?
```
