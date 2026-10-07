'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function getSession() {
  if (typeof window === 'undefined') return 'anonymous';
  try {
    let id = localStorage.getItem('pr-session-id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('pr-session-id', id);
    }
    return id;
  } catch {
    return 'anonymous';
  }
}

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Exclude admin pages from visitor tracking
    if (!pathname || pathname.startsWith('/admin')) return;

    const sessionId = getSession();

    const send = (type = 'page_view') => {
      fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          event_type: type,
          path: pathname || '/',
          session_id: sessionId,
          referrer: typeof document !== 'undefined' ? document.referrer : ''
        })
      }).catch(() => {});
    };

    send('page_view');

    const heartbeat = setInterval(() => {
      send('heartbeat');
    }, 20000);

    return () => clearInterval(heartbeat);
  }, [pathname]);

  return null;
}
