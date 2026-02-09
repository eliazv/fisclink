/**
 * Onboarding Wizard - Guida l'utente nella configurazione iniziale
 * Salva i dati realmente tramite /api/settings e verifica le connessioni
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  {
    id: "account",
    title: "Profilo Fiscale",
    description: "Configura il tuo regime fiscale e i dati aziendali.",
  },
  {
    id: "stripe",
    title: "Collegamento Stripe",
    description: "Collega il tuo account Stripe per importare gli ordini.",
  },
  {
    id: "fic",
    title: "Fatture in Cloud",
    description: "Collega FiC per emettere le fatture elettroniche.",
  },
  {
    id: "finish",
    title: "Fine",
    description: "Il tuo setup è pronto!",
  },
];

interface OnboardingData {
  taxRegime: string;
  bolloPolicy: string;
  businessName: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  ficAccessToken: string;
  ficCompanyId: string;
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [data, setData] = useState<OnboardingData>({
    taxRegime: "RF19",
    bolloPolicy: "CHARGE_CUSTOMER",
    businessName: "",
    stripeSecretKey: "",
    stripeWebhookSecret: "",
    ficAccessToken: "",
    ficCompanyId: "",
  });

  // Carica eventuali settings già configurati
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => {
        setData((d) => ({
          ...d,
          taxRegime: s.taxRegime ?? d.taxRegime,
          bolloPolicy: s.bolloPolicy ?? d.bolloPolicy,
          businessName: s.name ?? d.businessName,
          ficCompanyId: s.ficCompanyId ?? d.ficCompanyId,
        }));
      })
      .catch(() => {});
  }, []);

  const saveAndNext = async () => {
    setSaving(true);
    setError(null);

    try {
      // Costruisci body con solo i campi pertinenti allo step
      const body: Record<string, unknown> = {};

      if (currentStep === 0) {
        body.taxRegime = data.taxRegime;
        body.bolloPolicy = data.bolloPolicy;
        if (data.businessName) body.businessName = data.businessName;
      } else if (currentStep === 1) {
        if (data.stripeSecretKey) body.stripeSecretKey = data.stripeSecretKey;
        if (data.stripeWebhookSecret)
          body.stripeWebhookSecret = data.stripeWebhookSecret;
      } else if (currentStep === 2) {
        if (data.ficAccessToken) body.ficAccessToken = data.ficAccessToken;
        if (data.ficCompanyId) body.ficCompanyId = data.ficCompanyId;
      }

      if (Object.keys(body).length > 0) {
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error ?? "Errore nel salvataggio");
        }
      }

      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        router.push("/dashboard");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore sconosciuto");
    } finally {
      setSaving(false);
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="flex justify-between mb-8">
        {STEPS.map((step, idx) => (
          <div
            key={step.id}
            className={`flex flex-col items-center flex-1 ${
              idx <= currentStep ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 transition-colors ${
                idx < currentStep
                  ? "border-green-500 bg-green-50 text-green-600"
                  : idx === currentStep
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200"
              }`}
            >
              {idx < currentStep ? "✓" : idx + 1}
            </div>
            <span className="text-xs font-medium text-center">
              {step.title}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {STEPS[currentStep].title}
        </h1>
        <p className="text-gray-500 mb-8">{STEPS[currentStep].description}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="min-h-[300px]">
          {currentStep === 0 && <AccountStep data={data} onChange={setData} />}
          {currentStep === 1 && <StripeStep data={data} onChange={setData} />}
          {currentStep === 2 && <FicStep data={data} onChange={setData} />}
          {currentStep === 3 && <FinishStep />}
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={prev}
            disabled={currentStep === 0}
            className="px-6 py-2 text-gray-600 font-medium disabled:opacity-0"
          >
            Indietro
          </button>
          <button
            onClick={saveAndNext}
            disabled={saving}
            className="px-8 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {saving
              ? "Salvataggio..."
              : currentStep === STEPS.length - 1
                ? "Vai alla Dashboard"
                : "Salva e continua"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (d: OnboardingData) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome azienda / Ragione sociale
        </label>
        <input
          type="text"
          value={data.businessName}
          onChange={(e) => onChange({ ...data, businessName: e.target.value })}
          placeholder="Es. Mario Rossi o Acme S.r.l."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Regime Fiscale
        </label>
        <select
          value={data.taxRegime}
          onChange={(e) => onChange({ ...data, taxRegime: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="RF19">RF19 – Forfettario</option>
          <option value="RF01">RF01 – Ordinario</option>
          <option value="RF02">RF02 – Contribuenti Minimi</option>
          <option value="RF04">RF04 – Agricoltura</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Gestione imposta di bollo (€2)
        </label>
        <select
          value={data.bolloPolicy}
          onChange={(e) => onChange({ ...data, bolloPolicy: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="CHARGE_CUSTOMER">Addebita al cliente (+2€)</option>
          <option value="ABSORB_COST">A carico mio</option>
        </select>
      </div>
    </div>
  );
}

function StripeStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (d: OnboardingData) => void;
}) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  const testConnection = async () => {
    if (!data.stripeSecretKey) return;
    setTesting(true);
    setTestResult(null);

    try {
      // Prima salva la chiave
      const saveRes = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripeSecretKey: data.stripeSecretKey }),
      });
      if (!saveRes.ok) throw new Error("Errore nel salvataggio della chiave");

      // Poi testa la connessione
      const testRes = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test-stripe" }),
      });
      const result = await testRes.json();
      setTestResult({
        ok: result.success,
        msg: result.success
          ? "Connessione Stripe stabilita!"
          : (result.error ?? "Test fallito"),
      });
    } catch (e) {
      setTestResult({
        ok: false,
        msg: e instanceof Error ? e.message : "Errore di rete",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Vai su <strong>Stripe Dashboard → Developers → API Keys</strong> e copia
        la tua &quot;Secret Key&quot;.
      </p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Secret Key *
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="sk_live_..."
            value={data.stripeSecretKey}
            onChange={(e) =>
              onChange({ ...data, stripeSecretKey: e.target.value })
            }
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={testConnection}
            disabled={testing || !data.stripeSecretKey}
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold hover:bg-gray-50 disabled:opacity-50"
          >
            {testing ? "Test..." : "VERIFICA"}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Webhook Secret (opzionale)
        </label>
        <input
          type="password"
          placeholder="whsec_..."
          value={data.stripeWebhookSecret}
          onChange={(e) =>
            onChange({ ...data, stripeWebhookSecret: e.target.value })
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {testResult && (
        <p
          className={`text-xs font-bold ${testResult.ok ? "text-green-600" : "text-red-600"}`}
        >
          {testResult.ok ? "✓" : "✗"} {testResult.msg}
        </p>
      )}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-700 font-medium">🔐 Sicurezza:</p>
        <p className="text-xs text-blue-600">
          Le chiavi vengono cifrate con AES-256-GCM prima di essere salvate. Non
          sono mai memorizzate in chiaro.
        </p>
      </div>
    </div>
  );
}

function FicStep({
  data,
  onChange,
}: {
  data: OnboardingData;
  onChange: (d: OnboardingData) => void;
}) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  const testConnection = async () => {
    if (!data.ficAccessToken || !data.ficCompanyId) return;
    setTesting(true);
    setTestResult(null);

    try {
      // Prima salva le credenziali
      const saveRes = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ficAccessToken: data.ficAccessToken,
          ficCompanyId: data.ficCompanyId,
        }),
      });
      if (!saveRes.ok) throw new Error("Errore nel salvataggio");

      // Poi testa
      const testRes = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test-fic" }),
      });
      const result = await testRes.json();
      setTestResult({
        ok: result.success,
        msg: result.success
          ? `Connesso${result.companyName ? ` — ${result.companyName}` : ""}`
          : (result.error ?? "Test fallito"),
      });
    } catch (e) {
      setTestResult({
        ok: false,
        msg: e instanceof Error ? e.message : "Errore di rete",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Ottieni il tuo Bearer Token e Company ID da{" "}
        <strong>Fatture in Cloud → Impostazioni → API</strong>.
      </p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company ID *
        </label>
        <input
          type="text"
          placeholder="123456"
          value={data.ficCompanyId}
          onChange={(e) => onChange({ ...data, ficCompanyId: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          API Bearer Token *
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="Bearer token..."
            value={data.ficAccessToken}
            onChange={(e) =>
              onChange({ ...data, ficAccessToken: e.target.value })
            }
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={testConnection}
            disabled={testing || !data.ficAccessToken || !data.ficCompanyId}
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold hover:bg-gray-50 disabled:opacity-50"
          >
            {testing ? "Test..." : "VERIFICA"}
          </button>
        </div>
      </div>
      {testResult && (
        <p
          className={`text-xs font-bold ${testResult.ok ? "text-green-600" : "text-red-600"}`}
        >
          {testResult.ok ? "✓" : "✗"} {testResult.msg}
        </p>
      )}
    </div>
  );
}

function FinishStep() {
  return (
    <div className="text-center space-y-4 pt-8">
      <div className="text-6xl">🎉</div>
      <h2 className="text-xl font-bold text-gray-900">
        Configurazione completata!
      </h2>
      <p className="text-gray-500 max-w-md mx-auto">
        FiscLink inizierà a monitorare i tuoi ordini e a emettere fatture
        automaticamente. Ogni pagamento Stripe diventerà una fattura SDI.
      </p>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left max-w-md mx-auto mt-6">
        <p className="text-sm font-semibold text-green-800 mb-2">
          ✓ Cosa succede ora:
        </p>
        <ul className="text-xs text-green-700 space-y-1">
          <li>• I nuovi pagamenti vengono rilevati automaticamente</li>
          <li>
            • Se mancano dati fiscali, un Magic Link viene inviato al cliente
          </li>
          <li>
            • Le fatture vengono inviate allo SDI tramite Fatture in Cloud
          </li>
          <li>• Puoi monitorare tutto dalla Dashboard</li>
        </ul>
      </div>
    </div>
  );
}
