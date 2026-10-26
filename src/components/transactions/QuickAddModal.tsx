/** @format */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFinanceStore } from "../../store/financeStore";
import { useAuthStore } from "../../store/authStore";
import { Dialog } from "../ui/dialog";
import { useModalStore } from "../../store/modalStore";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import type { TransactionType } from "../../types";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, PiggyBank, Camera, Sparkles, ScanLine, X, KeyRound, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { scanReceiptWithAI } from "../../lib/receiptScanner";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
}

const TRANSACTION_TYPES = [
  { id: "expense" as const, label: "Keluar", icon: ArrowDownLeft, activeColor: "bg-[#a53a2b]", dotColor: "bg-[#a53a2b]", tag: "Pengeluaran" },
  { id: "income" as const, label: "Masuk", icon: ArrowUpRight, activeColor: "bg-[#356342]", dotColor: "bg-[#356342]", tag: "Pemasukan" },
  { id: "transfer" as const, label: "Transfer", icon: ArrowLeftRight, activeColor: "bg-[#1e1e1e]", dotColor: "bg-[#1e1e1e]", tag: "Pindah Saldo" },
  { id: "savings" as const, label: "Tabung", icon: PiggyBank, activeColor: "bg-[#9a5a21]", dotColor: "bg-[#9a5a21]", tag: "Tabungan" },
];

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose, initialType = "expense" }) => {
  const { user } = useAuthStore();
  const { wallets, categories, subcategories, addTransaction, addTransfer } = useFinanceStore();
  const { openWalletModal } = useModalStore();

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState<string>("");
  const [walletId, setWalletId] = useState<string>("");
  const [transferWalletId, setTransferWalletId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subCategoryId, setSubCategoryId] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState<string>("");
  const [receiptUrls, setReceiptUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // AI Receipt Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState<string>("");
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const scanInputRef = useRef<HTMLInputElement>(null);

  const amountRef = useRef<HTMLInputElement>(null);

  // 🔊 Audio synthesizer untuk suara "tit" elegan ala coffee shop (menggunakan Web Audio API)
  const playElegantBeep = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Nada tinggi yang bersih (dua nada selaras)
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // Nada A5
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Ignore audio context errors if blocked by browser policy
    }
  };

  // Filter wallets and categories based on active selections
  const activeWallets = wallets.reduce(
    (acc, current) => {
      const x = acc.find((item) => item.name === current.name);
      if (!x) {
        return acc.concat([current]);
      } else {
        if (Math.abs(current.balance) > Math.abs(x.balance)) {
          return acc.map((item) => (item.name === current.name ? current : item));
        }
        return acc;
      }
    },
    [] as typeof wallets,
  );
  const filteredCategories = categories.filter((c) => c.type === (type === "income" ? "income" : "expense"));
  const filteredSubCategories = subcategories.filter((sc) => sc.category_id === categoryId);

  // Set default form values when opening
  useEffect(() => {
    if (!isOpen) return;

    const frame = window.requestAnimationFrame(() => {
      setType(initialType);
      setAmount("");
      setDescription("");
      setReceiptUrls([]);
      setError("");
      setScanSuccess("");
      setDate(new Date().toISOString().split("T")[0]);

      if (wallets.length > 0) {
        setWalletId(wallets[0].id);
        setTransferWalletId(wallets.length > 1 ? wallets[1].id : wallets[0].id);
      } else {
        setWalletId("");
        setTransferWalletId("");
      }

      const defaultCats = categories.filter((c) => c.type === (initialType === "income" ? "income" : "expense"));
      setCategoryId(defaultCats[0]?.id ?? "");
      setSubCategoryId("");

      window.setTimeout(() => {
        amountRef.current?.focus();
      }, 250);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, wallets, categories, initialType]);

  // Adjust categories when type changes
  useEffect(() => {
    if (!isOpen) return;

    const frame = window.requestAnimationFrame(() => {
      const defaultCats = categories.filter((c) => c.type === (type === "income" ? "income" : "expense"));
      setCategoryId(defaultCats[0]?.id ?? "");
      setSubCategoryId("");
    });

    return () => window.cancelAnimationFrame(frame);
  }, [type, categories, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("User tidak teridentifikasi.");
      return;
    }

    if (!walletId) {
      setError("Pilih dompet pembayaran terlebih dahulu.");
      return;
    }

    const parsedAmount = parseFloat(amount.replace(/[^0-9]/g, ""));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Masukkan nominal transaksi yang valid (minimal Rp 1).");
      return;
    }

    if (type !== "transfer" && type !== "savings" && type !== "debt_payment") {
      if (!categoryId) {
        setError("Pilih kategori transaksi.");
        return;
      }

      if (filteredSubCategories.length > 0 && !subCategoryId) {
        setError("Pilih subkategori transaksi.");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      if (type === "transfer") {
        if (walletId === transferWalletId) {
          setError("Dompet asal dan tujuan tidak boleh sama.");
          setLoading(false);
          return;
        }
        await addTransfer(user.id, {
          from_wallet_id: walletId,
          to_wallet_id: transferWalletId,
          amount: parsedAmount,
          description: description || "Transfer Uang",
          date: date,
        });
      } else {
        await addTransaction(user.id, {
          wallet_id: walletId,
          category_id: type === "savings" || type === "debt_payment" ? null : categoryId || null,
          sub_category_id: type === "savings" || type === "debt_payment" ? null : subCategoryId || null,
          type: type,
          amount: parsedAmount,
          description: description,
          date: date,
          receipt_url: receiptUrls[0] || undefined,
          receipt_urls: receiptUrls.length > 0 ? receiptUrls : undefined,
        });
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan transaksi.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (val: number) => {
    setAmount(val.toLocaleString("id-ID"));
  };

  // ── AI Receipt Scanner with Elegant Effects ──────────────────────────────
  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const apiKey = (typeof localStorage !== "undefined" ? localStorage.getItem("mf_gemini_api_key") : null) || (import.meta.env.VITE_GEMINI_API_KEY as string | undefined);

    if (!apiKey) {
      setError("API Key tidak valid (harus berawalan 'AIzaSy...'). Silakan masukkan API Key Gemini kamu.");
      setShowApiKeyPrompt(true);
      return;
    }

    setIsScanning(true);
    setError("");
    setScanSuccess("");

    try {
      const compressedUrl = await compressImage(file);
      const result = await scanReceiptWithAI(file);

      // Auto-fill form fields
      if (result.amount > 0) {
        setAmount(result.amount.toLocaleString("id-ID"));
      }
      if (result.date) {
        setDate(result.date);
      }
      if (result.itemsSummary) {
        setDescription(result.itemsSummary);
      }

      // Match category hint to existing categories
      const catHintMap: Record<string, string[]> = {
        Makanan: ["makanan", "makan", "food", "kopi", "minuman"],
        Belanja: ["belanja", "shopping"],
        Transportasi: ["transportasi", "transport"],
        Tagihan: ["tagihan", "bill"],
        Lainnya: [],
      };
      const hintKeywords = catHintMap[result.categoryHint] || [];
      const matchedCat = filteredCategories.find((c) => hintKeywords.some((kw) => c.name.toLowerCase().includes(kw)));
      if (matchedCat) {
        setCategoryId(matchedCat.id);
      }

      // Add photo to receipt gallery
      setReceiptUrls((prev) => [compressedUrl, ...prev].slice(0, 8));

      // 🔊 Mainkan suara "tit" sukses ala coffee shop
      playElegantBeep();

      setScanSuccess(`Struk "${result.merchant}" berhasil dipindai!`);

      // Auto-hide success banner after 4 seconds
      setTimeout(() => setScanSuccess(""), 4000);
    } catch (err: any) {
      const msg = err?.message || "Gagal memindai struk. Coba lagi dengan foto yang lebih jelas.";
      setError(msg);
      if (msg.toLowerCase().includes("api key") || msg.includes("UNAUTHENTICATED") || msg.includes("ACCESS_TOKEN_TYPE")) {
        setShowApiKeyPrompt(true);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveApiKey = () => {
    const key = apiKeyInput.trim();
    if (!key) return;
    localStorage.setItem("mf_gemini_api_key", key);
    setShowApiKeyPrompt(false);
    setApiKeyInput("");
    setTimeout(() => scanInputRef.current?.click(), 100);
  };

  const compressImage = (file: File, maxDimension = 1200, quality = 0.75): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => reject(new Error("Gagal membaca gambar"));
      };
      reader.onerror = () => reject(new Error("Gagal mengunggah file"));
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 8 - receiptUrls.length;
    if (remainingSlots <= 0) {
      setError("Maksimal 8 foto bukti transaksi.");
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    const MAX_SIZE_MB = 2;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    for (const file of filesToProcess) {
      if (file.size > MAX_SIZE_BYTES) {
        setError(`Foto "${file.name}" melebihi batas maksimal ${MAX_SIZE_MB}MB.`);
        e.target.value = "";
        return;
      }
    }

    setError("");
    try {
      const compressedUrls = await Promise.all(filesToProcess.map((file) => compressImage(file)));
      setReceiptUrls((prev) => [...prev, ...compressedUrls].slice(0, 8));
    } catch (err: any) {
      setError(err?.message || "Gagal memproses foto bukti transaksi");
    } finally {
      e.target.value = "";
    }
  };

  const handleRemovePhoto = (index: number) => {
    setReceiptUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const currentTypeConfig = TRANSACTION_TYPES.find((t) => t.id === type) || TRANSACTION_TYPES[0];

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Catat Keuangan Baru">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative">
        {/* 🌟 Full Modal Blur Overlay & Laser Scanner Animation saat isScanning aktif */}
        <AnimatePresence>
          {isScanning && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 backdrop-blur-md bg-black/40 border-2 border-[#ff5722] flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden">
              {/* Efek Garis Laser Bergerak Memindai */}
              <motion.div animate={{ y: [-120, 120, -120] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }} className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff5722] to-transparent shadow-[0_0_20px_#ff5722]" />

              <div className="bg-[#fafafa] border-2 border-[#1e1e1e] p-6 max-w-xs w-full flex flex-col items-center gap-3 shadow-2xl relative z-10">
                <div className="h-12 w-12 border-2 border-[#1e1e1e] bg-[#ff5722] text-white flex items-center justify-center animate-pulse">
                  <ScanLine className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-wider text-[#1e1e1e]">AI Sedang Memindai</h4>
                  <p className="text-[11px] text-[#555555] mt-1">Membaca nominal, tanggal, dan pos belanja dari struk...</p>
                </div>
                <div className="w-full bg-[#e5e5e5] h-1.5 border border-[#1e1e1e] overflow-hidden mt-2">
                  <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }} className="h-full w-1/2 bg-[#ff5722]" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Sweetener Header */}
        <div className="flex items-center justify-between px-0.5">
          <motion.div animate={{ y: [0, -3.5, 0] }} transition={{ repeat: Infinity, duration: 2.8, ease: "easeInOut" }} className="flex items-center gap-1.5 px-2.5 py-1 border border-[#1e1e1e] bg-white shadow-2xs select-none">
            <motion.span animate={{ scale: [1, 1.35, 1] }} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }} className={cn("h-2 w-2 rounded-full", currentTypeConfig.dotColor)} />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#1e1e1e]">{currentTypeConfig.tag}</span>
          </motion.div>

          <motion.div animate={{ y: [0, -2.5, 0], rotate: [0, 1.5, -1.5, 0] }} transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }} className="flex items-center gap-1.5 text-[10px] font-bold text-[#555555] bg-[#f4f4f4] px-2.5 py-1 border border-[#1e1e1e] select-none">
            <Sparkles className="h-3 w-3 text-[#ff5722]" />
            <span className="uppercase tracking-wider">Fast Track</span>
          </motion.div>
        </div>

        {/* Toggle Types */}
        <div className="grid grid-cols-4 border border-[#1e1e1e] bg-[#f4f4f4] p-0 relative overflow-hidden select-none">
          {TRANSACTION_TYPES.map((t) => {
            const isSelected = type === t.id;
            const Icon = t.icon;
            return (
              <motion.button key={t.id} type="button" onClick={() => setType(t.id)} whileHover={{ y: -1 }} whileTap={{ scale: 0.95 }} className={cn("relative py-2.5 px-1 text-xs font-bold flex flex-col items-center gap-1 transition-colors border-r last:border-r-0 border-[#1e1e1e] z-10 cursor-pointer", isSelected ? "text-white" : "text-[#555555] hover:text-[#1e1e1e] hover:bg-[#ebebeb]/60")}>
                {isSelected && <motion.div layoutId="activeQuickAddType" className={cn("absolute inset-0 z-[-1]", t.activeColor)} transition={{ type: "spring", stiffness: 450, damping: 32 }} />}
                <motion.div animate={isSelected ? { scale: [0.9, 1.15, 1] } : { scale: 1 }} transition={{ duration: 0.25 }}>
                  <Icon className="h-4 w-4 stroke-[2.2]" />
                </motion.div>
                <span>{t.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Amount Input */}
        <div className="relative">
          <motion.span animate={{ scale: amount ? [1, 1.12, 1] : 1 }} transition={{ duration: 0.2 }} className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-xl text-[#555555] select-none">
            Rp
          </motion.span>
          <Input
            ref={amountRef}
            type="tel"
            placeholder="0"
            value={amount}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^0-9]/g, "");
              if (raw === "") {
                setAmount("");
              } else {
                setAmount(Number(raw).toLocaleString("id-ID"));
              }
            }}
            className="pl-14 pr-4 text-2xl font-black h-14 tracking-wide text-[#ff5722] no-spinner border border-[#1e1e1e] bg-white transition-all focus:bg-[#fafafa]"
          />
        </div>

        {/* Quick Amount Helpers */}
        <div className="grid grid-cols-4 gap-2">
          {[10000, 20000, 50000, 100000].map((val) => (
            <motion.button key={val} type="button" whileHover={{ scale: 1.03, y: -1.5 }} whileTap={{ scale: 0.94 }} onClick={() => handleQuickAmount(val)} className="py-1.5 border border-[#1e1e1e] bg-[#ffffff] text-[#1e1e1e] hover:bg-[#1e1e1e] hover:text-white text-xs font-black transition-colors cursor-pointer shadow-2xs select-none">
              +{val / 1000}k
            </motion.button>
          ))}
        </div>

        {/* ── AI Scan Struk Button dengan Animasi & Styling Elegan ───── */}
        {(type === "expense" || type === "income") && (
          <div className="flex flex-col gap-1.5">
            <motion.label whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} className="relative flex items-center justify-center gap-2.5 py-3 border-2 border-[#1e1e1e] cursor-pointer select-none transition-all font-bold text-sm bg-gradient-to-r from-[#fafafa] via-white to-[#fafafa] hover:bg-[#e64a19] hover:text-[#1e1e1e] hover:border-[#ff5722] text-[#1e1e1e] shadow-xs group overflow-hidden">
              {/* Efek kilau cahaya elegan saat di-hover */}
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none" />

              <ScanLine className="h-4 w-4 shrink-0 text-[#ff5722] group-hover:text-[#1e1e1e] transition-colors" />
              <span className="uppercase tracking-wider text-[11px] font-black">Scan Struk Belanja (AI)</span>
              <input ref={scanInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanReceipt} />
            </motion.label>

            {/* 🌟 Notifikasi Sukses Elegan (Popup Notification) */}
            <AnimatePresence>
              {scanSuccess && (
                <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} className="flex items-center gap-2 p-2.5 border-2 border-[#356342] bg-[#356342]/10 text-[#356342] text-xs font-bold">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{scanSuccess}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* API Key Prompt Modal */}
        <AnimatePresence>
          {showApiKeyPrompt && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="border-2 border-[#1e1e1e] bg-[#fafafa] p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-[#ff5722] shrink-0" />
                  <p className="text-xs font-black uppercase tracking-wider text-[#1e1e1e]">404</p>
                </div>
                <button type="button" onClick={() => setShowApiKeyPrompt(false)} className="text-[#555] hover:text-[#1e1e1e] cursor-pointer">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[11px] text-[#555555] leading-relaxed">
                Fitur Scan Struk AI saat ini tidak bisa mengunggah gambar, Coba beberapa saat lagi.{" "}
                {/* <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[#ff5722] underline font-bold">
                  Dapatkan di sini →
                </a> */}
              </p>
              <div className="flex gap-2">
                <input type="password" placeholder="Tempel API Key kamu di sini..." value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSaveApiKey()} className="flex-1 border border-[#1e1e1e] bg-white px-3 py-2 text-xs font-mono outline-none focus:border-[#ff5722]" />
                <button type="button" onClick={handleSaveApiKey} disabled={!apiKeyInput.trim()} className="px-4 py-2 bg-[#1e1e1e] text-white text-xs font-black uppercase tracking-wider hover:bg-[#ff5722] transition-colors disabled:opacity-40 cursor-pointer">
                  Simpan
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-[#a53a2b] font-bold text-center bg-[#a53a2b]/10 border border-[#a53a2b] p-2">
            {error}
          </motion.p>
        )}

        {/* Dynamic Fields */}
        <AnimatePresence mode="wait">
          <motion.div key={type} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="flex flex-col gap-4">
            {type === "transfer" ? (
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Dari Dompet"
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  options={activeWallets.map((w) => ({
                    value: w.id,
                    label: `${w.name} (Saldo: Rp${w.balance.toLocaleString("id-ID")})`,
                  }))}
                />
                <Select label="Ke Dompet" value={transferWalletId} onChange={(e) => setTransferWalletId(e.target.value)} options={activeWallets.map((w) => ({ value: w.id, label: `${w.name}` }))} />
              </div>
            ) : (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Select
                    label="Gunakan Dompet"
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    options={
                      activeWallets.length > 0
                        ? activeWallets.map((w) => ({
                            value: w.id,
                            label: `${w.name} (Saldo: Rp${w.balance.toLocaleString("id-ID")})`,
                          }))
                        : [{ value: "", label: "Belum ada dompet" }]
                    }
                  />
                </div>
                <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose();
                      openWalletModal("add");
                    }}
                    className="h-11 px-3 cursor-pointer"
                    title="Tambah Dompet Baru"
                  >
                    + Baru
                  </Button>
                </motion.div>
              </div>
            )}

            {type !== "savings" && type !== "debt_payment" && type !== "transfer" && (
              <div className="grid grid-cols-2 gap-3">
                <Select label="Kategori" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} options={filteredCategories.map((c) => ({ value: c.id, label: c.name }))} />
                <Select label="Subkategori" value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)} options={[{ value: "", label: "-- Pilih Subkategori --" }, ...filteredSubCategories.map((sc) => ({ value: sc.id, label: sc.name }))]} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input type="date" label="Tanggal" value={date} onChange={(e) => setDate(e.target.value)} />
              <Input type="text" label="Catatan" placeholder="Makanan, bensin, dll." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            {(type === "expense" || type === "income") && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#555555]">Foto Bukti Transaksi ({receiptUrls.length}/8 Foto)</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {receiptUrls.length < 8 && (
                    <motion.label whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.95 }} className="h-14 px-3 border border-[#1e1e1e] bg-[#fafafa] hover:bg-[#ffffff] flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors text-[10px] font-bold text-[#1e1e1e] shadow-2xs">
                      <Camera className="h-4 w-4 text-[#ff5722]" />
                      <span>+ Tambah</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                    </motion.label>
                  )}
                  <AnimatePresence>
                    {receiptUrls.map((url, idx) => (
                      <motion.div key={url + idx} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ type: "spring", stiffness: 350, damping: 25 }} className="relative h-14 w-14 border border-[#1e1e1e] group overflow-hidden bg-black/5">
                        <img src={url} alt={`Bukti ${idx + 1}`} className="h-full w-full object-cover" />
                        <button type="button" onClick={() => handleRemovePhoto(idx)} className="absolute inset-0 bg-black/70 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold text-[9px] transition-opacity cursor-pointer">
                          Hapus
                        </button>
                        <span className="absolute bottom-0 right-0 bg-[#1e1e1e] text-white text-[8px] px-1 font-bold">#{idx + 1}</span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
          <Button type="submit" loading={loading} className="h-12 w-full mt-2 font-bold text-sm cursor-pointer">
            Simpan Catatan
          </Button>
        </motion.div>
      </form>
    </Dialog>
  );
};

export default QuickAddModal;
