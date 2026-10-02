"use client";

import { useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = getBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <div className="login-wrap">
        <div className="login-card">
          <h1>Chumash Vocab 365</h1>
          <div className="sub">Sefaria-Sourced Edition</div>
          {!sent ? (
            <>
              <p>
                Enter your email and we&apos;ll send you a sign-in link. No
                password needed — your progress is saved to your account.
              </p>
              <form onSubmit={handleSubmit}>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <button className="btn-primary" type="submit" disabled={busy}>
                  {busy ? "Sending…" : "Email me a sign-in link"}
                </button>
              </form>
              {error && <p className="err">{error}</p>}
            </>
          ) : (
            <div className="sent-box">
              <div className="big">✉️</div>
              <p>
                <strong>Check your email.</strong>
                <br />
                We sent a sign-in link to {email.trim()}. Tap it on this
                device to start learning.
              </p>
            </div>
          )}
        </div>
        <p className="footer">
          Hebrew text: Sefaria (sefaria.org) — public-domain Masoretic text.
          English glosses are original to this app.
        </p>
      </div>
    </div>
  );
}
