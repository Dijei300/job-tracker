import Link from "next/link";
import { prisma } from "@/lib/prisma";
import StatusSelect from "./StatusSelect";
import DeleteButton from "./DeleteButton";

export default async function JobsPage() {
  const jobs = await prisma.job.findMany({
    include: {
      company: true,
      skills: {
        include: {
          skill: true,
        },
      },
    },
    orderBy: {
      appliedAt: "desc",
    },
  });

  return (
    <main className="w-full px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Job Applications</h1>
        <Link
          href="/jobs/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <p className="text-gray-500">No jobs saved yet. Add your first one!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="border rounded p-4"
            >
              <div className="flex justify-between items-start mb-2">
                 <div>
                    <h2 className="font-semibold text-lg">{job.title}</h2>
                    <p className="text-gray-600">{job.company.name}</p>
                    {job.recruiterName && (
                        <p className="text-sm text-gray-500">
                            Recruiter: {job.recruiterName}
                        </p>
                    )}
                    <p className="text-sm text-gray-400 mt-1">
                    Applied: {new Date(job.appliedAt).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <StatusSelect jobId={job.id} currentStatus={job.status} />
                    <DeleteButton jobId={job.id} />
                </div>
              </div>

              {job.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                  {job.skills.map(({ skill }) => (
                    <span
                      key={skill.id}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}