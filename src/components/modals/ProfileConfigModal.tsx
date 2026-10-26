/** @format */

import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { useModalStore } from "../../store/modalStore";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Save } from "lucide-react";
import { formatCurrencyInput, parseCurrencyInput } from "../../lib/utils";

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
        monthly_salary: formatCurrencyInput(user.monthly_salary || 0),
        financial_target: formatCurrencyInput(user.financial_target || 0),
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
        monthly_salary: parseCurrencyInput(formData.monthly_salary),
        financial_target: parseCurrencyInput(formData.financial_target),
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
    <Dialog isOpen={isOpen} onClose={closeModal} title="Edit Profil">
      <div className="w-full">

        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-[#f4f4f4] border border-[#1e1e1e] p-3 text-xs text-[#1e1e1e] mb-2 leading-relaxed">
            Data profil ini digunakan untuk menghitung <b>Skor Kesehatan Finansial</b> Anda dan memberikan rekomendasi yang dipersonalisasi.
          </div>

          <Input label="Nama Lengkap" placeholder="Nama Anda" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />

          <Input label="Mata Uang" placeholder="Rp" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} />

          <div className="flex flex-col gap-1">
            <Input
              type="text"
              inputMode="numeric"
              label="Gaji / Pendapatan Bulanan (Rp)"
              placeholder="0"
              value={formData.monthly_salary}
              onChange={(e) => setFormData({ ...formData, monthly_salary: formatCurrencyInput(e.target.value) })}
            />
            <span className="text-[10px] text-[#555555]">Digunakan untuk menghitung rasio tabungan ideal (20%) & peringatan pengeluaran berlebih.</span>
          </div>

          <div className="flex flex-col gap-1">
            <Input
              type="text"
              inputMode="numeric"
              label="Target Tabungan Jangka Panjang (Rp)"
              placeholder="0"
              value={formData.financial_target}
              onChange={(e) => setFormData({ ...formData, financial_target: formatCurrencyInput(e.target.value) })}
            />
            <span className="text-[10px] text-[#555555]">Digunakan sebagai acuan target akumulasi kekayaan / dana pensiun Anda.</span>
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
