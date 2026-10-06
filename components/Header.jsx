"use client";
import Link from "next/link"; import {Search,UserRound,Heart,ShoppingBag,Menu} from "lucide-react"; import {useStore} from "./StoreProvider";
export default function Header(){const {cart}=useStore();return <header className="header"><div className="container nav">
 <button className="iconbtn mobileMenu"><Menu size={20}/></button>
 <Link href="/" className="logo">PURE ROOTS<small>NATURE'S NUTRITION</small></Link>
 <nav className="navlinks"><Link href="/">Home</Link><Link href="/shop">Shop</Link><Link href="/category/nuts">Categories</Link><Link href="/about">About</Link><Link href="/reviews">Reviews</Link><Link href="/faq">FAQ</Link><Link href="/contact">Contact</Link></nav>
 <div className="actions"><Link className="iconbtn" href="/search"><Search size={19}/></Link><Link className="iconbtn" href="/account"><UserRound size={19}/></Link><Link className="iconbtn" href="/wishlist"><Heart size={19}/></Link><Link className="iconbtn" href="/cart"><ShoppingBag size={20}/>{cart.length>0&&<span className="badge">{cart.reduce((s,x)=>s+x.qty,0)}</span>}</Link></div>
 </div></header>}
