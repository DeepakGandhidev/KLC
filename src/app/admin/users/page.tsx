"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { apiGet } from "@/lib/apiClient";
import { fmtDate, fmtKlc } from "@/lib/format";
import type { AdminUser } from "@/lib/types";
import {
  Badge,
  Card,
  Kicker,
  Spinner,
  inputClass,
  tableClass,
  tdClass,
  thClass,
  theadClass,
} from "@/components/ui";

export default function AdminUsersPage() {
  const { t, lang } = useLanguage();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ users: AdminUser[] }>("/api/admin/users")
      .then((d) => {
        if (!cancelled) setUsers(d.users);
      })
      .catch(() => {
        // AppShell owns the 401/403 redirect
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  if (loading) return <Spinner label={t("common.loading")} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <Kicker>{t("admin.title")}</Kicker>
        <h1 className="mt-2 text-3xl font-bold text-white">
          {t("admin.users.title")}
        </h1>
      </header>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("admin.users.search")}
        className={`${inputClass} max-w-sm`}
        aria-label={t("admin.users.search")}
      />

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className={tableClass}>
            <thead className={theadClass}>
              <tr>
                <th className={thClass}>{t("admin.users.user")}</th>
                <th className={thClass}>{t("common.email")}</th>
                <th className={thClass}>{t("refs.yourCode")}</th>
                <th className={thClass}>{t("admin.users.role")}</th>
                <th className={thClass}>{t("admin.users.refs")}</th>
                <th className={thClass}>{t("admin.users.balance")}</th>
                <th className={thClass}>{t("dash.overview.totalMined")}</th>
                <th className={thClass}>{t("admin.users.joined")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td className={`${tdClass} text-slate-500`} colSpan={8}>
                    {t("admin.users.empty")}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u._id} className="hover:bg-white/[0.03]">
                    <td className={`${tdClass} font-medium text-white`}>{u.name}</td>
                    <td className={tdClass}>{u.email}</td>
                    <td className={tdClass}>
                      <code className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-amber-200">
                        {u.referralCode}
                      </code>
                    </td>
                    <td className={tdClass}>
                      {u.role === "admin" ? (
                        <Badge tone="amber">{t("admin.role.admin")}</Badge>
                      ) : (
                        <Badge tone="slate">{t("admin.role.user")}</Badge>
                      )}
                    </td>
                    <td className={tdClass}>{u.refsCount}</td>
                    <td className={`${tdClass} font-semibold text-amber-300`}>
                      {fmtKlc(u.klcBalance)}
                    </td>
                    <td className={tdClass}>{fmtKlc(u.totalMined)}</td>
                    <td className={tdClass}>{fmtDate(u.createdAt, lang)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
