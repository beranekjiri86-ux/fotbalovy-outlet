import AdminProductsClient from "./ui";

export default function AdminProductsPage() {
  return (
    <main className="container" style={{ paddingTop: 16 }}>
      <h1 className="h1">Produkty</h1>
      <div className="card" style={{ marginTop: 12 }}>
        <AdminProductsClient />
      </div>
    </main>
  );
}
