import Link from "next/link";
export default function Footer(){return <footer className="footer"><div className="container footer-grid">
 <div><div className="logo" style={{color:"#fff"}}>PURE ROOTS<small style={{color:"#C9A45C"}}>NATURE'S NUTRITION</small></div><p style={{color:"#b9c9bd",fontSize:13,lineHeight:1.7}}>Premium nuts, seeds, spices, natural honey and nutrition-focused foods, carefully selected for everyday wellness.</p></div>
 <div><h3>Shop</h3><Link href="/shop">All Products</Link><Link href="/category/nuts">Nuts</Link><Link href="/category/seeds">Seeds</Link><Link href="/category/honey">Honey</Link></div>
 <div><h3>Categories</h3><Link href="/category/spices">Spices</Link><Link href="/category/nut-mixes">Nut Mixes</Link><Link href="/category/seed-mixes">Seed Mixes</Link><Link href="/category/superfoods">Superfoods</Link></div>
 <div><h3>Support</h3><Link href="/faq">FAQ</Link><Link href="/track-order">Track Order</Link><Link href="/shipping">Shipping</Link><Link href="/returns">Returns</Link></div>
 <div><h3>Company</h3><Link href="/about">About</Link><Link href="/reviews">Reviews</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
 </div><div className="container copyright">© Pure Roots. All rights reserved. · BDT (৳) · bKash · Nagad · Cash on Delivery · Bank Transfer</div></footer>}
