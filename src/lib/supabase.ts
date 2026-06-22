/** @format */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("placeholder"));

console.log("[Supabase] URL:", supabaseUrl ? "✅ Terkonfigurasi" : "❌ Tidak ada");
console.log("[Supabase] Key:", supabaseAnonKey ? "✅ Terkonfigurasi" : "❌ Tidak ada");
console.log("[Supabase] Mode:", isSupabaseConfigured ? "🌐 Online (Supabase)" : "💾 Offline (LocalStorage)");

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : (null as any);
