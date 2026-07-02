"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setError("Check your email to confirm your account before logging in.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/jobs");
        router.refresh();
      }
    }

    setLoading(false);
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-page)" }}
    >
      <div
        className="w-full max-w-sm p-8"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "var(--card-border)",
          borderRadius: "var(--radius)",
        }}
      >
        <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>
          {isSignUp ? "Create Account" : "Sign In"}
        </h1>

        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2"
              style={{
                backgroundColor: "var(--bg-page)",
                color: "var(--text-primary)",
                border: "var(--card-border)",
                borderRadius: "var(--radius)",
              }}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2"
              style={{
                backgroundColor: "var(--bg-page)",
                color: "var(--text-primary)",
                border: "var(--card-border)",
                borderRadius: "var(--radius)",
              }}
              placeholder="••••••••"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 font-medium disabled:opacity-50"
            style={{
              backgroundColor: "var(--accent)",
              color: "#ffffff",
              borderRadius: "var(--radius)",
            }}
          >
            {loading
              ? "Please wait..."
              : isSignUp
                ? "Create Account"
                : "Sign In"}
          </button>

          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "No account yet? Create one"}
          </button>
        </div>
      </div>
    </main>
  );
}
