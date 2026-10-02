"use client";

import { useEffect, useRef, useState } from "react";
import { DECK } from "@/lib/deck";
import {
  buildQueue,
  dayNumber,
  gradeCard,
  newCardState,
  todayStr,
  yesterdayStr,
  type Quality,
  type StudyState,
} from "@/lib/srs";
import type { StudyUpdater } from "@/lib/useStudyState";

interface Props {
  study: StudyState;
  update: StudyUpdater;
}

const MAX_REQUEUES = 5;

export function StudyTab({ study, update }: Props) {
  const [queue, setQueue] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [canSpeak, setCanSpeak] = useState(false);

  const requeues = useRef<Record<number, number>>({});
  const studyRef = useRef(study);
  studyRef.current = study;

  useEffect(() => {
    setCanSpeak(
      typeof window !== "undefined" && "speechSynthesis" in window
    );
  }, []);

  function rebuild(from: StudyState) {
    setQueue(buildQueue(from, DECK.length, Date.now()));
    setPos(0);
    setDone(false);
    setReviewed(0);
    setNewCount(0);
    setFlipped(false);
    requeues.current = {};
  }

  // Build the session queue once the study state has loaded.
  useEffect(() => {
    rebuild(study);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function speak(text: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "he-IL";
      u.rate = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      /* audio unavailable */
    }
  }

  function grade(q: Quality) {
    const s = studyRef.current;
    const idx = queue[pos];
    if (idx === undefined || done) return;

    const now = Date.now();
    const t = todayStr();
    const prev = s.cards[idx] ?? newCardState();
    const isNew = !(idx in s.cards);
    const next = gradeCard(prev, q, now);

    let { streak, lastStudy } = s;
    if (lastStudy !== t) {
      streak = lastStudy === yesterdayStr() ? streak + 1 : 1;
      lastStudy = t;
    }

    const nextState: StudyState = {
      ...s,
      streak,
      lastStudy,
      cards: { ...s.cards, [idx]: next },
      gradeLog: [...s.gradeLog, q].slice(-500),
    };
    update(() => nextState);

    setReviewed((r) => r + 1);
    if (isNew) setNewCount((c) => c + 1);

    // Again: requeue later in this session (max 5 times per card).
    let newQueue = queue;
    if (q === 0) {
      const n = (requeues.current[idx] ?? 0) + 1;
      if (n <= MAX_REQUEUES) {
        requeues.current[idx] = n;
        newQueue = [...queue, idx];
        setQueue(newQueue);
      }
    }

    setFlipped(false);
    const np = pos + 1;
    if (np >= newQueue.length) {
      setDone(true);
    } else {
      setPos(np);
    }
  }

  const introduced = Object.keys(study.cards).length;
  const total = queue.length;
  const pct = total === 0 ? 0 : Math.round((pos / total) * 100);

  // Session finished: show summary.
  if (done) {
    return (
      <div>
        <div className="card center">
          <div style={{ fontSize: 44 }}>🎉</div>
          <h2 style={{ color: "var(--navy)", margin: "8px 0" }}>
            Session complete
          </h2>
          <p style={{ color: "var(--muted)" }}>
            {reviewed} reviewed · {newCount} new word
            {newCount === 1 ? "" : "s"}
          </p>
          <button
            className="btn-primary"
            style={{ marginTop: 12 }}
            onClick={() => rebuild(studyRef.current)}
          >
            Done
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // Nothing to study right now.
  if (total === 0) {
    return (
      <div>
        <ProgressCard study={study} pos={0} total={0} pct={0} />
        <div className="card center">
          <div style={{ fontSize: 44 }}>🎉</div>
          <h2 style={{ color: "var(--navy)", margin: "8px 0" }}>
            All caught up!
          </h2>
          <p style={{ color: "var(--muted)" }}>
            Come back tomorrow for {study.newPerDay} new words.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  const idx = queue[pos];
  const w = DECK[idx];

  return (
    <div>
      <ProgressCard study={study} pos={pos} total={total} pct={pct} />

      <div className="card flash" onClick={() => setFlipped((f) => !f)}>
        <div className="flash-inner" key={`${idx}-${flipped ? "b" : "f"}`}>
          {!flipped ? (
            <>
              <div className="hebrew" lang="he">
                {w.h}
              </div>
              <div className="translit">{w.t}</div>
              {canSpeak && (
                <button
                  className="audio-btn"
                  aria-label="Pronounce"
                  onClick={(e) => speak(w.h, e)}
                >
                  🔊
                </button>
              )}
              <div className="hint">Tap card to reveal</div>
            </>
          ) : (
            <>
              <div className="gloss">{w.g}</div>
              {w.s && <div className="shoresh">Shoresh: {w.s}</div>}
              <div className="verse-ref">{w.ref}</div>
              <a
                className="sefaria-link"
                href={`https://www.sefaria.org/${w.sef}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                View verse on Sefaria ↗
              </a>
              <div className="hint">How well did you know it?</div>
            </>
          )}
        </div>
      </div>

      <div className="srs">
        <button className="again" onClick={() => grade(0)}>
          Again
        </button>
        <button className="hard" onClick={() => grade(1)}>
          Hard
        </button>
        <button className="good" onClick={() => grade(2)}>
          Good
        </button>
        <button className="easy" onClick={() => grade(3)}>
          Easy
        </button>
      </div>

      <Footer />
    </div>
  );
}

function ProgressCard({
  study,
  pos,
  total,
  pct,
}: {
  study: StudyState;
  pos: number;
  total: number;
  pct: number;
}) {
  const introduced = Object.keys(study.cards).length;
  return (
    <div className="card">
      <div className="progress-top">
        <span className="day-label">
          Day {dayNumber(study.started)} · Starter deck (Genesis–Exodus)
        </span>
        <span className="streak">🔥 {study.streak}</span>
      </div>
      <div className="deck-note">
        {introduced}/{DECK.length} words introduced · reviews scheduled by
        spaced repetition
      </div>
      <div className="bar">
        <div style={{ width: `${pct}%` }} />
      </div>
      <div className="session-count">
        {total === 0 ? "No cards this session" : `Card ${pos + 1} of ${total}`}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <p className="footer">
      Hebrew text: Sefaria (sefaria.org) — public-domain Masoretic text.
      English glosses are original to this app.
    </p>
  );
}
