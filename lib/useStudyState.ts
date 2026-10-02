"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBrowserClient } from "./supabase/client";
import { loadStudyState, saveStudyState } from "./store";
import type { StudyState } from "./srs";

export type StudyUpdater = (fn: (prev: StudyState) => StudyState) => void;

/**
 * Loads the signed-in user's study state from Supabase and keeps it
 * synced: every update applies instantly to the UI and is saved to the
 * server (debounced 800ms, plus a flush when the tab is hidden).
 */
export function useStudyState() {
  const [userId, setUserId] = useState<string | null>(null);
  const [study, setStudy] = useState<StudyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pendingRef = useRef<StudyState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = userId;

  const flush = useCallback(async () => {
    const snap = pendingRef.current;
    const uid = userIdRef.current;
    if (!snap || !uid) return;
    pendingRef.current = null;
    try {
      await saveStudyState(getBrowserClient(), uid, snap);
    } catch {
      // Put it back so the next flush retries.
      pendingRef.current = snap;
    }
  }, []);

  const scheduleSave = useCallback(
    (next: StudyState) => {
      pendingRef.current = next;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void flush();
      }, 800);
    },
    [flush]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getBrowserClient();
        const { data, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!data.user) {
          if (!cancelled) setLoading(false);
          return;
        }
        if (!cancelled) setUserId(data.user.id);
        const s = await loadStudyState(supabase, data.user.id);
        if (!cancelled) setStudy(s);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Flush pending saves when the tab goes to the background.
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [flush]);

  const update: StudyUpdater = useCallback(
    (fn) => {
      setStudy((prev) => {
        if (!prev) return prev;
        const next = fn(prev);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  return { userId, study, loading, error, update, flush };
}
