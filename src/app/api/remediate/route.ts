import { NextResponse } from "next/server";
import { generateRemediation } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    const { finding } = await request.json();
    if (!finding) {
      return NextResponse.json({ error: "Finding is required" }, { status: 400 });
    }

    const remediation = await generateRemediation(finding);
    return NextResponse.json({ remediation });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
