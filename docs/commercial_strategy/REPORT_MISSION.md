# Report Analisi di Mercato e Strategia FiscLink

## 🚀 Visione del Prodotto
FiscLink non è un semplice connettore dati, ma un **Orchestratore di Compliance Fiscale** per il mercato italiano. Si posiziona come il "ponte intelligente" tra i gateway di pagamento internazionali (Stripe, Shopify, WooCommerce) e il sistema di interscambio (SDI) tramite Fatture in Cloud.

## 📊 Analisi di Mercato (Ricerca Marzo 2026)
La ricerca conferma tre "punti di dolore" critici per i merchant italiani:

1.  **Dati Fiscali Mancanti (Il problema del Checkout):** Stripe e Shopify non sono ottimizzati per raccogliere Codice Fiscale e Partita IVA validati. Questo blocca l'emissione della fattura elettronica entro i 12 giorni di legge.
2.  **Gestione Regime Forfettario:** L'automazione dell'imposta di bollo (2€ sopra i 77.47€) è spesso gestita male o manualmente dai connettori economici.
3.  **Rimborsi e Note di Credito:** La maggior parte dei connettori non automatizza lo storno (Nota di Credito) su Fatture in Cloud quando avviene un rimborso su Stripe/Shopify, creando caos contabile.

## 💡 La nostra "Killer Feature": IL MAGIC LINK
FiscLink risolve il problema dei dati mancanti inviando un **Magic Link** automatico al cliente. 
- **User Experience imbattibile:** Il cliente non viene bloccato al checkout (aumentando le conversioni).
- **Automazione Totale:** Se i dati mancano, FiscLink li richiede, li valida e genera la fattura solo a dati ricevuti.

## 🛠️ Stato dell'Implementazione (MVP Status)
| Feature | Stato | Priorità MVP |
| :--- | :--- | :--- |
| **Validazione CF/PIVA/VIES** | ✅ 100% | Critica |
| **Calcolo Bollo (Regime RF19)** | ✅ 100% | Critica |
| **Worker Rimborsi (Note di Credito)** | ✅ 90% | Alta |
| **Invio Magic Link Automatico** | ✅ 100% | Killer Feature |
| **Dashboard Merchant (UI)** | 🚧 40% | Media |
| **Onboarding Wizard** | 🚧 30% | Alta |

## 🎯 Strategia di Lancio & Marketing (Free/Low Cost)
1.  **SEO di Nicchia:** Articoli blog su "Fattura Elettronica Stripe Forfettari" e "Recupero Codice Fiscale Shopify".
2.  **Lead Magnet:** Tool gratuito di validazione CF/PIVA sulla landing page per attirare traffico organico.
3.  **Community Engagement:** Risposte dirette sui forum Shopify Community IT e gruppi Facebook di E-commerce Merchant.
4.  **Referral Commercialisti:** Dashboard dedicata per i consulenti fiscali per gestire i propri clienti con un click.

---
*Documento generato il 03/03/2026 per FiscLink Project.*
