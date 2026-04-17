import crypto from "crypto";

const QB_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QB_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QB_REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke";

function getCredentials() {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("QuickBooks OAuth credentials not configured");
  }
  return { clientId, clientSecret, redirectUri };
}

function basicAuth(): string {
  const { clientId, clientSecret } = getCredentials();
  return Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
}

export interface OAuthState {
  businessId: string;
  nonce: string;
  exp: number;
}

export function buildAuthUrl(businessId: string): { authUrl: string; state: string } {
  const { clientId, redirectUri } = getCredentials();
  const statePayload: OAuthState = {
    businessId,
    nonce: crypto.randomBytes(16).toString("hex"),
    exp: Date.now() + 10 * 60 * 1000,
  };
  const state = Buffer.from(JSON.stringify(statePayload)).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    scope: "com.intuit.quickbooks.accounting",
    redirect_uri: redirectUri,
    response_type: "code",
    state,
  });

  return { authUrl: `${QB_AUTH_URL}?${params.toString()}`, state };
}

export function parseState(state: string): OAuthState {
  let raw: string;
  try {
    raw = Buffer.from(state, "base64url").toString("utf8");
  } catch {
    // Try standard base64 in case Intuit re-encoded the state
    raw = Buffer.from(state, "base64").toString("utf8");
  }
  console.error("[QB OAuth] Decoded state:", raw);
  const payload = JSON.parse(raw) as OAuthState;
  if (!payload.businessId) throw new Error("State missing businessId");
  // Relaxed expiry: warn but don't reject (HMR restarts can delay the callback)
  if (Date.now() > payload.exp) {
    console.error("[QB OAuth] State expired but proceeding (exp:", new Date(payload.exp).toISOString(), ")");
  }
  return payload;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  x_refresh_token_expires_in: number;
  token_type: string;
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const { redirectUri, clientId } = getCredentials();
  const bodyParams = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  console.error("[QB OAuth] Token exchange request:");
  console.error("  URL:", QB_TOKEN_URL);
  console.error("  redirect_uri:", redirectUri);
  console.error("  client_id:", clientId);
  console.error("  code:", code.slice(0, 15) + "...");

  const res = await fetch(QB_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: bodyParams.toString(),
  });

  const responseText = await res.text();
  console.error("[QB OAuth] Token exchange response:", res.status, responseText.slice(0, 500));

  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status}): ${responseText}`);
  }

  try {
    return JSON.parse(responseText) as TokenResponse;
  } catch {
    throw new Error(`Token exchange returned non-JSON: ${responseText.slice(0, 200)}`);
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch(QB_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }

  return res.json();
}

export async function revokeToken(token: string): Promise<void> {
  await fetch(QB_REVOKE_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ token }).toString(),
  });
}
