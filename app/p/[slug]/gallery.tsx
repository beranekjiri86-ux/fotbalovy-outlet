"use client";

import { useMemo, useState } from "react";

export default function ProductGallery({
  name,
  images,
}: {
  name: string;
  images: string[];
}) {
  const safeImages = useMemo(
    () => images.filter((x) => typeof x === "string" && x.trim().length > 0),
    [images]
  );

  const [selected, setSelected] = useState(safeImages[0] ?? null);

  if (!safeImages.length || !selected) {
    return (
      <div className="card small muted" style={{ marginTop: 12, padding: 12 }}>
        Bez fotky.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
      <div className="productGalleryMain">
        <img
          src={selected}
          alt={name}
          loading="eager"
          className="productGalleryMainImage"
        />
      </div>

      {safeImages.length > 1 ? (
        <div className="productGalleryThumbs">
          {safeImages.map((url, index) => {
            const active = url === selected;

            return (
              <button
                key={`${url}-${index}`}
                type="button"
                onClick={() => setSelected(url)}
                className={`productGalleryThumb${active ? " isActive" : ""}`}
                aria-label={`Zobrazit fotku ${index + 1}`}
              >
                <img
                  src={url}
                  alt={`${name} ${index + 1}`}
                  loading="lazy"
                  className="productGalleryThumbImage"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
