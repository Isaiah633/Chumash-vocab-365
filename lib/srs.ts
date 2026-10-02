/**
 * SM-2 spaced repetition engine for Chumash Vocab 365.
 *
 * Grades: 0 = Again, 1 = Hard, 2 = Good, 3 = Easy.
 */

export type Quality = 0 | 1 | 2 | 3;

export interface CardState {
  /** Current interval in days (0 = unseen / relearning) */
  ivl: number;
  /** Ease factor */
  ease: number;
  /** Consecutive successful repetitions */
  reps: number;
  /** Next due time, ms epoch */
  due: number;
  /** Lifetime Again count */
  lapses: number;
}

export interface StudyState {
  /** YYYY-MM-DD (local) of first launch */
  started: string;
  /** YYYY-MM-DD (local) of last study day, "" if never */
  lastStudy: string;
  streak: number;
  newPerDay: number;
  /** keyed by deck index */
  cards: Record<string, CardState>;
  /** recent grades, newest last, capped at 500 */
  gradeLog: number[];
}

const DAY_MS = 86400000;

export function newCardState(): CardState {
  return { ivl: 0, ease: 2.5, reps: 0, due: 0, lapses: 0 };
}

export function freshState(): StudyState {
  return {
    started: todayStr(),
    lastStudy: "",
    streak: 0,
    newPerDay: 6,
    cards: {},
    gradeLog: [],
  };
}

export function gradeCard(prev: CardState, q: Quality, now: number): CardState {
  const c: CardState = { ...prev };

  if (q === 0) {
    // Again: reset progress, ease penalty, review again in 10 minutes.
    c.lapses += 1;
    c.ease = Math.max(1.3, c.ease - 0.2);
    c.reps = 0;
    c.ivl = 0;
    c.due = now + 10 * 60 * 1000;
    return c;
  }

  if (q === 1) {
    // Hard: small ease penalty, modest interval growth.
    c.ease = Math.max(1.3, c.ease - 0.15);
    c.ivl = c.ivl <= 0 ? 1 : Math.max(1, Math.round(c.ivl * 1.2));
  } else if (q === 2) {
    // Good: standard SM-2 steps 1 -> 6 -> ivl * ease.
    c.ivl = c.reps === 0 ? 1 : c.reps === 1 ? 6 : Math.round(c.ivl * c.ease);
  } else {
    // Easy: ease bonus, larger jump.
    c.ease = c.ease + 0.15;
    c.ivl = c.reps === 0 ? 4 : Math.round(c.ivl * c.ease * 1.3);
  }

  c.reps += 1;
  c.due = now + c.ivl * DAY_MS;
  return c;
}

/**
 * Build a study session queue: due cards (oldest first), then up to
 * `newPerDay` unseen cards in deck order.
 */
export function buildQueue(
  state: StudyState,
  deckLength: number,
  now: number
): number[] {
  const due: { i: number; due: number }[] = [];
  for (const [k, c] of Object.entries(state.cards)) {
    if (c.due <= now) due.push({ i: Number(k), due: c.due });
  }
  due.sort((a, b) => a.due - b.due);

  const fresh: number[] = [];
  for (let i = 0; i < deckLength && fresh.length < state.newPerDay; i++) {
    if (!(i in state.cards)) fresh.push(i);
  }

  return [...due.map((d) => d.i), ...fresh];
}

/** Local YYYY-MM-DD */
export function todayStr(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayStr(d);
}

/** 1-based day count since `started` (local dates). */
export function dayNumber(started: string, now: Date = new Date()): number {
  const [y, m, d] = started.split("-").map(Number);
  const start = new Date(y || 1970, (m || 1) - 1, d || 1);
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const b = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  ).getTime();
  return Math.max(1, Math.floor((a - b) / DAY_MS) + 1);
}

/** Retention % = 100 * (grades 1-3) / (all grades); null when no grades yet. */
export function retention(log: number[]): number | null {
  if (log.length === 0) return null;
  const ok = log.filter((q) => q >= 1).length;
  return Math.round((ok / log.length) * 100);
}
