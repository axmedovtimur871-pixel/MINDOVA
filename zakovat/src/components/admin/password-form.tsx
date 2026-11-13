"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { changeOwnPassword } from "@/app/admin/(panel)/settings/actions";

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (next !== repeat) return setMsg({ tone: "danger", text: "Yangi parollar bir xil emas." });
        start(async () => {
          const res = await changeOwnPassword(current, next);
          setMsg(res.ok ? { tone: "success", text: "Parol oʻzgartirildi." } : { tone: "danger", text: res.error });
          if (res.ok) { setCurrent(""); setNext(""); setRepeat(""); }
        });
      }}
    >
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
      <Field label="Joriy parol">{(p) => <Input {...p} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />}</Field>
      <Field label="Yangi parol" hint="Kamida 10 belgi">{(p) => <Input {...p} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />}</Field>
      <Field label="Yangi parolni takrorlang">{(p) => <Input {...p} type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} />}</Field>
      <Button type="submit" loading={pending}>Parolni oʻzgartirish</Button>
    </form>
  );
}
