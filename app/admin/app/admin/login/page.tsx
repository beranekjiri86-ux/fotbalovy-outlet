"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function login() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMsg(error.message);
      return;
    }

    router.push("/admin/produkty");
  }

  return (
    <main style={{ maxWidth: 420, margin: "60px auto" }}>
      <h1>Admin login</h1>

      <input
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="heslo"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={login}>Přihlásit</button>

      {msg && <p>{msg}</p>}
    </main>
  );
}
