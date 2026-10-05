import Link from "next/link";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const links = [
  ["Review queue", "/admin"],
  ["Enquiries", "/admin/enquiries"],
  ["Partner applications", "/admin/partners"],
  ["Data quality", "/admin/quality"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireUser(["ADMIN", "INSPECTOR"]);
  return (
    <div className="mx-auto max-w-page px-4 py-6 sm:px-6">
      <nav aria-label="Staff" className="mb-6 flex gap-2 overflow-x-auto">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full bg-secondary px-4 text-sm font-semibold">
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
