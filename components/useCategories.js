'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { categories as fallbackCategories } from '@/lib/products';

export default function useCategories({ all = false } = {}) {
  const [items, setItems] = useState(
    process.env.NODE_ENV === 'production' ? [] : fallbackCategories
  );
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const my = ++seq.current;
    try {
      const res = await fetch(`/api/categories${all ? '?all=1' : ''}`, {
        cache: 'no-store'
      });
      if (my !== seq.current) return;
      const data = await res.json().catch(() => ({}));
      if (my !== seq.current) return;
      if (res.ok && Array.isArray(data.categories)) {
        setItems(data.categories);
      }
    } catch {
      // keep fallback
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, [all]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, reload: load };
}
