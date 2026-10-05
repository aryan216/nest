import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Application received",
  robots: { index: false, follow: false },
};

export default function ThankYouPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-4xl">Application received</h1>
      <p className="mt-4 text-sm leading-7 text-muted-foreground">
        Thank you. A {brand.name} editor will read your application. If we go ahead, you can sign in with this email and{" "}
        <Link href="/partner/listings/new" className="font-semibold text-[#4574ec] underline-offset-4 hover:underline">
          register a property
        </Link>
        . Nothing goes live before a visit.
      </p>
      <div className="mt-6 flex flex-wrap gap-4">
        <Link href="/partner/listings/new" className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
          Register property
        </Link>
        <Link href="/" className="inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:underline">
          Back to verified homes
        </Link>
      </div>
    </div>
  );
}
