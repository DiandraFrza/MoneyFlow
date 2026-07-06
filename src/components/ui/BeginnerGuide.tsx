/** @format */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronDown, ChevronUp, X, Sparkles, Wallet, BarChart3, Search, Tag, Trash2, CreditCard, Repeat2, Users, CircleDollarSign, TrendingUp, Target, BadgeCheck, Plus } from "lucide-react";

interface GuideItem {
  icon: React.ElementType;
  title: string;
  description: string;
}

interface BeginnerGuideProps {
  pageKey: "dashboard" | "transactions" | "reports" | "settings";
}

const GUIDE_DATA: Record<string, { title: string; subtitle: string; items: GuideItem[] }> = {
  dashboard: {
    title: "Panduan Pemula — Dashboard",
    subtitle: "Halaman ini adalah 'mading keuangan' kamu. Seperti papan pengumuman yang menampilkan semua info penting uangmu!",
    items: [
      {
        icon: CircleDollarSign,
        title: "Total Saldo",
        description: "Ini kayak isi dompet kamu yang kelihatan semua. Kalau angka di sini besar, berarti uangmu masih banyak! Contoh: Kamu punya Rp2.000.000 dari gaji + tabungan.",
      },
      {
        icon: BarChart3,
        title: "Pemasukan vs Pengeluaran",
        description: "Ini kayak pertandingan skor antara uang masuk vs uang keluar bulan ini. Yang bagus itu kalau pemasukan > pengeluaran. Contoh: Gaji Rp5.000.000, belanja cuma Rp3.000.000 → sehat!",
      },
      {
        icon: TrendingUp,
        title: "Grafik Tren",
        description: "Ini kayak laporan rapor keuangan kamu per hari/minggu. Bisa lihat kapan kamu paling boros. Contoh: Tiap weekend belanja lebih banyak? Bisa keliatan di sini!",
      },
      {
        icon: BadgeCheck,
        title: "Notifikasi Pintar",
        description: "Kayak alarm yang ngingetin kalau utang mau jatuh tempo, anggaran mau habis, atau tagihan otomatis masuk. Contoh: 'Utang ke Budi jatuh tempo besok!'",
      },
    ],
  },
  transactions: {
    title: "Panduan Pemula — Daftar Transaksi",
    subtitle: "Halaman ini kayak 'buku kas' digital. Semua uang masuk dan keluar tercatat rapi di sini!",
    items: [
      {
        icon: Plus,
        title: "Catat Transaksi Baru",
        description: "Setiap kali kamu beli sesuatu atau dapat uang, catat di sini. Kayak nulis di buku catatan harian. Contoh: 'Beli Nasi Goreng Rp15.000 pakai dompet tunai'.",
      },
      {
        icon: Search,
        title: "Cari & Filter",
        description: "Bisa cari transaksi tertentu pakai kata kunci atau filter berdasarkan waktu. Contoh: Mau lihat semua pengeluaran minggu lalu? Tinggal filter aja!",
      },
      {
        icon: Tag,
        title: "Kategori & Sub-Kategori",
        description: "Setiap transaksi punya label. Jadi kamu tahu uang habis buat apa. Contoh: Kategori 'Makanan' → Sub: 'Sarapan', 'Makan Siang', 'Jajanan'.",
      },
      {
        icon: Trash2,
        title: "Hapus Transaksi",
        description: "Salah catat? Bisa dihapus kok. Saldo dompetmu otomatis disesuaikan lagi. Contoh: Kamu salah input Rp50.000, hapus aja, uang balik ke saldo.",
      },
    ],
  },
  reports: {
    title: "Panduan Pemula — Analisis Keuangan",
    subtitle: "Halaman ini kayak 'rapor duit'. Kamu bisa lihat nilai keuanganmu apakah sehat atau butuh perbaikan!",
    items: [
      {
        icon: BarChart3,
        title: "Pie Chart Pengeluaran",
        description: "Lingkaran warna-warni yang nunjukin kemana aja uangmu pergi. Contoh: 40% makanan, 20% transportasi, 15% hiburan.",
      },
      {
        icon: BadgeCheck,
        title: "Skor Kesehatan Keuangan",
        description: "Nilai 0-100 yang nunjukin seberapa sehat keuanganmu. Di atas 70 = bagus! Contoh: Kalau kamu rajin nabung dan nggak boros, skornya bisa 85+.",
      },
      {
        icon: TrendingUp,
        title: "Tren Bulanan",
        description: "Grafik yang nunjukin apakah pengeluaranmu naik atau turun tiap bulan. Contoh: Bulan ini lebih hemat Rp500.000 dari bulan lalu → garis turun = bagus!",
      },
      {
        icon: Target,
        title: "Target & Budget",
        description: "Bisa lihat apakah anggaran tiap kategori masih aman atau sudah melewati batas. Contoh: Budget makan Rp2jt, sudah pakai Rp1.8jt → hati-hati!",
      },
    ],
  },
  settings: {
    title: "Panduan Pemula — Pengaturan",
    subtitle: "Halaman ini kayak 'ruang kontrol'. Kamu bisa atur dompet, utang, anggaran, dan semua pengaturan aplikasi di sini!",
    items: [
      {
        icon: Wallet,
        title: "Kelola Dompet",
        description: "Daftar semua 'tempat uang' kamu. Bisa tunai, bank, atau e-wallet. Contoh: Dompet Tunai (Rp200.000), BCA (Rp5.000.000), GoPay (Rp150.000).",
      },
      {
        icon: BarChart3,
        title: "Anggaran Bulanan",
        description: "Batasi pengeluaran per kategori biar nggak kebablasan. Contoh: Makanan max Rp2jt/bulan, Hiburan max Rp500rb/bulan.",
      },
      {
        icon: CreditCard,
        title: "Catat Utang & Piutang",
        description: "Catat siapa yang utang ke kamu, atau kamu utang ke siapa. Contoh: 'Pinjam Rp300.000 ke Budi, jatuh tempo tgl 15'.",
      },
      {
        icon: Repeat2,
        title: "Transaksi Berulang",
        description: "Tagihan otomatis yang masuk rutin setiap bulan. Contoh: 'Internet Rp350.000 setiap tanggal 5' — otomatis tercatat!",
      },
      {
        icon: Users,
        title: "Akun Bersama (Joint Account)",
        description: "Hubungkan akun dengan pasangan/keluarga. Semua transaksi tercatat bersama! Contoh: Akun Budi + Siti → lihat gabungan keuangan keluarga.",
      },
    ],
  },
};

