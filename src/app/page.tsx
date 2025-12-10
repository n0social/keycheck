"use client";

import { useState } from "react";
import { Search, AlertTriangle, CheckCircle, Loader2, ShieldAlert, ChevronRight, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { loadStripe } from "@stripe/stripe-js";

// Helper for tailwind classes
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Finding {
  file: string;
  line: number;
  match: string;
  type: string;
  context: string;
}

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState("");
  const [remediationLoading, setRemediationLoading] = useState<number | null>(null);
  const [remediations, setRemediations] = useState<Record<number, string>>({});
  const [isPro, setIsPro] = useState(false); // Mock pro state for now
  const [showPaywall, setShowPaywall] = useState(false);

  // Check for payment success on load
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get("session_id");
    if (sessionId && urlParams.get("payment_success")) {
        // Clear params to prevent re-verification loop
        window.history.replaceState({}, document.title, "/");
        
        // Verify payment
        fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("Payment successful! You have 1 scan credit.");
                setShowPaywall(false);
            }
        });
    }
  }

  const handleCheckout = async () => {
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe failed to load");

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // No priceId needed, handled on server
      });

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error(err);
      alert("Checkout failed. Please check console.");
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFindings([]);
    setScanned(false);
    setRemediations({});
    setShowPaywall(false);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });
      
      const data = await res.json();
      
      if (res.status === 402) {
        setShowPaywall(true);
        throw new Error(data.message);
      }
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to scan repository");
      }

      setFindings(data.findings);
      setScanned(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getRemediation = async (index: number, finding: Finding) => {
    // AI Remediation is now included in the scan price (free or paid)
    if (remediations[index]) {
        // Toggle visibility if needed, or just do nothing
        return; 
    }

    setRemediationLoading(index);
    try {
      const res = await fetch("/api/remediate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finding }),
      });
      const data = await res.json();
      if (data.remediation) {
        setRemediations(prev => ({ ...prev, [index]: data.remediation }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRemediationLoading(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-800">KeyCheck</h1>
          </div>
          <div className="text-sm text-slate-500">
            Secure your code
          </div>
        </div>
      </header>

      {/* Hero / Search */}
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4">
            Scan your GitHub Repository for Exposed Secrets
          </h2>
          <p className="text-lg text-slate-600">
            Instantly detect API keys, tokens, and sensitive data leaked in your public code.
          </p>
        </div>

        <form onSubmit={handleScan} className="relative flex items-center">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-slate-400" />
            </div>
            <input
              type="url"
              className="block w-full p-4 pl-10 text-sm text-slate-900 border border-slate-300 rounded-lg bg-white focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              placeholder="https://github.com/username/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2.5 bottom-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Scan Repository"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
                <p className="font-bold">{error}</p>
                {showPaywall && (
                    <button 
                        onClick={handleCheckout}
                        className="mt-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded"
                    >
                        Buy 1 Scan for $0.99
                    </button>
                )}
            </div>
          </div>
        )}

        {/* Pricing Teaser - Removed Pro Plan UI, replaced with simple info */}
        {!scanned && !error && (
            <div className="mt-12 text-center text-slate-500 text-sm">
                <p>First scan is free. Additional scans are $0.99 each.</p>
            </div>
        )}
      </div>

      {/* Results */}
      {scanned && (
        <div className="container mx-auto px-4 pb-20 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-800">Scan Results</h3>
            <span className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              findings.length > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            )}>
              {findings.length} Issues Found
            </span>
          </div>

          {findings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-slate-900 mb-2">No Secrets Found</h4>
              <p className="text-slate-500">
                Great job! We didn&apos;t detect any obvious secrets in the scanned files.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {findings.map((finding, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                            {finding.type}
                          </span>
                          <span className="text-slate-400 text-sm">
                            Line {finding.line}
                          </span>
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900 font-mono">
                          {finding.file}
                        </h4>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-lg p-4 mb-4 overflow-x-auto">
                      <code className="text-sm font-mono text-slate-300">
                        {finding.context}
                      </code>
                    </div>

                    <div>
                      <button
                        onClick={() => getRemediation(index, finding)}
                        className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors"
                      >
                        {remediations[index] ? (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            Hide Remediation Steps
                          </>
                        ) : (
                          <>
                            {remediationLoading === index ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                            How to fix this?
                          </>
                        )}
                      </button>

                      {remediations[index] && (
                        <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100 text-slate-800 text-sm prose prose-sm max-w-none">
                           <pre className="whitespace-pre-wrap font-sans">{remediations[index]}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
