/** @format */

import React, { useState, useEffect } from "react";
import { useFinanceStore } from "../../store/financeStore";
import { useAuthStore } from "../../store/authStore";
import { useModalStore } from "../../store/modalStore";
import type { Wallet } from "../../types";
import { Dialog } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { AlertTriangle, Save } from "lucide-react";

interface WalletConfigModalProps {
  isOpen: boolean;
  wallet?: Wallet;
}

export const WalletConfigModal: React.FC<WalletConfigModalProps> = ({ isOpen, wallet }) => {
  const { user } = useAuthStore();
  const { addWallet, updateWallet, deleteWallet } = useFinanceStore();
  const { mode, closeModal } = useModalStore();

  const [formData, setFormData] = useState({
    name: "",
    type: "bank" as Wallet["type"],
    provider: "",
    balance: "",
    color: "#2563EB",
    icon: "Wallet",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Reset form ketika modal dibuka dengan wallet yang berbeda
  useEffect(() => {
    if (mode === "add") {
      setFormData({
        name: "",
        type: "bank",
        provider: "",
        balance: "",
        color: "#2563EB",
        icon: "Wallet",
        description: "",
      });
    } else if (mode === "edit" && wallet) {
      setFormData({
        name: wallet.name || "",
        type: wallet.type,
        provider: wallet.provider || "",
        balance: wallet.balance.toString(),
        color: wallet.color || "#2563EB",
        icon: wallet.icon || "Wallet",
        description: wallet.description || "",
      });
    }
    setError("");
    setSuccess("");
  }, [mode, wallet, isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("User tidak ditemukan");
      return;
    }

    if (!formData.name.trim()) {
      setError("Nama dompet tidak boleh kosong");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (mode === "add") {
        await addWallet(user.id, {
          name: formData.name,
          type: formData.type,
          provider: formData.provider || undefined,
          balance: parseFloat(formData.balance) || 0,
          color: formData.color,
          icon: formData.icon,
          description: formData.description || undefined,
        });
        setSuccess("Dompet berhasil ditambahkan!");
      } else if (mode === "edit" && wallet) {
        await updateWallet(user.id, wallet.id, {
          name: formData.name,
          type: formData.type,
          provider: formData.provider || undefined,
          balance: parseFloat(formData.balance) || 0,
          color: formData.color,
          icon: formData.icon,
          description: formData.description || undefined,
        });
        setSuccess("Dompet berhasil diperbarui!");
      }

      setTimeout(() => {
        closeModal();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan dompet");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !wallet) return;

    if (!window.confirm("Hapus dompet ini? Semua transaksi terkait akan terpengaruh.")) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      await deleteWallet(user.id, wallet.id);
      setSuccess("Dompet berhasil dihapus!");

      setTimeout(() => {
        closeModal();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus dompet");
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "add" ? "Tambah Dompet Baru" : mode === "edit" ? "Edit Dompet" : "Hapus Dompet";

  return (
    <Dialog isOpen={isOpen} onClose={closeModal} title={title}>
      <div className="w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-lg">
        <h2 className="text-lg font-bold mb-4">{title}</h2>

        {mode === "delete" ? (
          // Delete confirmation
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-200">Konfirmasi Penghapusan</p>
                <p className="text-sm text-red-800 dark:text-red-300 mt-1">Apakah Anda yakin ingin menghapus dompet "{wallet?.name}"? Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            {error && <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">{error}</div>}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={closeModal} disabled={loading}>
                Batal
              </Button>
              <Button onClick={handleDelete} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
                {loading ? "Menghapus..." : "Hapus Dompet"}
              </Button>
            </div>
          </div>
        ) : (
          // Add/Edit form
          <form onSubmit={handleSave} className="space-y-4">
            <Input label="Nama Dompet" placeholder="BCA, Jago, GoPay, Tunai" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />

            <Select
              label="Jenis Dompet"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as Wallet["type"] })}
              options={[
                { value: "cash", label: "Cash (Tunai)" },
                { value: "bank", label: "Bank (Rekening)" },
                { value: "e-wallet", label: "E-Wallet (Dana/GoPay)" },
                { value: "crypto", label: "Crypto Wallet" },
                { value: "other", label: "Lainnya" },
              ]}
            />

            <Select
              label="Provider (Opsional)"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              options={[
                { value: "", label: "Pilih Provider..." },
                // Bank Nasional
                { value: "BCA", label: "Bank BCA" },
                { value: "Mandiri", label: "Bank Mandiri" },
                { value: "BNI", label: "Bank BNI" },
                { value: "BRI", label: "Bank BRI" },
                { value: "BSI", label: "Bank Syariah Indonesia (BSI)" },
                { value: "CIMB", label: "CIMB Niaga" },
                { value: "Permata", label: "Bank Permata" },
                { value: "Danamon", label: "Bank Danamon" },
                { value: "BTN", label: "Bank BTN" },
                { value: "Mega", label: "Bank Mega" },
                { value: "MegaSyariah", label: "Bank Mega Syariah" },
                { value: "Panin", label: "Bank Panin" },
                // Bank Digital
                { value: "SeaBank", label: "Sea Bank" },
                { value: "Jago", label: "Bank Jago" },
                { value: "Allo", label: "Allo Bank" },
                { value: "Neo", label: "Neo Bank" },
                { value: "Blu", label: "blu by BCA Digital" },
                { value: "Jenius", label: "Jenius (BTPN)" },
                { value: "Neobank", label: "Neo Commerce" },
                // E-Wallet
                { value: "GoPay", label: "GoPay" },
                { value: "Dana", label: "Dana" },
                { value: "OVO", label: "OVO" },
                { value: "ShopeePay", label: "ShopeePay" },
                { value: "LinkAja", label: "LinkAja" },
                { value: "iSaku", label: "iSaku" },
                { value: "Other", label: "Lainnya" },
              ]}
            />

            <Input type="number" label="Saldo (Rp)" placeholder="0" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: e.target.value })} />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-mutedLight tracking-wide">Pilih Warna</label>
              <div className="flex items-center gap-3">
                <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="h-10 w-12 rounded border cursor-pointer" />
                <span className="text-xs font-mono uppercase font-bold text-text-mutedLight">{formData.color}</span>
              </div>
            </div>

            <Input label="Catatan (Opsional)" placeholder="Contoh: Rekening gaji utama" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />

            {error && <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">{error}</div>}

            {success && <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded text-sm">{success}</div>}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={closeModal} disabled={loading}>
                Batal
              </Button>
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {loading ? "Menyimpan..." : mode === "add" ? "Tambah Dompet" : "Perbarui Dompet"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
};
