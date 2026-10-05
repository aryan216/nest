"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { brand } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeCallbackPath } from "@/lib/utils";

export function LoginForm({ googleEnabled, callbackUrl }: { googleEnabled: boolean; callbackUrl: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("partner@nestverify.test");
  const [password, setPassword] = useState("partner123");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const next = safeCallbackPath(callbackUrl, "/");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const result = await signIn("credentials", { email, password, redirect: false });
    setPending(false);
    if (!result || result.error) {
      setMessage("Email or password is incorrect.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div>
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      {message ? (
        <p className="text-sm text-destructive" role="alert">
          {message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      {googleEnabled ? (
        <Button type="button" variant="secondary" className="w-full" onClick={() => void signIn("google", { callbackUrl: next })}>
          Continue with Google
        </Button>
      ) : null}
      <div className="rounded-2xl bg-secondary px-3 py-3 text-xs leading-5 text-muted-foreground">
        <p className="font-semibold text-foreground">Test accounts</p>
        <p className="mt-1">partner@nestverify.test / partner123</p>
        <p>admin@nestverify.test / admin123</p>
        <p>test@nestverify.test / test123</p>
        <p className="mt-2">Partner accounts can register properties. Roles for production will be assigned by {brand.name}.</p>
      </div>
    </form>
  );
}
