// Seed data for admin domains that have no backend yet.
// All collections persist to localStorage via useLocalCollection and are
// structured to map 1:1 onto future API endpoints (save/patch/remove).

export const seedSuppliers = [
  { id: 'sup-1', name: 'Rajshahi Agro Traders', contact: 'Kamrul Hasan', phone: '+880 1711-203944', email: 'sales@rajshahiagro.com', products: 'Walnuts, Cashew Nuts', city: 'Rajshahi', rating: 4.6, active: true },
  { id: 'sup-2', name: 'Dinajpur Organic Collective', contact: 'Nusrat Jahan', phone: '+880 1812-556781', email: 'hello@dinajpurorganic.bd', products: 'Pumpkin Seeds, Flax Seeds', city: 'Dinajpur', rating: 4.8, active: true },
  { id: 'sup-3', name: 'Sylhet Spice House', contact: 'Abdul Malek', phone: '+880 1913-448210', email: 'orders@sylhetspice.bd', products: 'Turmeric, Cinnamon, Cardamom', city: 'Sylhet', rating: 4.3, active: true },
  { id: 'sup-4', name: 'Chattogram Import Co.', contact: 'Rezaul Karim', phone: '+880 1521-770093', email: 'import@ctgtrading.com', products: 'Almonds, Pistachios', city: 'Chattogram', rating: 4.1, active: false }
];

export const seedPurchaseOrders = [
  { id: 'po-1', number: 'PO-2026-004', supplier: 'Rajshahi Agro Traders', items: 6, total: 48500, status: 'Received', ordered_at: '2026-09-18' },
  { id: 'po-2', number: 'PO-2026-005', supplier: 'Dinajpur Organic Collective', items: 4, total: 32750, status: 'Sent', ordered_at: '2026-09-27' },
  { id: 'po-3', number: 'PO-2026-006', supplier: 'Sylhet Spice House', items: 9, total: 21400, status: 'Draft', ordered_at: '2026-10-03' }
];

export const seedWarehouses = [
  { id: 'wh-1', name: 'Main Store — Sonapur', location: 'Noakhali', manager: 'Fahim Chodna', capacity: 1200, used: 760, active: true },
  { id: 'wh-2', name: 'Dhaka Micro-Hub', location: 'Mirpur, Dhaka', manager: 'Sadia Rahman', capacity: 500, used: 315, active: true },
  { id: 'wh-3', name: 'Chattogram Overflow', location: 'Agrabad, Chattogram', manager: 'Imran Hossain', capacity: 400, used: 90, active: false }
];

export const seedBatches = [
  { id: 'bat-1', product: 'Organic Turmeric', batch: 'TC-0912', qty: 180, expiry: '2027-03-14', warehouse: 'Main Store — Sonapur' },
  { id: 'bat-2', product: 'Chia Seeds', batch: 'CS-0874', qty: 60, expiry: '2026-11-30', warehouse: 'Dhaka Micro-Hub' },
  { id: 'bat-3', product: 'Natural Honey', batch: 'NH-0661', qty: 45, expiry: '2026-10-21', warehouse: 'Main Store — Sonapur' },
  { id: 'bat-4', product: 'Walnuts', batch: 'WN-1102', qty: 120, expiry: '2027-06-08', warehouse: 'Main Store — Sonapur' }
];

export const seedCoupons = [
  { id: 'cp-1', code: 'WELCOME10', type: 'percent', value: 10, minSpend: 500, limit: 500, used: 142, active: true, expires: '2026-12-31' },
  { id: 'cp-2', code: 'EIDSALE', type: 'flat', value: 150, minSpend: 2500, limit: 200, used: 87, active: true, expires: '2026-11-15' },
  { id: 'cp-3', code: 'FREEDEL', type: 'free-delivery', value: 0, minSpend: 1500, limit: 1000, used: 305, active: false, expires: '2026-09-30' }
];

export const seedTiers = [
  { id: 'tier-1', name: 'Seedling', minSpend: 0, pointsRate: 1, perks: 'Birthday voucher 100৳', members: 0 },
  { id: 'tier-2', name: 'Grower', minSpend: 5000, pointsRate: 1.5, perks: 'Free delivery over 1000৳', members: 0 },
  { id: 'tier-3', name: 'Harvester', minSpend: 15000, pointsRate: 2, perks: 'Early access + 2% cashback', members: 0 }
];

