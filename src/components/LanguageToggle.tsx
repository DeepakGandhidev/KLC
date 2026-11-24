"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { Lang } from "@/lib/i18n/dictionaries";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  const options: Lang[] = ["fr", "en"];

  return (
    <div
      role="group"
      aria-label="Language / Langue"
      className="inline-flex items-center rounded-full border border-white/15 bg-white/5 p-0.5 text-xs font-semibold"
    >
      {options.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-2.5 py-1 uppercase tracking-wide transition ${
            lang === l
              ? "bg-gradient-to-r from-amber-400 to-amber-600 text-black"
              : "text-slate-300 hover:text-white"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
