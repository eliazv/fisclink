/**
 * Pagina Impostazioni - Configurazione chiavi API e preferenze
 * Collegata al backend via /api/settings (GET/PUT) e /api/settings/tax-mapping
 */

"use client";

import { useState, useEffect, useCallback } from "react";

interface SettingsData {
  stripeApiKey: string;
  stripeWebhookSecret: string;
  ficApiKey: string;
  ficCompanyId: string;
  shopifyApiKey: string;
  shopifyWebhookSecret: string;
  shopifyShopDomain: string;
  wooConsumerKey: string;
  wooConsumerSecret: string;
  wooStoreUrl: string;
  wooWebhookSecret: string;
  taxRegime: string;
  bolloPolicy: string;
  brandColor: string;
  logoUrl: string;
}

interface TaxMapping {
  id: string;
  stripeTaxCode: string;
  stripeTaxLabel: string;
  ficVatId: number;
  ficVatRate: number;
  ficVatNature: string;
  isDefault: boolean;
}

interface StatusFlags {
  hasStripeKey: boolean;
  hasFicToken: boolean;
  hasShopifyKey: boolean;
  hasWooCommerceKey: boolean;
}

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    type: string;
    ok: boolean;
    msg: string;
  } | null>(null);
  const [statusFlags, setStatusFlags] = useState<StatusFlags>({
    hasStripeKey: false,
    hasFicToken: false,
    hasShopifyKey: false,
    hasWooCommerceKey: false,
  });
  const [taxMappings, setTaxMappings] = useState<TaxMapping[]>([]);
  const [newMapping, setNewMapping] = useState({
    stripeTaxCode: "",
    stripeTaxLabel: "",
    ficVatId: 0,
    ficVatRate: 22,
    ficVatNature: "",
    isDefault: false,
  });

  const [settings, setSettings] = useState<SettingsData>({
    stripeApiKey: "",
    stripeWebhookSecret: "",
    ficApiKey: "",
    ficCompanyId: "",
    shopifyApiKey: "",
    shopifyWebhookSecret: "",
    shopifyShopDomain: "",
    wooConsumerKey: "",
    wooConsumerSecret: "",
    wooStoreUrl: "",
    wooWebhookSecret: "",
    taxRegime: "RF19",
    bolloPolicy: "CHARGE_CUSTOMER",
    brandColor: "#2563eb",
    logoUrl: "",
  });

  // Carica settings dal backend
  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Errore caricamento impostazioni");
      const data = await res.json();
      setSettings((prev) => ({
        ...prev,
        ficCompanyId: data.ficCompanyId ?? "",
        taxRegime: data.taxRegime ?? "RF19",
        bolloPolicy: data.bolloPolicy ?? "CHARGE_CUSTOMER",
        brandColor: data.brandColor ?? "#2563eb",
        logoUrl: data.logoUrl ?? "",
        shopifyShopDomain: data.shopifyShopDomain ?? "",
        wooStoreUrl: data.wooCommerceStoreUrl ?? "",
      }));
      setStatusFlags({
        hasStripeKey: data.hasStripeKey ?? false,
        hasFicToken: data.hasFicToken ?? false,
        hasShopifyKey: data.hasShopifyKey ?? false,
        hasWooCommerceKey: data.hasWooCommerceKey ?? false,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTaxMappings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings/tax-mapping");
      if (res.ok) {
        const data = await res.json();
        setTaxMappings(data.mappings ?? []);
      }
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, no external sync alternative here
    loadSettings();
    loadTaxMappings();
  }, [loadSettings, loadTaxMappings]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        taxRegime: settings.taxRegime,
        bolloPolicy: settings.bolloPolicy,
        brandColor: settings.brandColor,
        logoUrl: settings.logoUrl || null,
        ficCompanyId: settings.ficCompanyId || null,
        shopifyShopDomain: settings.shopifyShopDomain || null,
        wooCommerceStoreUrl: settings.wooStoreUrl || null,
      };
      // Solo invia le chiavi se l'utente le ha digitato (non vuote)
      if (settings.stripeApiKey) body.stripeSecretKey = settings.stripeApiKey;
      if (settings.stripeWebhookSecret)
        body.stripeWebhookSecret = settings.stripeWebhookSecret;
      if (settings.ficApiKey) body.ficAccessToken = settings.ficApiKey;
      if (settings.shopifyApiKey) body.shopifyApiKey = settings.shopifyApiKey;
      if (settings.shopifyWebhookSecret)
        body.shopifyWebhookSecret = settings.shopifyWebhookSecret;
      if (settings.wooConsumerKey)
        body.wooCommerceConsumerKey = settings.wooConsumerKey;
      if (settings.wooConsumerSecret)
        body.wooCommerceConsumerSecret = settings.wooConsumerSecret;
      if (settings.wooWebhookSecret)
        body.wooCommerceWebhookSecret = settings.wooWebhookSecret;

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? `Errore HTTP ${res.status}`);
      }

      setSaved(true);
      // Ricarica le flags aggiornate
      await loadSettings();
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  // Test connessione
  const handleTest = async (type: "test-stripe" | "test-fic") => {
    setTesting(type);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: type }),
      });
      const data = await res.json();
      setTestResult({
        type,
        ok: data.success,
        msg: data.success
          ? `Connessione OK${data.storeName ? ` — ${data.storeName}` : ""}`
          : (data.error ?? "Test fallito"),
      });
    } catch {
      setTestResult({ type, ok: false, msg: "Errore di rete" });
    } finally {
      setTesting(null);
    }
  };

  // Tax Mapping CRUD
  const handleAddMapping = async () => {
    if (!newMapping.stripeTaxCode) return;
    try {
      const res = await fetch("/api/settings/tax-mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMapping),
      });
      if (res.ok) {
        setNewMapping({
          stripeTaxCode: "",
          stripeTaxLabel: "",
          ficVatId: 0,
          ficVatRate: 22,
          ficVatNature: "",
          isDefault: false,
        });
        await loadTaxMappings();
      }
    } catch {
      /* toast error */
    }
  };

  const handleDeleteMapping = async (id: string) => {
    try {
      const res = await fetch("/api/settings/tax-mapping", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) await loadTaxMappings();
    } catch {
      /* silent */
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Impostazioni</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configura le tue integrazioni e preferenze fiscali
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Stripe */}
      <Section
        title="🔗 Stripe"
        description="Collega il tuo account Stripe per ricevere i pagamenti."
        status={statusFlags.hasStripeKey ? "Collegato" : undefined}
      >
        <Field
          label="Secret Key"
          placeholder={
            statusFlags.hasStripeKey
              ? "••••••• (già configurata)"
              : "sk_live_..."
          }
          type="password"
          value={settings.stripeApiKey}
          onChange={(v) => setSettings((s) => ({ ...s, stripeApiKey: v }))}
          help="Trovi la Secret Key nel dashboard Stripe → Developers → API Keys"
        />
        <Field
          label="Webhook Secret"
          placeholder={
            statusFlags.hasStripeKey ? "••••••• (già configurato)" : "whsec_..."
          }
          type="password"
          value={settings.stripeWebhookSecret}
          onChange={(v) =>
            setSettings((s) => ({ ...s, stripeWebhookSecret: v }))
          }
        />
        <button
          onClick={() => handleTest("test-stripe")}
          disabled={testing !== null}
          className="text-sm text-blue-600 hover:underline disabled:opacity-50"
        >
          {testing === "test-stripe"
            ? "Test in corso..."
            : "Testa connessione Stripe"}
        </button>
        {testResult?.type === "test-stripe" && (
          <p
            className={`text-sm ${testResult.ok ? "text-green-600" : "text-red-600"}`}
          >
            {testResult.msg}
          </p>
        )}
      </Section>

      {/* Fatture in Cloud */}
      <Section
        title="📄 Fatture in Cloud"
        description="Collega il tuo account Fatture in Cloud per la fatturazione elettronica."
        status={statusFlags.hasFicToken ? "Collegato" : undefined}
      >
        <Field
          label="API Key (Bearer Token)"
          placeholder={
            statusFlags.hasFicToken ? "••••••• (già configurata)" : "Token..."
          }
          type="password"
          value={settings.ficApiKey}
          onChange={(v) => setSettings((s) => ({ ...s, ficApiKey: v }))}
        />
        <Field
          label="Company ID"
          placeholder="123456"
          value={settings.ficCompanyId}
          onChange={(v) => setSettings((s) => ({ ...s, ficCompanyId: v }))}
        />
        <button
          onClick={() => handleTest("test-fic")}
          disabled={testing !== null}
          className="text-sm text-blue-600 hover:underline disabled:opacity-50"
        >
          {testing === "test-fic"
            ? "Test in corso..."
            : "Testa connessione FiC"}
        </button>
        {testResult?.type === "test-fic" && (
          <p
            className={`text-sm ${testResult.ok ? "text-green-600" : "text-red-600"}`}
          >
            {testResult.msg}
          </p>
        )}
      </Section>

      {/* Shopify — disabilitato per MVP */}
      <Section
        title="🛍️ Shopify"
        description="Integrazione Shopify in arrivo. Resta sintonizzato!"
        disabled
      >
        <p className="text-sm text-slate-400 italic">Prossimamente disponibile.</p>
      </Section>

      {/* WooCommerce — disabilitato per MVP */}
      <Section
        title="🛒 WooCommerce"
        description="Integrazione WooCommerce in arrivo. Resta sintonizzato!"
        disabled
      >
        <p className="text-sm text-slate-400 italic">Prossimamente disponibile.</p>
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
        </div>
      </Section>

      {/* Tax Mapping */}
      <Section
        title="📊 Mapping Aliquote IVA"
        description="Mappa i codici tax di Stripe alle aliquote IVA di Fatture in Cloud."
      >
        {taxMappings.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Codice Stripe</th>
                  <th className="pb-2">IVA %</th>
                  <th className="pb-2">Natura</th>
                  <th className="pb-2">Default</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {taxMappings.map((m) => (
                  <tr key={m.id} className="border-b">
                    <td className="py-2 font-mono text-xs">
                      {m.stripeTaxCode}
                    </td>
                    <td className="py-2">{m.ficVatRate}%</td>
                    <td className="py-2">{m.ficVatNature || "—"}</td>
                    <td className="py-2">{m.isDefault ? "✓" : ""}</td>
                    <td className="py-2">
                      <button
                        onClick={() => handleDeleteMapping(m.id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Elimina
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Codice Tax Stripe"
            placeholder="txr_123 o txcd_10000000"
            value={newMapping.stripeTaxCode}
            onChange={(v) => setNewMapping((m) => ({ ...m, stripeTaxCode: v }))}
          />
          <Field
            label="Aliquota IVA %"
            placeholder="22"
            type="number"
            value={String(newMapping.ficVatRate)}
            onChange={(v) =>
              setNewMapping((m) => ({ ...m, ficVatRate: Number(v) }))
            }
          />
          <Field
            label="Natura IVA (opzionale)"
            placeholder="N2.2, N4, ecc."
            value={newMapping.ficVatNature}
            onChange={(v) => setNewMapping((m) => ({ ...m, ficVatNature: v }))}
          />
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newMapping.isDefault}
                onChange={(e) =>
                  setNewMapping((m) => ({ ...m, isDefault: e.target.checked }))
                }
              />
              Default
            </label>
          </div>
        </div>
        <button
          onClick={handleAddMapping}
          className="text-sm text-blue-600 hover:underline"
        >
          + Aggiungi mapping
        </button>
      </Section>

      {/* Branding */}
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
          <span className="text-sm text-green-600 font-medium">
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
  status,
  disabled,
  children,
}: {
  title: string;
  description: string;
  status?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {disabled ? (
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            Prossimamente
          </span>
        ) : status ? (
          <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
            ✓ {status}
          </span>
        ) : null}
      </div>
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
