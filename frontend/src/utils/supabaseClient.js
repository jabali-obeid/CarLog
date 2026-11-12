import { createClient } from '@supabase/supabase-js';

let cachedClient = null;
let cachedConfigHash = '';

export function normalizeSupabaseUrl(rawUrl) {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return '';

  const dashboardMatch = trimmed.match(/supabase\.com\/dashboard\/project\/([a-z0-9]+)/i);
  if (dashboardMatch?.[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    return parsed.origin;
  } catch {
    return trimmed;
  }
}

function getEnvConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  return {
    url: normalizeSupabaseUrl(envUrl),
    anonKey: envKey.trim()
  };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getEnvConfig();
  return Boolean(url && anonKey && url.startsWith('http'));
}

export function getSupabase() {
  const { url, anonKey } = getEnvConfig();
  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }

  const hash = `${url}::${anonKey}`;
  if (!cachedClient || cachedConfigHash !== hash) {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    cachedConfigHash = hash;
  }

  return cachedClient;
}
