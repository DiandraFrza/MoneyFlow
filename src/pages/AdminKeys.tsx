/** @format */

import React, { useState, useEffect } from "react";
import { db } from "../lib/repository";
import type { AccessKey } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Search,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";

export const AdminKeys: React.FC = () => {
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "pending">("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const loadKeys = async () => {
    setLoading(true);
    try {
      const data = await db.accessKeys.list();
      setKeys(data);
    } catch (e) {
      console.error("[AdminKeys] Error loading keys:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
    generateRandomKey();
  }, []);

  const generateRandomKey = () => {
    // Generate exactly 11 digits numeric string
    const min = 10000000000;
    const max = 99999999999;
    const randomNum = Math.floor(min + Math.random() * (max - min)).toString();
    setNewKey(randomNum);
  };

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newKey.length !== 11) {
      alert("Kode lisensi harus tepat 11 digit.");
      return;
    }

    setGenerating(true);
    try {
      await db.accessKeys.create({
        key: newKey,
        user_name: buyerName.trim(),
        phone_number: buyerPhone.trim(),
      });
      setFeedbackMessage(`Lisensi ${newKey} berhasil diterbitkan.`);
      setTimeout(() => setFeedbackMessage(""), 4000);
      setBuyerName("");
      setBuyerPhone("");
      generateRandomKey();
      await loadKeys();
    } catch (err: any) {
      alert(err?.message || "Gagal membuat lisensi.");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCopyTemplate = (key: AccessKey) => {
    const greeting = key.user_name ? `Halo Kak ${key.user_name}` : "Halo Kak";
    const text = `${greeting}! Terima kasih telah membeli lisensi MoneyFlow Pro di Lynk.id.\n\nBerikut Kode Akses 11-Digit Anda:\n👉 ${key.key} 👈\n\nCara Aktivasi:\n1. Buka aplikasi MoneyFlow Pro\n2. Masukkan kode 11-digit di atas pada form login\n3. Masukkan Nama & Nomor WhatsApp Anda untuk mengikat lisensi\n4. Selesai! Seluruh fitur penuh aktif permanen tanpa biaya langganan.`;
    navigator.clipboard.writeText(text);
    setCopiedTemplate(key.key);
    setTimeout(() => setCopiedTemplate(null), 2500);
  };

  const handleDelete = async (key: string) => {
    if (window.confirm(`Yakin ingin menghapus lisensi ${key}? Pembeli dengan kode ini tidak akan dapat mengakses aplikasi lagi.`)) {
      await db.accessKeys.delete(key);
      await loadKeys();
    }
  };

  // Filtered keys
  const filteredKeys = keys.filter((k) => {
    const matchesSearch =
      k.key.includes(searchQuery) ||
      (k.user_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.phone_number || "").includes(searchQuery);

    if (!matchesSearch) return false;
    if (filterStatus === "active") return !!k.activated_at;
    if (filterStatus === "pending") return !k.activated_at;
    return true;
  });

  const totalIssued = keys.length;
  const totalActivated = keys.filter((k) => !!k.activated_at).length;
  const totalPending = totalIssued - totalActivated;

  // Format 11 digits as XXXX - XXXX - XXX
  const formatKeyDisplay = (str: string) => {
    if (str.length !== 11) return str;
    return `${str.slice(0, 4)} - ${str.slice(4, 8)} - ${str.slice(8)}`;
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full select-none pb-12">
      {/* Swiss Style Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#1e1e1e] pb-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-[#1e1e1e] text-white flex items-center justify-center border border-[#1e1e1e]">
            <KeyRound className="h-6 w-6 text-[#ff5722]" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-[#1e1e1e] uppercase">
              Pusat Lisensi Lynk.id (Master Admin)
            </h1>
            <p className="text-xs text-[#555555] font-medium mt-0.5">
              Terbitkan dan kelola kode akses 11-digit untuk pembeli produk MoneyFlow Pro di Lynk.id
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={loadKeys}
            className="h-10 text-xs font-bold border-2 border-[#1e1e1e] bg-white hover:bg-[#f4f4f4]"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Strict Privacy Guarantee Box */}
      <div className="border-2 border-[#1e1e1e] bg-[#1e1e1e] text-white p-4 flex items-start gap-3.5">
        <ShieldCheck className="h-5 w-5 text-[#ff5722] flex-shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <span className="font-bold uppercase tracking-wider text-[#ff5722] block mb-1">
            Kebijakan Privasi Ketat (Zero-Knowledge Finansial)
          </span>
          Panel Admin ini <strong>secara ketat hanya melihat No, Nama, Nomor WhatsApp, Key 11-Digit, dan Tanggal Aktif</strong> untuk keperluan verifikasi penjualan Lynk.id. Admin <strong>TIDAK memiliki akses</strong> ke saldo, rekening, dompet, maupun transaksi pribadi pengguna demi menjaga kerahasiaan keuangan pembeli.
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border-2 border-[#1e1e1e] bg-[#fafafa] p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#555555]">Total Lisensi Diterbitkan</span>
          <span className="text-3xl font-black text-[#1e1e1e] mt-2 font-mono">{totalIssued}</span>
        </div>
        <div className="border-2 border-[#1e1e1e] bg-[#fafafa] p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#356342]">Sudah Diaktifkan (Terikat)</span>
          <span className="text-3xl font-black text-[#356342] mt-2 font-mono">{totalActivated}</span>
        </div>
        <div className="border-2 border-[#1e1e1e] bg-[#fafafa] p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff5722]">Belum Aktif (Siap Dijual)</span>
          <span className="text-3xl font-black text-[#ff5722] mt-2 font-mono">{totalPending}</span>
        </div>
      </div>

      {/* License Generator Form */}
      <Card className="border-2 border-[#1e1e1e] bg-[#fafafa]">
        <CardHeader className="border-b border-[#1e1e1e] bg-[#f4f4f4] py-3.5">
          <CardTitle className="text-sm font-bold text-[#1e1e1e] uppercase tracking-wider flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#ff5722]" /> Terbitkan Kode Akses 11-Digit Baru
          </CardTitle>
          <CardDescription className="text-xs text-[#555555]">
            Generate kode acak 11 digit untuk diberikan langsung kepada pembeli setelah checkout di Lynk.id.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleCreateLicense} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 11-Digit Key Field with Random Generator */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-[#1e1e1e] uppercase tracking-wider flex items-center justify-between">
                  <span>Kode 11-Digit</span>
                  <button
                    type="button"
                    onClick={generateRandomKey}
                    className="text-[10px] text-[#ff5722] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <RefreshCw className="h-3 w-3" /> Acak Baru
                  </button>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value.replace(/[^0-9]/g, "").slice(0, 11))}
                    maxLength={11}
                    className="font-mono font-bold text-base tracking-widest border-2 border-[#1e1e1e] bg-white h-11 text-center"
                    required
                  />
                </div>
              </div>

              {/* Optional Buyer Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-[#1e1e1e] uppercase tracking-wider">
                  Nama Pembeli Lynk.id (Opsional)
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="border-2 border-[#1e1e1e] bg-white h-11 text-sm"
                />
              </div>

              {/* Optional Buyer WhatsApp */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-[#1e1e1e] uppercase tracking-wider">
                  Nomor WhatsApp / HP (Opsional)
                </label>
                <Input
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="border-2 border-[#1e1e1e] bg-white h-11 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-[#555555]">
                {feedbackMessage ? (
                  <span className="text-[#356342] font-bold">✓ {feedbackMessage}</span>
                ) : (
                  "Tip: Kode yang baru diterbitkan dapat langsung disalin dan dikirim via chat WhatsApp / invoice Lynk.id."
                )}
              </span>
              <Button
                type="submit"
                loading={generating}
                disabled={newKey.length !== 11}
                className="w-full sm:w-auto px-6 h-11 font-bold text-sm bg-[#ff5722] text-white hover:bg-[#e64a19] border-2 border-[#1e1e1e] transition-colors"
              >
                Terbitkan Lisensi
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Registered Users Table - Privacy Safe */}
      <div className="border-2 border-[#1e1e1e] bg-[#fafafa]">
        {/* Table Controls */}
        <div className="p-4 border-b border-[#1e1e1e] bg-[#f4f4f4] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1e1e1e]">Daftar Lisensi</span>
            <span className="text-xs font-mono font-bold bg-[#1e1e1e] text-white px-2 py-0.5">
              {filteredKeys.length}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {/* Filter Buttons */}
            <div className="flex items-center border border-[#1e1e1e] bg-white p-0.5 text-xs font-bold w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1 cursor-pointer transition-colors ${
                  filterStatus === "all" ? "bg-[#1e1e1e] text-white" : "text-[#555555] hover:bg-[#f4f4f4]"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("active")}
                className={`px-3 py-1 cursor-pointer transition-colors ${
                  filterStatus === "active" ? "bg-[#1e1e1e] text-white" : "text-[#555555] hover:bg-[#f4f4f4]"
                }`}
              >
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("pending")}
                className={`px-3 py-1 cursor-pointer transition-colors ${
                  filterStatus === "pending" ? "bg-[#1e1e1e] text-white" : "text-[#555555] hover:bg-[#f4f4f4]"
                }`}
              >
                Belum Aktif
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#555555]" />
              <Input
                type="text"
                placeholder="Cari nama, WA, atau key..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs border border-[#1e1e1e] bg-white"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-[#1e1e1e] bg-[#eaeaea] text-[#1e1e1e] font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Pembeli</th>
                <th className="py-3 px-4">Nomor HP / WhatsApp</th>
                <th className="py-3 px-4">11-Digit Access Key</th>
                <th className="py-3 px-4">Tanggal Aktif</th>
                <th className="py-3 px-4 text-center">Status & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e0e0e0]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#555555] font-semibold">
                    Memuat data lisensi...
                  </td>
                </tr>
              ) : filteredKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#555555] font-semibold">
                    Tidak ada lisensi yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredKeys.map((item, index) => {
                  const isActivated = !!item.activated_at;
                  const formattedDate = item.activated_at
                    ? new Date(item.activated_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Belum Diaktifkan";

                  return (
                    <tr key={item.key} className="hover:bg-[#f4f4f4] transition-colors">
                      <td className="py-3 px-3 text-center font-mono font-bold text-[#555555]">
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#1e1e1e]">
                        {item.user_name || <span className="text-[#999999] italic">Belum diisi</span>}
                      </td>
                      <td className="py-3 px-4 font-mono text-[#1e1e1e]">
                        {item.phone_number || <span className="text-[#999999] italic">-</span>}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#1e1e1e] tracking-wider">
                        <div className="flex items-center gap-2">
                          <span className="bg-[#f0f0f0] px-2 py-0.5 border border-[#1e1e1e]">
                            {formatKeyDisplay(item.key)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyKey(item.key)}
                            title="Salin 11 Digit Key"
                            className="p-1 border border-[#1e1e1e] hover:bg-[#1e1e1e] hover:text-white transition-colors cursor-pointer"
                          >
                            {copiedKey === item.key ? (
                              <Check className="h-3 w-3 text-[#356342]" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#555555]">
                        {isActivated ? (
                          <span className="font-medium text-[#1e1e1e]">{formattedDate}</span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9a5a21] bg-[#9a5a21]/10 px-2 py-0.5 border border-[#9a5a21]">
                            Belum Aktif
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Copy Template for Lynk.id Buyer */}
                          <button
                            type="button"
                            onClick={() => handleCopyTemplate(item)}
                            title="Salin Pesan Format Kirim Pembeli Lynk.id"
                            className="px-2 py-1 text-[10px] font-bold border border-[#1e1e1e] bg-white hover:bg-[#1e1e1e] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="h-3 w-3 text-[#ff5722]" />
                            {copiedTemplate === item.key ? "Tersalin!" : "Format Lynk.id"}
                          </button>

                          {/* Delete key */}
                          <button
                            type="button"
                            onClick={() => handleDelete(item.key)}
                            title="Hapus Lisensi"
                            className="p-1 text-[#a53a2b] border border-transparent hover:border-[#a53a2b] hover:bg-[#a53a2b]/10 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminKeys;
