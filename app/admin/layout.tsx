"use client";

import { supabase } from "@/lib/supabaseClient";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  return (
    <div>
      {/* ADMIN HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 20px",
          borderBottom: "1px solid var(--border)",
          background: "#0e1522",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ fontWeight: 800 }}>Admin</div>

        <button
          onClick={logout}
          className="btn"
          style={{
            padding: "6px 12px",
            borderRadius: 8,
          }}
        >
          Odhlásit
        </button>
      </div>

      {/* ADMIN CONTENT */}
      <div>{children}</div>
    </div>
  );
}
