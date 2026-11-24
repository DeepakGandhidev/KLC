"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { apiSend, ApiError } from "@/lib/apiClient";
import { authErrorKey } from "@/lib/errorKeys";
import { AuthShell } from "@/components/AuthShell";
import { Card, Spinner, btnPrimary, inputClass } from "@/components/ui";

export default function LoginPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiSend("/api/auth/login", "POST", { email, password });
      router.push(searchParams.get("next") || "/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.code : "server_error");
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <Card glow className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-white">{t("auth.login.title")}</h1>
        <p className="mt-1 text-sm text-slate-400">{t("auth.login.subtitle")}</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
              {t("common.email")}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
              {t("common.password")}
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
              {t(authErrorKey(error))}
            </p>
          )}

          <button type="submit" disabled={loading} className={`${btnPrimary} w-full`}>
            {loading ? t("common.loading") : t("auth.login.submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {t("auth.login.noAccount")}{" "}
          <Link href="/register" className="font-semibold text-amber-300 hover:text-amber-200">
            {t("auth.login.create")}
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
