"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage(
          data.message || "Email inviata! Controlla la tua casella di posta.",
        );
      } else {
        setStatus("error");
        setMessage(data.error || "Qualcosa è andato storto.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Errore di connessione.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-2xl font-bold text-blue-600 mb-2 inline-block"
          >
            ⚡ FiscLink
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Accedi o Registrati
          </h1>
          <p className="text-gray-500 mt-2">
            Inserisci la tua email per ricevere un link di accesso magico.
          </p>
        </div>

        {status === "success" ? (
          <div className="bg-green-50 border border-green-100 text-green-700 p-4 rounded-lg text-center">
            <p className="font-semibold">✉️ Email inviata!</p>
            <p className="text-sm mt-1">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Aziendale
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@azienda.it"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
                disabled={status === "loading"}
              />
            </div>

            {status === "error" && (
              <p className="text-red-500 text-sm">{message}</p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {status === "loading"
                ? "Invio in corso..."
                : "Invia Link di Accesso"}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-400 mt-8">
          Nessuna password richiesta. Sicuro e veloce.
        </p>
      </div>
    </div>
  );
}
