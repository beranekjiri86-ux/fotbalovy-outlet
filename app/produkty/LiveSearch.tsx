"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  initialValue?: string;
  placeholder?: string;
  className?: string;
};

export default function LiveSearch({
  initialValue = "",
  placeholder = "Hledat produkty...",
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [value, setValue] = useState(initialValue);
  const lastCommittedRef = useRef(initialValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const currentQ = searchParams.get("q") ?? "";

    if (currentQ !== lastCommittedRef.current && currentQ !== value) {
      setValue(currentQ);
      lastCommittedRef.current = currentQ;
    }
  }, [searchParams, value]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();
      const currentQ = params.get("q") ?? "";

      if (trimmed === currentQ) return;

      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }

      lastCommittedRef.current = trimmed;

      const nextUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, pathname, router, searchParams]);

  return (
    <div style={{ display: "grid", gap: 6, width: "100%" }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={className}
        style={{ width: "100%", minWidth: 0 }}
        autoComplete="off"
        spellCheck={false}
      />
      {isPending ? <div className="small muted">Hledám...</div> : null}
    </div>
  );
}
