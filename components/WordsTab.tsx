"use client";

import { useState } from "react";
import { DECK } from "@/lib/deck";
import type { StudyState } from "@/lib/srs";

const COLORS = {
  new: "#9aa3b2",
  due: "#e08a2e",
  learning: "#2f7fd0",
  mature: "#2f9e63",
};

function statusOf(
  study: StudyState,
  i: number,
  now: number
): { color: string; label: string } {
  const c = study.cards[i];
  if (!c) return { color: COLORS.new, label: "New" };
  if (c.due <= now) return { color: COLORS.due, label: "Due" };
  if (c.ivl >= 21) return { color: COLORS.mature, label: "Mature" };
  return { color: COLORS.learning, label: "Learning" };
}

export function WordsTab({ study }: { study: StudyState }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const now = Date.now();

  const query = q.trim().toLowerCase();
  const list = DECK.map((w, i) => ({ w, i })).filter(
    ({ w }) =>
      !query ||
      w.h.includes(q.trim()) ||
      w.t.toLowerCase().includes(query) ||
      w.g.toLowerCase().includes(query)
  );

  return (
    <div>
      <div className="card">
        <input
          className="search"
          placeholder="Search Hebrew, transliteration, or meaning…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
          <span style={{ color: COLORS.new }}>●</span> New&nbsp;&nbsp;
          <span style={{ color: COLORS.learning }}>●</span> Learning&nbsp;&nbsp;
          <span style={{ color: COLORS.mature }}>●</span> Mature&nbsp;&nbsp;
          <span style={{ color: COLORS.due }}>●</span> Due
        </div>
      </div>

      <div className="card" style={{ paddingTop: 6, paddingBottom: 6 }}>
        {list.length === 0 && (
          <p style={{ color: "var(--muted)", textAlign: "center" }}>
            No words match “{q.trim()}”.
          </p>
        )}
        {list.map(({ w, i }) => {
          const st = statusOf(study, i, now);
          const isOpen = open === i;
          return (
            <div key={i}>
              <div className="word-row" onClick={() => setOpen(isOpen ? null : i)}>
                <span
                  className="dot"
                  style={{ background: st.color }}
                  title={st.label}
                />
                <span className="word-he" lang="he">
                  {w.h}
                </span>
                <div className="word-meta">
                  <div className="word-t">{w.t}</div>
                  <div className="word-g">{w.g}</div>
                </div>
              </div>
              {isOpen && (
                <div className="word-detail">
                  {w.s && (
                    <>
                      Shoresh: <span lang="he">{w.s}</span>
                      <br />
                    </>
                  )}
                  {w.ref}
                  <br />
                  <a
                    href={`https://www.sefaria.org/${w.sef}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View verse on Sefaria ↗
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="footer">
        Hebrew text: Sefaria (sefaria.org) — public-domain Masoretic text.
        English glosses are original to this app.
      </p>
    </div>
  );
}
