import Link from "next/link";
import { brand } from "@/config/brand";
import { Logo } from "@/components/layout/logo";

export function SiteFooter({ localities }: { localities: { name: string; slug: string }[] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-[#e6ebf4] bg-white">
      <div className="mx-auto grid max-w-page gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-[#7a87aa]">
            Verified property in {brand.city}. Every public listing is inspected in person. Buyers pay no brokerage.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#080e2b]">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm text-[#4d5a83]">
            <li><Link className="transition-colors hover:text-[#4574ec]" href="/search">Search verified homes</Link></li>
            <li><Link className="transition-colors hover:text-[#4574ec]" href="/join">Become a Partner</Link></li>
            <li><Link className="transition-colors hover:text-[#4574ec]" href="/sample-report">Sample verification report</Link></li>
            <li><Link className="transition-colors hover:text-[#4574ec]" href="/saved">Saved homes</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-[#080e2b]">Popular localities</h2>
          <ul className="mt-3 space-y-2 text-sm text-[#4d5a83]">
            {localities.slice(0, 6).map((locality) => (
              <li key={locality.slug}>
                <Link className="transition-colors hover:text-[#4574ec]" href={`/locality/${locality.slug}`}>{locality.name}</Link>
              </li>
            ))}
            {localities.length === 0 ? <li className="text-[#7a87aa]">Localities appear after the first verified homes.</li> : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-[#dce5fa]">
        <div className="mx-auto flex max-w-page flex-col gap-2 px-4 py-6 text-sm text-[#7a87aa] sm:px-6 md:flex-row md:justify-between">
          <address className="not-italic">
            {brand.addressLines.join(", ")} · {brand.phoneDisplay}
          </address>
          <p>© {year} {brand.name}. Verified property in {brand.city}.</p>
        </div>
      </div>
    </footer>
  );
}
