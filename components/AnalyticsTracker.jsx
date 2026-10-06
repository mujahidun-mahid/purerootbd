'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function getSession() {
  try {
    let id = localStorage.getItem('pr-session-id');
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('pr-session-id', id); }
    return id;
  } catch { return 'anonymous'; }
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  useEffect(() => {
    const send = () => fetch('/api/analytics/event', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event_type: 'page_view', path: pathname || '/', session_id: getSession(), referrer: document.referrer }) }).catch(() => {});
    send();
    const heartbeat = setInterval(() => fetch('/api/analytics/event', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event_type: 'heartbeat', path: pathname || '/', session_id: getSession() }) }).catch(() => {}), 15000);
    return () => clearInterval(heartbeat);
  }, [pathname]);
  return null;
}
