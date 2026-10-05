import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">404</p>
      <h1 className="mt-3 font-heading text-4xl">This page is not on the map</h1>
      <p className="mt-3 text-sm text-muted-foreground">The home may have left the verified list, or the address was typed wrong.</p>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center font-semibold underline-offset-4 hover:underline">
        Back to verified homes
      </Link>
    </div>
  );
}
