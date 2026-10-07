import {
  Activity,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Users
} from 'lucide-react';

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
  ['catalog', 'Catalog', Package],
  ['analytics', 'Live Analytics', Activity],
  ['settings', 'Site Controls', Settings]
];

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
