import Link from "next/link";

export default function AdminHome() {
  return (
    <main className="container" style={{ paddingTop: 16 }}>
      <h1 className="h1">Admin</h1>
      <div className="card" style={{ marginTop: 12 }}>
        <p>
          <Link href="/admin/produkty">Správa produktů</Link>
        </p>
      </div>
    </main>
  );
}
