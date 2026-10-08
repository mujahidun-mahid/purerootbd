'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function useAdminProducts(password) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const seq = useRef(0);

  const auth = useCallback(
    () => ({ 'x-admin-password': password || '', 'content-type': 'application/json' }),
    [password]
  );

  const load = useCallback(async () => {
    const my = ++seq.current;
    try {
      const res = await fetch('/api/admin/products', { headers: auth(), cache: 'no-store' });
      if (my !== seq.current) return;
      if (res.status === 401) {
        setItems([]);
        setError('Session expired. Please sign in again.');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (my !== seq.current) return;
      if (!res.ok) throw new Error(data.error || 'Could not load products.');
      setItems(data.products || []);
      setError('');
    } catch (e) {
      if (my === seq.current) setError(e.message);
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (payload, isNew) => {
      setSaving(true);
      setError('');
      try {
        const res = await fetch('/api/admin/products', {
          method: isNew ? 'POST' : 'PATCH',
          headers: auth(),
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not save product.');
        await load();
        return { ok: true, product: data.product };
      } catch (e) {
        setError(e.message);
        return { ok: false, error: e.message };
      } finally {
        setSaving(false);
      }
    },
    [auth, load]
  );

  const remove = useCallback(
    async (id) => {
      setSaving(true);
      setError('');
      try {
        const res = await fetch('/api/admin/products', {
          method: 'DELETE',
          headers: auth(),
          body: JSON.stringify({ id })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not delete product.');
        await load();
        return { ok: true };
      } catch (e) {
        setError(e.message);
        return { ok: false, error: e.message };
      } finally {
        setSaving(false);
      }
    },
    [auth, load]
  );

  return { items, loading, saving, error, setError, reload: load, save, remove };
}
