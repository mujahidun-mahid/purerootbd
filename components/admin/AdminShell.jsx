import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Alert } from './ui';

export default function AdminShell({
  tab,
  onSelect,
  connected,
  lastSync,
  loading,
  onRefresh,
  onLogout,
  navOpen,
  onToggleNav,
  onCloseNav,
  message,
  onDismissMessage,
  error,
  onDismissError,
  modal,
  children
}) {
  return (
    <main className="admin-app">
      <Sidebar
        tab={tab}
        connected={connected}
        onSelect={onSelect}
        onLogout={onLogout}
        open={navOpen}
        onClose={onCloseNav}
      />

      <section className="admin-main">
        <TopBar
          tab={tab}
          connected={connected}
          lastSync={lastSync}
          loading={loading}
          onRefresh={onRefresh}
          onMenu={onToggleNav}
        />

        {message && <Alert onClose={onDismissMessage}>{message}</Alert>}
        {error && (
          <Alert type="error" onClose={onDismissError}>
            {error}
          </Alert>
        )}

        {children}
      </section>

      {modal}
    </main>
  );
}