export const BeginnerGuide: React.FC<BeginnerGuideProps> = ({ pageKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem(`guide_dismissed_${pageKey}`) === "true";
  });

  const data = GUIDE_DATA[pageKey];
  if (!data || isDismissed) return null;

  return (
    <div className="mb-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-2xl border border-amber-200/60 dark:border-amber-800/30 bg-gradient-to-br from-amber-50/80 via-yellow-50/60 to-orange-50/40 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-orange-950/10 shadow-soft-sm">
        {/* Decorative sparkle */}
        <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-amber-300/10 blur-2xl" />
        <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-yellow-300/10 blur-xl" />

        {/* Header */}
        <div onClick={() => setIsOpen(!isOpen)} className="relative flex items-center justify-between gap-3 px-5 py-3.5 cursor-pointer hover:bg-amber-100/30 dark:hover:bg-amber-900/10 transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-amber-400/20 dark:bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Lightbulb className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-black text-amber-800 dark:text-amber-300 truncate">{data.title}</h3>
              {!isOpen && <p className="text-[10px] text-amber-600/80 dark:text-amber-400/60 truncate mt-0.5">{data.subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDismissed(true);
                localStorage.setItem(`guide_dismissed_${pageKey}`, "true");
              }}
              className="h-7 w-7 rounded-lg bg-amber-200/40 hover:bg-amber-300/50 dark:bg-amber-800/30 dark:hover:bg-amber-800/50 flex items-center justify-center text-amber-600 dark:text-amber-400 transition-colors"
              title="Sembunyikan panduan"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="h-7 w-7 rounded-lg bg-amber-200/40 dark:bg-amber-800/30 flex items-center justify-center text-amber-600 dark:text-amber-400">{isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</div>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 28 }} className="overflow-hidden">
              <div className="px-5 pb-5">
                <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70 mb-4 leading-relaxed">{data.subtitle}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.items.map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="flex gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-amber-100/60 dark:border-amber-800/20">
                      <div className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400">{React.createElement(item.icon, { className: "h-4 w-4" })}</div>
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-bold text-amber-900 dark:text-amber-200">{item.title}</h4>
                        <p className="text-[10px] text-amber-700/70 dark:text-amber-400/60 leading-relaxed mt-1">{item.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 text-[10px] text-amber-600/60 dark:text-amber-400/40">
                  <Sparkles className="h-3 w-3" />
                  <span>Klik tombol X di pojok kanan untuk menyembunyikan panduan ini selamanya.</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
