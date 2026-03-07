"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const paramsString = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(paramsString);

      const current = params.get("q") ?? "";
      const next = value.trim();

      if (next === current) return;

      if (next) params.set("q", next);
      else params.delete("q");

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [value, paramsString, pathname, router]);

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
      {isPending ? (
        <div className="small muted">Hledám...</div>
      ) : null}
    </div>
  );
}
