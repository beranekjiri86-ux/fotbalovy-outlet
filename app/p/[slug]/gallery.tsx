"use client";

import { useState } from "react";

export default function ProductGallery({
  name,
  images,
}: {
  name: string;
  images: string[];
}) {
  const [selected, setSelected] = useState(images[0] ?? null);

  if (!images.length || !selected) {
    return (
      <div className="card small muted" style={{ marginTop: 12, padding: 12 }}>
        Bez fotky.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
      
      {/* hlavní fotka */}
      <div
        className="card"
        style={{
          overflow: "hidden",
          borderRadius: 12,
        }}
      >
        <img
          src={selected}
          alt={name}
          loading="eager"
          style={{
            width: "100%",
            height: "520px",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>

      {/* galerie */}
      {images.length > 1 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
            gap: 8,
          }}
        >
          {images.map((url) => {
            const active = url === selected;

            return (
              <button
                key={url}
                type="button"
                onClick={() => setSelected(url)}
                style={{
                  padding: 0,
                  borderRadius: 10,
                  overflow: "hidden",
                  border: active
                    ? "2px solid var(--text)"
                    : "1px solid var(--border)",
                  cursor: "pointer",
                }}
              >
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "90px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
