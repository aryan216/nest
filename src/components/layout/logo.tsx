import Link from "next/link";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 text-[#080e2b]", className)}>
      <svg width="34" height="34" viewBox="0 0 38 38" aria-hidden className="shrink-0">
        <defs>
          <radialGradient id="nv-logo-grad" cx="30%" cy="20%">
            <stop stopColor="#7d9efa" />
            <stop offset="1" stopColor="#4674e9" />
          </radialGradient>
        </defs>
        <circle cx="23" cy="15" r="14" fill="url(#nv-logo-grad)" />
        <circle cx="10" cy="27" r="8" fill="#6389f0" />
        <circle cx="15" cy="8" r="3.5" fill="#b2c7ff" opacity=".45" />
      </svg>
      {compact ? null : (
        <span className="text-[1.35rem] font-semibold tracking-[-0.03em] leading-none">
          Nest<span className="text-[#4673eb]">Verify</span>
        </span>
      )}
    </span>
  );
}

export function LogoLink({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" aria-label={`${brand.name} home`} className="rounded-xl">
      <Logo compact={compact} />
    </Link>
  );
}
