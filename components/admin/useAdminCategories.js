'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function useAdminCategories(password) {
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
      const res = await fetch('/api/admin/categories', { headers: auth(), cache: 'no-store' });
      if (my !== seq.current) return;
      if (res.status === 401) {
        setItems([]);
        setError('Session expired. Please sign in again.');
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (my !== seq.current) return;
      if (!res.ok) throw new Error(data.error || 'Could not load categories.');
      setItems(data.categories || []);
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
        const res = await fetch('/api/admin/categories', {
          method: isNew ? 'POST' : 'PATCH',
          headers: auth(),
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not save category.');
        await load();
        return { ok: true, category: data.category };
      } catch (e) {
        setError(e.message);
        return { ok: false, error: e.message };
      } finally {
        setSaving(false);
      }
    },
    [auth, load]
  );

  const patch = useCallback(
    async (slug, fields) => {
      setSaving(true);
      setError('');
      try {
        const res = await fetch('/api/admin/categories', {
          method: 'PATCH',
          headers: auth(),
          body: JSON.stringify({ slug, ...fields })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not update category.');
        await load();
        return { ok: true, category: data.category };
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
    async (slug) => {
      setSaving(true);
      setError('');
      try {
        const res = await fetch(`/api/admin/categories?slug=${encodeURIComponent(slug)}`, {
          method: 'DELETE',
          headers: auth()
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not delete category.');
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
        const res = await fetch('/api/admin/categories', {
          method: 'PUT',
          headers: auth(),
          body: JSON.stringify({ updates })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Could not reorder categories.');
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

  return { items, loading, saving, error, setError, reload: load, save, patch, remove, reorder };
}
