/**
 * Pagina Impostazioni - Configurazione chiavi API e preferenze
 */

"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    // Stripe
    stripeApiKey: "",
    stripeWebhookSecret: "",
    // Fatture in Cloud
    ficApiKey: "",
    ficCompanyId: "",
    // Regime fiscale
    taxRegime: "RF19",
    bolloPolicy: "CHARGE_CUSTOMER",
    // Branding
    brandColor: "#2563eb",
    logoUrl: "",
  });

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      // TODO: POST a /api/settings
      await new Promise((r) => setTimeout(r, 1000)); // Simulazione
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Impostazioni</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configura le tue integrazioni e preferenze fiscali
        </p>
      </div>

      {/* Stripe */}
      <Section
        title="🔗 Stripe"
        description="Collega il tuo account Stripe per ricevere i pagamenti."
      >
        <Field
          label="Secret Key"
          placeholder="sk_live_..."
          type="password"
          value={settings.stripeApiKey}
          onChange={(v) => setSettings((s) => ({ ...s, stripeApiKey: v }))}
          help="Trovi la Secret Key nel dashboard Stripe → Developers → API Keys"
        />
        <Field
          label="Webhook Secret"
          placeholder="whsec_..."
          type="password"
          value={settings.stripeWebhookSecret}
          onChange={(v) =>
            setSettings((s) => ({ ...s, stripeWebhookSecret: v }))
          }
          help="Si genera quando crei un Webhook Endpoint su Stripe"
        />
        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">
            URL Webhook da configurare su Stripe:
          </p>
          <code className="text-xs bg-blue-100 px-2 py-1 rounded">
            {typeof window !== "undefined"
              ? window.location.origin
              : "https://tuodominio.com"}
            /api/webhooks/stripe?merchant=YOUR_MERCHANT_ID
          </code>
          <p className="mt-2 text-xs">
            Eventi da attivare: <code>checkout.session.completed</code>,{" "}
            <code>payment_intent.succeeded</code>
          </p>
        </div>
      </Section>

      {/* Fatture in Cloud */}
      <Section
        title="📄 Fatture in Cloud"
        description="Collega il tuo account Fatture in Cloud per la fatturazione elettronica."
      >
        <Field
          label="API Key (Bearer Token)"
          placeholder="Il tuo access token..."
          type="password"
          value={settings.ficApiKey}
          onChange={(v) => setSettings((s) => ({ ...s, ficApiKey: v }))}
          help="Vai su Fatture in Cloud → Impostazioni → API per generare il token"
        />
        <Field
          label="Company ID"
          placeholder="123456"
          value={settings.ficCompanyId}
          onChange={(v) => setSettings((s) => ({ ...s, ficCompanyId: v }))}
          help="L'ID della tua azienda su Fatture in Cloud"
        />
      </Section>

      {/* Regime Fiscale */}
      <Section
        title="🏛️ Regime Fiscale"
        description="Imposta il tuo regime fiscale per la corretta generazione delle fatture."
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Regime
          </label>
          <select
            value={settings.taxRegime}
            onChange={(e) =>
              setSettings((s) => ({ ...s, taxRegime: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="RF01">RF01 – Regime Ordinario</option>
            <option value="RF19">RF19 – Regime Forfettario</option>
            <option value="RF02">RF02 – Contribuenti Minimi</option>
            <option value="RF04">RF04 – Agricoltura</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gestione imposta di bollo (2€)
          </label>
          <select
            value={settings.bolloPolicy}
            onChange={(e) =>
              setSettings((s) => ({ ...s, bolloPolicy: e.target.value }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="CHARGE_CUSTOMER">
              Addebita al cliente (+2€ in fattura)
            </option>
            <option value="ABSORB_COST">
              A carico mio (bollo non addebitato)
            </option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Il bollo di 2€ è obbligatorio per fatture esenti IVA superiori a
            77,47€
          </p>
        </div>
      </Section>

      {/* Branding Magic Link */}
      <Section
        title="🎨 Branding"
        description="Personalizza l'aspetto delle email e delle pagine Magic Link."
      >
        <Field
          label="Colore principale"
          type="color"
          value={settings.brandColor}
          onChange={(v) => setSettings((s) => ({ ...s, brandColor: v }))}
        />
        <Field
          label="URL Logo"
          placeholder="https://esempio.com/logo.png"
          value={settings.logoUrl}
          onChange={(v) => setSettings((s) => ({ ...s, logoUrl: v }))}
          help="Verrà mostrato nelle email e nella pagina di recupero dati fiscali"
        />
      </Section>

      {/* Save */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {saving ? "Salvataggio..." : "Salva impostazioni"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium animate-fade-in">
            ✓ Salvato con successo
          </span>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  help,
}: {
  label: string;
  placeholder?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  help?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {help && <p className="text-xs text-gray-400 mt-1">{help}</p>}
    </div>
  );
}
