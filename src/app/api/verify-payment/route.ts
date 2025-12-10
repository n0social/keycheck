import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { ipCredits, getClientIp } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    const ip = getClientIp(request);

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    // Verify session with Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    // Check if this session was already processed (simple check for MVP)
    // In production, store session IDs in DB to prevent replay attacks
    
    // Add credit
    const currentCredits = ipCredits.get(ip) || 0;
    ipCredits.set(ip, currentCredits + 1);

    return NextResponse.json({ success: true, credits: currentCredits + 1 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
