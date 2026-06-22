/** @format */

import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { useModalStore } from "../../store/modalStore";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Save } from "lucide-react";

interface ProfileConfigModalProps {
  isOpen: boolean;
}

export const ProfileConfigModal: React.FC<ProfileConfigModalProps> = ({ isOpen }) => {
  const { user, updateProfile } = useAuthStore();
  const { closeModal } = useModalStore();

  const [formData, setFormData] = useState({
    name: "",
    currency: "Rp",
    monthly_salary: "",
    financial_target: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        currency: user.currency || "Rp",
        monthly_salary: user.monthly_salary?.toString() || "0",
        financial_target: user.financial_target?.toString() || "0",
      });
    }
    setError("");
    setSuccess("");
  }, [user, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("User tidak ditemukan");
      return;
    }

    if (!formData.name.trim()) {
      setError("Nama tidak boleh kosong");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await updateProfile({
        name: formData.name,
        currency: formData.currency,
        monthly_salary: parseFloat(formData.monthly_salary) || 0,
        financial_target: parseFloat(formData.financial_target) || 0,
      });

      setSuccess("Profil berhasil diperbarui!");

      setTimeout(() => {
        closeModal();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui profil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-lg">
        <h2 className="text-lg font-bold mb-4">Edit Profil</h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-xs text-blue-800 dark:text-blue-200 mb-2 leading-relaxed">
            Data profil ini digunakan untuk menghitung <b>Skor Kesehatan Finansial</b> Anda dan memberikan rekomendasi yang dipersonalisasi.
          </div>
          
          <Input label="Nama Lengkap" placeholder="Nama Anda" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />

          <Input label="Mata Uang" placeholder="Rp" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} />

          <div className="flex flex-col gap-1">
            <Input type="number" label="Gaji / Pendapatan Bulanan" placeholder="0" value={formData.monthly_salary} onChange={(e) => setFormData({ ...formData, monthly_salary: e.target.value })} />
            <span className="text-[10px] text-slate-500">Digunakan untuk menghitung rasio tabungan ideal (20%) & peringatan pengeluaran berlebih.</span>
          </div>

          <div className="flex flex-col gap-1">
            <Input type="number" label="Target Tabungan Jangka Panjang" placeholder="0" value={formData.financial_target} onChange={(e) => setFormData({ ...formData, financial_target: e.target.value })} />
            <span className="text-[10px] text-slate-500">Digunakan sebagai acuan target akumulasi kekayaan / dana pensiun Anda.</span>
          </div>

          {error && <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">{error}</div>}

          {success && <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded text-sm">{success}</div>}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={closeModal} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {loading ? "Menyimpan..." : "Simpan Profil"}
            </Button>
          </div>
        </form>
      </div>
    </Dialog>
  );
};
