'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

function getCsrfTokenFromCookie() {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|; )csrf_token=([^;]+)/);
  return match ? match[1] : '';
}

export default function useAdminProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const seq = useRef(0);

  const auth = useCallback(() => {
    const csrf = getCsrfTokenFromCookie();
    const h = { 'content-type': 'application/json' };
    if (csrf) h['X-CSRF-Token'] = csrf;
    return h;
  }, []);

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

  const reorder = useCallback(
    async (updates) => {
      setSaving(true);
      setError('');
      try {
        const res = await fetch('/api/admin/products', {
          method: 'PUT',
          headers: auth(),
          body: JSON.stringify({ updates })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not reorder products.');
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

  return { items, loading, saving, error, setError, reload: load, save, remove, reorder };
}