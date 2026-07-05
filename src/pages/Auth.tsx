/** @format */

import React, { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion } from "framer-motion";
import { Mail, Lock, User, Wallet } from "lucide-react";

export const Auth: React.FC = () => {
  const { login, register, forgotPassword, error: authError } = useAuthStore();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const displayError = error || authError || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "login") {
        const success = await login(email, password);
        if (!success) {
          setError("Login gagal. Periksa kembali email dan password Anda.");
        }
      } else if (mode === "register") {
        if (!name) {
          setError("Nama lengkap wajib diisi.");
          setLoading(false);
          return;
        }
        const success = await register(email, password, name);
        if (success) {
          setMessage("Pendaftaran berhasil! Silakan login.");
          setMode("login");
        }
      } else {
        const success = await forgotPassword(email);
        if (success) {
          setMessage("Tautan reset password telah dikirim ke email Anda.");
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan sistem.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    try {
      // Direct local storage mode
      await login("", "");
    } catch {
      setError("Gagal masuk mode tamu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-4 transition-colors duration-200">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg animate-pulse">
          <Wallet className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-extrabold text-2xl tracking-tight leading-none text-slate-900 dark:text-white">MoneyFlow Pro</h1>
          <p className="text-sm text-text-mutedLight dark:text-text-mutedDark mt-1">Kelola Keuangan Pribadi dengan Mudah</p>
        </div>
      </div>

      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 20 }} className="w-full max-w-md">
        <Card className="glass-card">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {mode === "login" && "Selamat Datang"}
              {mode === "register" && "Buat Akun Baru"}
              {mode === "forgot" && "Reset Password"}
            </CardTitle>
            <CardDescription>
              {mode === "login" && "Masukkan email dan sandi Anda untuk melanjutkan."}
              {mode === "register" && "Lengkapi form di bawah untuk bergabung dengan MoneyFlow."}
              {mode === "forgot" && "Kami akan mengirimkan email untuk menyetel ulang sandi Anda."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === "register" && (
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mutedLight dark:text-text-mutedDark">
                    <User className="h-4.5 w-4.5" />
                  </span>
                  <Input type="text" placeholder="Nama Lengkap" value={name} onChange={(e) => setName(e.target.value)} className="pl-11" required />
                </div>
              )}

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mutedLight dark:text-text-mutedDark">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <Input type="email" placeholder="Alamat Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11" required />
              </div>

              {mode !== "forgot" && (
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mutedLight dark:text-text-mutedDark">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11" required />
                </div>
              )}

              {displayError && <p className="text-xs text-danger font-semibold text-center">{displayError}</p>}
              {message && <p className="text-xs text-success font-semibold text-center">{message}</p>}

              <Button type="submit" loading={loading} className="w-full h-11 font-bold mt-2 text-sm">
                {mode === "login" && "Masuk Ke Akun"}
                {mode === "register" && "Daftar Sekarang"}
                {mode === "forgot" && "Kirim Link Reset"}
              </Button>

              {/* Forgot password link */}
              {mode === "login" && (
                <button type="button" onClick={() => setMode("forgot")} className="text-xs text-right text-primary font-bold hover:underline self-end">
                  Lupa password?
                </button>
              )}
            </form>

            <div className="relative flex py-5 items-center">
              <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="shrink-0 mx-4 text-text-mutedLight dark:text-text-mutedDark text-[10px] font-bold uppercase tracking-wider">Atau</span>
              <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            {/* Guest mode entrance */}
            <Button type="button" variant="outline" onClick={handleGuestMode} className="w-full h-11 border-dashed font-bold text-sm text-slate-700 dark:text-slate-200">
              <Wallet className="h-4 w-4 mr-2" />
              Gunakan Mode Offline (Lokal)
            </Button>
          </CardContent>
        </Card>

        {/* Footer links */}
        <div className="text-center mt-6 text-xs text-text-mutedLight dark:text-text-mutedDark">
          {mode === "login" && (
            <p>
              Belum punya akun?{" "}
              <button onClick={() => setMode("register")} className="text-primary font-bold hover:underline">
                Daftar
              </button>
            </p>
          )}
          {mode === "register" && (
            <p>
              Sudah punya akun?{" "}
              <button onClick={() => setMode("login")} className="text-primary font-bold hover:underline">
                Masuk
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <p>
              Kembali ke halaman{" "}
              <button onClick={() => setMode("login")} className="text-primary font-bold hover:underline">
                Masuk
              </button>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
};
export default Auth;
