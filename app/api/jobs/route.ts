import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractSkills } from "@/lib/extractSkills";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, recruiterName, companyName } = body;

    if (!title || !description || !companyName) {
      return NextResponse.json(
        { error: "Title, description and company are required" },
        { status: 400 }
      );
    }

    const company = await prisma.company.upsert({
      where: { name: companyName },
      update: {},
      create: { name: companyName },
    });

    const job = await prisma.job.create({
      data: {
        title,
        description,
        recruiterName,
        companyId: company.id,
        userId: user.id,
      },
    });

    const skillNames = await extractSkills(description);

    for (const name of skillNames) {
      const skill = await prisma.skill.upsert({
        where: { name },
        update: {},
        create: { name },
      });

      await prisma.jobSkill.create({
        data: {
          jobId: job.id,
          skillId: skill.id,
        },
      });
    }

    const jobWithSkills = await prisma.job.findUnique({
      where: { id: job.id },
      include: {
        company: true,
        skills: {
          include: {
            skill: true,
          },
        },
      },
    });

    return NextResponse.json(jobWithSkills, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, title, recruiterName, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Job id is required" },
        { status: 400 }
      );
    }

    const job = await prisma.job.findUnique({ where: { id } });

    if (!job || job.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.job.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(title && { title }),
        ...(recruiterName !== undefined && { recruiterName }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Job id is required" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({ where: { id } });

    if (!job || job.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.jobSkill.deleteMany({ where: { jobId: id } });
    await prisma.job.delete({ where: { id } });

    await prisma.company.deleteMany({
      where: {
        id: job.companyId,
        jobs: { none: {} },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
