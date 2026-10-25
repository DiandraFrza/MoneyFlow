/** @format */

import React, { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
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

  const switchMode = (newMode: "login" | "register" | "forgot") => {
    setError("");
    setMessage("");
    setMode(newMode);
  };

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
      await login("", "");
    } catch {
      setError("Gagal masuk mode tamu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col items-center justify-center p-4 select-none">
      {/* Brand Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: "easeOut" }} className="flex items-center gap-3 mb-8">
        <motion.div whileHover={{ rotate: -6, scale: 1.05 }} transition={{ duration: 0.15 }} className="h-12 w-12 border-2 border-[#1e1e1e] bg-[#ff5722] flex items-center justify-center text-white">
          <Wallet className="h-6 w-6 stroke-[2.2]" />
        </motion.div>
        <div>
          <h1 className="font-bold text-2xl tracking-tight leading-none text-[#1e1e1e]">MoneyFlow Pro</h1>
          <p className="text-xs font-medium text-[#555555] mt-1">Asisten Keuangan Presisi</p>
        </div>
      </motion.div>

      <motion.div layout initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25, ease: "easeOut" }} className="w-full max-w-md">
        <Card className="border-2 border-[#1e1e1e] bg-[#fafafa] overflow-hidden">
          <CardHeader className="text-center border-b border-[#1e1e1e] bg-[#f4f4f4] py-5">
            <AnimatePresence mode="wait">
              <motion.div key={mode} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                <CardTitle className="text-lg font-bold text-[#1e1e1e] tracking-tight">
                  {mode === "login" && "Selamat Datang"}
                  {mode === "register" && "Buat Akun Baru"}
                  {mode === "forgot" && "Reset Password"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {mode === "login" && "Masukkan email dan sandi Anda untuk melanjutkan."}
                  {mode === "register" && "Lengkapi form di bawah untuk bergabung dengan MoneyFlow."}
                  {mode === "forgot" && "Kami akan mengirimkan email untuk menyetel ulang sandi Anda."}
                </CardDescription>
              </motion.div>
            </AnimatePresence>
          </CardHeader>

          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <AnimatePresence initial={false}>
                {mode === "register" && (
                  <motion.div key="name-input" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="relative overflow-hidden">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mutedLight dark:text-text-mutedDark z-10">
                      <User className="h-4.5 w-4.5" />
                    </span>
                    <Input type="text" placeholder="Nama Lengkap" value={name} onChange={(e) => setName(e.target.value)} className="pl-11" required />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mutedLight dark:text-text-mutedDark">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <Input type="email" placeholder="Alamat Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-11" required />
              </div>

              <AnimatePresence initial={false}>
                {mode !== "forgot" && (
                  <motion.div key="password-input" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="relative overflow-hidden">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-mutedLight dark:text-text-mutedDark z-10">
                      <Lock className="h-4.5 w-4.5" />
                    </span>
                    <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-11" required />
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {displayError && (
                  <motion.p key="error-msg" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: [0, -4, 4, -2, 2, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="text-xs text-[#a53a2b] bg-[#a53a2b]/10 border border-[#a53a2b] p-2.5 font-semibold text-center">
                    {displayError}
                  </motion.p>
                )}
                {message && (
                  <motion.p key="success-msg" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-[#356342] bg-[#356342]/10 border border-[#356342] p-2.5 font-semibold text-center">
                    {message}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.div whileTap={{ scale: 0.99 }}>
                <Button type="submit" loading={loading} className="w-full h-11 font-bold mt-1 text-sm">
                  {mode === "login" && "Masuk Ke Akun"}
                  {mode === "register" && "Daftar Sekarang"}
                  {mode === "forgot" && "Kirim Link Reset"}
                </Button>
              </motion.div>

              {mode === "login" && (
                <button type="button" onClick={() => switchMode("forgot")} className="text-xs text-right text-primary font-bold hover:underline self-end cursor-pointer">
                  Lupa password?
                </button>
              )}
            </form>

            <div className="relative flex py-5 items-center">
              <div className="grow border-t border-[#1e1e1e]"></div>
              <span className="shrink-0 mx-4 text-[#555555] text-[10px] font-bold uppercase tracking-wider">Atau</span>
              <div className="grow border-t border-[#1e1e1e]"></div>
            </div>

            <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}>
              <Button type="button" variant="outline" onClick={handleGuestMode} className="w-full h-11 font-bold text-xs">
                <Wallet className="h-4 w-4 mr-2" />
                Gunakan Mode Offline (Lokal)
              </Button>
            </motion.div>
          </CardContent>
        </Card>

        {/* Footer links */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-center mt-6 text-xs text-text-mutedLight dark:text-text-mutedDark">
          {mode === "login" && (
            <p>
              Belum punya akun?{" "}
              <button onClick={() => switchMode("register")} className="text-primary font-bold hover:underline cursor-pointer">
                Daftar
              </button>
            </p>
          )}
          {mode === "register" && (
            <p>
              Sudah punya akun?{" "}
              <button onClick={() => switchMode("login")} className="text-primary font-bold hover:underline cursor-pointer">
                Masuk
              </button>
            </p>
          )}
          {mode === "forgot" && (
            <p>
              Kembali ke halaman{" "}
              <button onClick={() => switchMode("login")} className="text-primary font-bold hover:underline cursor-pointer">
                Masuk
              </button>
            </p>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Auth;