export const seedTickets = [
  { id: 'tk-1', subject: 'Order PR-103 arrived with torn pouch', customer: 'Tanvir Ahmed', order: 'PR-103', priority: 'High', status: 'Open', created_at: '2026-10-06' },
  { id: 'tk-2', subject: 'Change delivery address to Dhanmondi', customer: 'Farhana Islam', order: 'PR-101', priority: 'Normal', status: 'Pending', created_at: '2026-10-07' },
  { id: 'tk-3', subject: 'Refund for cancelled honey order', customer: 'Shakib Rahman', order: 'PR-099', priority: 'Low', status: 'Resolved', created_at: '2026-10-04' }
];

export const seedSlots = [
  { id: 'sl-1', day: 'Every day', window: '09:00 – 12:00', fee: 80, capacity: 20, active: true },
  { id: 'sl-2', day: 'Every day', window: '14:00 – 18:00', fee: 80, capacity: 25, active: true },
  { id: 'sl-3', day: 'Friday', window: '16:00 – 20:00', fee: 100, capacity: 15, active: false }
];

export const seedZones = [
  { id: 'zn-1', name: 'Inside Noakhali', areas: 'Sonapur, Maijdee, Chandpur Road', fee: 40, eta: 'Same day', active: true },
  { id: 'zn-2', name: 'Dhaka Metro', areas: 'Mirpur, Uttara, Gulshan, Dhanmondi', fee: 80, eta: '1–2 days', active: true },
  { id: 'zn-3', name: 'Rest of Bangladesh', areas: 'All other districts (courier)', fee: 120, eta: '2–4 days', active: true }
];

export const seedDrivers = [
  { id: 'dr-1', name: 'Jahangir Alam', phone: '+880 1712-334455', vehicle: 'Motorbike · DHA-11-4582', zone: 'Inside Noakhali', status: 'On Duty', active: true },
  { id: 'dr-2', name: 'Mizanur Rahman', phone: '+880 1813-998877', vehicle: 'Van · CHA-12-9031', zone: 'Dhaka Metro', status: 'On Duty', active: true },
  { id: 'dr-3', name: 'Salma Khatun', phone: '+880 1914-220011', vehicle: 'Motorbike · THA-08-7742', zone: 'Rest of Bangladesh', status: 'Off', active: false }
];

export const seedReturns = [
  { id: 'rt-1', order: 'PR-097', customer: 'Rifat Sultana', reason: 'Damaged seal', amount: 640, status: 'Refunded', created_at: '2026-10-01' },
  { id: 'rt-2', order: 'PR-104', customer: 'Arif Hossain', reason: 'Wrong item delivered', amount: 890, status: 'Approved', created_at: '2026-10-06' }
];

export const seedRoles = [
  { id: 'role-1', name: 'Owner', users: 1, permissions: { orders: 'manage', catalog: 'manage', settings: 'manage', refunds: 'manage', reports: 'view' } },
  { id: 'role-2', name: 'Store Manager', users: 0, permissions: { orders: 'manage', catalog: 'manage', settings: 'none', refunds: 'view', reports: 'view' } },
  { id: 'role-3', name: 'Support Agent', users: 0, permissions: { orders: 'view', catalog: 'none', settings: 'none', refunds: 'request', reports: 'none' } },
  { id: 'role-4', name: 'Viewer', users: 0, permissions: { orders: 'view', catalog: 'view', settings: 'none', refunds: 'none', reports: 'view' } }
];

export const seedIntegrations = [
  { id: 'in-1', name: 'Supabase (Database & Storage)', key: 'supabase', connected: true, locked: true, desc: 'PostgreSQL + product-images storage bucket' },
  { id: 'in-2', name: 'Vercel Hosting', key: 'vercel', connected: true, locked: true, desc: 'Frontend deployments & edge functions' },
  { id: 'in-3', name: 'Analytics Events', key: 'analytics', connected: true, locked: false, desc: 'Storefront page & cart events' },
  { id: 'in-4', name: 'bKash Merchant', key: 'bkash', connected: false, locked: false, desc: 'Online payment collection' },
  { id: 'in-5', name: 'SMS Notifications', key: 'sms', connected: false, locked: false, desc: 'Order status SMS to customers' },
  { id: 'in-6', name: 'Courier Partner API', key: 'courier', connected: false, locked: false, desc: 'Automated shipping labels & tracking' }
];
