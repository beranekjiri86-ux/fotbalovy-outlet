import AdminProductEditClient from "./ui";

export default function AdminProductEditPage({ params }: { params: { id: string } }) {
  return (
    <main className="container" style={{ paddingTop: 16 }}>
      <h1 className="h1">Edit produktu</h1>
      <div className="card" style={{ marginTop: 12 }}>
        <AdminProductEditClient id={params.id} />
      </div>
    </main>
  );
}
