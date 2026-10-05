import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { googleAuthEnabled } from "@/lib/auth";
import { safeCallbackPath } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  return (
    <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <h1 className="font-heading text-4xl">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">Use your email and password. Test accounts are listed on the form.</p>
      <div className="mt-6">
        <LoginForm googleEnabled={googleAuthEnabled()} callbackUrl={safeCallbackPath(searchParams.callbackUrl, "/")} />
      </div>
    </div>
  );
}
