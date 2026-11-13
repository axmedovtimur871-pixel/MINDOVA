"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl font-semibold text-navy-900">Xatolik yuz berdi</h1>
        <p className="mt-2 text-muted">Sahifani yuklashda muammo chiqdi. Qayta urinib koʻring.</p>
        <Button className="mt-6" onClick={reset}>Qayta urinish</Button>
      </div>
    </div>
  );
}
