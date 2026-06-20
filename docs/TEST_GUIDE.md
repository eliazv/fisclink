# FiscLink - Guida Test Completa

## Avvio Rapido

```powershell
# PowerShell (Windows)
.\scripts\dev-start.ps1

# Oppure avvia manualmente:
docker compose up -d
pnpm exec prisma migrate deploy
pnpm exec prisma generate
pnpm run dev       # terminale 1
pnpm run worker    # terminale 2
```

App: http://localhost:3000

---

## 1. Login (Auto-registrazione)

FiscLink usa login **passwordless** via magic link email.
In dev mode il link di login viene stampato nei log della console.

### Come accedere:

1. Vai su http://localhost:3000/login
2. Inserisci una email qualsiasi (es. `test@example.com`)
3. Guarda i log del terminale dove gira `pnpm run dev`
4. Troverai questo output:

```
==========================================
DEV MODE: Magic Link di Accesso
Email: test@example.com
URL:   http://localhost:3000/api/auth/verify?token=XXXXX
==========================================
```

5. Copia/incolla quel URL nel browser → verrai reindirizzato alla dashboard
6. La prima volta vai su `/dashboard/onboarding`, le successive su `/dashboard`

**Non serve creare account manualmente.** Inserire un'email nel login crea automaticamente il merchant nel DB.

---

## 2. Configurazione Merchant (Settings)

Dopo il login, vai su http://localhost:3000/dashboard/settings

### Stripe (Test Mode)

Per testare serve un account Stripe (gratuito):

1. Crea account su https://dashboard.stripe.com
2. Usa le chiavi **test** (non live):
   - Secret Key: `sk_test_...` (Dashboard → Developers → API Keys)
   - Webhook Secret: lo ottieni dalla Stripe CLI (vedi sotto)

### Fatture in Cloud (Sandbox)

1. Crea account su https://developers.fattureincloud.it/
2. Crea un'applicazione di test
3. Ottieni il Bearer Token e il Company ID
4. Inseriscili nelle impostazioni

### Se non hai account esterni

Puoi comunque testare:
- Il login e la navigazione funzionano senza chiavi API
- La dashboard mostra i dati (vuoti inizialmente)
- Le impostazioni si salvano correttamente
- La landing page, privacy e terms sono visibili

---

## 3. Test Webhook Stripe (con Stripe CLI)

### Installazione Stripe CLI

```powershell
# Windows (con scoop)
scoop install stripe

# Oppure scarica da: https://stripe.com/docs/stripe-cli
```

### Forward dei webhook

```powershell
stripe login
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe?merchant=TUO_MERCHANT_ID
```

La CLI stampa un `whsec_...` temporaneo. Copialo e inseriscilo nelle impostazioni come Webhook Secret.

### Trovare il tuo merchant ID

Dopo il login, apri Prisma Studio:
```powershell
pnpm run db:studio
```
Vai sulla tabella `merchants` → copia l'`id` del tuo merchant.

### Simulare un pagamento

```powershell
# In un altro terminale:
stripe trigger checkout.session.completed
```

Cosa succede:
1. Il webhook arriva a `/api/webhooks/stripe?merchant=...`
2. Viene creata una fattura con status `VALIDATING`
3. Il worker la processa:
   - Se mancano dati fiscali → crea un Magic Link → invia email
   - Se i dati sono completi → crea fattura su FiC → invia a SDI

### Simulare un rimborso

```powershell
stripe trigger charge.refunded
```

Cosa succede:
1. Il webhook crea una `CreditNote` nel DB
2. Il worker genera una Nota di Credito (TD04) su Fatture in Cloud

---

## 4. Test Magic Link

Il Magic Link è la feature principale. Per testarlo:

### Metodo 1: Via webhook (automatico)

1. Fai un `stripe trigger checkout.session.completed`
2. Se il pagamento non ha CF/PIVA, viene creato un Magic Link
3. Controlla i log del worker per il link
4. Oppure apri Prisma Studio → tabella `magic_links` → copia il `token`
5. Vai su: `http://localhost:3000/magic/TOKEN_QUI`

