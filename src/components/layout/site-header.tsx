"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import * as Dialog from "@radix-ui/react-dialog";
import { Heart, Menu, X } from "lucide-react";
import { brand } from "@/config/brand";
import { LogoLink } from "@/components/layout/logo";
import { useSaved } from "@/components/saved/saved-state";
import type { PropertyType } from "@/types/domain";
import { cn } from "@/lib/utils";

function BuyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 22" className={className} aria-hidden>
      <path d="M12 2.2 2 10.4h2.6V20h6.2v-5.6h2.4V20H19.4V10.4H22L12 2.2Z" fill="#dce6fb" />
      <path d="M12 2.2 2 10.4h20L12 2.2Z" fill="#4673eb" />
      <path d="M10.6 14.4h2.8V20h-2.8v-5.6Z" fill="#fff" opacity=".55" />
    </svg>
  );
}

function SellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 22" className={className} aria-hidden>
      <path d="M6.2 2.2v18.4" stroke="#2a3354" strokeWidth="1.7" strokeLinecap="round" fill="none" />
      <path d="M7.2 2.6h8.4c.85 0 1.45.75 1.2 1.55l-1.35 4.1a1.2 1.2 0 0 0 0 .9l1.35 4.1c.25.8-.35 1.55-1.2 1.55H7.2V2.6Z" fill="#4673eb" />
      <circle cx="11.4" cy="8.9" r="1.55" fill="#fff" />
    </svg>
  );
}

function RentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 22 22" className={className} aria-hidden>
      <circle cx="7.2" cy="11" r="4.4" fill="#dce6fb" stroke="#4673eb" strokeWidth="1.4" />
      <circle cx="7.2" cy="11" r="1.55" fill="#4673eb" />
      <path
        d="M11.4 11h8.2M16.6 11v3.6M18.8 11v2.4"
        stroke="#2a3354"
        strokeWidth="1.65"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

const primaryNav = [
  { href: "/search", label: "Buy", Icon: BuyIcon },
  { href: "/join", label: "Sell", Icon: SellIcon },
  { href: "/search", label: "Rent", Icon: RentIcon },
] as const;

const iconBtn =
  "inline-flex h-10 w-10 items-center justify-center rounded-full text-[#080e2b] transition-colors hover:bg-[#e8effc] hover:text-[#4574ec]";

export function SiteHeader({ typeCounts: _typeCounts }: { typeCounts: { type: PropertyType; count: number }[] }) {
  void _typeCounts;
  const [open, setOpen] = useState(false);
  const { ids } = useSaved();
  const { data, status } = useSession();
  const savedLabel = ids.length > 0 ? `Saved homes, ${ids.length}` : "Saved homes";

  return (
    <header className="sticky top-0 z-50 border-b border-[#e6ebf4] bg-white text-[#080e2b]">
      <div className="relative mx-auto flex min-h-[4.5rem] max-w-page items-center px-4 sm:px-6">
        <LogoLink />

        <nav aria-label="Main" className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="inline-flex items-center gap-2 text-[15px] font-medium text-[#2a3354] transition-colors hover:text-[#4574ec]"
            >
              <item.Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          {status === "authenticated" && data?.user?.role === "ADMIN" ? (
            <Link href="/admin" className="hidden text-sm font-medium text-[#4d5a83] hover:text-[#4574ec] xl:inline">
              Review queue
            </Link>
          ) : null}
          {status === "authenticated" && (data?.user?.role === "PARTNER" || data?.user?.role === "ADMIN") ? (
            <Link href="/partner" className="hidden text-sm font-medium text-[#4d5a83] hover:text-[#4574ec] xl:inline">
              Partner desk
            </Link>
          ) : null}
          {status === "authenticated" ? (
            <button type="button" className="hidden text-sm font-medium text-[#4d5a83] hover:text-[#4574ec] xl:inline" onClick={() => void signOut({ callbackUrl: "/" })}>
              Sign out
            </button>
          ) : null}

          <Link href="/saved" className={iconBtn} aria-label={savedLabel}>
            <Heart className="h-[22px] w-[22px]" strokeWidth={1.6} aria-hidden />
          </Link>

          <Link
            href="/join"
            className="hidden rounded-full border border-[#d8dee9] bg-[#f4f6fa] px-4 py-2.5 text-sm font-medium text-[#2a3354] transition-colors hover:border-[#c5d0e8] hover:bg-[#e8effc] hover:text-[#4574ec] sm:inline-flex"
          >
            Become a channel partner
          </Link>

          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger className={cn(iconBtn, "md:hidden")} aria-label="Open menu">
              <Menu className="h-5 w-5" aria-hidden />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-[70] bg-[#1a315c]/33" />
              <Dialog.Content className="fixed inset-y-0 right-0 z-[80] flex w-[min(100%,20rem)] flex-col gap-4 bg-white p-5 text-[#080e2b] shadow-soft">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="text-xl font-semibold tracking-tight">{brand.name}</Dialog.Title>
                  <Dialog.Close className={iconBtn} aria-label="Close menu">
                    <X className="h-5 w-5" aria-hidden />
                  </Dialog.Close>
                </div>
                <nav aria-label="Mobile" className="flex flex-col">
                  {primaryNav.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="inline-flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 font-semibold text-[#080e2b] hover:bg-[#e8effc] hover:text-[#4574ec]"
                      onClick={() => setOpen(false)}
                    >
                      <item.Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}
                  <Link href="/saved" className="inline-flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 font-semibold hover:bg-[#e8effc] hover:text-[#4574ec]" onClick={() => setOpen(false)}>
                    <Heart className="h-5 w-5 text-[#4673eb]" aria-hidden />
                    Saved homes
                  </Link>
                  <Link href="/login" className="min-h-11 rounded-xl px-2 py-2 font-semibold hover:bg-[#e8effc] hover:text-[#4574ec]" onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                </nav>
                <Link
                  href="/join"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d8dee9] bg-[#f4f6fa] px-5 text-sm font-medium text-[#2a3354] hover:bg-[#e8effc]"
                  onClick={() => setOpen(false)}
                >
                  Become a channel partner
                </Link>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
