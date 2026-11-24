"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { apiSend, ApiError } from "@/lib/apiClient";
import { authErrorKey } from "@/lib/errorKeys";
import { AuthShell } from "@/components/AuthShell";
import { Card, Spinner, btnPrimary, inputClass } from "@/components/ui";

export default function RegisterPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [referralCode, setReferralCode] = useState(
    searchParams.get("ref") ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("password_mismatch");
      return;
    }
    setLoading(true);
    try {
      await apiSend("/api/auth/register", "POST", {
        name,
        email,
        password,
        referralCode: referralCode.trim() || undefined,
        language: lang,
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.code : "server_error");
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <Card glow className="w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-white">
          {t("auth.register.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {t("auth.register.subtitle")}
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-300">
              {t("common.name")}
            </label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
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
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-300">
              {t("auth.register.confirmPassword")}
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="referralCode" className="mb-1.5 block text-sm font-medium text-slate-300">
              {t("auth.register.referralCode")}
            </label>
            <input
              id="referralCode"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">
              {error === "password_mismatch"
                ? t("auth.error.passwordMismatch")
                : t(authErrorKey(error))}
            </p>
          )}

          <button type="submit" disabled={loading} className={`${btnPrimary} w-full`}>
            {loading ? t("common.loading") : t("auth.register.submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {t("auth.register.hasAccount")}{" "}
          <Link href="/login" className="font-semibold text-amber-300 hover:text-amber-200">
            {t("auth.register.login")}
          </Link>
        </p>
      </Card>
    </AuthShell>
  );
}
