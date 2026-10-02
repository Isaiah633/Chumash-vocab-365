"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase/client";
import { useStudyState } from "@/lib/useStudyState";
import { StudyTab } from "@/components/StudyTab";
import { WordsTab } from "@/components/WordsTab";
import { StatsTab } from "@/components/StatsTab";

type Tab = "study" | "words" | "stats";

export default function Home() {
  const { study, loading, error, update } = useStudyState();
  const [tab, setTab] = useState<Tab>("study");
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();

  async function signOut() {
    setSigningOut(true);
    try {
      await getBrowserClient().auth.signOut();
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-row">
          <div>
            <h1>Chumash Vocab 365</h1>
            <div className="sub">Sefaria-Sourced Edition</div>
          </div>
          <button
            className="signout"
            onClick={signOut}
            disabled={signingOut}
          >
            {signingOut ? "…" : "Sign out"}
          </button>
        </div>
      </header>

      <main className="main">
        {loading && <div className="center">Loading your progress…</div>}
        {error && (
          <div className="center">
            <p className="err">{error}</p>
            <p style={{ fontSize: 13 }}>
              If this mentions Supabase configuration, the app&apos;s
              environment variables are not set yet — see the README.
            </p>
          </div>
        )}
        {!loading && !error && study && (
          <>
            {tab === "study" && <StudyTab study={study} update={update} />}
            {tab === "words" && <WordsTab study={study} />}
            {tab === "stats" && <StatsTab study={study} update={update} />}
          </>
        )}
      </main>

      <nav className="tabbar">
        <button
          className={tab === "study" ? "active" : ""}
          onClick={() => setTab("study")}
        >
          Study
        </button>
        <button
          className={tab === "words" ? "active" : ""}
          onClick={() => setTab("words")}
        >
          Words
        </button>
        <button
          className={tab === "stats" ? "active" : ""}
          onClick={() => setTab("stats")}
        >
          Stats
        </button>
      </nav>
    </div>
  );
}
