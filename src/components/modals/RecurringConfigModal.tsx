import React, { useState, useEffect } from "react";
import { useFinanceStore } from "../../store/financeStore";
import { useAuthStore } from "../../store/authStore";
import { useModalStore } from "../../store/modalStore";
import { useConfirm } from "../../store/confirmStore";
import { useToastStore } from "../../store/toastStore";
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
  const confirm = useConfirm();
  const { showToast } = useToastStore();

  const expenseCategories = categories.filter((c) => c.type === "expense");

  const [formData, setFormData] = useState({
    wallet_id: "",
    category_id: "",
    type: "expense" as RecurringTransaction["type"],
    amount: "",
    description: "",
    frequency: "monthly" as RecurringTransaction["frequency"],
    interval_day: "",
    next_date: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const timeoutId = window.setTimeout(() => {
      if (mode === "add") {
        setFormData({
          wallet_id: wallets[0]?.id || "",
          category_id: "",
          type: "expense",
          amount: "",
          description: "",
          frequency: "monthly",
          interval_day: "5",
          next_date: today,
        });
      } else if (mode === "edit" && recurring) {
        setFormData({
          wallet_id: recurring.wallet_id,
          category_id: recurring.category_id || "",
          type: recurring.type,
          amount: recurring.amount.toString(),
          description: recurring.description || "",
          frequency: recurring.frequency,
          interval_day: recurring.interval_day.toString(),
          next_date: recurring.next_date || today,
        });
      }
      setError("");
      setSuccess("");
    }, 0);

    return () => window.clearTimeout(timeoutId);
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
          interval_day: parseInt(formData.interval_day || "5", 10),
          next_date: formData.next_date,
        });
        showToast("Transaksi rutin berhasil dibuat!", "success");
      } else if (mode === "edit" && recurring) {
        await updateRecurring(user.id, recurring.id, {
          wallet_id: formData.wallet_id,
          category_id: formData.category_id || null,
          amount: parseFloat(formData.amount),
          description: formData.description,
          frequency: formData.frequency,
          interval_day: parseInt(formData.interval_day || "5", 10),
          next_date: formData.next_date,
        });
        showToast("Transaksi rutin berhasil diperbarui!", "success");
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

    const confirmed = await confirm({
      title: "Hapus Transaksi Rutin",
      message: "Apakah Anda yakin ingin menghapus transaksi rutin ini?",
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
      type: "danger",
    });

    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      await deleteRecurring(user.id, recurring.id);
      showToast("Transaksi rutin berhasil dihapus!", "success");

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
    <Dialog isOpen={isOpen} onClose={closeModal} title={title}>
      <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">{title}</h2>

        {mode === "delete" ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
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
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as RecurringTransaction["frequency"] })}
              options={[
                { value: "weekly", label: "Mingguan" },
                { value: "monthly", label: "Bulanan" },
                { value: "yearly", label: "Tahunan" },
              ]}
            />

            <Input type="number" label="Hari Interval" placeholder="5" value={formData.interval_day} onChange={(e) => setFormData({ ...formData, interval_day: e.target.value })} required />

            <Input type="date" label="Tanggal Tagihan Berikutnya" value={formData.next_date} onChange={(e) => setFormData({ ...formData, next_date: e.target.value })} required />

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
