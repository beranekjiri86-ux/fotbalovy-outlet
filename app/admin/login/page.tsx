"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.replace("/admin/produkty");
    router.refresh();
  }

  return (
    <main className="container" style={{ paddingTop: 24, maxWidth: 520 }}>
      <h1 className="h1">Admin login</h1>

      <div className="card" style={{ marginTop: 12, padding: 14, display: "grid", gap: 10 }}>
        {msg ? (
          <div style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 12 }}>
            {msg}
          </div>
        ) : null}

        <label style={{ display: "grid", gap: 6 }}>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@..." />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Heslo
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        <button type="button" className="btn btnPrimary" onClick={signIn} disabled={loading}>
          {loading ? "Přihlašuji…" : "Přihlásit"}
        </button>
      </div>
    </main>
  );
}
