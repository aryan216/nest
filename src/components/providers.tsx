"use client";

import { SessionProvider } from "next-auth/react";
import { SavedProvider } from "@/components/saved/saved-state";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <SavedProvider>{children}</SavedProvider>
    </SessionProvider>
  );
}
