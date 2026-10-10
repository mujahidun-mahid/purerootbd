"use client";
import { useState } from "react";

/**
 * Provider logo with graceful fallback.
 * Drop files into public/images/payments/ as:
 *   bkash.png, nagad.png, bank.png
 * Until then (or if a file is missing) the brand badge/icon fallback shows.
 */
export default function PayLogo({ src, alt, fallback, whiteBg = false, large = false }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return fallback;
  const img = (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={large ? "pm-logo-img pm-logo-img-lg" : "pm-logo-img"}
      onError={() => setFailed(true)}
    />
  );
  if (whiteBg) {
    return (
      <span className="pm-logo-white" aria-hidden="true">
        {img}
      </span>
    );
  }
  return img;
}
