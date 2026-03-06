"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialQ = searchParams.get("q") ?? "";
  const [value, setValue] = useState(initialQ);
  const lastCommittedRef = useRef(initialQ);

  useEffect(() => {
    const urlQ = searchParams.get("q") ?? "";

    if (urlQ !== lastCommittedRef.current && urlQ !== value) {
      setValue(urlQ);
      lastCommittedRef.current = urlQ;
    }
  }, [searchParams, value]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const trimmed = value.trim();
      const currentQ = searchParams.get("q") ?? "";

      if (trimmed === currentQ) return;

      const params = new URLSearchParams(searchParams.toString());

      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }

      const next = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      lastCommittedRef.current = trimmed;
      router.replace(next, { scroll: false });
    }, 400);

    return () => clearTimeout(timeout);
  }, [value, pathname, router, searchParams]);

  return (
    <input
      name="q"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Hledat (název / kód / značka)..."
      autoComplete="off"
      spellCheck={false}
    />
  );
}
