"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Georgia, serif", padding: "4rem 1.5rem", background: "#f6f1e7", color: "#1a1a17" }}>
        <h1>Something went wrong</h1>
        <button type="button" onClick={() => reset()} style={{ marginTop: "1rem", minHeight: "44px" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
