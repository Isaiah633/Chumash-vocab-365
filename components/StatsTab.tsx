"use client";

import { DECK } from "@/lib/deck";
import {
  dayNumber,
  freshState,
  retention,
  type StudyState,
} from "@/lib/srs";
import type { StudyUpdater } from "@/lib/useStudyState";

interface Props {
  study: StudyState;
  update: StudyUpdater;
}

export function StatsTab({ study, update }: Props) {
  const now = Date.now();
  const cards = Object.values(study.cards);
  const introduced = cards.length;
  const mature = cards.filter((c) => c.ivl >= 21).length;
  const due = cards.filter((c) => c.due <= now).length;
  const ret = retention(study.gradeLog);

  function setNewPerDay(n: 3 | 6 | 10) {
    update((prev) => ({ ...prev, newPerDay: n }));
  }

  function resetAll() {
    if (
      window.confirm(
        "Reset all progress? This clears your streak, reviews, and settings on this account. This cannot be undone."
      )
    ) {
      update(() => freshState());
    }
  }

  return (
    <div>
      <div className="card">
        <div className="section-title">Your progress</div>
        <div className="stat-row">
          <span>Day</span>
          <b>{dayNumber(study.started)}</b>
        </div>
        <div className="stat-row">
          <span>Streak</span>
          <b>🔥 {study.streak}</b>
        </div>
        <div className="stat-row">
          <span>Words introduced</span>
          <b>
            {introduced} / {DECK.length}
          </b>
        </div>
        <div className="stat-row">
          <span>Mature words</span>
          <b>{mature}</b>
        </div>
        <div className="stat-row">
          <span>Due now</span>
          <b>{due}</b>
        </div>
        <div className="stat-row">
          <span>Total reviews</span>
          <b>{study.gradeLog.length}</b>
        </div>
        <div className="stat-row" style={{ borderBottom: "none" }}>
          <span>Retention</span>
          <b>{ret === null ? "—" : `${ret}%`}</b>
        </div>
      </div>

      <div className="card">
        <div className="section-title">New words per day</div>
        <div className="seg">
          {([3, 6, 10] as const).map((n) => (
            <button
              key={n}
              className={study.newPerDay === n ? "active" : ""}
              onClick={() => setNewPerDay(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <button className="danger" onClick={resetAll}>
          Reset all progress
        </button>
      </div>

      <p className="footer">
        Hebrew text: Sefaria (sefaria.org) — public-domain Masoretic text.
        English glosses are original to this app.
      </p>
    </div>
  );
}
