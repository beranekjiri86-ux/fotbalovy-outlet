"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  initialValue?: string;
  placeholder?: string;
};

export default function LiveSearch({
  initialValue = "",
  placeholder = "Hledat produkty...",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [value, setValue] = useState(initialValue);
  const lastSyncedRef = useRef(initialValue);

  useEffect(() => {
    const currentQ = searchParams.get("q") ?? "";
    if (currentQ !== lastSyncedRef.current && currentQ !== value) {
      setValue(currentQ);
      lastSyncedRef.current = currentQ;
    }
  }, [searchParams, value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const next = value.trim();
      const current = params.get("q") ?? "";

      if (next === current) return;

      if (next) params.set("q", next);
      else params.delete("q");

      const qs = params.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;

      lastSyncedRef.current = next;

      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [value, pathname, router, searchParams]);

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="headerSearch"
        autoComplete="off"
        spellCheck={false}
      />
      {isPending ? <div className="small muted">Hledám...</div> : null}
    </div>
  );
}
