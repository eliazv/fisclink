/**
 * Onboarding Wizard - Guida l'utente nella configurazione iniziale
 */

"use client";

import { useState } from "react";
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

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const next = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push("/dashboard");
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 ${
                idx <= currentStep
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200"
              }`}
            >
              {idx < currentStep ? "✓" : idx + 1}
            </div>
            <span className="text-xs font-medium text-center">{step.title}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {STEPS[currentStep].title}
        </h1>
        <p className="text-gray-500 mb-8">{STEPS[currentStep].description}</p>

        <div className="min-h-[300px]">
          {currentStep === 0 && <AccountStep />}
          {currentStep === 1 && <StripeStep />}
          {currentStep === 2 && <FicStep />}
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
            onClick={next}
            className="px-8 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            {currentStep === STEPS.length - 1 ? "Vai alla Dashboard" : "Continua"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AccountStep() {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Regime Fiscale
        </label>
        <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="RF19">Forfettario (RF19)</option>
          <option value="RF01">Ordinario (RF01)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Applica Bollo (€2)
        </label>
        <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="CHARGE_CUSTOMER">Addebita al cliente</option>
          <option value="MERCHANT_PAYS">Paga il merchant</option>
        </select>
      </div>
    </div>
  );
}

function StripeStep() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Vai su Stripe dashboard > Developers > API Keys e copia la tua "Secret Key".
      </p>
      <input
        type="password"
        placeholder="sk_live_..."
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
        <p className="text-xs text-yellow-700 font-medium">Nota:</p>
        <p className="text-xs text-yellow-600">
          Usa una Restricted Key con permessi di lettura per Charges e Invoices per maggiore sicurezza.
        </p>
      </div>
    </div>
  );
}

function FicStep() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Ottieni il tuo API UID e API Key da Fatture in Cloud (Impostazioni > API).
      </p>
      <input
        type="text"
        placeholder="API UID"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <input
        type="password"
        placeholder="API Key"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

function FinishStep() {
  return (
    <div className="text-center space-y-4 pt-8">
      <div className="text-6xl">🎉</div>
      <h2 className="text-xl font-bold text-gray-900">Configurazione completata!</h2>
      <p className="text-gray-500">
        FiscLink inizierà a monitorare i tuoi ordini e a emettere fatture automaticamente.
      </p>
    </div>
  );
}
