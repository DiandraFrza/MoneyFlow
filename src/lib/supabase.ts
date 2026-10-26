/** @format */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("placeholder"));

// Bersihkan token auth lawas dari localStorage agar tidak memicu auto-refresh error
if (typeof localStorage !== "undefined") {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    // Abaikan error akses storage
  }
}

console.log("[Supabase] URL:", supabaseUrl ? "✅ Terkonfigurasi" : "❌ Tidak ada");
console.log("[Supabase] Key:", supabaseAnonKey ? "✅ Terkonfigurasi" : "❌ Tidak ada");
console.log("[Supabase] Mode:", isSupabaseConfigured ? "🌐 Online (Supabase)" : "💾 Offline (LocalStorage)");

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  : (null as any);
