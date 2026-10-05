import type { ReactNode } from "react";
import { ChevronDown, Home, IndianRupee, MapPin, Search } from "lucide-react";
import { brand } from "@/config/brand";
import { BUDGET_PRESETS, PROPERTY_CATALOG } from "@/config/catalog";

export function HeroSearch({ localities }: { localities: { name: string; slug: string }[] }) {
  return (
    <form
      action="/search"
      className="mx-auto grid w-full max-w-4xl gap-2 rounded-[1.75rem] border border-white/70 bg-white/95 p-2 shadow-[0_28px_80px_-28px_rgba(8,40,34,0.55)] backdrop-blur-md sm:grid-cols-[1.2fr_1fr_1fr_auto] sm:items-center sm:rounded-full sm:gap-0 sm:p-1.5 sm:pl-2"
    >
      <SearchField icon={MapPin} label="Where" divider>
        <select name="locality" defaultValue="" className="hero-select" aria-label={`Locality in ${brand.city}`}>
          <option value="">All of {brand.city}</option>
          {localities.map((locality) => (
            <option key={locality.slug} value={locality.slug}>
              {locality.name}
            </option>
          ))}
        </select>
      </SearchField>
      <SearchField icon={Home} label="Type" divider>
        <select name="type" defaultValue="" className="hero-select" aria-label="Property type">
          <option value="">Any home</option>
          {PROPERTY_CATALOG.map((item) => (
            <option key={item.type} value={item.type}>
              {item.label}
            </option>
          ))}
        </select>
      </SearchField>
      <SearchField icon={IndianRupee} label="Budget">
        <select name="budgetPreset" defaultValue="any" className="hero-select" aria-label="Budget">
          {BUDGET_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.id === "any" ? "Any budget" : preset.label}
            </option>
          ))}
        </select>
      </SearchField>
      <button
        type="submit"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition duration-200 hover:bg-primary/90 sm:min-h-14 sm:px-7"
      >
        <Search className="h-4 w-4" aria-hidden />
        Search
      </button>
    </form>
  );
}

function SearchField({
  icon: Icon,
  label,
  children,
  divider = false,
}: {
  icon: typeof MapPin;
  label: string;
  children: ReactNode;
  divider?: boolean;
}) {
  return (
    <label
      className={`flex min-w-0 items-center gap-3 rounded-2xl px-3 py-2 transition duration-200 hover:bg-secondary/70 sm:rounded-full sm:py-1.5 ${
        divider ? "sm:border-r sm:border-border/80" : ""
      }`}
    >
      <Icon className="hidden h-4 w-4 shrink-0 text-primary sm:block" aria-hidden />
      <span className="relative min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
        {children}
        <ChevronDown className="pointer-events-none absolute bottom-0.5 right-0 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      </span>
    </label>
  );
}
