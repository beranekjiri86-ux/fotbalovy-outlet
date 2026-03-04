import AdminProductEditClient from "./ui";

export default function AdminProductEditPage({ params }: { params: { id: string } }) {
  return (
    <main className="container">
      <h1>Edit produktu</h1>
      <AdminProductEditClient id={params.id} />
    </main>
  );
}
