/** @format */

import React, { useState, useEffect } from "react";
import { useFinanceStore } from "../../store/financeStore";
import { useAuthStore } from "../../store/authStore";
import { useModalStore } from "../../store/modalStore";
import type { RecurringTransaction } from "../../types";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { AlertTriangle, Save } from "lucide-react";

interface RecurringConfigModalProps {
  isOpen: boolean;
  recurring?: RecurringTransaction;
}

export const RecurringConfigModal: React.FC<RecurringConfigModalProps> = ({ isOpen, recurring }) => {
  const { user } = useAuthStore();
  const { wallets, categories, addRecurring, updateRecurring, deleteRecurring } = useFinanceStore();
  const { mode, closeModal } = useModalStore();

  const expenseCategories = categories.filter((c) => c.type === "expense");

  const [formData, setFormData] = useState({
    wallet_id: "",
    category_id: "",
    type: "expense" as const,
    amount: "",
    description: "",
    frequency: "monthly" as const,
    start_date: "",
    end_date: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (mode === "add") {
      setFormData({
        wallet_id: wallets[0]?.id || "",
        category_id: "",
        type: "expense",
        amount: "",
        description: "",
        frequency: "monthly",
        start_date: today,
        end_date: "",
      });
    } else if (mode === "edit" && recurring) {
      setFormData({
        wallet_id: recurring.wallet_id,
        category_id: recurring.category_id || "",
        type: recurring.type,
        amount: recurring.amount.toString(),
        description: recurring.description || "",
        frequency: recurring.frequency,
        start_date: recurring.frequency === "daily" ? today : today,
        end_date: recurring.end_date || "",
      });
    }
    setError("");
    setSuccess("");
  }, [mode, recurring, isOpen, wallets]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("User tidak ditemukan");
      return;
    }

    if (!formData.wallet_id) {
      setError("Pilih dompet pembayaran");
      return;
    }

    if (!formData.description.trim()) {
      setError("Deskripsi transaksi tidak boleh kosong");
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Jumlah harus lebih dari 0");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (mode === "add") {
        await addRecurring(user.id, {
          wallet_id: formData.wallet_id,
          category_id: formData.category_id || null,
          type: formData.type,
          amount: parseFloat(formData.amount),
          description: formData.description,
          frequency: formData.frequency,
          start_date: formData.start_date,
          end_date: formData.end_date || undefined,
        });
        setSuccess("Transaksi rutin berhasil dibuat!");
      } else if (mode === "edit" && recurring) {
        await updateRecurring(user.id, recurring.id, {
          wallet_id: formData.wallet_id,
          category_id: formData.category_id || null,
          amount: parseFloat(formData.amount),
          description: formData.description,
          frequency: formData.frequency,
          end_date: formData.end_date || undefined,
        });
        setSuccess("Transaksi rutin berhasil diperbarui!");
      }

      setTimeout(() => {
        closeModal();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan transaksi rutin");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !recurring) return;

    if (!window.confirm("Hapus transaksi rutin ini?")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await deleteRecurring(user.id, recurring.id);
      setSuccess("Transaksi rutin berhasil dihapus!");

      setTimeout(() => {
        closeModal();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus transaksi rutin");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "add" ? "Tambah Transaksi Rutin" : mode === "edit" ? "Edit Transaksi Rutin" : "Hapus Transaksi Rutin";

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">{title}</h2>

        {mode === "delete" ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">Apakah Anda yakin ingin menghapus transaksi rutin ini? Transaksi yang sudah dibuat tidak akan dihapus.</p>
            </div>

            {error && <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">{error}</div>}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={closeModal} disabled={loading}>
                Batal
              </Button>
              <Button onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
                {loading ? "Menghapus..." : "Hapus"}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <Input label="Nama Layanan / Catatan" placeholder="Netflix, Listrik, Kost, dll" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />

            <Input type="number" label="Nominal (Rp)" placeholder="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />

            <Select label="Dompet Pembayaran" value={formData.wallet_id} onChange={(e) => setFormData({ ...formData, wallet_id: e.target.value })} options={[{ value: "", label: "Pilih Dompet..." }, ...wallets.map((w) => ({ value: w.id, label: w.name }))]} required />

            <Select label="Kategori (Opsional)" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} options={[{ value: "", label: "Pilih Kategori..." }, ...expenseCategories.map((c) => ({ value: c.id, label: c.name }))]} />

            <Select
              label="Frekuensi"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
              options={[
                { value: "daily", label: "Harian" },
                { value: "weekly", label: "Mingguan" },
                { value: "biweekly", label: "Dua Mingguan" },
                { value: "monthly", label: "Bulanan" },
                { value: "quarterly", label: "Triwulanan" },
                { value: "yearly", label: "Tahunan" },
              ]}
            />

            <Input type="date" label="Tanggal Mulai" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />

            <Input type="date" label="Tanggal Akhir (Opsional)" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} />

            {error && <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">{error}</div>}

            {success && <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded text-sm">{success}</div>}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={closeModal} disabled={loading}>
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {loading ? "Menyimpan..." : mode === "add" ? "Tambah Transaksi" : "Perbarui Transaksi"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
};
