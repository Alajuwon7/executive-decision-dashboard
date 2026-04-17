import { createServerSupabaseClient } from "@/lib/supabase/server";
import { encryptToken, decryptToken } from "@/lib/crypto/encryption";
import { refreshAccessToken } from "./oauth";

interface TokenResult {
  accessToken: string;
  realmId: string;
}

export async function getValidAccessToken(integrationId: string): Promise<TokenResult> {
  const supabase = await createServerSupabaseClient();
  const { data: row, error } = await supabase
    .from("business_integrations")
    .select("access_token, refresh_token, token_expires_at, realm_id")
    .eq("id", integrationId)
    .single();

  if (error || !row) throw new Error("Integration not found");
  if (!row.access_token || !row.refresh_token) throw new Error("Missing tokens");

  const expiresAt = new Date(row.token_expires_at).getTime();
  const bufferMs = 5 * 60 * 1000;

  // If token is still valid with 5-minute buffer, use it
  if (Date.now() < expiresAt - bufferMs) {
    return {
      accessToken: decryptToken(row.access_token),
      realmId: row.realm_id,
    };
  }

  // Otherwise refresh
  const decryptedRefresh = decryptToken(row.refresh_token);
  const tokens = await refreshAccessToken(decryptedRefresh);

  const newExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  await supabase
    .from("business_integrations")
    .update({
      access_token: encryptToken(tokens.access_token),
      refresh_token: encryptToken(tokens.refresh_token),
      token_expires_at: newExpiry,
      updated_at: new Date().toISOString(),
    })
    .eq("id", integrationId);

  return {
    accessToken: tokens.access_token,
    realmId: row.realm_id,
  };
}
