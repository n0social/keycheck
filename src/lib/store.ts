// Simple in-memory store for MVP
// In production, this should be replaced with Redis (Vercel KV) or a database

// Map<IP_Address, Scan_Count>
export const ipScanCount = new Map<string, number>();

// Map<IP_Address, Credit_Count>
export const ipCredits = new Map<string, number>();

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return "127.0.0.1"; // Fallback for local dev
}
