import { Database, Package } from 'lucide-react';
import { money } from '../constants';
import { products as catalogProducts } from '@/lib/products';

const categoryArt = {
  nuts: '🥜',
  seeds: '🌱',
  spices: '🌿',
  honey: '🍯'
};

export default function CatalogTab() {
  return (
    <div className="admin-content">
      <div className="admin-live-banner">
        <div>
          <Package size={16} /> Storefront Product Catalog
        </div>
        <span>
          {catalogProducts.length} Active Nutrition Products across 7 Categories
        </span>
      </div>

      <div className="catalog-grid">
        {catalogProducts.map((p) => (
          <div className="catalog-card" key={p.id}>
            <div className="catalog-art">{categoryArt[p.category] || '✨'}</div>
            <div>
              <strong>{p.name}</strong>
              <span>
                {money(p.price)} • {(p.packages || []).map((x) => x.size).join(', ')}
              </span>
            </div>
            <b>Active</b>
          </div>
        ))}
      </div>

      <div className="admin-note">
        <Database size={18} />
        <div>
          <strong>Catalog Architecture</strong>
          <p>
            Products are powered by the Pure Roots product registry. All order purchases, customer
            data, and status changes are dynamically saved to Supabase in real time.
          </p>
        </div>
      </div>
    </div>
  );
}
