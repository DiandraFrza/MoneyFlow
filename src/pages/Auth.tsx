/** @format */

import React, { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, ShieldCheck, User, Phone, Wallet, ExternalLink, ArrowRight, ArrowLeft } from "lucide-react";

export const Auth: React.FC = () => {
  const { loginWithKey, activateKey, loginDemo, error: authError } = useAuthStore();
  const [step, setStep] = useState<"enter_key" | "bind_profile">("enter_key");
  const [rememberKey, setRememberKey] = useState<boolean>(() => {
    return typeof localStorage !== "undefined" ? localStorage.getItem("mf_remember_setting") !== "false" : true;
  });
  const [keyInput, setKeyInput] = useState(() => {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem("mf_remembered_key") || "";
    }
    return "";
  });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const displayError = error || authError || "";
  const cleanDigits = keyInput.replace(/[^0-9]/g, "");

  // Format 11 digits visually as XXXX - XXXX - XXX
  const formatKeyDisplay = (digits: string) => {
    if (digits.length <= 4) return digits;
    if (digits.length <= 8) return `${digits.slice(0, 4)} - ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} - ${digits.slice(4, 8)} - ${digits.slice(8, 11)}`;
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 11);
    setKeyInput(raw);
    setError("");
  };

  const handleKeyPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digitsOnly = pastedData.replace(/[^0-9]/g, "").slice(0, 11);
    setKeyInput(digitsOnly);
    setError("");
  };

  const handleVerifyKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cleanDigits.length !== 11) {
      setError(`Kode akses harus terdiri dari tepat 11 digit angka (saat ini baru ${cleanDigits.length} digit). Master Admin Key: 99999999999`);
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const res = await loginWithKey(cleanDigits);
      if (res.success) {
        if (rememberKey) {
          localStorage.setItem("mf_remembered_key", cleanDigits);
          localStorage.setItem("mf_remember_setting", "true");
        } else {
          localStorage.removeItem("mf_remembered_key");
          localStorage.setItem("mf_remember_setting", "false");
        }
        setSuccessMessage("Autentikasi berhasil! Mengalihkan ke dashboard...");
      } else if (res.needsBinding) {
        setName(res.name || "");
        setPhone(res.phone || "");
        setStep("bind_profile");
        setError("");
      } else if (res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan saat memeriksa kode akses.");
    } finally {
      setLoading(false);
    }
  };

  const handleActivateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama lengkap wajib diisi untuk mengikat lisensi.");
      return;
    }
    if (!phone.trim()) {
      setError("Nomor WhatsApp wajib diisi untuk verifikasi pemilik lisensi.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const ok = await activateKey(cleanDigits, name, phone);
      if (ok) {
        if (rememberKey) {
          localStorage.setItem("mf_remembered_key", cleanDigits);
          localStorage.setItem("mf_remember_setting", "true");
        } else {
          localStorage.removeItem("mf_remembered_key");
          localStorage.setItem("mf_remember_setting", "false");
        }
        setSuccessMessage("Lisensi berhasil diaktifkan! Mengalihkan ke dashboard...");
      } else {
        setError("Gagal mengaktifkan lisensi. Periksa kembali data Anda.");
      }
    } catch (err: any) {
      setError(err?.message || "Gagal mengaktifkan lisensi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = async () => {
    setLoading(true);
    setError("");
    try {
      await loginDemo();
    } catch (err: any) {
      setError(err?.message || "Gagal mengaktifkan Mode Demo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex flex-col items-center justify-center p-4 select-none">
      {/* Brand Header - Swiss Style */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 border-2 border-[#1e1e1e] bg-[#ff5722] flex items-center justify-center text-white">
          <Wallet className="h-6 w-6 stroke-[2.2]" />
        </div>
        <div>
          <h1 className="font-bold text-2xl tracking-tight leading-none text-[#1e1e1e]">MoneyFlow Pro</h1>
          <p className="text-xs font-semibold text-[#555555] mt-1 uppercase tracking-wider">Catat Keuangan Anda dengan Mudah</p>
        </div>
      </motion.div>

      {/* Main Authentication Card */}
      <motion.div layout initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.2 }} className="w-full max-w-md">
        <Card className="border-2 border-[#1e1e1e] bg-[#fafafa] overflow-hidden">
          <CardHeader className="text-center border-b border-[#1e1e1e] bg-[#f4f4f4] py-5">
            <AnimatePresence mode="wait">
              {step === "enter_key" ? (
                <motion.div key="header-key" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                  <div className="h-10 w-10 bg-[#1e1e1e] text-white flex items-center justify-center mx-auto mb-2.5 border border-[#1e1e1e]">
                    <KeyRound className="h-5 w-5 text-[#fefefe]" />
                  </div>
                  <CardTitle className="text-lg font-bold text-[#1e1e1e] tracking-tight uppercase">Aktivasi Kode</CardTitle>
                  {/* <CardDescription className="mt-1 text-xs text-[#555555]">Masukkan kode lisensi untuk login!</CardDescription> */}
                </motion.div>
              ) : (
                <motion.div key="header-bind" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                  <div className="h-10 w-10 bg-[#ff5722] text-white flex items-center justify-center mx-auto mb-2.5 border border-[#1e1e1e]">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg font-bold text-[#1e1e1e] tracking-tight uppercase">Aktivasi Lisensi Baru</CardTitle>
                  <CardDescription className="mt-1 text-xs text-[#555555]">Ikat lisensi 11-digit ini ke identitas Anda untuk akses seumur hidup.</CardDescription>
                </motion.div>
              )}
            </AnimatePresence>
          </CardHeader>

          <CardContent className="pt-6 pb-6">
            <AnimatePresence mode="wait">
              {step === "enter_key" ? (
                <motion.form key="step-key" onSubmit={handleVerifyKey} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                  {/* 11-Digit Key Formatted Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#1e1e1e] uppercase tracking-wider flex justify-between">
                      <span>Kode Akses (11 Digit)</span>
                      <span className={cleanDigits.length === 11 ? "text-[#356342] font-black" : "text-[#ff5722] font-bold"}>{cleanDigits.length === 11 ? "✓ 11 Digit Lengkap" : `${cleanDigits.length} / 11 Digit`}</span>
                    </label>

                    <div className="relative">
                      <Input
                        type="text"
                        name="username"
                        id="access_key"
                        autoComplete="username"
                        inputMode="numeric"
                        autoFocus
                        placeholder="gasr-sswv-909"
                        value={formatKeyDisplay(cleanDigits)}
                        onChange={handleKeyChange}
                        onPaste={handleKeyPaste}
                        className="text-center font-mono font-bold text-lg tracking-[0.16em] h-13 border-2 border-[#1e1e1e] bg-white text-[#1e1e1e] focus:border-[#ff5722]"
                        maxLength={17} // with dashes: 4 + 3 + 4 + 3 + 3 = 17 chars
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <label className="flex items-center gap-2 font-semibold text-[#1e1e1e] cursor-pointer select-none">
                        <input type="checkbox" checked={rememberKey} onChange={(e) => setRememberKey(e.target.checked)} className="h-3.5 w-3.5 border border-[#1e1e1e] rounded-none accent-[#ff5722] cursor-pointer" />
                        <span>Ingat Kode di Perangkat Ini (Auto-Fill)</span>
                      </label>
                      {cleanDigits && (
                        <button
                          type="button"
                          onClick={() => {
                            setKeyInput("");
                            localStorage.removeItem("mf_remembered_key");
                          }}
                          className="text-[10px] text-[#a53a2b] font-bold hover:underline cursor-pointer"
                        >
                          Hapus Simpanan
                        </button>
                      )}
                    </div>
                  </div>

                  {displayError && <div className="text-xs text-[#a53a2b] bg-[#a53a2b]/10 border border-[#a53a2b] p-3 font-semibold text-center">{displayError}</div>}

                  {successMessage && <div className="text-xs text-[#356342] bg-[#356342]/10 border border-[#356342] p-3 font-semibold text-center">{successMessage}</div>}

                  <Button type="submit" loading={loading} disabled={cleanDigits.length !== 11} className="w-full h-12 font-bold text-sm bg-[#1e1e1e] text-white hover:bg-[#ff5722] hover:text-white border-2 border-[#1e1e1e] transition-colors">
                    {cleanDigits.length === 11 ? (
                      <>
                        {" "}
                        Masuk
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    ) : cleanDigits.length === 0 ? (
                      "Masukkan 11-Digit Kode Akses"
                    ) : (
                      `Kurang ${11 - cleanDigits.length} Digit Lagi (${cleanDigits.length}/11)`
                    )}
                  </Button>

                  <div className="relative flex py-2 items-center">
                    <div className="grow border-t border-[#1e1e1e]"></div>
                    <span className="shrink-0 mx-4 text-[#555555] text-[10px] font-bold uppercase tracking-wider">Atau Coba Dahulu</span>
                    <div className="grow border-t border-[#1e1e1e]"></div>
                  </div>

                  {/* Free Demo Mode Button */}
                  <Button type="button" variant="outline" onClick={handleDemoMode} disabled={loading} className="w-full h-11 font-bold text-xs border-2 border-[#1e1e1e] bg-white text-[#1e1e1e] hover:bg-[#f4f4f4] transition-colors">
                    <Wallet className="h-4 w-4 mr-2 text-[#ff5722]" />
                    Coba Mode Demo (Gratis)
                  </Button>
                </motion.form>
              ) : (
                <motion.form key="step-bind" onSubmit={handleActivateAndSubmit} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                  {/* Current Active Key Pill */}
                  <div className="border border-[#1e1e1e] bg-[#f4f4f4] p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-[#777777] block">Kode Lisensi</span>
                      <span className="font-mono font-bold text-sm text-[#1e1e1e] tracking-wider">{formatKeyDisplay(cleanDigits)}</span>
                    </div>
                    <button type="button" onClick={() => setStep("enter_key")} className="text-xs font-bold text-[#ff5722] hover:underline flex items-center gap-1 cursor-pointer">
                      <ArrowLeft className="h-3 w-3" /> Ganti
                    </button>
                  </div>

                  {/* Name Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#1e1e1e] uppercase tracking-wider">Nama Lengkap Anda</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555555]">
                        <User className="h-4 w-4" />
                      </span>
                      <Input type="text" placeholder="Contoh: Danda Nugraha" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 h-11 border-2 border-[#1e1e1e]" required autoFocus />
                    </div>
                  </div>

                  {/* WhatsApp Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#1e1e1e] uppercase tracking-wider">Nomor WhatsApp / HP</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555555]">
                        <Phone className="h-4 w-4" />
                      </span>
                      <Input type="tel" placeholder="Contoh: 081234567890" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 h-11 border-2 border-[#1e1e1e]" required />
                    </div>
                    <p className="text-[10px] text-[#777777]">Digunakan untuk verifikasi pemulihan lisensi jika Anda berpindah perangkat.</p>
                  </div>

                  {displayError && <div className="text-xs text-[#a53a2b] bg-[#a53a2b]/10 border border-[#a53a2b] p-3 font-semibold text-center">{displayError}</div>}

                  {successMessage && <div className="text-xs text-[#356342] bg-[#356342]/10 border border-[#356342] p-3 font-semibold text-center">{successMessage}</div>}

                  <Button type="submit" loading={loading} className="w-full h-12 font-bold text-sm bg-[#ff5722] text-white hover:bg-[#e64a19] border-2 border-[#1e1e1e] transition-colors">
                    Aktifkan Lisensi & Masuk
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Lynk.id Buyer Call-to-action */}
        <div className="text-center mt-6 flex flex-col items-center gap-2">
          <p className="text-xs text-[#555555] font-medium">
            Belum memiliki Kode Akses?{" "}
            <a href="https://lynk.id" target="_blank" rel="noreferrer" className="font-bold text-[#ff5722] hover:underline inline-flex items-center gap-1">
              Beli di Lynk.id <ExternalLink className="h-3 w-3" />
            </a>
          </p>
          <p className="text-[10px] text-[#777777]">Lisensi sekali bayar, berlaku permanen tanpa biaya langganan bulanan.</p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
