'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SETTINGS_DEFAULTS } from '@/lib/site-defaults';

const SiteSettingsContext = createContext(null);

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  return ctx ?? { settings: SETTINGS_DEFAULTS, refresh: () => {}, ready: false };
}

export default function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(SETTINGS_DEFAULTS);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const debounceRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/site-settings', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data && typeof data === 'object') {
        setSettings({ ...SETTINGS_DEFAULTS, ...data });
        setReady(true);
      }
    } catch {
      /* network hiccup — keep last known settings */
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(refresh, 150);
  }, [refresh]);

  // Keep the browser tab title in sync with the admin-controlled meta title.
  useEffect(() => {
    if (isAdmin) return;
    const title = settings?.meta_title;
    if (title && document.title !== title) document.title = title;
  }, [settings?.meta_title, isAdmin]);

  // Admin manages its own realtime channel; the storefront needs its own.
  useEffect(() => {
    if (isAdmin) return undefined;

    let cancelled = false;
    let channel = null;
    let client = null;
    let pollId = null;

    refresh();

    const attachRealtime = async () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
      if (!url || !key) return;
      try {
        const { createClient } = await import('@supabase/supabase-js');
        if (cancelled) return;
        client = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false }
        });
        channel = client
          .channel('pure-roots-admin-events')
          .on('broadcast', { event: 'admin_data_changed' }, (msg) => {
            const table = msg?.payload?.table_name;
            if (!table || table === 'site_settings') scheduleRefresh();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () =>
            scheduleRefresh()
          )
          .subscribe();
      } catch {
        /* realtime unavailable — the polling fallback keeps data fresh */
      }
    };

    attachRealtime();

    // Safety net: refresh at most every 20s while the tab is visible.
    pollId = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') refresh();
    }, 20000);

    return () => {
      cancelled = true;
      if (pollId) clearInterval(pollId);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (channel && client) client.removeChannel(channel);
    };
  }, [isAdmin, refresh, scheduleRefresh]);

  const value = useMemo(() => ({ settings, refresh, ready }), [settings, refresh, ready]);

  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}
