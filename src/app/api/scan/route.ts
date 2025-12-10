import { NextResponse } from "next/server";
import { getRepoFiles, getFileContent } from "@/lib/github";
import { scanContent } from "@/lib/scanner";

export async function POST(request: Request) {
  try {
    const { repoUrl } = await request.json();

    if (!repoUrl) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
    }

    // Parse owner/repo
    // https://github.com/owner/repo
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
    }
    const [, owner, repo] = match;

    const files = await getRepoFiles(owner, repo);
    const findings = [];

    // Filter files to scan
    // Prioritize config files and source code, avoid images/binaries
    const targetExtensions = ['.env', '.json', '.js', '.ts', '.tsx', '.jsx', '.py', '.yml', '.yaml', '.xml', '.properties', '.config'];
    
    const targetFiles = files.filter((f) => {
      if (!f.path || !f.size) return false;
      const isText = targetExtensions.some(ext => f.path!.endsWith(ext)) || f.path.includes('config') || f.path.includes('secret');
      return isText && f.size < 500000; // < 500KB
    }).slice(0, 50); // Limit to 50 files for MVP

    for (const file of targetFiles) {
      if (!file.path || !file.sha) continue;
      try {
        const content = await getFileContent(owner, repo, file.sha);
        const fileFindings = scanContent(content, file.path);
        findings.push(...fileFindings);
      } catch (err) {
        console.error(`Failed to scan file ${file.path}:`, err);
      }
    }

    return NextResponse.json({ findings });
  } catch (error) {
    console.error("Scan error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
