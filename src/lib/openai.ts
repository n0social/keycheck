import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateRemediation(finding: { file: string; type: string; match: string }) {
  if (!process.env.OPENAI_API_KEY) {
    return "OpenAI API Key not configured. Please set OPENAI_API_KEY in your environment variables to get detailed remediation instructions.";
  }

  const prompt = `
    I found a potential secret leak in a GitHub repository.
    Type: ${finding.type}
    File: ${finding.file}
    Secret (partially redacted): ${finding.match.substring(0, 4)}...

    Please provide a short explanation of why this is dangerous and specific instructions on how to remove it using 'git filter-repo'.
    Assume the user has 'git filter-repo' installed.
    Provide the exact command to remove this secret from history.
    Format the response in Markdown.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API Error:", error);
    return "Error generating remediation instructions.";
  }
}
