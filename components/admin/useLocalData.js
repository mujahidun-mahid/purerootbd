'use client';

import { useCallback, useEffect, useState } from 'react';

const storageKey = (key) => `pr-admin-${key}`;

const readStored = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(key));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeStored = (key, value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(value));
  } catch {
    /* storage full or unavailable — keep in-memory state */
  }
};

export const newLocalId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `loc-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

// localStorage-backed CRUD collection. Swap `save/remove` bodies for API calls later.
export function useLocalCollection(key, seed = []) {
  const [items, setItems] = useState(seed);

  useEffect(() => {
    const stored = readStored(key);
    if (stored && Array.isArray(stored)) setItems(stored);
  }, [key]);

  const commit = useCallback(
    (next) => {
      setItems(next);
      writeStored(key, next);
    },
    [key]
  );

  const save = useCallback(
    (item) => {
      const id = item.id || newLocalId();
      setItems((prev) => {
        const exists = prev.some((x) => x.id === id);
        const next = exists
          ? prev.map((x) => (x.id === id ? { ...x, ...item, id } : x))
          : [{ ...item, id, created_at: item.created_at || new Date().toISOString() }, ...prev];
        writeStored(key, next);
        return next;
      });
      return id;
    },
    [key]
  );

  const patch = useCallback(
    (id, data) => {
      setItems((prev) => {
        const next = prev.map((x) => (x.id === id ? { ...x, ...data } : x));
        writeStored(key, next);
        return next;
      });
    },
    [key]
  );

  const remove = useCallback(
    (id) => {
      setItems((prev) => {
        const next = prev.filter((x) => x.id !== id);
        writeStored(key, next);
        return next;
      });
    },
    [key]
  );

  const reset = useCallback(() => {
    if (typeof window !== 'undefined') window.localStorage.removeItem(storageKey(key));
    setItems(seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { items, save, patch, remove, reset };
}
