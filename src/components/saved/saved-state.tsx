"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { isRecord } from "@/lib/utils";

const STORAGE_KEY = "nestverify.saved.v1";

function readSaved(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && /^[a-f0-9]{24}$/i.test(item));
  } catch {
    return [];
  }
}

function writeSaved(ids: string[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("nestverify:saved"));
}

interface SavedContextValue {
  ids: string[];
  ready: boolean;
  toggle: (id: string) => void;
  isSaved: (id: string) => boolean;
}

const SavedContext = createContext<SavedContextValue>({
  ids: [],
  ready: false,
  toggle: () => undefined,
  isSaved: () => false,
});

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIds(readSaved());
    setReady(true);
    const onChange = () => setIds(readSaved());
    window.addEventListener("nestverify:saved", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("nestverify:saved", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    const local = readSaved();
    void fetch("/api/saved", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: local }),
    })
      .then((response) => response.json())
      .then((payload: unknown) => {
        if (!isRecord(payload) || !Array.isArray(payload.ids)) return;
        const next = payload.ids.filter((item): item is string => typeof item === "string");
        writeSaved(next);
        setIds(next);
      })
      .catch(() => undefined);
  }, [status]);

  const value = useMemo<SavedContextValue>(() => {
    return {
      ids,
      ready,
      isSaved: (id: string) => ids.includes(id),
      toggle: (id: string) => {
        const current = readSaved();
        const saved = current.includes(id);
        const next = saved ? current.filter((item) => item !== id) : [...current, id];
        writeSaved(next);
        setIds(next);
        if (status === "authenticated") {
          void fetch("/api/saved", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listingId: id, saved: !saved }),
          }).catch(() => undefined);
        }
      },
    };
  }, [ids, ready, status]);

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSaved() {
  return useContext(SavedContext);
}
