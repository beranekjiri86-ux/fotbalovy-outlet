"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

  const [selectedIndex, setSelectedIndex] = useState(0);

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [safeImages]);

  if (!safeImages.length) {
    return (
      <div className="card small muted" style={{ marginTop: 12, padding: 12 }}>
        Bez fotky.
      </div>
    );
  }

  const selected = safeImages[selectedIndex] ?? safeImages[0];

  function goPrev() {
    setSelectedIndex((prev) =>
      prev === 0 ? safeImages.length - 1 : prev - 1
    );
  }

  function goNext() {
    setSelectedIndex((prev) =>
      prev === safeImages.length - 1 ? 0 : prev + 1
    );
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.targetTouches[0].clientX;
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchEndX.current = e.targetTouches[0].clientX;
  }

  function handleTouchEnd() {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;

    if (distance > 50) {
      goNext();
    }

    if (distance < -50) {
      goPrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  }

  return (
    <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
      <div
        className="productGalleryMain productGalleryMainWithNav"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {safeImages.length > 1 ? (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="productGalleryNav productGalleryNavLeft"
              aria-label="Předchozí fotka"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={goNext}
              className="productGalleryNav productGalleryNavRight"
              aria-label="Další fotka"
            >
              ›
            </button>
          </>
        ) : null}

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
            const active = index === selectedIndex;

            return (
              <button
                key={`${url}-${index}`}
                type="button"
                onClick={() => setSelectedIndex(index)}
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
