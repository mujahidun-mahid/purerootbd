import { Activity, Boxes, Database, Plug, Shield } from 'lucide-react';
import { StatCard, Toggle } from '../ui';
import { useLocalCollection } from '../useLocalData';
import { seedIntegrations } from '../mockData';

export default function IntegrationsTab({ password, data }) {
  const health = data?.systemHealth || {};
  const { items: integrations, save } = useLocalCollection('integrations', seedIntegrations);

  const connected = integrations.filter((i) => i.connected).length;

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <div>
          <div className="admin-kicker">System</div>
          <h2>
            Integrations <em>({connected}/{integrations.length} connected)</em>
          </h2>
        </div>
        <div className="admin-toolbar-right muted">
          Toggle a service to connect or disconnect it.
        </div>
      </div>

      <div className="kpi-row">
        <StatCard
          label="Connected"
          value={`${connected}/${integrations.length}`}
          sub="Services linked"
          icon={Plug}
          tone="green"
        />
        <StatCard
          label="Database"
          value={health.database || 'Checking…'}
          sub="Primary data store"
          icon={Database}
        />
        <StatCard
          label="Orders Tracked"
          value={health.ordersCount ?? 0}
          sub="Rows in orders table"
          icon={Boxes}
        />
        <StatCard
          label="Events Tracked"
          value={health.eventsCount ?? 0}
          sub="Rows in site_events"
          icon={Activity}
          tone="gold"
        />
        <StatCard
          label="Service Role Key"
          value={health.isServiceRole ? 'Active' : 'Anon'}
          sub="Server credential mode"
          icon={Shield}
        />
      </div>

      <div className="card-grid">
        {integrations.map((item) => (
          <article className={`info-card${item.connected ? '' : ' off'}`} key={item.id}>
            <div className="ic-head">
              <div>
                <h4>{item.name}</h4>
                <div className="ic-sub">{item.desc}</div>
              </div>
              {item.locked ? (
                <span className="pill pill-on">Built-in</span>
              ) : (
                <Toggle
                  checked={Boolean(item.connected)}
                  onChange={(v) => save({ ...item, connected: v })}
                  label={item.name}
                />
              )}
            </div>
            <div className="ic-lines">
              <span>{item.connected ? 'Connected' : 'Not connected'}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
