"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { getBrowserClient } from "@/lib/supabase/browser";
import { isSupabaseConfigured } from "@/lib/env";

export function LoginForm({ next, initialError }: { next: string; initialError: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) return setError("Supabase sozlanmagan. .env faylini tekshiring.");
    setLoading(true);
    setError(null);
    const supabase = getBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      return setError(/invalid/i.test(error.message) ? "Email yoki parol notoʻgʻri." : /banned/i.test(error.message) ? "Bu hisob oʻchirilgan." : error.message);
    }
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
      await supabase.auth.signOut();
      setLoading(false);
      return setError("Bu hisobga admin panelga kirish huquqi berilmagan.");
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="Email" required>
        {(p) => <Input {...p} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />}
      </Field>
      <Field label="Parol" required>
        {(p) => <Input {...p} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />}
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={loading}>Kirish</Button>
    </form>
  );
}
