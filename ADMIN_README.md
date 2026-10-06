# Pure Roots admin/backend architecture

This frontend is intentionally integration-ready rather than pretending to provide a production database.

Recommended server-side models:
- Product: id, slug, name, category, images, description, shortDescription, prices, packageSizes, stock, SKU, ingredients, nutrition, benefits, relatedProducts
- Category: id, slug, name, description
- Order: id, customer, items, totals, deliveryAddress, paymentMethod, paymentStatus, orderStatus, createdAt
- Review: id, customerId, productId, rating, text, verifiedPurchase, moderationStatus
- Coupon: code, type, value, limits, expiry
- Settings: deliveryCharges, paymentMerchantConfig, contact details

Payment architecture:
1. Create a server-side checkout session.
2. For bKash/Nagad, create the official gateway payment request server-side.
3. Redirect the browser to the gateway's secure URL.
4. Handle the official callback/webhook server-side.
5. Verify the transaction with the gateway before setting paymentStatus=Paid.
6. Only then set orderStatus=Confirmed and redirect to /order-confirmation.
7. Store merchant credentials only in server environment variables/secrets.

Never put merchant API secrets in client components and never mark online payments successful based only on a browser redirect.
