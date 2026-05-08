/** Auth credential resolution and persistence. */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { createClient } from "@supabase/supabase-js";

const AUTH_DIR = join(homedir(), ".config", "vitrine");
const AUTH_FILE = join(AUTH_DIR, "mcp-auth.json");

const SUPABASE_URL = "https://lgjkyhbpoosidprneotg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnamt5aGJwb29zaWRwcm5lb3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTUxODcsImV4cCI6MjA4OTU5MTE4N30.ySd7gvyRWxjmp21gXl-x6Qfj90DK6j5nCS0QUeNOZ58";

const DEFAULT_DASHBOARD_URL = "https://app.vitrine3d.com";

interface SavedAuth {
  apiKey?: string;
  anonAccessToken?: string;
  anonRefreshToken?: string;
  anonUserId?: string;
}

/** Read saved auth from disk. */
async function loadSavedAuth(): Promise<SavedAuth> {
  try {
    const raw = await readFile(AUTH_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** Write auth to disk. */
export async function saveAuth(auth: SavedAuth): Promise<void> {
  await mkdir(AUTH_DIR, { recursive: true });
  await writeFile(AUTH_FILE, JSON.stringify(auth, null, 2), "utf-8");
}

/**
 * Resolve credentials in priority order:
 * 1. VITRINE_API_KEY env var
 * 2. Saved API key from ~/.config/vitrine/mcp-auth.json
 * 3. Saved anonymous session (refresh if needed)
 * 4. Create new anonymous session via Supabase
 */
export async function resolveCredentials(): Promise<{
  apiKey?: string;
  jwt?: string;
  baseUrl?: string;
  isAnonymous: boolean;
  anonUserId?: string;
}> {
  const baseUrl = process.env.VITRINE_API_URL || undefined;

  // 1. Env var
  const envKey = process.env.VITRINE_API_KEY;
  if (envKey) {
    return { apiKey: envKey, baseUrl, isAnonymous: false };
  }

  // 2. Saved API key
  const saved = await loadSavedAuth();
  if (saved.apiKey) {
    return { apiKey: saved.apiKey, baseUrl, isAnonymous: false };
  }

  // 3. Saved anonymous session — try to restore/refresh
  if (saved.anonRefreshToken) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase.auth.setSession({
      access_token: saved.anonAccessToken!,
      refresh_token: saved.anonRefreshToken,
    });
    if (!error && data.session) {
      // Save refreshed tokens
      await saveAuth({
        anonAccessToken: data.session.access_token,
        anonRefreshToken: data.session.refresh_token,
        anonUserId: data.session.user.id,
      });
      return {
        jwt: data.session.access_token,
        baseUrl,
        isAnonymous: true,
        anonUserId: data.session.user.id,
      };
    }
    // Refresh failed — fall through to create new session
  }

  // 4. Create new anonymous session
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.auth.signInAnonymously();
  if (!error && data.session) {
    await saveAuth({
      anonAccessToken: data.session.access_token,
      anonRefreshToken: data.session.refresh_token,
      anonUserId: data.session.user.id,
    });
    return {
      jwt: data.session.access_token,
      baseUrl,
      isAnonymous: true,
      anonUserId: data.session.user.id,
    };
  }

  // All failed — no auth
  return { baseUrl, isAnonymous: true };
}

/** Get the dashboard URL for the login flow. */
export function getDashboardUrl(): string {
  return process.env.VITRINE_DASHBOARD_URL ?? DEFAULT_DASHBOARD_URL;
}

export { loadSavedAuth, AUTH_FILE };
