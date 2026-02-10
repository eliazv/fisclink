"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

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
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4 selection:bg-blue-100">
      <div className="max-w-[440px] w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-10 h-10 overflow-hidden rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
              <Image
                src="/fisclink.png"
                alt="FiscLink Logo"
                fill
                className="object-contain p-1"
              />
            </div>
            <span className="text-2xl font-black tracking-tight text-[#0f172a]">
              FiscLink
            </span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-[#0f172a] tracking-tight">
              Bentornato
            </h1>
            <p className="text-slate-500 mt-3 text-lg">
              Accedi o registrati alla piattaforma
            </p>
          </div>

          {status === "success" ? (
            <div className="bg-emerald-50/50 border border-emerald-100 text-emerald-800 p-6 rounded-2xl text-center animate-in fade-in zoom-in duration-300">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✉️</span>
              </div>
              <p className="font-bold text-lg">Controlla la tua email</p>
              <p className="text-sm mt-2 opacity-90 line-relaxed">
                Ti abbiamo inviato un link magico per accedere istantaneamente
                senza password.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-6 text-sm font-semibold text-emerald-700 hover:underline"
              >
                Prova con un'altra email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 ml-1"
                >
                  Email Aziendale
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@azienda.it"
                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-[4px] focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none bg-slate-50/30 font-medium placeholder:text-slate-400"
                    disabled={status === "loading"}
                  />
                </div>
              </div>

              {status === "error" && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm font-medium animate-shake">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-4 bg-[#0f172a] text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-[0.98]"
              >
                {status === "loading"
                  ? "Verifica in corso..."
                  : "Ricevi Magic Link"}
              </button>

              <div className="pt-2">
                <p className="text-slate-400 text-xs text-center leading-relaxed">
                  Utilizzando FiscLink accetti i nostri <br />
                  <Link
                    href="/terms"
                    className="underline hover:text-slate-600 transition-colors"
                  >
                    Termini
                  </Link>{" "}
                  e la{" "}
                  <Link
                    href="/privacy"
                    className="underline hover:text-slate-600 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm font-medium text-slate-500 mt-10">
          Nuovo su FiscLink?{" "}
          <span className="text-[#0f172a]">
            Inserisci la tua email per iniziare.
          </span>
        </p>
      </div>
    </div>
  );
}
