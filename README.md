# Pure Roots — Multi-page Bangladesh E-commerce

A Next.js App Router starter implementing the requested Pure Roots architecture.

## Run
```bash
npm install
npm run dev
```
Then open http://localhost:3000.

## Routes
/, /shop, /category/[slug], /product/[slug], /cart, /checkout, /payment,
/order-confirmation, /about, /reviews, /faq, /contact, /shipping,
/returns, /privacy, /terms, /track-order, /search?q=, /wishlist, /account

## Important
- Product catalog lives in `lib/products.js`.
- Cart and wishlist persist in localStorage.
- Checkout validates required fields.
- COD can create a demo local order confirmation.
- bKash/Nagad are intentionally NOT faked: connect official merchant APIs/server callbacks as described in `ADMIN_README.md`.
- Reviews, tracking, account auth, contact delivery, and policies contain explicit integration/placeholders where a backend is required.
- Replace demo/placeholder review content and contact/policy details before production launch.
