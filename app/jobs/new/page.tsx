"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewJobPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [recruiter, setRecruiter] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!title || !company || !description) {
      setError("Title, company and description are required");
      return;
    }

    setLoading(true);
    setError("");

    const response = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        companyName: company,
        recruiterName: recruiter,
        description,
      }),
    });

    setLoading(false);

    if (response.ok) {
      router.push("/jobs");
    } else {
      setError("Something went wrong, please try again");
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Add a Job Application</h1>

      {error && (
        <p className="text-red-500 mb-4">{error}</p>
      )}

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Job Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. Frontend Developer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Company *</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. Google"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Recruiter Name</label>
          <input
            type="text"
            value={recruiter}
            onChange={(e) => setRecruiter(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Job Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded px-3 py-2 h-48"
            placeholder="Paste the full job description here..."
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Job"}
        </button>
      </div>
    </main>
  );
}