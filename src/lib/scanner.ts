export const PATTERNS = [
  {
    name: "AWS Access Key ID",
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
  },
  {
    name: "Stripe Secret Key",
    regex: /sk_live_[0-9a-zA-Z]{24}/g,
  },
  {
    name: "OpenAI API Key",
    regex: /sk-[a-zA-Z0-9]{32,}/g,
  },
  {
    name: "Google API Key",
    regex: /AIza[0-9A-Za-z-_]{35}/g,
  },
  {
    name: "Slack Token",
    regex: /xox[baprs]-([0-9a-zA-Z]{10,48})/g,
  },
  {
    name: "Private Key Block",
    regex: /-----BEGIN (?:RSA|DSA|EC|OPENSSH|PGP) PRIVATE KEY-----/g,
  },
];

export interface Finding {
  file: string;
  line: number;
  match: string;
  type: string;
  context: string;
}

export function scanContent(content: string, filePath: string): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split("\n");

  PATTERNS.forEach((pattern) => {
    lines.forEach((line, index) => {
      const matches = line.match(pattern.regex);
      if (matches) {
        matches.forEach((m) => {
          findings.push({
            file: filePath,
            line: index + 1,
            match: m,
            type: pattern.name,
            context: line.trim(),
          });
        });
      }
    });
  });

  return findings;
}
