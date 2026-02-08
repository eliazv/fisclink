/**
 * Magic Link Page - Pagina pubblica per il recupero dati fiscali
 *
 * Il cliente finale accede a questa pagina dopo aver ricevuto l'email.
 * Il form è semplice, brandizzato col logo del merchant.
 */

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PROVINCE_ITALIANE } from "@/lib/validators/fiscal";

interface MagicLinkData {
  status: "active" | "completed" | "expired";
  message?: string;
  error?: string;
  merchant?: {
    name: string;
    logoUrl: string | null;
    brandColor: string | null;
  };
  invoice?: {
    amount: number;
    currency: string;
    description: string | null;
  };
  prefilled?: {
    name: string | null;
    fiscalCode: string | null;
    vatNumber: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    zipCode: string | null;
    country: string | null;
    sdiCode: string | null;
    pecEmail: string | null;
    customerType: string | null;
  } | null;
}

type FormData = {
  customerType: "PRIVATE" | "BUSINESS" | "FOREIGN";
  name: string;
  fiscalCode: string;
  vatNumber: string;
  address: string;
  city: string;
  province: string;
  zipCode: string;
  country: string;
  sdiCode: string;
  pecEmail: string;
};

export default function MagicLinkPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<MagicLinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [form, setForm] = useState<FormData>({
    customerType: "PRIVATE",
    name: "",
    fiscalCode: "",
    vatNumber: "",
    address: "",
    city: "",
    province: "",
    zipCode: "",
    country: "IT",
    sdiCode: "",
    pecEmail: "",
  });

  // Carica i dati del magic link
  useEffect(() => {
    fetch(`/api/magic-link/${token}`)
      .then((r) => r.json())
      .then((result: MagicLinkData) => {
        setData(result);
        if (result.prefilled) {
          setForm((prev) => ({
            ...prev,
            customerType:
              (result.prefilled?.customerType as FormData["customerType"]) ??
              "PRIVATE",
            name: result.prefilled?.name ?? "",
            fiscalCode: result.prefilled?.fiscalCode ?? "",
            vatNumber: result.prefilled?.vatNumber ?? "",
            address: result.prefilled?.address ?? "",
            city: result.prefilled?.city ?? "",
            province: result.prefilled?.province ?? "",
            zipCode: result.prefilled?.zipCode ?? "",
            country: result.prefilled?.country ?? "IT",
            sdiCode: result.prefilled?.sdiCode ?? "",
            pecEmail: result.prefilled?.pecEmail ?? "",
          }));
        }
      })
      .catch(() =>
        setData({ status: "expired", error: "Errore di connessione" }),
      )
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);

    try {
      const response = await fetch(`/api/magic-link/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          fiscalCode: form.fiscalCode || null,
          vatNumber: form.vatNumber || null,
          sdiCode: form.sdiCode || null,
          pecEmail: form.pecEmail || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors(
          result.details ?? [result.error ?? "Errore nell'invio dei dati"],
        );
        return;
      }

      setSuccess(true);
    } catch {
      setErrors(["Errore di connessione. Riprova."]);
    } finally {
      setSubmitting(false);
    }
  };

  const brandColor = data?.merchant?.brandColor ?? "#2563eb";

  // --- States ---

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data || data.status === "expired") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-4">⏰</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Link scaduto
          </h1>
          <p className="text-gray-500">
            {data?.error ??
              "Questo link non è più valido. Contatta il venditore per riceverne uno nuovo."}
          </p>
        </div>
      </div>
    );
  }

  if (data.status === "completed" || success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm max-w-md w-full p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Dati ricevuti!
          </h1>
          <p className="text-gray-500">
            Grazie! La tua fattura elettronica verrà emessa a breve.
          </p>
          {data.merchant && (
            <p className="text-sm text-gray-400 mt-4">{data.merchant.name}</p>
          )}
        </div>
      </div>
    );
  }

  // --- Form attivo ---
  const provinces = Array.from(PROVINCE_ITALIANE).sort();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header merchant */}
        <div
          className="rounded-t-xl p-6 text-center"
          style={{ backgroundColor: brandColor }}
        >
          {data.merchant?.logoUrl && (
            <img
              src={data.merchant.logoUrl}
              alt={data.merchant.name}
              className="h-10 mx-auto mb-2"
            />
          )}
          <h1 className="text-white text-lg font-semibold">
            {data.merchant?.name}
          </h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded-b-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Completa i tuoi dati fiscali
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Per emettere la fattura elettronica, abbiamo bisogno di alcuni dati.
            {data.invoice && (
              <span className="block mt-1 font-medium text-gray-700">
                Importo: {data.invoice.amount.toFixed(2)}{" "}
                {data.invoice.currency}
                {data.invoice.description && ` – ${data.invoice.description}`}
              </span>
            )}
          </p>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-red-800 mb-1">
                Correggi i seguenti errori:
              </p>
              <ul className="text-sm text-red-600 list-disc list-inside">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <div className="flex gap-2">
                {(
                  [
                    ["PRIVATE", "Privato"],
                    ["BUSINESS", "Azienda"],
                    ["FOREIGN", "Estero"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, customerType: value }))
                    }
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      form.customerType === value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.customerType === "BUSINESS"
                  ? "Ragione Sociale *"
                  : "Nome e Cognome *"}
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={
                  form.customerType === "BUSINESS"
                    ? "Es. Acme S.r.l."
                    : "Es. Mario Rossi"
                }
              />
            </div>

            {/* Codice Fiscale (per privati italiani) */}
            {form.customerType === "PRIVATE" && form.country === "IT" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Codice Fiscale *
                </label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={form.fiscalCode}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      fiscalCode: e.target.value.toUpperCase(),
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="RSSMRA85M01H501Z"
                />
              </div>
            )}

            {/* Partita IVA (per aziende) */}
            {form.customerType === "BUSINESS" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Partita IVA *
                </label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  value={form.vatNumber}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      vatNumber: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="01234567890"
                />
              </div>
            )}

            {/* Indirizzo */}
            {form.country === "IT" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Indirizzo *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Via Roma 1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Città *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, city: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Milano"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CAP *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      value={form.zipCode}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          zipCode: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="20121"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provincia *
                    </label>
                    <select
                      required
                      value={form.province}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, province: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleziona...</option>
                      {provinces.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nazione
                    </label>
                    <select
                      value={form.country}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, country: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="IT">Italia</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* SDI / PEC (opzionali, per aziende) */}
            {form.customerType === "BUSINESS" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Codice SDI
                  </label>
                  <input
                    type="text"
                    maxLength={7}
                    value={form.sdiCode}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        sdiCode: e.target.value.toUpperCase(),
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PEC
                  </label>
                  <input
                    type="email"
                    value={form.pecEmail}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, pecEmail: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="azienda@pec.it"
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-opacity disabled:opacity-60"
              style={{ backgroundColor: brandColor }}
            >
              {submitting ? "Invio in corso..." : "Conferma dati fiscali"}
            </button>

            <p className="text-xs text-gray-400 text-center">
              I tuoi dati saranno usati esclusivamente per l&apos;emissione
              della fattura elettronica.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
