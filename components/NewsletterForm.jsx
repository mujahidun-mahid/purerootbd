"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function submit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
    setEmail("");
  }

  if (done) {
    return <p className="muted" style={{ marginTop: 12 }}>Thanks! You’re subscribed.</p>;
  }

  return (
    <form onSubmit={submit}>
      <input
        className="input"
        placeholder="Your email address"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button className="btn btn-gold" type="submit">Subscribe</button>
    </form>
  );
}
