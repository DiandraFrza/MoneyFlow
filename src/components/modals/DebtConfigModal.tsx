/** @format */

import React, { useState, useEffect } from "react";
import { useFinanceStore } from "../../store/financeStore";
import { useAuthStore } from "../../store/authStore";
import { useModalStore } from "../../store/modalStore";
import type { Debt } from "../../types";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { AlertTriangle, Save } from "lucide-react";

interface DebtConfigModalProps {
  isOpen: boolean;
  debt?: Debt;
}

export const DebtConfigModal: React.FC<DebtConfigModalProps> = ({ isOpen, debt }) => {
  const { user } = useAuthStore();
  const { addDebt, updateDebt, deleteDebt } = useFinanceStore();
  const { mode, closeModal } = useModalStore();

  const [formData, setFormData] = useState({
    type: "borrowed" as "borrowed" | "lent",
    person_name: "",
    amount: "",
    interest_rate: "",
    remaining_amount: "",
    due_date: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (mode === "add") {
      setFormData({
        type: "borrowed",
        person_name: "",
        amount: "",
        interest_rate: "",
        remaining_amount: "",
        due_date: "",
        description: "",
      });
    } else if (mode === "edit" && debt) {
      setFormData({
        type: debt.type,
        person_name: debt.person_name,
        amount: debt.amount.toString(),
        interest_rate: "0",
        remaining_amount: debt.remaining_amount.toString(),
        due_date: debt.due_date || "",
        description: debt.description || "",
      });
    }
    setError("");
    setSuccess("");
  }, [mode, debt, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("User tidak ditemukan");
      return;
    }

    if (!formData.person_name.trim()) {
      setError("Nama orang/instansi tidak boleh kosong");
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
        await addDebt(user.id, {
          type: formData.type,
          person_name: formData.person_name,
          amount: parseFloat(formData.amount),
          remaining_amount: parseFloat(formData.amount),
          due_date: formData.due_date || undefined,
          description: formData.description || undefined,
        });
        setSuccess("Catatan utang berhasil dibuat!");
      } else if (mode === "edit" && debt) {
        await updateDebt(user.id, debt.id, {
          type: formData.type,
          person_name: formData.person_name,
          amount: parseFloat(formData.amount),
          remaining_amount: parseFloat(formData.remaining_amount),
          due_date: formData.due_date || undefined,
          description: formData.description || undefined,
        });
        setSuccess("Catatan utang berhasil diperbarui!");
      }

      setTimeout(() => {
        closeModal();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan catatan utang");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !debt) return;

    if (!window.confirm("Hapus catatan utang ini?")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await deleteDebt(user.id, debt.id);
      setSuccess("Catatan utang berhasil dihapus!");

      setTimeout(() => {
        closeModal();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus catatan utang");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "add" ? "Catat Utang/Piutang Baru" : mode === "edit" ? "Edit Utang/Piutang" : "Hapus Utang/Piutang";

  return (
    <Dialog isOpen={isOpen} onClose={closeModal} title={title}>
      <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">{title}</h2>

        {mode === "delete" ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">Apakah Anda yakin ingin menghapus catatan utang ini?</p>
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
            <Select
              label="Jenis Catatan"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              options={[
                { value: "borrowed", label: "Utang (Kita Pinjam Uang)" },
                { value: "lent", label: "Piutang (Kita Pinjamkan Uang)" },
              ]}
            />

            <Input label="Nama Orang / Instansi" placeholder="Budi, Bank BCA, dll." value={formData.person_name} onChange={(e) => setFormData({ ...formData, person_name: e.target.value })} required />

            <Input type="number" label="Jumlah Utang (Rp)" placeholder="0" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />

            <Input type="number" label="Sisa Utang (Rp)" placeholder="0" value={formData.remaining_amount} onChange={(e) => setFormData({ ...formData, remaining_amount: e.target.value })} required />

            <Input type="number" label="Suku Bunga (%) - Opsional" placeholder="0" value={formData.interest_rate} onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })} />

            <Input type="date" label="Tanggal Jatuh Tempo - Opsional" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />

            <Input label="Keterangan" placeholder="Alasan pinjam atau detail tambahan" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />

            {error && <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">{error}</div>}

            {success && <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded text-sm">{success}</div>}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={closeModal} disabled={loading}>
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {loading ? "Menyimpan..." : mode === "add" ? "Catat Utang" : "Perbarui"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
};
