import Link from "next/link";

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-300 to-amber-600 shadow-[0_0_20px_-4px_rgba(245,185,66,0.6)]">
        <span className="h-2.5 w-2.5 rotate-45 rounded-[2px] bg-[#070b14]" />
      </span>
      {!compact && (
        <span className="text-lg font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
            KLAUN
          </span>
          <span className="text-white">-EC</span>
        </span>
      )}
    </Link>
  );
}
