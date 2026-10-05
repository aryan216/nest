import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { SavedExplorer } from "@/components/saved/saved-explorer";
import { getCurrentUser } from "@/lib/session";
import { listSavedListings } from "@/services/quality";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saved homes",
  description: `Homes you have saved on ${brand.name}.`,
  robots: { index: false, follow: false },
};

export default async function SavedPage() {
  const user = await getCurrentUser();
  const initial = user ? await listSavedListings(user.id).catch(() => []) : [];
  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:px-6">
      <h1 className="font-heading text-4xl">Saved homes</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Hearts stay on this device until you sign in. Compare up to three verified homes side by side.</p>
      <div className="mt-6">
        <SavedExplorer initial={initial} />
      </div>
    </div>
  );
}
