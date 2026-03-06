"use client";

import { useEffect, useMemo, useState } from "react";

type ProductGalleryProps = {
  name: string;
  images: string[];
};

export default function ProductGallery({
  name,
  images,
}: ProductGalleryProps) {
  const safeImages = useMemo(() => {
    if (!Array.isArray(images)) return [];
    return images.filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0
    );
  }, [images]);

  const [selected, setSelected] = useState<string | null>(safeImages[0] ?? null);

  useEffect(() => {
    setSelected(safeImages[0] ?? null);
  }, [safeImages]);

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
          onError={(e) => {
            e.currentTarget.src = "/no-photo.png";
          }}
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
                  onError={(e) => {
                    e.currentTarget.src = "/no-photo.png";
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
