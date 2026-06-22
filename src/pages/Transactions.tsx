import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { useAuthStore } from '../store/authStore';
import { useFinancialHealth } from '../hooks/useFinancialHealth';
import { exportToExcel, exportToPDF } from '../lib/exportServices';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { 
  Search, Download, Trash2, Calendar, Eye, 
  ArrowUpRight, ArrowDownLeft, PiggyBank, Scale
} from 'lucide-react';

export const Transactions: React.FC = () => {
  const { user } = useAuthStore();
  const { 
    transactions, transfers, wallets, categories, subcategories, 
    deleteTransaction, budgets, savings, debts 
  } = useFinanceStore();
  
  const health = useFinancialHealth();

  // Search & Filters State
  const [search, setSearch] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<string>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Receipt Preview Lightbox
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Mappings for ease of display
  const walletMap = useMemo(() => new Map(wallets.map(w => [w.id, w])), [wallets]);
  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
  const subCategoryMap = useMemo(() => new Map(subcategories.map(s => [s.id, s])), [subcategories]);

  // Handle transaction deletion
  const handleDelete = async (id: string) => {
    if (!user) return;
    if (window.confirm('Apakah Anda yakin ingin menghapus catatan transaksi ini? Saldo dompet Anda akan disesuaikan kembali secara otomatis.')) {
      await deleteTransaction(user.id, id);
    }
  };

  // Filter & Sort Logic
  const filteredAndSortedTransactions = useMemo(() => {
    // Merge transfers mapped to look like transactions
    const mappedTransfers = transfers.map(tf => ({
      id: tf.id,
      user_id: tf.user_id,
      wallet_id: tf.from_wallet_id,
      category_id: null,
      sub_category_id: null,
      type: 'transfer' as any,
      amount: tf.amount,
      description: `${tf.description || 'Transfer'} (Ke: ${walletMap.get(tf.to_wallet_id)?.name || '?'})`,
      date: tf.date,
      created_at: tf.created_at
    }));

    let result = [...transactions, ...mappedTransfers];

    // 1. Search text filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t => {
        const desc = (t.description || '').toLowerCase();
        const cat = categoryMap.get(t.category_id || '')?.name.toLowerCase() || '';
        const sub = subCategoryMap.get(t.sub_category_id || '')?.name.toLowerCase() || '';
        return desc.includes(q) || cat.includes(q) || sub.includes(q);
      });
    }

    // 2. Transaction Type Filter
    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }

    // 3. Period Filter
    const today = new Date();
    result = result.filter(t => {
      const txDate = new Date(t.date + 'T12:00:00');
      
      if (filterPeriod === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        return t.date === todayStr;
      }
      
      if (filterPeriod === 'week') {
        const diffTime = today.getTime() - txDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      
      if (filterPeriod === 'month') {
        return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
      }
      
      if (filterPeriod === 'year') {
        return txDate.getFullYear() === today.getFullYear();
      }
      
      if (filterPeriod === 'custom') {
        if (customStart && customEnd) {
          return t.date >= customStart && t.date <= customEnd;
        }
      }
      return true;
    });

    // 4. Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return b.date.localeCompare(a.date);
      }
      if (sortBy === 'oldest') {
        return a.date.localeCompare(b.date);
      }
      if (sortBy === 'highest') {
        return b.amount - a.amount;
      }
      if (sortBy === 'lowest') {
        return a.amount - b.amount;
      }
      return 0;
    });

    return result;
  }, [transactions, search, filterPeriod, customStart, customEnd, filterType, sortBy, categoryMap, subCategoryMap]);

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
      categories
    });
  };

  const handleExportPDF = () => {
    if (!user) return;
    exportToPDF({
      profile: user,
      wallets,
      transactions,
      budgets,
      savings,
      debts,
      categories
    }, health.score, health.status);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* ---------------------------------------------------------------------
          FILTER PANEL & CONTROLS
          --------------------------------------------------------------------- */}
      <Card>
        <CardContent className="p-5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mutedLight dark:text-text-mutedDark">
                <Search className="h-4.5 w-4.5" />
              </span>
              <Input
                type="text"
                placeholder="Cari deskripsi, kategori, dll..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleExportExcel} variant="outline" size="sm" className="flex-1 md:flex-none gap-2 font-bold h-11 text-xs">
                <Download className="h-4 w-4" />
                Excel
              </Button>
              <Button onClick={handleExportPDF} variant="outline" size="sm" className="flex-1 md:flex-none gap-2 font-bold h-11 text-xs">
                <Download className="h-4 w-4" />
                PDF Report
              </Button>
            </div>
          </div>

          {/* Detailed Filters row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Select
              label="Periode Waktu"
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              options={[
                { value: 'all', label: 'Semua Waktu' },
                { value: 'today', label: 'Hari Ini' },
                { value: 'week', label: '7 Hari Terakhir' },
                { value: 'month', label: 'Bulan Ini (Juni)' },
                { value: 'year', label: 'Tahun Ini' },
                { value: 'custom', label: 'Rentang Kustom' }
              ]}
            />
            
            <Select
              label="Jenis Aliran"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={[
                { value: 'all', label: 'Semua Jenis' },
                { value: 'expense', label: 'Pengeluaran' },
                { value: 'income', label: 'Pemasukan' },
                { value: 'savings', label: 'Tabungan' },
                { value: 'debt_payment', label: 'Bayar Utang' },
                { value: 'installment', label: 'Cicilan' }
              ]}
            />

            <Select
              label="Urutkan"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'newest', label: 'Tanggal Terbaru' },
                { value: 'oldest', label: 'Tanggal Terlama' },
                { value: 'highest', label: 'Nominal Terbesar' },
                { value: 'lowest', label: 'Nominal Terkecil' }
              ]}
            />
          </div>

          {/* Custom Date Range Picker */}
          {filterPeriod === 'custom' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/30 animate-fade-in">
              <Input
                type="date"
                label="Tanggal Mulai"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <Input
                type="date"
                label="Tanggal Selesai"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------------------------------------------------------------------
          TRANSACTION LISTING
          --------------------------------------------------------------------- */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-text-mutedLight dark:text-text-mutedDark uppercase">
            MENAMPILKAN {filteredAndSortedTransactions.length} TRANSAKSI
          </span>
        </div>

        {filteredAndSortedTransactions.length === 0 ? (
          <Card className="py-16">
            <CardContent className="flex flex-col items-center justify-center gap-3">
              <span className="text-3xl">📭</span>
              <h3 className="font-bold text-sm">Tidak ada transaksi ditemukan</h3>
              <p className="text-xs text-text-mutedLight text-center max-w-xs leading-normal">
                Ubah filter pencarian Anda atau tambahkan transaksi baru menggunakan tombol tambah di bawah.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredAndSortedTransactions.map((tx) => {
              const wallet = walletMap.get(tx.wallet_id);
              const category = categoryMap.get(tx.category_id || '');
              const subcat = subCategoryMap.get(tx.sub_category_id || '');
              
              return (
                <div
                  key={tx.id}
                  className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4 shadow-soft-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  {/* Left Side: Type Icon, Category & Details */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" 
                      style={{ backgroundColor: category?.color || wallet?.color || '#2563EB' }}
                    >
                      {tx.type === 'income' && <ArrowUpRight className="h-5 w-5" />}
                      {tx.type === 'expense' && <ArrowDownLeft className="h-5 w-5" />}
                      {tx.type === 'savings' && <PiggyBank className="h-5 w-5" />}
                      {tx.type === 'debt_payment' && <Scale className="h-5 w-5" />}
                      {tx.type === 'installment' && <Calendar className="h-5 w-5" />}
                      {(tx.type as any) === 'transfer' && <ArrowUpRight className="h-5 w-5" />}
                    </div>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black truncate leading-none">
                          {tx.description || category?.name || 'Catatan Kosong'}
                        </h4>
                        {tx.receipt_url && (
                          <button
                            onClick={() => setPreviewImage(tx.receipt_url!)}
                            className="text-primary hover:text-primary-dark p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] text-text-mutedLight dark:text-text-mutedDark">
                        <span className="font-semibold uppercase bg-slate-50 dark:bg-slate-800 px-1 py-0.5 rounded">{wallet?.name || 'Rekening'}</span>
                        {category && <span>• {category.name}</span>}
                        {subcat && <span>• {subcat.name}</span>}
                        <span>• {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Amount & Delete Button */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <h4 className={`text-sm font-black text-right ${
                      tx.type === 'income' ? 'text-success' : 'text-danger'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'} Rp{tx.amount.toLocaleString('id-ID')}
                    </h4>
                    
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 text-text-mutedLight hover:text-red-500 dark:bg-slate-800 dark:hover:bg-red-950/20 dark:text-text-mutedDark transition-all btn-pressable"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------------
          LIGHTBOX RECEIPT PREVIEW MODAL
          --------------------------------------------------------------------- */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="relative max-w-full max-h-[85vh] bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xl flex flex-col items-center">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 h-8 w-8 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-white rounded-full flex items-center justify-center shadow font-bold text-xs"
            >
              ✕
            </button>
            <img src={previewImage} alt="Bukti Transaksi" className="max-w-[90vw] max-h-[70vh] rounded-lg object-contain" />
            <span className="text-[10px] text-text-mutedLight dark:text-text-mutedDark mt-2 font-bold uppercase">Foto Bukti Transaksi Pengguna</span>
          </div>
        </div>
      )}

    </div>
  );
};
export default Transactions;
