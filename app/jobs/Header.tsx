"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Header({ email }: { email: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="w-full px-8 py-4 border-b flex justify-between items-center mb-6">
      <span className="text-sm text-gray-400">{email}</span>
      <button
        onClick={handleSignOut}
        className="text-sm text-gray-400 hover:text-red-400"
      >
        Sign out
      </button>
    </header>
  );
}