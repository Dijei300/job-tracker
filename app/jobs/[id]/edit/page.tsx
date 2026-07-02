import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import EditJobForm from "../EditJobForm";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const job = await prisma.job.findUnique({ where: { id } });

  if (!job || job.userId !== user.id) {
    notFound();
  }

  return (
    <main
      className="w-full px-8 py-8 max-w-4xl mx-auto"
      style={{ backgroundColor: "var(--bg-page)", minHeight: "100vh" }}
    >
      <div className="mb-6">
        <Link
          href={`/jobs/${job.id}`}
          className="text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          ← Back to job
        </Link>
      </div>

      <EditJobForm
        jobId={job.id}
        initialTitle={job.title}
        initialRecruiter={job.recruiterName}
        initialNotes={job.notes}
      />
    </main>
  );
}