### Metodo 2: Diretto nel DB (manuale)

```powershell
pnpm run db:studio
```

1. Crea un record in `invoices` (con dati minimi)
2. Crea un record in `magic_links` con:
   - `token`: una stringa qualsiasi (es. `test123`)
   - `invoiceId`: l'id della fattura creata
   - `merchantId`: il tuo merchant
   - `expiresAt`: una data futura
3. Vai su `http://localhost:3000/magic/test123`

### Form Magic Link - Dati di Test

| Campo | Valore di test | Note |
|---|---|---|
| Tipo cliente | Persona Fisica | o "Azienda" |
| Nome | Mario Rossi | |
| Codice Fiscale | `RSSMRA85M01H501Z` | CF sintatticamente valido |
| Partita IVA | `12345678903` | Passa la validazione Luhn |
| Codice SDI | `0000000` | Per persona fisica |
| PEC | `test@pec.it` | Alternativa a SDI |
| Indirizzo | Via Roma 1 | |
| Citta' | Roma | |
| Provincia | RM | Seleziona dal dropdown |
| CAP | `00100` | 5 cifre |

---

## 5. Test delle Pagine

| URL | Cosa testa | Auth? |
|---|---|---|
| http://localhost:3000 | Landing page + SEO | No |
| http://localhost:3000/privacy | Privacy Policy | No |
| http://localhost:3000/terms | Termini di Servizio | No |
| http://localhost:3000/login | Login form | No |
| http://localhost:3000/dashboard | Dashboard KPI | Si |
| http://localhost:3000/dashboard/invoices | Lista fatture | Si |
| http://localhost:3000/dashboard/settings | Configurazione | Si |
| http://localhost:3000/dashboard/reports | Report mensili | Si |
| http://localhost:3000/dashboard/onboarding | Setup guidato | Si |
| http://localhost:3000/magic/TOKEN | Magic Link form | No |
| http://localhost:3000/api/health | Health check API | No |

---

## 6. Variabili .env per Dev

Queste sono gia' nel file `.env`:

```env
DATABASE_URL="postgresql://connettore:connettore_dev_2026@localhost:55432/connettore_fiscale?schema=public"
REDIS_URL="redis://localhost:6379"
ENCRYPTION_SECRET="dev-change-me-in-prod-min-32-chars-random"
AUTH_SECRET="dev-auth-secret-change-in-production-32chars"
RESEND_API_KEY="re_..."
EMAIL_FROM="FiscLink <noreply@tuodominio.it>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="FiscLink"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

**Nota:** In dev mode, se Resend fallisce l'invio email, il login funziona comunque — il magic link viene stampato nei log della console.

---

## 7. Prisma Studio (GUI Database)

```powershell
pnpm run db:studio
```

Apre un'interfaccia web su http://localhost:5555 dove puoi:
- Vedere tutti i record di ogni tabella
- Creare/modificare/cancellare dati manualmente
- Verificare che webhook, fatture e magic link vengano creati correttamente

### Tabelle utili per il debug

| Tabella | Cosa contiene |
|---|---|
| `merchants` | Account merchant (il tuo) |
| `invoices` | Fatture create dai webhook |
| `magic_links` | Token per recupero dati fiscali |
| `credit_notes` | Note di credito per rimborsi |
| `audit_logs` | Log di tutte le operazioni |
| `customers` | Clienti finali del merchant |
| `login_tokens` | Token di login (magic link auth) |

---

## 8. Troubleshooting

### "Docker non in esecuzione"
Avvia Docker Desktop e riprova.

### "Errore connessione database"
```powershell
docker compose ps   # verifica che postgres sia running
docker compose logs postgres   # vedi i log
```

### "Worker non parte"
Verifica che Redis sia attivo:
```powershell
docker compose logs redis
```

### "Login non funziona"
In dev mode, il link di login viene stampato nella console di `pnpm run dev`. Cercalo li'.

### "Webhook Stripe non arriva"
- Verifica che Stripe CLI sia connessa: `stripe listen --forward-to ...`
- Controlla che il `merchant` query parameter sia corretto
- Guarda i log del server per errori di verifica firma
