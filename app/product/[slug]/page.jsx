"use client";
import {notFound, useRouter, useParams} from "next/navigation";
import {useEffect, useState} from "react";
import {Heart,Share2,Minus,Plus} from "lucide-react";
import {useProducts} from "@/components/useProducts";
import {useStore} from "@/components/StoreProvider";
import ProductGrid from "@/components/ProductGrid";

function ProductReviews({ slug }) {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [form, setForm] = useState({ name: "", rating: "5", body: "" });
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/products/${encodeURIComponent(slug)}/reviews`, { cache: "no-store" })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error("Unable to load reviews.")))
      .then((data) => { if (active) setReviews(data.reviews || []); })
      .catch(() => { if (active) setMessage("Reviews are temporarily unavailable."); })
      .finally(() => { if (active) setLoadingReviews(false); });
    return () => { active = false; };
  }, [slug]);

  async function submitReview(event) {
    event.preventDefault();
    setSending(true);
    setMessage("");
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(slug)}/reviews`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to submit your review.");
      setForm({ name: "", rating: "5", body: "" });
      setMessage("Thanks! Your review was submitted and is awaiting approval.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSending(false);
    }
  }

  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  return <section className="tab product-reviews" id="customer-reviews">
    <h2>Customer Reviews</h2>
    {reviews.length > 0 && <p className="muted">★ {average.toFixed(1)} out of 5 · {reviews.length} approved {reviews.length === 1 ? "review" : "reviews"}</p>}
    {loadingReviews ? <p className="muted">Loading reviews…</p> : reviews.length ? reviews.map((review) => <article className="review-item" key={review.id}>
      <strong>{review.name}</strong><span className="rating"> · {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
      <p className="muted">{review.body}</p><small className="muted">{new Date(review.created_at).toLocaleDateString()}</small>
    </article>) : <p className="muted">No approved reviews yet. Be the first to share your experience.</p>}
    <h3>Write a Review</h3>
    <form className="form-grid" onSubmit={submitReview}>
      <div><label htmlFor="review-name">Name</label><input id="review-name" className="input" maxLength={80} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></div>
      <div><label htmlFor="review-rating">Rating</label><select id="review-rating" className="input" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? "" : "s"}</option>)}</select></div>
      <div className="full"><label htmlFor="review-body">Your Review</label><textarea id="review-body" className="input" rows="4" maxLength={2000} required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}/></div>
      <div className="full"><button className="btn btn-primary" disabled={sending}>{sending ? "Submitting…" : "Submit Review"}</button>{message && <p className="muted" role="status">{message}</p>}</div>
    </form>
  </section>;
}

export default function ProductPage(){
  const router = useRouter();
  const routeParams = useParams();
  const slug = Array.isArray(routeParams?.slug) ? routeParams.slug[0] : routeParams?.slug || "";
  const {products,loading}=useProducts();
  const p=products.find(x=>x.slug===slug);
  const {add,buyNow,wishlist,toggleWish}=useStore();
  const defaultSize=(pkgList)=>pkgList&&pkgList.length?pkgList[Math.min(1,pkgList.length-1)].size:"";
  const [size,setSize]=useState(()=>defaultSize(p?.packages));
  const [qty,setQty]=useState(1);
  const [photo,setPhoto]=useState(0);

  useEffect(()=>{ setPhoto(0); },[slug]);

  const gallery = p && Array.isArray(p.images) && p.images.length ? p.images : (p?.image ? [p.image] : []);
  const current = gallery[Math.min(photo, Math.max(0, gallery.length - 1))];

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
            {current
              ? <img className="gallery-photo" src={current} alt={`${p.name} — photo ${Math.min(photo, gallery.length - 1) + 1}`}/>
              : <div className={`orb ${orbClass}`}/>}
          </div>
          {gallery.length > 1 && (
            <div className="thumbs" role="tablist" aria-label="Product photos">
              {gallery.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={i === photo}
                  aria-label={`View photo ${i + 1} of ${gallery.length}`}
                  className={`thumb thumb-btn${i === photo ? " active" : ""}`}
                  onClick={() => setPhoto(i)}
                >
                  <img src={src} alt=""/>
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <div className="kicker">{p.category}</div>
          <h1 className="serif">{p.name}</h1>
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
            <button className="btn btn-primary" onClick={()=>add(p,size,qty,current)}>Add to Cart</button>
            <button className="btn btn-gold" onClick={()=>{buyNow(p,size,qty,current);router.push("/checkout");}}>Buy Now</button>
            <button className="iconbtn" onClick={()=>toggleWish(p.slug)}><Heart fill={wishlist.includes(p.slug)?"currentColor":"none"}/></button>
            <button className="iconbtn"><Share2/></button>
          </div>
          <div className="notice" style={{marginTop:20}}>Delivery in Bangladesh · Delivery charge calculated at checkout.</div>
        </div>
      </div>

      <div className="tabs">
        <div className="tab"><h3>Product Description</h3><p className="muted">{p.description}</p></div>
        <ProductReviews slug={p.slug}/>
      </div>

      {related.length>0&&<section className="section"><div className="section-head"><h2>Related Products</h2></div><ProductGrid products={related}/></section>}
    </div>
  </>;
}
