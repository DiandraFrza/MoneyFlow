/** @format */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronDown, ChevronUp, X, Sparkles, Wallet, BarChart3, Search, Tag, Trash2, CreditCard, Repeat2, Users, CircleDollarSign, TrendingUp, Target, BadgeCheck, Plus } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

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
    title: "PANDUAN PEMULA - DASHBOARD",
    subtitle: "Halaman ini adalah mading keuangan Anda yang menampilkan ringkasan saldo, statistik bulanan, dan arus kas.",
    items: [
      {
        icon: CircleDollarSign,
        title: "Total Saldo",
        description: "Akumulasi saldo nyata dari seluruh dompet, rekening bank, dan e-wallet Anda.",
      },
      {
        icon: BarChart3,
        title: "Pemasukan vs Pengeluaran",
        description: "Perbandingan uang masuk versus keluar bulan ini. Keuangan sehat menjaga pemasukan di atas pengeluaran.",
      },
      {
        icon: TrendingUp,
        title: "Grafik Tren 7 Hari",
        description: "Pemantauan ritme pengeluaran harian agar Anda dapat mengantisipasi lonjakan belanja mingguan.",
      },
      {
        icon: BadgeCheck,
        title: "Notifikasi Pintar",
        description: "Peringatan otomatis saat anggaran menipis, utang mendekati jatuh tempo, atau tagihan rutin tiba.",
      },
    ],
  },
  transactions: {
    title: "PANDUAN PEMULA - DAFTAR TRANSAKSI",
    subtitle: "Buku kas digital presisi. Seluruh arus masuk, keluar, dan transfer tercatat terstruktur di sini.",
    items: [
      {
        icon: Plus,
        title: "Catat Transaksi",
        description: "Setiap transaksi yang dicatat akan langsung menyesuaikan saldo dompet yang bersangkutan.",
      },
      {
        icon: Search,
        title: "Cari & Filter Presisi",
        description: "Filter riwayat berdasarkan periode waktu, jenis aliran dana, atau kata kunci deskripsi dan kategori.",
      },
      {
        icon: Tag,
        title: "Kategori & Sub-Kategori",
        description: "Strukturkan transaksi ke dalam pos kategori untuk mempermudah evaluasi anggaran bulanan.",
      },
      {
        icon: Trash2,
        title: "Koreksi Transaksi",
        description: "Penghapusan transaksi akan mengembalikan saldo dompet secara otomatis tanpa perhitungan manual.",
      },
    ],
  },
  reports: {
    title: "PANDUAN PEMULA - ANALISIS KEUANGAN",
    subtitle: "Evaluasi kesehatan finansial Anda melalui metrik, proporsi kategori, dan tren bulanan.",
    items: [
      {
        icon: BarChart3,
        title: "Proporsi Kategori",
        description: "Visualisasi porsi belanja untuk mengidentifikasi pos pengeluaran terbesar Anda.",
      },
      {
        icon: BadgeCheck,
        title: "Skor Kesehatan Finansial",
        description: "Indikator otomatis berbasis rasio tabungan, kestabilan belanja, dan pengelolaan utang.",
      },
      {
        icon: TrendingUp,
        title: "Tren Arus Kas Bulanan",
        description: "Perbandingan performa keuangan dari bulan ke bulan untuk memastikan efisiensi tabungan.",
      },
      {
        icon: Target,
        title: "Batas Anggaran",
        description: "Pemantauan real-time terhadap limit belanja per kategori sebelum anggaran terlampaui.",
      },
    ],
  },
  settings: {
    title: "PANDUAN PEMULA - PENGATURAN",
    subtitle: "Pusat kendali konfigurasi: dompet, limit anggaran, utang/piutang, tagihan rutin, dan kategori.",
    items: [
      {
        icon: Wallet,
        title: "Kelola Dompet",
        description: "Daftarkan rekening bank, dompet tunai, maupun e-wallet dengan saldo terpisah yang presisi.",
      },
      {
        icon: BarChart3,
        title: "Limit Anggaran",
        description: "Tetapkan batas maksimal pengeluaran bulanan per kategori untuk mengontrol gaya hidup.",
      },
      {
        icon: CreditCard,
        title: "Sistem Utang & Cicilan",
        description: "Catat utang atau piutang dengan nominal cicilan dan pantau status pelunasannya.",
      },
      {
        icon: Repeat2,
        title: "Transaksi Rutin",
        description: "Jadwalkan tagihan bulanan (listrik, internet, sewa) agar otomatis tercatat pada tanggalnya.",
      },
      {
        icon: Users,
        title: "Akun Bersama (Joint)",
        description: "Hubungkan akun dengan pasangan untuk mengelola keuangan keluarga dalam satu sistem.",
      },
    ],
  },
};

