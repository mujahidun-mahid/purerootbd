import {
  Activity,
  BarChart3,
  Boxes,
  ClipboardList,
  CreditCard,
  FileText,
  Gift,
  Headphones,
  LayoutDashboard,
  LayoutGrid,
  MapPin,
  Package,
  Plug,
  RotateCcw,
  ScrollText,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Ticket,
  Truck,
  Users,
  Warehouse
} from 'lucide-react';
import { categories } from '@/lib/products';

export const statuses = [
  'Order Placed',
  'Awaiting Payment',
  'Awaiting Bank Transfer',
  'Order Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled'
];

export const tabs = [
  ['overview', 'Overview', LayoutDashboard],
  ['orders', 'Orders', ShoppingBag],
  ['customers', 'Customers', Users],
  ['catalog', 'Catalog', LayoutGrid],
  ['products', 'Products', Package],
  ['featured-categories', 'Featured Categories', Sparkles],
  ['analytics', 'Live Analytics', Activity],
  ['settings', 'Site Controls', Settings],
  ['reports', 'Reports', BarChart3],
  ['returns', 'Returns', RotateCcw],
  ['inventory', 'Inventory', Boxes],
  ['suppliers', 'Suppliers', Warehouse],
  ['fulfillment', 'Fulfillment', ClipboardList],
  ['delivery', 'Delivery', MapPin],
  ['drivers', 'Drivers', Truck],
  ['promotions', 'Promotions', Ticket],
  ['loyalty', 'Loyalty', Gift],
  ['support', 'Support', Headphones],
  ['payments', 'Payments & Taxes', CreditCard],
  ['roles', 'Roles', Shield],
  ['integrations', 'Integrations', Plug],
  ['audit', 'Audit Log', ScrollText],
  ['pages', 'Pages', FileText]
];

export const navSections = [
  { label: 'Overview', items: ['overview', 'reports', 'analytics'] },
  { label: 'Sales', items: ['orders', 'returns'] },
  { label: 'Catalog', items: ['products', 'catalog', 'featured-categories', 'inventory', 'suppliers'] },
  { label: 'Operations', items: ['fulfillment', 'delivery', 'drivers'] },
  { label: 'Marketing', items: ['promotions', 'loyalty'] },
  { label: 'Customers', items: ['customers', 'support'] },
  { label: 'Content', items: ['pages'] },
  { label: 'System', items: ['settings', 'payments', 'roles', 'integrations', 'audit'] }
];

export const sectionForTab = (id) => navSections.find((s) => s.items.includes(id));

export const catIcon = (slug) =>
  (categories.find((c) => c.slug === slug) || {}).icon || '📦';

export const money = (n) => `৳${Number(n || 0).toLocaleString('en-BD')}`;

export const phoneMask = (p) =>
  p ? `${String(p).slice(0, 3)}••••${String(p).slice(-4)}` : '—';

export const formatDate = (d) => new Date(d).toLocaleDateString('en-BD');

export const formatDateTime = (d) =>
  new Date(d).toLocaleString('en-BD', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
