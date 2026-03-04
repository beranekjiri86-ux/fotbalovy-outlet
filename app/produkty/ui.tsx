"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function FiltersClient() {
  const router = useRouter();
  const params = useSearchParams();

  function setFilter(name: string, value: string) {
    const next = new URLSearchParams(params.toString());

    if (next.get(name) === value) {
      next.delete(name);
    } else {
      next.set(name, value);
    }

    router.push("/produkty?" + next.toString());
  }

  return (
    <div className="card" style={{ display: "grid", gap: 12 }}>

      <details open>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>
          Značka
        </summary>

        <div className="filters">
          {["Nike","Adidas","Puma","New Balance"].map((b)=>(
            <button
              key={b}
              className="btn"
              onClick={()=>setFilter("brand",b)}
            >
              {b}
            </button>
          ))}
        </div>
      </details>


      <details>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>
          Typ kopaček
        </summary>

        <div className="filters">
          {["FG","AG","SG","TF","IC"].map((t)=>(
            <button
              key={t}
              className="btn"
              onClick={()=>setFilter("boot_type",t)}
            >
              {t}
            </button>
          ))}
        </div>
      </details>


      <details>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>
          Velikost EU
        </summary>

        <div className="filters">
          {[40,41,42,43,44,45,46].map((s)=>(
            <button
              key={s}
              className="btn"
              onClick={()=>setFilter("size_eu",String(s))}
            >
              {s}
            </button>
          ))}
        </div>
      </details>


      <details>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>
          Stav
        </summary>

        <div className="filters">
          {["nové","velmi dobré","dobré"].map((s)=>(
            <button
              key={s}
              className="btn"
              onClick={()=>setFilter("condition",s)}
            >
              {s}
            </button>
          ))}
        </div>
      </details>

    </div>
  );
}
