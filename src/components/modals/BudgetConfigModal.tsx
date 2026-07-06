import React, { useState, useEffect } from "react";
import { useFinanceStore } from "../../store/financeStore";
import { useAuthStore } from "../../store/authStore";
import { useModalStore } from "../../store/modalStore";
import { useConfirm } from "../../store/confirmStore";
import { useToastStore } from "../../store/toastStore";
import type { Budget } from "../../types";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { AlertTriangle, Save } from "lucide-react";

interface BudgetConfigModalProps {
  isOpen: boolean;
  budget?: Budget;
}

const CURRENT_MONTH = new Date().getMonth() + 1;
const CURRENT_YEAR = new Date().getFullYear();

export const BudgetConfigModal: React.FC<BudgetConfigModalProps> = ({ isOpen, budget }) => {
  const { user } = useAuthStore();
  const { categories, setBudget, deleteBudget } = useFinanceStore();
  const { mode, closeModal } = useModalStore();
  const confirm = useConfirm();
  const { showToast } = useToastStore();

  const [formData, setFormData] = useState({
    category_id: "",
    amount: "",
    month: CURRENT_MONTH,
    year: CURRENT_YEAR,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const expenseCategories = categories.filter((c) => c.type === "expense");

  useEffect(() => {
    if (mode === "add") {
      setFormData({
        category_id: "",
        amount: "",
        month: CURRENT_MONTH,
        year: CURRENT_YEAR,
      });
    } else if (mode === "edit" && budget) {
      setFormData({
        category_id: budget.category_id,
        amount: budget.amount.toString(),
        month: budget.month,
        year: budget.year,
      });
    }
    setError("");
    setSuccess("");
  }, [mode, budget, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("User tidak ditemukan");
      return;
    }

    if (!formData.category_id) {
      setError("Pilih kategori terlebih dahulu");
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Jumlah anggaran harus lebih dari 0");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await setBudget(user.id, {
        category_id: formData.category_id,
        amount: parseFloat(formData.amount),
        month: formData.month,
        year: formData.year,
      });

      const categoryName = categories.find((c) => c.id === formData.category_id)?.name;
      showToast(mode === "add" ? `Anggaran ${categoryName} berhasil dibuat!` : `Anggaran ${categoryName} berhasil diperbarui!`, "success");

      setTimeout(() => {
        closeModal();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan anggaran");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !budget) return;

    const confirmed = await confirm({
      title: "Hapus Anggaran",
      message: "Apakah Anda yakin ingin menghapus anggaran kategori ini?",
      confirmLabel: "Hapus",
      cancelLabel: "Batal",
      type: "danger",
    });

    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      await deleteBudget(user.id, budget.id);
      showToast("Anggaran berhasil dihapus!", "success");

      setTimeout(() => {
        closeModal();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus anggaran");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "add" ? "Buat Anggaran Baru" : mode === "edit" ? "Edit Anggaran" : "Hapus Anggaran";

  return (
    <Dialog isOpen={isOpen} onClose={closeModal} title={title}>
      <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-lg">
        <h2 className="text-lg font-bold mb-4">{title}</h2>

        {mode === "delete" ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">Apakah Anda yakin ingin menghapus anggaran ini?</p>
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
            <Select label="Kategori Pengeluaran" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} options={[{ value: "", label: "Pilih Kategori..." }, ...expenseCategories.map((c) => ({ value: c.id, label: c.name }))]} required />

            <Input type="number" label="Jumlah Anggaran (Rp)" placeholder="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Bulan"
                value={formData.month.toString()}
                onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                options={Array.from({ length: 12 }, (_, i) => ({
                  value: (i + 1).toString(),
                  label: new Date(2024, i).toLocaleString("id-ID", { month: "long" }),
                }))}
              />

              <Select
                label="Tahun"
                value={formData.year.toString()}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                options={Array.from({ length: 5 }, (_, i) => ({
                  value: (CURRENT_YEAR - 2 + i).toString(),
                  label: (CURRENT_YEAR - 2 + i).toString(),
                }))}
              />
            </div>

            {error && <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">{error}</div>}

            {success && <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded text-sm">{success}</div>}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={closeModal} disabled={loading}>
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {loading ? "Menyimpan..." : mode === "add" ? "Buat Anggaran" : "Perbarui Anggaran"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
};
