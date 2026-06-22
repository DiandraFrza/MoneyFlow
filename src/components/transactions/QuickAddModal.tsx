/** @format */

import React, { useState, useEffect, useRef } from "react";
import { useFinanceStore } from "../../store/financeStore";
import { useAuthStore } from "../../store/authStore";
import { Dialog } from "../ui/dialog";
import { useModalStore } from "../../store/modalStore";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import type { TransactionType } from "../../types";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, PiggyBank, Camera } from "lucide-react";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const { wallets, categories, subcategories, addTransaction, addTransfer } = useFinanceStore();
  const { openWalletModal } = useModalStore();

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState<string>("");
  const [walletId, setWalletId] = useState<string>("");
  const [transferWalletId, setTransferWalletId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [subCategoryId, setSubCategoryId] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]); // tanggal hari ini
  const [description, setDescription] = useState<string>("");
  const [receiptUrl, setReceiptUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const amountRef = useRef<HTMLInputElement>(null);

  // Filter wallets and categories based on active selections
  // Deduplicate wallets by name to prevent double-seeding issues in UI
  const activeWallets = wallets.reduce((acc, current) => {
    const x = acc.find(item => item.name === current.name);
    if (!x) {
      return acc.concat([current]);
    } else {
      // If duplicate, keep the one with larger balance
      if (Math.abs(current.balance) > Math.abs(x.balance)) {
        return acc.map(item => item.name === current.name ? current : item);
      }
      return acc;
    }
  }, [] as typeof wallets);
  const filteredCategories = categories.filter((c) => c.type === (type === "income" ? "income" : "expense"));
  const filteredSubCategories = subcategories.filter((sc) => sc.category_id === categoryId);

  // Set default form values when opening
  useEffect(() => {
    if (isOpen) {
      setType("expense");
      setAmount("");
      setDescription("");
      setReceiptUrl("");
      setError("");
      setDate(new Date().toISOString().split("T")[0]); // reset ke tanggal hari ini

      if (wallets.length > 0) {
        setWalletId(wallets[0].id);
        if (wallets.length > 1) {
          setTransferWalletId(wallets[1].id);
        } else {
          setTransferWalletId(wallets[0].id);
        }
      }

      // Auto focus on amount field (mobile keyboard triggers immediately!)
      setTimeout(() => {
        amountRef.current?.focus();
      }, 250);
    }
  }, [isOpen, wallets]);

  // Adjust categories when type changes
  useEffect(() => {
    const defaultCats = categories.filter((c) => c.type === (type === "income" ? "income" : "expense"));
    if (defaultCats.length > 0) {
      setCategoryId(defaultCats[0].id);
    } else {
      setCategoryId("");
    }
  }, [type, categories]);

  // Adjust subcategories when category changes
  useEffect(() => {
    const defaultSubs = subcategories.filter((sc) => sc.category_id === categoryId);
    if (defaultSubs.length > 0) {
      setSubCategoryId(defaultSubs[0].id);
    } else {
      setSubCategoryId("");
    }
  }, [categoryId, subcategories]);

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

    if (type !== "transfer" && type !== "savings" && type !== "debt_payment" && (!categoryId || !subCategoryId)) {
      setError("Pilih kategori dan subkategori transaksi.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if ((type as any) === "transfer") {
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
          category_id: type === "savings" || type === "debt_payment" ? null : (categoryId || null),
          sub_category_id: type === "savings" || type === "debt_payment" ? null : (subCategoryId || null),
          type: type,
          amount: parsedAmount,
          description: description,
          date: date,
          receipt_url: receiptUrl || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menyimpan transaksi.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (val: number) => {
    // Format the quick amount same as user input (with locale formatting)
    setAmount(val.toLocaleString("id-ID"));
  };

  // Mock photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate uploading by generating a base64 or temporary URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Catat Keuangan Baru">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Toggle Types */}
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button type="button" onClick={() => setType("expense")} className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all btn-pressable ${type === "expense" ? "bg-danger text-white shadow" : "text-text-mutedLight dark:text-text-mutedDark"}`}>
            <ArrowDownLeft className="h-4 w-4" />
            <span>Keluar</span>
          </button>
          <button type="button" onClick={() => setType("income")} className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all btn-pressable ${type === "income" ? "bg-success text-white shadow" : "text-text-mutedLight dark:text-text-mutedDark"}`}>
            <ArrowUpRight className="h-4 w-4" />
            <span>Masuk</span>
          </button>
          <button type="button" onClick={() => setType("transfer" as any)} className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all btn-pressable ${(type as any) === "transfer" ? "bg-primary text-white shadow" : "text-text-mutedLight dark:text-text-mutedDark"}`}>
            <ArrowLeftRight className="h-4 w-4" />
            <span>Transfer</span>
          </button>
          <button type="button" onClick={() => setType("savings")} className={`py-2 px-1 rounded-lg text-xs font-bold flex flex-col items-center gap-1 transition-all btn-pressable ${type === "savings" ? "bg-amber-500 text-white shadow" : "text-text-mutedLight dark:text-text-mutedDark"}`}>
            <PiggyBank className="h-4 w-4" />
            <span>Tabung</span>
          </button>
        </div>

        {/* Amount Input */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-xl text-text-mutedLight dark:text-text-mutedDark">Rp</span>
          <Input
            ref={amountRef}
            type="tel" // Opens numeric keypad on iOS/Android
            placeholder="0"
            value={amount}
            onChange={(e) => {
              // Extract only numbers and format with Indonesian locale
              const raw = e.target.value.replace(/[^0-9]/g, "");
              if (raw === "") {
                setAmount("");
              } else {
                setAmount(Number(raw).toLocaleString("id-ID"));
              }
            }}
            className="pl-12 text-2xl font-black h-14 tracking-wide text-primary no-spinner border-2"
          />
        </div>

        {/* Quick Amount Helpers */}
        <div className="grid grid-cols-4 gap-2">
          {[10000, 20000, 50000, 100000].map((val) => (
            <button key={val} type="button" onClick={() => handleQuickAmount(val)} className="py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors btn-pressable">
              +{val / 1000}k
            </button>
          ))}
        </div>

        {error && <p className="text-xs text-danger font-semibold text-center">{error}</p>}

        {/* Dynamic Fields based on Transaction Type */}
        <div className="flex flex-col gap-4">
          {/* Wallets */}
          {(type as any) === "transfer" ? (
            <div className="grid grid-cols-2 gap-3">
              <Select label="Dari Dompet" value={walletId} onChange={(e) => setWalletId(e.target.value)} options={activeWallets.map((w) => ({ value: w.id, label: `${w.name} (Saldo: Rp${w.balance.toLocaleString("id-ID")})` }))} />
              <Select label="Ke Dompet" value={transferWalletId} onChange={(e) => setTransferWalletId(e.target.value)} options={activeWallets.map((w) => ({ value: w.id, label: `${w.name}` }))} />
            </div>
          ) : (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Select label="Gunakan Dompet" value={walletId} onChange={(e) => setWalletId(e.target.value)} options={activeWallets.length > 0 ? activeWallets.map((w) => ({ value: w.id, label: `${w.name} (Saldo: Rp${w.balance.toLocaleString("id-ID")})` })) : [{value: '', label: 'Belum ada dompet'}]} />
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => { onClose(); openWalletModal(); }} className="h-11 px-3" title="Tambah Dompet Baru">
                + Baru
              </Button>
            </div>
          )}

          {/* Categories & Subcategories (Not for Transfer / Savings / Debts) */}
          {type !== "savings" && type !== "debt_payment" && (type as any) !== "transfer" && (
            <div className="grid grid-cols-2 gap-3">
              <Select label="Kategori" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} options={filteredCategories.map((c) => ({ value: c.id, label: c.name }))} />
              <Select label="Subkategori" value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)} options={[{value: '', label: '-- Pilih Subkategori --'}, ...filteredSubCategories.map((sc) => ({ value: sc.id, label: sc.name }))]} />
            </div>
          )}

          {/* Date & Description */}
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" label="Tanggal" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input type="text" label="Catatan" placeholder="Makanan, bensin, dll." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* Upload Receipt Image (Only for expense/income) */}
          {(type === "expense" || type === "income") && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-text-mutedLight dark:text-text-mutedDark tracking-wide">Foto Bukti Transaksi (Opsional)</span>
              <div className="flex items-center gap-3">
                <label className="h-11 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary rounded-xl flex items-center gap-2 cursor-pointer transition-colors text-xs font-semibold text-text-mutedLight dark:text-text-mutedDark">
                  <Camera className="h-4 w-4" />
                  <span>Ambil Foto</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
                {receiptUrl && (
                  <div className="relative h-11 w-11 rounded-lg border overflow-hidden">
                    <img src={receiptUrl} alt="Bukti" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => setReceiptUrl("")} className="absolute inset-0 bg-black/40 text-white flex items-center justify-center font-bold text-[8px]">
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <Button type="submit" loading={loading} className="h-12 w-full mt-2 font-bold text-sm">
          Simpan Catatan
        </Button>
      </form>
    </Dialog>
  );
};
export default QuickAddModal;
