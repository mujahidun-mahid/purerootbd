"use client";
import { useEffect, useState } from "react";

export default function ProductReviews({ slug }) {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [form, setForm] = useState({ name: "", rating: "5", body: "" });
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/products/${encodeURIComponent(slug)}/reviews`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Unable to load reviews."))))
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
  return (
    <section className="tab product-reviews" id="customer-reviews">
      <h2>Customer Reviews</h2>
      {reviews.length > 0 && <p className="muted">★ {average.toFixed(1)} out of 5 · {reviews.length} approved {reviews.length === 1 ? "review" : "reviews"}</p>}
      {loadingReviews ? <p className="muted">Loading reviews…</p> : reviews.length ? reviews.map((review) => (
        <article className="review-item" key={review.id}>
          <strong>{review.name}</strong><span className="rating"> · {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
          <p className="muted">{review.body}</p><small className="muted">{new Date(review.created_at).toLocaleDateString()}</small>
        </article>
      )) : <p className="muted">No approved reviews yet. Be the first to share your experience.</p>}
      <h3>Write a Review</h3>
      <form className="form-grid" onSubmit={submitReview}>
        <div><label htmlFor="review-name">Name</label><input id="review-name" className="input" maxLength={80} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label htmlFor="review-rating">Rating</label><select id="review-rating" className="input" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? "" : "s"}</option>)}</select></div>
        <div className="full"><label htmlFor="review-body">Your Review</label><textarea id="review-body" className="input" rows={4} maxLength={2000} required value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
        <div className="full"><button className="btn btn-primary" disabled={sending}>{sending ? "Submitting…" : "Submit Review"}</button>{message && <p className="muted" role="status">{message}</p>}</div>
      </form>
    </section>
  );
}
