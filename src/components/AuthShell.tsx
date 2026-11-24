import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-1 flex-col items-center justify-center px-4 py-12">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 50% 0%, rgba(245,185,66,0.13), transparent 70%)",
        }}
      />
      <div className="absolute right-4 top-4">
        <LanguageToggle />
      </div>
      <div className="relative mb-8">
        <Logo />
      </div>
      <div className="relative flex w-full justify-center">{children}</div>
    </div>
  );
}
