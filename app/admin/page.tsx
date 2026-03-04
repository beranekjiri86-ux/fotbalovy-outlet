import Link from "next/link";

export default function AdminHome() {
  return (
    <main className="container">
      <h1>Admin</h1>
      <p><Link href="/admin/produkty">Správa produktů</Link></p>
    </main>
  );
}
