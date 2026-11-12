import { createClient } from '@supabase/supabase-js';

let cachedClient = null;
let cachedConfigHash = '';

export function getSupabaseConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  const localUrl = localStorage.getItem('carlog_supabase_url') || '';
  const localKey = localStorage.getItem('carlog_supabase_key') || '';

  return {
    url: (envUrl || localUrl).trim(),
    anonKey: (envKey || localKey).trim()
  };
}

export function isSupabaseConfigured() {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey && url.startsWith('http'));
}

export function getSupabase() {
  const { url, anonKey } = getSupabaseConfig();
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

export function resetSupabaseClient() {
  cachedClient = null;
  cachedConfigHash = '';
}

