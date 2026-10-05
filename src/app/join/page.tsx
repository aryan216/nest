import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/config/brand";
import { PartnerApplicationForm } from "@/components/partner/application-form";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Become a Partner",
  description: `List a property with ${brand.name}. No joining fee. The verified badge comes only after an in-person audit.`,
  alternates: { canonical: "/join" },
};

export default function JoinPage() {
  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="font-heading text-4xl sm:text-5xl">Become a channel partner</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
          {brand.name} publishes a home only after our inspector has walked through it. Partners do not pay a joining fee. Any commission is agreed in writing before the listing goes live, and buyers are not charged brokerage.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6 text-left shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#4673eb]">New partners</p>
          <h2 className="mt-2 font-heading text-2xl">Apply to partner with us</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Tell us the city you work in and the homes you handle. After approval you can sign in and register listings.
          </p>
          <ol className="mt-4 space-y-2 text-sm leading-6 text-[#2a3354]">
            <li><strong>1.</strong> Apply with the form on this page.</li>
            <li><strong>2.</strong> Sign in once your desk is approved.</li>
            <li><strong>3.</strong> Register the property with photos and papers.</li>
          </ol>
        </div>
        <div className="rounded-3xl border border-[#c5d4f5] bg-[#f7f9ff] p-6 text-left shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#4673eb]">Approved partners</p>
          <h2 className="mt-2 font-heading text-2xl">Register a property</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Upload photos to ImageKit, fill every field that appears on the public property page, and attach ownership papers for inspection.
          </p>
          <Link
            href="/partner/listings/new"
            className={buttonVariants({ className: "mt-5 inline-flex min-h-11 w-full justify-center sm:w-auto" })}
          >
            Register property
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">
            Direct link: <span className="font-medium text-[#2a3354]">/partner/listings/new</span> — you will be asked to sign in if needed.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-page gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-heading text-3xl">Partner application</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Use this form if you are not yet on the partner desk. Already approved? Skip ahead and{" "}
            <Link href="/partner/listings/new" className="font-semibold text-[#4574ec] underline-offset-4 hover:underline">
              register a property
            </Link>
            .
          </p>
          <ol className="mt-6 space-y-4 text-sm leading-6">
            <li><strong>Apply.</strong> Tell us the city you work in and the kind of homes you handle.</li>
            <li><strong>Register the listing.</strong> Photos, papers, measured area, specs and map pin — everything buyers will see.</li>
            <li><strong>Audit.</strong> We visit. If the checklist passes, the home goes live with the Verified badge.</li>
          </ol>
        </div>
        <PartnerApplicationForm />
      </div>
    </div>
  );
}
