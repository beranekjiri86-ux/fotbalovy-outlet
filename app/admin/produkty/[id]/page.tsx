import AdminProductEditClient from "./ui";

export default function AdminProductEditPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { copy?: string };
}) {
  const copyId =
    typeof searchParams?.copy === "string" && searchParams.copy.trim()
      ? searchParams.copy.trim()
      : null;

  return (
    <main className="container" style={{ paddingTop: 16 }}>
      <h1 className="h1">
        {params.id === "new" ? "Nový produkt" : "Edit produktu"}
      </h1>

      <div className="card" style={{ marginTop: 12 }}>
        <AdminProductEditClient id={params.id} copyId={copyId} />
      </div>
    </main>
  );
}
