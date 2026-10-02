import type { SupabaseClient } from "@supabase/supabase-js";
import { freshState, type StudyState } from "./srs";

function normalize(raw: unknown): StudyState {
  const base = freshState();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<StudyState>;
  return {
    started: typeof r.started === "string" ? r.started : base.started,
    lastStudy: typeof r.lastStudy === "string" ? r.lastStudy : "",
    streak: typeof r.streak === "number" ? r.streak : 0,
    newPerDay:
      r.newPerDay === 3 || r.newPerDay === 6 || r.newPerDay === 10
        ? r.newPerDay
        : 6,
    cards:
      r.cards && typeof r.cards === "object"
        ? (r.cards as StudyState["cards"])
        : {},
    gradeLog: Array.isArray(r.gradeLog) ? r.gradeLog.slice(-500) : [],
  };
}

export async function loadStudyState(
  supabase: SupabaseClient,
  userId: string
): Promise<StudyState> {
  const { data, error } = await supabase
    .from("study_state")
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (data?.state) return normalize(data.state);

  // First launch: create the row.
  const fresh = freshState();
  const { error: insertError } = await supabase
    .from("study_state")
    .insert({ user_id: userId, state: fresh });
  if (insertError) throw insertError;
  return fresh;
}

export async function saveStudyState(
  supabase: SupabaseClient,
  userId: string,
  state: StudyState
): Promise<void> {
  const { error } = await supabase.from("study_state").upsert(
    {
      user_id: userId,
      state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}
