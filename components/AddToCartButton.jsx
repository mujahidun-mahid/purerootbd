"use client";

import React, { useState } from "react";
import { ShoppingCart, Package } from "lucide-react";
import "./AddToCartButton.css";

export default function AddToCartButton({ onAdd, label = "Add to Cart", successLabel = "Added!" }) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (isAnimating) return;
    if (typeof onAdd === "function") onAdd();
    setIsAnimating(true);

    // Total animation loop duration before resetting state
    setTimeout(() => {
      setIsAnimating(false);
    }, 2000);
  };

  return (
    <button
      className={`atc-button ${isAnimating ? "animating" : ""}`}
      onClick={handleClick}
      disabled={isAnimating}
      aria-label="Add to Cart"
    >
      {/* 1. Default State: Text with ShoppingCart icon on the right */}
      <span className="atc-default-content">
        <span className="atc-label">{label}</span>
        <ShoppingCart className="atc-icon-default" size={18} />
      </span>

      {/* 3, 4 & 5. Cart Entrance, Package Drop, Jitter & Exit Track */}
      <span className="atc-animating-content">
        <span className="atc-cart-wrapper">
          <ShoppingCart className="atc-cart-icon" size={20} />
          <Package className="atc-package-icon" size={18} />
        </span>
      </span>

      {/* 6. Success Text Phase */}
      <span className="atc-success-content">
        <span className="atc-success-label">{successLabel}</span>
      </span>
    </button>
  );
}
