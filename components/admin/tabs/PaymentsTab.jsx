import { useEffect, useRef, useState } from 'react';
import { Save } from 'lucide-react';
import { Alert, Field, Panel, Toggle, KV } from '../ui';
import { money } from '../constants';
import { SETTINGS_DEFAULTS } from '@/lib/site-defaults';

const PAYMENT_KEYS = [
  'payment_cod_enabled',
  'payment_bkash_enabled',
  'payment_nagad_enabled',
  'payment_bank_enabled',
  'payment_instructions',
  'tax_enabled',
  'tax_rate',
  'delivery_fee_default',
  'free_delivery_threshold'
];

const METHOD_LABELS = [
  ['payment_cod_enabled', 'Cash on Delivery', 'Collected in cash when the order arrives'],
  ['payment_bkash_enabled', 'bKash', 'Customer sends payment to the merchant bKash number'],
  ['payment_nagad_enabled', 'Nagad', 'Customer sends payment to the merchant Nagad number'],
  ['payment_bank_enabled', 'Bank Transfer', 'Manual transfer into the store bank account']
];

const readForm = (settings) => {
  const merged = { ...SETTINGS_DEFAULTS, ...(settings || {}) };
  return Object.fromEntries(
    PAYMENT_KEYS.map((key) => [key, merged[key] ?? SETTINGS_DEFAULTS[key] ?? ''])
  );
};

export default function PaymentsTab({ password, data, saveSetting }) {
  const [form, setForm] = useState(() => readForm(data?.siteSettings));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const touchedRef = useRef(false);

  useEffect(() => {
    if (touchedRef.current) return;
    setForm(readForm(data?.siteSettings));
  }, [data?.siteSettings]);

  const update = (key, value) => {
    touchedRef.current = true;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function saveAll() {
    setSaving(true);
    setNotice(null);
    try {
      await saveSetting(Object.entries(form));
      setNotice({ type: 'success', text: 'Payment settings saved. Storefront updated instantly.' });
    } catch (e) {
      setNotice({ type: 'error', text: e?.message || 'Could not save payment settings.' });
    } finally {
      setSaving(false);
    }
  }

  const subtotal = 1500;
  const fee = Number(form.delivery_fee_default || 0);
  const threshold = Number(form.free_delivery_threshold || 0);
  const delivery = threshold > 0 && subtotal >= threshold ? 0 : fee;
  const taxRate = Number(form.tax_rate || 0);
  const tax = form.tax_enabled === 'true' ? (subtotal * taxRate) / 100 : 0;
  const total = subtotal + delivery + tax;

  const enabledMethods = METHOD_LABELS.filter(([key]) => form[key] === 'true').map(
    ([, label]) => label
  );

  const previewItems = [
    ['Subtotal', money(subtotal)],
    ['Delivery', delivery === 0 ? `Free — over ${money(threshold)}` : money(delivery)],
    [
      form.tax_enabled === 'true' ? `Tax (${taxRate}%)` : 'Tax',
      form.tax_enabled === 'true' ? money(tax) : 'Not applied'
    ],
    ['Total', money(total)]
  ];

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <div>
          <div className="admin-kicker">Checkout</div>
          <h2>Payments & Taxes</h2>
        </div>
        <div className="admin-toolbar-right">
          <button
            type="button"
            className="btn btn-primary"
            onClick={saveAll}
            disabled={saving}
          >
            <Save size={15} /> {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>

      {notice && (
        <Alert type={notice.type} onClose={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      <Panel kicker="Payment Methods" title="Accepted at checkout">
        {METHOD_LABELS.map(([key, label, desc]) => (
          <div className="toggle-row" key={key}>
            <div>
              <strong>{label}</strong>
              <span className="muted">{desc}</span>
            </div>
            <Toggle
              checked={form[key] === 'true'}
              onChange={(v) => update(key, v ? 'true' : 'false')}
              label={label}
            />
          </div>
        ))}
      </Panel>

      <Panel kicker="Checkout Rules" title="Delivery, tax & instructions">
        <Field label="Default delivery fee (৳)">
          <input
            className="input"
            type="number"
            min="0"
            value={form.delivery_fee_default}
            onChange={(e) => update('delivery_fee_default', e.target.value)}
          />
        </Field>
        <Field label="Free delivery threshold (৳)">
          <input
            className="input"
            type="number"
            min="0"
            value={form.free_delivery_threshold}
            onChange={(e) => update('free_delivery_threshold', e.target.value)}
          />
        </Field>
        <div className="full">
          <label>Apply VAT/tax at checkout</label>
          <Toggle
            checked={form.tax_enabled === 'true'}
            onChange={(v) => update('tax_enabled', v ? 'true' : 'false')}
            label="Apply VAT/tax at checkout"
          />
        </div>
        <Field label="Tax rate (%)" hint="full">
          <input
            className="input"
            type="number"
            step="0.1"
            min="0"
            disabled={form.tax_enabled !== 'true'}
            value={form.tax_rate}
            onChange={(e) => update('tax_rate', e.target.value)}
          />
        </Field>
        <Field label="Payment instructions note (shown at checkout)" hint="full">
          <textarea
            className="input textarea"
            rows="3"
            value={form.payment_instructions}
            placeholder="e.g. Send the transfer receipt to 01XXX-XXXXXX"
            onChange={(e) => update('payment_instructions', e.target.value)}
          />
        </Field>
      </Panel>

      <Panel kicker="Live Preview" title="Worked example · ৳1,500 basket">
        <KV items={previewItems} />
        <KV
          items={[
            [
              'Methods shown at checkout',
              enabledMethods.length ? enabledMethods.join(' · ') : 'None enabled'
            ]
          ]}
        />
      </Panel>
    </div>
  );
}