export const BeginnerGuide: React.FC<BeginnerGuideProps> = ({ pageKey }) => {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // -------------------------------------------------------------------------
  // Logika: Panduan aktif selama 7 hari pertama akun.
  // Jika di-close sebelum 7 hari, akan muncul lagi setelah 12 jam (tidak hilang selamanya).
  // Jika akun sudah > 7 hari aktif, panduan hilang permanen.
  // -------------------------------------------------------------------------
  useEffect(() => {
    // 1. Hitung usia akun
    let firstSeen = localStorage.getItem("mf_account_first_seen");
    if (!firstSeen) {
      firstSeen = user?.created_at || new Date().toISOString();
      localStorage.setItem("mf_account_first_seen", firstSeen);
    }

    const accountAgeMs = Date.now() - new Date(firstSeen).getTime();
    const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);

    // Jika akun sudah aktif lebih dari 7 hari (1 minggu), sembunyikan selamanya
    if (accountAgeDays >= 7) {
      setIsVisible(false);
      return;
    }

    // Jika akun masih baru (< 7 hari), periksa apakah baru saja di-close sementara
    const dismissedAtStr = localStorage.getItem(`guide_dismissed_at_${pageKey}`);
    if (dismissedAtStr) {
      const dismissedAt = parseInt(dismissedAtStr, 10);
      const hoursSinceDismiss = (Date.now() - dismissedAt) / (1000 * 60 * 60);

      // Muncul kembali setelah 12 jam jika belum lewat 7 hari
      if (hoursSinceDismiss < 12) {
        setIsVisible(false);
        return;
      } else {
        // Sudah lewat 12 jam, hapus dismiss sementara agar panduan muncul kembali
        localStorage.removeItem(`guide_dismissed_at_${pageKey}`);
      }
    }

    setIsVisible(true);
  }, [pageKey, user?.created_at]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
    // Simpan timestamp di-close agar muncul lagi setelah 12 jam (selama akun < 7 hari)
    localStorage.setItem(`guide_dismissed_at_${pageKey}`, Date.now().toString());
  };

  const data = GUIDE_DATA[pageKey];
  if (!data || !isVisible) return null;

  return (
    <div className="mb-6 select-none">
      <div className="border border-[#1e1e1e] bg-[#fafafa]">
        {/* Header Bar */}
        <div onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between gap-4 px-5 py-3.5 cursor-pointer bg-[#f4f4f4] hover:bg-[#ebebeb] transition-colors">
          <div className="flex items-center gap-3 min-w-0">
            {/* Square Icon Badge */}
            <div className="h-8 w-8 shrink-0 border border-[#1e1e1e] bg-[#ff5722] text-white flex items-center justify-center">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[#1e1e1e] tracking-tight">{data.title}</h3>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border border-[#1e1e1e] bg-[#ffffff] text-[#ff5722] hidden sm:inline-block">Aktif 7 Hari</span>
              </div>
              {!isOpen && <p className="text-[11px] text-[#555555] font-medium truncate mt-0.5">{data.subtitle}</p>}
            </div>
          </div>

          {/* Action buttons (Sharp, Swiss Style) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={handleDismiss} className="h-7 w-7 border border-[#1e1e1e] bg-[#ffffff] text-[#1e1e1e] hover:bg-[#1e1e1e] hover:text-white flex items-center justify-center transition-colors" title="Tutup sementara (muncul lagi setelah beberapa waktu)">
              <X className="h-3.5 w-3.5" />
            </button>
            <button type="button" className="h-7 w-7 border border-[#1e1e1e] bg-[#ffffff] text-[#1e1e1e] hover:bg-[#1e1e1e] hover:text-white flex items-center justify-center transition-colors">
              {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Content Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18, ease: "easeInOut" }} className="overflow-hidden border-t border-[#1e1e1e]">
              <div className="p-5">
                <p className="text-xs text-[#555555] font-medium mb-4 leading-relaxed">{data.subtitle}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border-t border-l border-[#1e1e1e]">
                  {data.items.map((item, i) => (
                    <div key={i} className="p-4 bg-[#ffffff] border-r border-b border-[#1e1e1e] flex gap-3.5 items-start hover:bg-[#f9f9f9] transition-colors">
                      <div className="h-8 w-8 shrink-0 border border-[#1e1e1e] bg-[#fafafa] flex items-center justify-center text-[#ff5722] mt-0.5">{React.createElement(item.icon, { className: "h-4 w-4" })}</div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#1e1e1e] tracking-tight">{item.title}</h4>
                        <p className="text-[11px] text-[#555555] font-normal leading-relaxed mt-1">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] text-[#777777] font-medium pt-2 border-t border-[#e5e5e5]">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-[#ff5722]" />
                    Panduan akan otomatis berhenti muncul setelah akun Anda aktif lebih dari 7 hari.
                  </span>
                  <button onClick={handleDismiss} className="text-[10px] font-bold text-[#1e1e1e] hover:text-[#ff5722] underline cursor-pointer uppercase tracking-wider">
                    Tutup Sekarang
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
