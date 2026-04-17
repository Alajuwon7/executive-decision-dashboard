"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function QuickBooksCallbackInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const realmId = searchParams.get("realmId");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setErrorMsg(error);
      return;
    }

    if (!code || !state || !realmId) {
      setStatus("error");
      setErrorMsg("Missing parameters from QuickBooks. Please try connecting again.");
      return;
    }

    // Call our server-side API to exchange the code for tokens and store them
    fetch("/api/integrations/quickbooks/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state, realmId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus("success");
          // Notify the opener (dashboard popup flow)
          if (window.opener) {
            window.opener.postMessage({ type: "quickbooks-connected", businessId: data.businessId }, "*");
            setTimeout(() => window.close(), 1500);
          } else {
            // Direct navigation (non-popup flow) — redirect after delay
            setTimeout(() => {
              window.location.href = `/dashboard?integration=quickbooks&status=connected&business=${data.businessId}`;
            }, 1500);
          }
        } else {
          setStatus("error");
          setErrorMsg(data.error ?? "Token exchange failed");
        }
      })
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err.message ?? "Network error");
      });
  }, [searchParams]);

  return (
    <div className="bg-[#141414] border border-[#2A2A2A] rounded-[14px] p-8 max-w-md text-center">
      {status === "processing" && (
        <>
          <div className="w-12 h-12 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Connecting QuickBooks...</h2>
          <p className="text-sm text-[#737373]">Exchanging authorization tokens. This will only take a moment.</p>
        </>
      )}
      {status === "success" && (
        <>
          <div className="w-12 h-12 bg-[#22C55E]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#22C55E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Connected!</h2>
          <p className="text-sm text-[#737373]">
            {typeof window !== "undefined" && window.opener ? "Closing this window..." : "Redirecting to dashboard..."}
          </p>
        </>
      )}
      {status === "error" && (
        <>
          <div className="w-12 h-12 bg-[#EF4444]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Connection Failed</h2>
          <p className="text-sm text-[#737373] mb-4">{errorMsg}</p>
          <button
            onClick={() => { window.location.href = "/dashboard"; }}
            className="text-sm font-semibold text-[#F59E0B] hover:underline"
          >
            Return to Dashboard
          </button>
        </>
      )}
    </div>
  );
}

function CallbackFallback() {
  return (
    <div className="bg-[#141414] border border-[#2A2A2A] rounded-[14px] p-8 max-w-md text-center">
      <div className="w-12 h-12 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <h2 className="text-lg font-bold text-white mb-2">Loading...</h2>
    </div>
  );
}

export default function QuickBooksCallbackPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <Suspense fallback={<CallbackFallback />}>
        <QuickBooksCallbackInner />
      </Suspense>
    </div>
  );
}
