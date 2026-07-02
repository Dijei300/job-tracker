"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  jobId: string;
  initialTitle: string;
  initialRecruiter: string | null;
  initialNotes: string | null;
};

export default function EditJobForm({
  jobId,
  initialTitle,
  initialRecruiter,
  initialNotes,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [recruiterName, setRecruiterName] = useState(initialRecruiter ?? "");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    setSaved(false);

    const response = await fetch("/api/jobs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: jobId,
        title,
        recruiterName,
        notes,
      }),
    });

    setSaving(false);

    if (response.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError("Something went wrong, please try again");
    }
  }

  return (
    <div className="border rounded p-6 mt-6">
      <h2 className="text-sm font-medium text-gray-400 mb-4">Edit Job</h2>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Job Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Recruiter Name
          </label>
          <input
            type="text"
            value={recruiterName}
            onChange={(e) => setRecruiterName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border rounded px-3 py-2 h-36"
            placeholder="Interview notes, contacts, follow-up reminders..."
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50 w-fit"
        >
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
