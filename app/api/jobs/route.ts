import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
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
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}