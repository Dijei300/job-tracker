"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/ThemeProvider";

export default function Header({ email }: { email: string }) {
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className="w-full px-8 py-4 border-b flex justify-between items-center mb-6"
      style={{ borderColor: "var(--card-border)" }}
    >
      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {email}
      </span>

      <div className="flex items-center gap-4">
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as typeof theme)}
          className="text-sm px-2 py-1 rounded border cursor-pointer"
          style={{
            backgroundColor: "var(--bg-card)",
            color: "var(--text-primary)",
          }}
        >
          <option value="linkedin">LinkedIn</option>
          <option value="instagram">Instagram</option>
          <option value="twitter">Twitter</option>
          <option value="notion">Notion</option>
        </select>

        <button
          onClick={handleSignOut}
          className="text-sm hover:text-red-400"
          style={{ color: "var(--text-secondary)" }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}