import { useState } from 'react';
import { Layers, Pencil, Plus, Shield, Star, Trash2, Users } from 'lucide-react';
import { Alert, ModalShell, Field, StatCard, EmptyState } from '../ui';
import { useLocalCollection } from '../useLocalData';
import { seedRoles } from '../mockData';

const AREAS = [
  ['orders', 'Orders'],
  ['catalog', 'Catalog'],
  ['settings', 'Settings'],
  ['refunds', 'Refunds'],
  ['reports', 'Reports']
];

const permissionOptions = (area) =>
  area === 'refunds'
    ? [
        ['none', 'None'],
        ['view', 'View'],
        ['manage', 'Manage'],
        ['request', 'Request']
      ]
    : [
        ['none', 'None'],
        ['view', 'View'],
        ['manage', 'Manage']
      ];

const blankRole = {
  name: '',
  users: 0,
  permissions: { orders: 'none', catalog: 'none', settings: 'none', refunds: 'none', reports: 'none' }
};

export default function RolesTab({ password }) {
  const { items: roles, save, patch, remove } = useLocalCollection('roles', seedRoles);
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(null);

  const totalUsers = roles.reduce((sum, r) => sum + Number(r.users || 0), 0);
  const customRoles = roles.filter((r) => !seedRoles.some((s) => s.id === r.id)).length;

  function openNew() {
    setNotice(null);
    setEditing({ ...blankRole, permissions: { ...blankRole.permissions } });
  }

  function openEdit(role) {
    setNotice(null);
    setEditing({ ...role, permissions: { ...role.permissions } });
  }

  function saveRole() {
    const name = String(editing.name || '').trim();
    if (!name) {
      setNotice({ type: 'error', text: 'Role name is required.' });
      return;
    }
    save({ ...editing, name, users: Number(editing.users || 0) });
    setNotice({ type: 'success', text: `Role ${name} saved.` });
    setEditing(null);
  }

  function deleteRole(role) {
    if (roles.length <= 1) {
      setNotice({ type: 'error', text: 'At least one role must remain.' });
      return;
    }
    if (!window.confirm(`Delete the ${role.name} role?`)) return;
    remove(role.id);
    setNotice({ type: 'success', text: `Role ${role.name} deleted.` });
  }

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <div>
          <div className="admin-kicker">Access Control</div>
          <h2>
            Roles & Permissions <em>({roles.length})</em>
          </h2>
        </div>
        <div className="admin-toolbar-right">
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Plus size={15} /> Add Role
          </button>
        </div>
      </div>

      <p className="admin-sub muted">
        Single-password authentication is active — roles define future team access. Matrix changes
        save locally until user management ships.
      </p>

      {notice && (
        <Alert type={notice.type} onClose={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      <div className="kpi-row">
        <StatCard label="Roles" value={roles.length} sub="Access profiles" icon={Shield} />
        <StatCard label="Admin Users" value={totalUsers} sub="Assigned to roles" icon={Users} tone="green" />
        <StatCard label="Permission Areas" value={AREAS.length} sub="Modules covered" icon={Layers} />
        <StatCard label="Custom Roles" value={customRoles} sub="Added beyond defaults" icon={Star} tone="gold" />
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table className="matrix">
            <thead>
              <tr>
                <th>Role</th>
                {AREAS.map(([area, label]) => (
                  <th key={area}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <td>
                    <strong>{role.name}</strong>
                    <div className="muted">
                      {Number(role.users || 0)} user{Number(role.users || 0) === 1 ? '' : 's'}
                    </div>
                    <div className="row-actions">
                      <button type="button" className="btn btn-sm" onClick={() => openEdit(role)}>
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm danger"
                        onClick={() => deleteRole(role)}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                  {AREAS.map(([area]) => (
                    <td key={area}>
                      <select
                        value={(role.permissions || {})[area] || 'none'}
                        onChange={(e) =>
                          patch(role.id, {
                            permissions: { ...role.permissions, [area]: e.target.value }
                          })
                        }
                      >
                        {permissionOptions(area).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!roles.length && <EmptyState text="No roles configured yet." icon={Shield} />}
      </div>

      {editing && (
        <ModalShell
          kicker="Role Editor"
          title={editing.name ? `Edit ${editing.name}` : 'New Role'}
          onClose={() => setEditing(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveRole}>
                Save Role
              </button>
            </>
          }
        >
          <Field label="Role Name">
            <input
              className="input"
              value={editing.name}
              placeholder="e.g. Warehouse Lead"
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
          </Field>
          <Field label="Users In Role">
            <input
              className="input"
              type="number"
              min="0"
              value={editing.users}
              onChange={(e) => setEditing({ ...editing, users: e.target.value })}
            />
          </Field>
          {AREAS.map(([area, label]) => (
            <Field key={area} label={label}>
              <select
                className="input"
                value={(editing.permissions || {})[area] || 'none'}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    permissions: { ...editing.permissions, [area]: e.target.value }
                  })
                }
              >
                {permissionOptions(area).map(([value, optionLabel]) => (
                  <option key={value} value={value}>
                    {optionLabel}
                  </option>
                ))}
              </select>
            </Field>
          ))}
        </ModalShell>
      )}
    </div>
  );
}
