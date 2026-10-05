export function formatPriceINR(amount: number): string {
  if (!Number.isFinite(amount)) return "₹0";
  const rounded = Math.round(Math.abs(amount));
  if (rounded >= 10000000) return `₹${trimCompact(rounded / 10000000)} Cr`;
  if (rounded >= 100000) return `₹${trimCompact(rounded / 100000)} L`;
  return `₹${new Intl.NumberFormat("en-IN").format(rounded)}`;
}

function trimCompact(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return rounded.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

export function formatPerSqFt(amount: number): string {
  const rounded = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(rounded)} / sq ft`;
}

export function formatArea(area: number): string {
  const rounded = Number.isFinite(area) ? Math.round(area) : 0;
  return `${new Intl.NumberFormat("en-IN").format(rounded)} sq ft`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}
