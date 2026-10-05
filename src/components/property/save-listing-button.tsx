"use client";

import { Heart } from "lucide-react";
import { useSaved } from "@/components/saved/saved-state";
import { cn } from "@/lib/utils";

export function SaveListingButton({ id, title }: { id: string; title: string }) {
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(id);
  return (
    <button
      type="button"
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-semibold"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from saved` : `Save ${title}`}
      onClick={() => toggle(id)}
    >
      <Heart className={cn("h-4 w-4", saved ? "fill-primary text-primary" : "")} aria-hidden />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
