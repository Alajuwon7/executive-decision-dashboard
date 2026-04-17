import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const verifierToken = process.env.QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN;
  if (!verifierToken) {
    return new NextResponse("Webhook not configured", { status: 500 });
  }

  const signature = request.headers.get("intuit-signature");
  if (!signature) {
    return new NextResponse("Missing signature", { status: 401 });
  }

  const body = await request.text();

  const hash = crypto
    .createHmac("sha256", verifierToken)
    .update(body)
    .digest("base64");

  if (hash !== signature) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  // Parse and dispatch — respond immediately, process async
  try {
    const event = JSON.parse(body);
    const notifications = event.eventNotifications ?? [];

    for (const notification of notifications) {
      const realmId = notification.realmId;
      if (!realmId) continue;

      // Trigger incremental sync for this realm
      // Fire-and-forget — don't block webhook response
      fetch(new URL("/api/integrations/quickbooks/sync", request.url).toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-token": process.env.INTERNAL_CRON_TOKEN ?? "",
        },
        body: JSON.stringify({ realmId, syncType: "incremental", scheduled: true }),
      }).catch(() => {});
    }
  } catch {
    // Parse failure — still return 200 so QB doesn't retry
  }

  return new NextResponse(null, { status: 200 });
}
