"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
      <h1 className="font-heading text-4xl">Something went wrong</h1>
      <p className="mt-3 text-sm text-muted-foreground">The page could not be loaded. You can try again.</p>
      <button type="button" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
