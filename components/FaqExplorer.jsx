"use client";
import { useMemo, useState } from "react";
import { Search, ChevronDown } from "lucide-react";

export default function FaqExplorer({ groups }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(() => ["All", ...groups.map((g) => g.category)], [groups]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .filter((g) => category === "All" || g.category === category)
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (it) =>
            !q ||
            it.question.toLowerCase().includes(q) ||
            it.answer.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, query, category]);

  return (
    <>
      <div className="faq-search" role="search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          placeholder="Search questions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search frequently asked questions"
        />
      </div>

      {categories.length > 2 && (
        <div className="faq-pills" role="tablist" aria-label="Filter by topic">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              className={`faq-pill${category === c ? " active" : ""}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {visible.length ? (
        visible.map((g) => (
          <section key={g.category} className="faq-group" aria-label={g.category}>
            {groups.length > 1 && <h2 className="faq-group-title">{g.category}</h2>}
            {g.items.map((it, i) => (
              <details key={`${g.category}-${i}`} className="faq-item">
                <summary>
                  <span>{it.question}</span>
                  <ChevronDown size={18} aria-hidden="true" />
                </summary>
                <p>{it.answer}</p>
              </details>
            ))}
          </section>
        ))
      ) : (
        <div className="empty">
          <h3>No matching questions</h3>
          <p className="muted">Try a different keyword or topic.</p>
          <button
            type="button"
            className="btn btn-outline"
            style={{ marginTop: 12 }}
            onClick={() => { setQuery(""); setCategory("All"); }}
          >
            Clear Search
          </button>
        </div>
      )}
    </>
  );
}
