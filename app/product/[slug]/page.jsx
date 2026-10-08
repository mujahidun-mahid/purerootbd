"use client";
import {notFound} from "next/navigation";
import {useEffect, useState} from "react";
import Link from "next/link";
import {Heart,Share2,Minus,Plus} from "lucide-react";
import {useProducts} from "@/components/useProducts";
import {useStore} from "@/components/StoreProvider";
import ProductGrid from "@/components/ProductGrid";

export default function ProductPage({params}){
  const {products,loading}=useProducts();
  const p=products.find(x=>x.slug===params.slug);
  const {add,wishlist,toggleWish}=useStore();
  const defaultSize=(pkgList)=>pkgList&&pkgList.length?pkgList[Math.min(1,pkgList.length-1)].size:"";
  const [size,setSize]=useState(()=>defaultSize(p?.packages));
  const [qty,setQty]=useState(1);

  useEffect(()=>{
    if(p?.packages?.length&&!p.packages.some(x=>x.size===size)) setSize(defaultSize(p.packages));
  },[p]);

  if(!p){
    if(loading) return <div className="container"><div className="empty">Loading product…</div></div>;
    notFound();
  }

  const pkg=p.packages.find(x=>x.size===size)||p.packages[0];
  const related=products.filter(x=>p.related?.includes(x.slug));
  const orbClass=p.category==="honey"?"honey":p.category==="spices"?"spice":(p.category||"").includes("seed")||p.category==="seeds"?"seed":"nut";

  return <>
    <div className="container">
      <div className="detail">
        <div>
          <div className="gallery-main">
            {p.image
              ? <img className="gallery-photo" src={p.image} alt={p.name}/>
              : <div className={`orb ${orbClass}`}/>}
          </div>
          <div className="thumbs">
            <div className="thumb">Front</div>
            <div className="thumb">Detail</div>
            <div className="thumb">Pack</div>
          </div>
        </div>
        <div>
          <div className="kicker">{p.category}</div>
          <h1 className="serif">{p.name}</h1>
          <div className="rating">★ {p.rating} · {p.reviews} customer reviews</div>
          <div className="detail-price">৳{pkg.price.toLocaleString()} {p.oldPrice&&<span className="old">৳{p.oldPrice.toLocaleString()}</span>}</div>
          <p className="muted">{p.short}</p>
          <div style={{margin:"22px 0"}}>
            <label>Package size</label>
            <div className="options">
              {p.packages.map(o=><button key={o.size} className={`option ${size===o.size?"active":""}`} onClick={()=>setSize(o.size)}>{o.size} · ৳{o.price}</button>)}
            </div>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14}}>
            <label style={{margin:0}}>Quantity</label>
            <div className="qty">
              <button onClick={()=>setQty(Math.max(1,qty-1))}><Minus size={15}/></button>
              <span>{qty}</span>
              <button onClick={()=>setQty(qty+1)}><Plus size={15}/></button>
            </div>
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <button className="btn btn-primary" onClick={()=>add(p,size,qty)}>Add to Cart</button>
            <Link className="btn btn-gold" href="/checkout" onClick={()=>add(p,size,qty)}>Buy Now</Link>
            <button className="iconbtn" onClick={()=>toggleWish(p.slug)}><Heart fill={wishlist.includes(p.slug)?"currentColor":"none"}/></button>
            <button className="iconbtn"><Share2/></button>
          </div>
          <div className="notice" style={{marginTop:20}}>Delivery in Bangladesh · Delivery charge calculated at checkout.</div>
        </div>
      </div>

      <div className="tabs">
        <div className="tab"><h3>Product Description</h3><p className="muted">{p.description}</p></div>
        <div className="tab"><h3>Nutrition Information</h3><p className="muted">{p.nutrition}</p></div>
        <div className="tab"><h3>Ingredients</h3><p className="muted">{p.ingredients}</p></div>
        <div className="tab"><h3>How to Use / Serving Suggestions</h3><p className="muted">{p.use}</p></div>
        <div className="tab"><h3>Storage Instructions</h3><p className="muted">{p.storage}</p></div>
        <div className="tab"><h3>Customer Reviews</h3><p className="muted">Demo review structure only. Replace with verified customer reviews before publishing.</p></div>
      </div>

      {related.length>0&&<section className="section"><div className="section-head"><h2>Related Products</h2></div><ProductGrid products={related}/></section>}
    </div>
  </>;
}
