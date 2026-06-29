import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import StatusSelect from "../StatusSelect";
import DeleteButton from "../DeleteButton";
import EditJobForm from "./EditJobForm";

export default async function JobDetailPage({
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

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      company: true,
      skills: {
        include: {
          skill: true,
        },
      },
    },
  });

  if (!job || job.userId !== user.id) {
    notFound();
  }

  return (
    <main className="w-full px-8 py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/jobs"
          className="text-sm text-gray-400 hover:text-gray-300"
        >
          ← Back to jobs
        </Link>
      </div>

      <div className="border rounded p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">{job.title}</h1>
            <p className="text-gray-400 text-lg">{job.company.name}</p>
            {job.recruiterName && (
              <p className="text-sm text-gray-500 mt-1">
                Recruiter: {job.recruiterName}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Applied: {new Date(job.appliedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusSelect jobId={job.id} currentStatus={job.status} />
            <DeleteButton jobId={job.id} />
          </div>
        </div>

        {job.skills.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h2 className="text-sm font-medium text-gray-400 mb-2">
              Required Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map(({ skill }) => (
                <span
                  key={skill.id}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {job.notes && (
          <div className="mt-4 pt-4 border-t">
            <h2 className="text-sm font-medium text-gray-400 mb-2">Notes</h2>
            <p className="text-sm text-gray-300 whitespace-pre-wrap">
              {job.notes}
            </p>
          </div>
        )}
      </div>

      <div className="border rounded p-6">
        <h2 className="text-sm font-medium text-gray-400 mb-3">
          Job Description
        </h2>
        <p className="text-sm text-gray-300 whitespace-pre-wrap">
          {job.description}
        </p>
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