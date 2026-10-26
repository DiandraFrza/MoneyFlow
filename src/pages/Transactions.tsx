/** @format */

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useFinanceStore } from "../store/financeStore";
import { useAuthStore } from "../store/authStore";
import { useFinancialHealth } from "../hooks/useFinancialHealth";
import { exportToExcel, exportToPDF } from "../lib/exportServices";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { BeginnerGuide } from "../components/ui/BeginnerGuide";
import { Button } from "../components/ui/button";
import { Search, Download, Trash2, Calendar, Eye, Mailbox, ArrowUpRight, ArrowDownLeft, PiggyBank, Scale, Users } from "lucide-react";
import { LazyViewport } from "../components/ui/lazy-viewport";
import { useConfirm } from "../store/confirmStore";
import { useToastStore } from "../store/toastStore";
import { scaleInVariant } from "../utils/animation";

export const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const { user, workspaces, activeWorkspaceId, activeRole } = useAuthStore();
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const isSharedWorkspace = activeWorkspace?.type === "couple" || activeWorkspace?.type === "family" || (activeWorkspace?.members && activeWorkspace.members.length > 1);
  const { transactions, transfers, wallets, categories, subcategories, deleteTransaction, budgets, savings, debts } = useFinanceStore();
  const health = useFinancialHealth();
  const confirm = useConfirm();
  const { showToast } = useToastStore();

  // Search & Filters State
  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<string>("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Receipt Preview Lightbox Gallery (supports up to 8 photos)
  const [previewGallery, setPreviewGallery] = useState<{ urls: string[]; activeIndex: number } | null>(null);

  // Mappings for ease of display
  const walletMap = useMemo(() => new Map(wallets.map((w) => [w.id, w])), [wallets]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const subCategoryMap = useMemo(() => new Map(subcategories.map((s) => [s.id, s])), [subcategories]);

  // Handle transaction deletion
  const handleDelete = async (id: string) => {
    if (!user) return;
    const confirmed = await confirm({
      title: "Hapus Transaksi",
      message: "Apakah Anda yakin ingin menghapus catatan transaksi ini? Saldo dompet Anda akan disesuaikan kembali secara otomatis.",
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
      type: "danger",
    });
    if (confirmed) {
      await deleteTransaction(user.id, id);
      showToast("Transaksi berhasil dihapus!", "success");
    }
  };

  // Filter & Sort Logic
  const filteredAndSortedTransactions = useMemo(() => {
    const mappedTransfers = transfers.map((tf) => ({
      id: tf.id,
      user_id: tf.user_id,
      wallet_id: tf.from_wallet_id,
      category_id: null,
      sub_category_id: null,
      type: "transfer" as any,
      amount: tf.amount,
      description: `${tf.description || "Transfer"} (Ke: ${walletMap.get(tf.to_wallet_id)?.name || "?"})`,
      date: tf.date,
      created_at: tf.created_at,
      receipt_url: undefined,
      receipt_urls: undefined as string[] | undefined,
      created_by_name: (tf as any).created_by_name || undefined,
    }));

    let result = [...transactions, ...mappedTransfers];

    // 1. Search text filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => {
        const desc = (t.description || "").toLowerCase();
        const cat = categoryMap.get(t.category_id || "")?.name.toLowerCase() || "";
        const sub = subCategoryMap.get(t.sub_category_id || "")?.name.toLowerCase() || "";
        return desc.includes(q) || cat.includes(q) || sub.includes(q);
      });
    }

    // 2. Transaction Type Filter
    if (filterType !== "all") {
      result = result.filter((t) => t.type === filterType);
    }

    // 3. Period Filter
    const today = new Date();
    result = result.filter((t) => {
      const txDate = new Date(t.date + "T12:00:00");
      if (filterPeriod === "today") {
        const todayStr = new Date().toISOString().split("T")[0];
        return t.date === todayStr;
      }
      if (filterPeriod === "week") {
        const diffTime = today.getTime() - txDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      if (filterPeriod === "month") {
        return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
      }
      if (filterPeriod === "year") {
        return txDate.getFullYear() === today.getFullYear();
      }
      if (filterPeriod === "custom") {
        if (customStart && customEnd) {
          return t.date >= customStart && t.date <= customEnd;
        }
      }
      return true;
    });

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy === "newest") return b.date.localeCompare(a.date);
      if (sortBy === "oldest") return a.date.localeCompare(b.date);
      if (sortBy === "highest") return b.amount - a.amount;
      if (sortBy === "lowest") return a.amount - b.amount;
      return 0;
    });

    return result;
  }, [transactions, transfers, search, filterPeriod, customStart, customEnd, filterType, sortBy, categoryMap, subCategoryMap, walletMap]);

  // Export handlers
  const handleExportExcel = () => {
    if (!user) return;
    exportToExcel({
      profile: user,
      wallets,
      transactions,
      budgets,
      savings,
      debts,
      categories,
    });
  };

  const handleExportPDF = () => {
    if (!user) return;
    exportToPDF(
      {
        profile: user,
        wallets,
        transactions,
        budgets,
        savings,
        debts,
        categories,
      },
      health.score,
      health.status,
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <BeginnerGuide pageKey="transactions" />

      {/* ---------------------------------------------------------------------
          FILTER PANEL & CONTROLS
          --------------------------------------------------------------------- */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card>
          <CardContent className="p-5 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mutedLight dark:text-text-mutedDark">
                  <Search className="h-4.5 w-4.5" />
                </span>
                <Input type="text" placeholder="Cari deskripsi, kategori, dll..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11" />
              </div>
              {/* Export & Split Bill Buttons */}
              <div className="flex flex-wrap gap-2">
                <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="flex-1 md:flex-none">
                  <Button onClick={() => navigate("/split-bill")} variant="outline" size="sm" className="w-full gap-2 font-bold h-11 text-xs border-2 border-[#1e1e1e] bg-[#fafafa] hover:bg-[#ff5722] hover:text-white transition-colors">
                    <Users className="h-4 w-4 text-[#ff5722]" />
                    Split Bill
                  </Button>
                </motion.div>
                <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="flex-1 md:flex-none">
                  <Button onClick={handleExportExcel} variant="outline" size="sm" className="w-full gap-2 font-bold h-11 text-xs">
                    <Download className="h-4 w-4" />
                    Excel
                  </Button>
                </motion.div>
                <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }} className="flex-1 md:flex-none">
                  <Button onClick={handleExportPDF} variant="outline" size="sm" className="w-full gap-2 font-bold h-11 text-xs">
                    <Download className="h-4 w-4" />
                    PDF Report
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Detailed Filters row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Select
                label="Periode Waktu"
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                options={[
                  { value: "all", label: "Semua Waktu" },
                  { value: "today", label: "Hari Ini" },
                  { value: "week", label: "7 Hari Terakhir" },
                  { value: "month", label: `Bulan Ini (${new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date())})` },
                  { value: "year", label: `Tahun Ini (${new Date().getFullYear()})` },
                  { value: "custom", label: "Rentang Kustom" },
                ]}
              />
              <Select
                label="Jenis Aliran"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                options={[
                  { value: "all", label: "Semua Jenis" },
                  { value: "expense", label: "Pengeluaran" },
                  { value: "income", label: "Pemasukan" },
                  { value: "savings", label: "Tabungan" },
                  { value: "debt_payment", label: "Bayar Utang" },
                  { value: "installment", label: "Cicilan" },
                ]}
              />
              <Select
                label="Urutkan"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={[
                  { value: "newest", label: "Tanggal Terbaru" },
                  { value: "oldest", label: "Tanggal Terlama" },
                  { value: "highest", label: "Nominal Terbesar" },
                  { value: "lowest", label: "Nominal Terkecil" },
                ]}
              />
            </div>

            {/* Custom Date Range Picker with AnimatePresence */}
            <AnimatePresence>
              {filterPeriod === "custom" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="grid grid-cols-2 gap-3 p-3 bg-[#f4f4f4] border border-[#1e1e1e]">
                    <Input type="date" label="Tanggal Mulai" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                    <Input type="date" label="Tanggal Selesai" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* ---------------------------------------------------------------------
          TRANSACTION LISTING
          --------------------------------------------------------------------- */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-[#555555] uppercase tracking-wider">MENAMPILKAN {filteredAndSortedTransactions.length} TRANSAKSI</span>
        </div>

        {filteredAndSortedTransactions.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
            <Card className="py-16 border border-[#1e1e1e] bg-[#fafafa]">
              <CardContent className="flex flex-col items-center justify-center gap-3">
                <div className="h-12 w-12 border border-[#1e1e1e] bg-[#f4f4f4] flex items-center justify-center">
                  <Mailbox className="h-6 w-6 text-[#1e1e1e]" />
                </div>
                <h3 className="font-bold text-sm text-[#1e1e1e]">Tidak ada transaksi ditemukan</h3>
                <p className="text-xs text-[#555555] text-center max-w-xs leading-normal">Ubah filter pencarian Anda atau tambahkan transaksi baru menggunakan tombol tambah.</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <LazyViewport height="300px" className="w-full">
            <div className="flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {filteredAndSortedTransactions.map((tx, idx) => {
                  const wallet = walletMap.get(tx.wallet_id);
                  const category = categoryMap.get(tx.category_id || "");
                  const subcat = subCategoryMap.get(tx.sub_category_id || "");

                  return (
                    <motion.div layout key={tx.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }} transition={{ duration: 0.2, delay: Math.min(idx * 0.03, 0.3) }} whileHover={{ x: 4 }} className="p-4 border border-[#1e1e1e] bg-[#fafafa] hover:bg-[#ffffff] flex items-center justify-between gap-4 transition-colors">
                      {/* Left Side: Type Icon, Category & Details */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="h-10 w-10 border border-[#1e1e1e] flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: category?.color || wallet?.color || "#ff5722" }}>
                          {tx.type === "income" && <ArrowUpRight className="h-5 w-5" />}
                          {tx.type === "expense" && <ArrowDownLeft className="h-5 w-5" />}
                          {tx.type === "savings" && <PiggyBank className="h-5 w-5" />}
                          {tx.type === "debt_payment" && <Scale className="h-5 w-5" />}
                          {tx.type === "installment" && <Calendar className="h-5 w-5" />}
                          {(tx.type as any) === "transfer" && <ArrowUpRight className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[#1e1e1e] truncate leading-tight tracking-tight">{tx.description || category?.name || "Catatan Kosong"}</h4>
                            {(() => {
                              const photos = tx.receipt_urls && tx.receipt_urls.length > 0 ? tx.receipt_urls : tx.receipt_url ? [tx.receipt_url] : [];
                              if (photos.length === 0) return null;
                              return (
                                <button onClick={() => setPreviewGallery({ urls: photos, activeIndex: 0 })} className="inline-flex items-center gap-1 text-[#ff5722] hover:text-[#1e1e1e] px-1.5 py-0.5 border border-[#1e1e1e] hover:bg-[#ffffff] text-[10px] font-bold bg-[#fafafa] cursor-pointer" title="Lihat Foto Bukti">
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Struk{photos.length > 1 ? ` (${photos.length})` : ""}</span>
                                </button>
                              );
                            })()}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[11px] text-[#555555]">
                            <span className="font-bold uppercase tracking-wider bg-[#ffffff] border border-[#1e1e1e] px-1.5 py-0.2 text-[9px] text-[#1e1e1e]">{wallet?.name || "Rekening"}</span>
                            {category && <span className="font-medium">· {category.name}</span>}
                            {subcat && <span className="font-medium">· {subcat.name}</span>}
                            <span className="font-medium">· {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                            {(tx.created_by_name || (tx as any).actor_name) && isSharedWorkspace && (
                              <span className="font-bold uppercase tracking-wider bg-[#f4f4f4] border border-[#1e1e1e] px-1.5 py-0.2 text-[9px] text-[#1e1e1e]">
                                Oleh: {tx.created_by_name || (tx as any).actor_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Amount & Delete Button */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <h4 className={`text-sm font-bold text-right tracking-tight ${tx.type === "income" ? "text-[#356342]" : "text-[#a53a2b]"}`}>
                          {tx.type === "income" ? "+" : "−"} Rp{tx.amount.toLocaleString("id-ID")}
                        </h4>
                        {activeRole !== "viewer" && (
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(tx.id)} className="h-8 w-8 border border-[#1e1e1e] bg-[#ffffff] text-[#1e1e1e] hover:bg-[#a53a2b] hover:text-white flex items-center justify-center transition-colors cursor-pointer" title="Hapus Transaksi">
                          <Trash2 className="h-4 w-4" />
                        </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </LazyViewport>
        )}
      </div>

      {/* ---------------------------------------------------------------------
          LIGHTBOX RECEIPT PREVIEW MODAL (SWISS STYLE + ANIMATED)
          --------------------------------------------------------------------- */}
      <AnimatePresence>
        {previewGallery && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75" onClick={() => setPreviewGallery(null)}>
            <motion.div variants={scaleInVariant} initial="hidden" animate="visible" exit="exit" onClick={(e) => e.stopPropagation()} className="relative max-w-2xl w-full bg-[#f4f4f4] border-2 border-[#1e1e1e] p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-3">
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-[#1e1e1e]">Bukti Transaksi</h3>
                  <span className="text-[11px] text-[#555555] font-semibold">
                    Foto {previewGallery.activeIndex + 1} dari {previewGallery.urls.length}
                  </span>
                </div>
                <button onClick={() => setPreviewGallery(null)} className="h-8 px-3 border border-[#1e1e1e] bg-[#ffffff] hover:bg-[#1e1e1e] hover:text-white text-xs font-bold transition-colors cursor-pointer">
                  Tutup [ESC]
                </button>
              </div>

              <div className="relative border border-[#1e1e1e] bg-black/5 flex items-center justify-center min-h-[260px] max-h-[60vh] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img key={previewGallery.activeIndex} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.15 }} src={previewGallery.urls[previewGallery.activeIndex]} alt={`Bukti transaksi ${previewGallery.activeIndex + 1}`} className="max-h-[58vh] max-w-full object-contain" />
                </AnimatePresence>
              </div>

              {/* Thumbnail Navigation if more than 1 image */}
              {previewGallery.urls.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1">
                  {previewGallery.urls.map((url, i) => (
                    <button key={i} onClick={() => setPreviewGallery({ ...previewGallery, activeIndex: i })} className={`relative h-14 w-14 flex-shrink-0 border cursor-pointer transition-opacity ${previewGallery.activeIndex === i ? "border-2 border-[#ff5722]" : "border-[#1e1e1e] opacity-60 hover:opacity-100"}`}>
                      <img src={url} alt={`Thumbnail ${i + 1}`} className="h-full w-full object-cover" />
                      <span className="absolute bottom-0 right-0 bg-[#1e1e1e] text-white text-[8px] font-bold px-1">#{i + 1}</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Transactions;
