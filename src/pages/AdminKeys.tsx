/** @format */

import React, { useState, useEffect } from "react";
import { db } from "../lib/repository";
import type { AccessKey, UserProfile } from "../types";
import { useConfirm } from "../store/confirmStore";
import { useToastStore } from "../store/toastStore";
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
  MessageSquare,
  Power,
  PowerOff,
  Users,
  Sparkles,
} from "lucide-react";

export const AdminKeys: React.FC = () => {
  const confirm = useConfirm();
  const { showToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<"keys" | "existing_users">("keys");
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [existingProfiles, setExistingProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "pending" | "disabled">("all");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

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

  const loadExistingProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const data = await db.accessKeys.listExistingProfiles();
      setExistingProfiles(data);
    } catch (e) {
      console.error("[AdminKeys] Error loading existing profiles:", e);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([loadKeys(), loadExistingProfiles()]);
  };

  useEffect(() => {
    refreshAll();
    generateRandomKey();
  }, []);

  const generateRandomKey = () => {
    // Generate exactly 11 digits numeric string (10000000000 - 99999999999)
    const min = 10000000000;
    const max = 99999999999;
    const randomNum = Math.floor(min + Math.random() * (max - min)).toString();
    setNewKey(randomNum);
    return randomNum;
  };

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newKey.length !== 11) {
      showToast("Kode lisensi harus tepat 11 digit.", "warning");
      return;
    }

    setGenerating(true);
    try {
      await db.accessKeys.create({
        key: newKey,
        user_name: buyerName.trim(),
        phone_number: buyerPhone.trim(),
      });
      showToast(`Lisensi ${newKey} berhasil diterbitkan dan langsung aktif!`, "success");
      setBuyerName("");
      setBuyerPhone("");
      generateRandomKey();
      await refreshAll();
    } catch (err: any) {
      showToast(err?.message || "Gagal membuat lisensi.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleActive = async (key: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const actionName = nextStatus ? "Aktifkan" : "Nonaktifkan";

    const ok = await confirm({
      title: `${actionName} Lisensi`,
      message: nextStatus
        ? `Aktifkan kembali akses untuk lisensi ${formatKeyDisplay(key)}? Pengguna dapat kembali login dan menggunakan aplikasi.`
        : `Nonaktifkan akses untuk lisensi ${formatKeyDisplay(key)}? Pengguna tidak akan dapat mengakses aplikasi hingga diaktifkan kembali.`,
      confirmLabel: `Ya, ${actionName}`,
      cancelLabel: "Batal",
      type: nextStatus ? "success" : "danger",
    });

    if (ok) {
      try {
        await db.accessKeys.toggleActive(key, nextStatus);
        showToast(`Lisensi ${key} berhasil ${nextStatus ? "diaktifkan kembali" : "dinonaktifkan"}.`, "success");
        await refreshAll();
      } catch (err: any) {
        showToast(err?.message || `Gagal ${actionName} lisensi.`, "error");
      }
    }
  };

  const handleAssignKeyToProfile = async (profile: UserProfile) => {
    const generated = generateRandomKey();
    const ok = await confirm({
      title: "Pasangkan Lisensi 11-Digit",
      message: `Buat dan pasangkan Kode Akses 11-digit (${formatKeyDisplay(generated)}) untuk user lama "${profile.name}"?\nSemua riwayat transaksi, kategori, dan saldo dompet user ini akan tetap utuh dan aman.`,
      confirmLabel: "Ya, Pasangkan Key",
      cancelLabel: "Batal",
      type: "info",
    });

    if (!ok) return;

    try {
      await db.accessKeys.assignToUser(generated, profile.id, profile.name || "User", profile.phone_number);
      showToast(`Key ${generated} berhasil dipasangkan ke akun ${profile.name}!`, "success");
      await refreshAll();
    } catch (err: any) {
      showToast(err?.message || "Gagal memasangkan key ke user.", "error");
    }
  };

  const handleSyncAllExistingUsers = async () => {
    const unlinked = existingProfiles.filter((p) => !p.access_key || p.access_key.length !== 11);
    if (unlinked.length === 0) {
      showToast("Semua user lama sudah memiliki 11-digit access key!", "info");
      return;
    }

    const ok = await confirm({
      title: "Sinkronkan Semua Key User Lama",
      message: `Ditemukan ${unlinked.length} akun pengguna lama yang belum memiliki kode akses. Buatkan 11-digit key otomatis untuk mereka semua sekarang?`,
      confirmLabel: "Ya, Buatkan Semua",
      cancelLabel: "Batal",
      type: "info",
    });

    if (!ok) return;

    setSyncingAll(true);
    try {
      for (const p of unlinked) {
        const min = 10000000000;
        const max = 99999999999;
        const generated = Math.floor(min + Math.random() * (max - min)).toString();
        await db.accessKeys.assignToUser(generated, p.id, p.name || "User", p.phone_number);
      }
      showToast(`Berhasil membuatkan lisensi untuk ${unlinked.length} user lama.`, "success");
      await refreshAll();
    } catch (err: any) {
      showToast(err?.message || "Gagal sinkronisasi user lama.", "error");
    } finally {
      setSyncingAll(false);
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCopyTemplate = (key: AccessKey) => {
    const greeting = key.user_name ? `Halo Kak ${key.user_name}` : "Halo Kak";
    const text = `${greeting}! Terima kasih telah membeli lisensi MoneyFlow Pro di Lynk.id.\n\nBerikut Kode Akses 11-Digit Anda:\n👉 ${key.key} 👈\n\nCara Masuk / Aktivasi:\n1. Buka aplikasi MoneyFlow Pro\n2. Masukkan kode 11-digit di atas pada halaman masuk\n3. Selesai! Seluruh data dan fitur penuh aktif permanen tanpa biaya langganan.`;
    navigator.clipboard.writeText(text);
    setCopiedTemplate(key.key);
    setTimeout(() => setCopiedTemplate(null), 2500);
  };

  const handleDelete = async (key: string) => {
    const ok = await confirm({
      title: "Hapus Lisensi",
      message: `Yakin ingin menghapus lisensi ${formatKeyDisplay(key)}? Pengguna dengan kode ini tidak akan dapat mengakses aplikasi lagi.`,
      confirmLabel: "Ya, Hapus",
      cancelLabel: "Batal",
      type: "danger",
    });

    if (ok) {
      await db.accessKeys.delete(key);
      showToast(`Lisensi ${key} berhasil dihapus.`, "info");
      await refreshAll();
    }
  };

  // Filtered keys
  const filteredKeys = keys.filter((k) => {
    const matchesSearch =
      k.key.includes(searchQuery) ||
      (k.user_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (k.phone_number || "").includes(searchQuery);

    if (!matchesSearch) return false;
    if (filterStatus === "active") return k.is_active !== false && !!k.activated_at;
    if (filterStatus === "pending") return k.is_active !== false && !k.activated_at;
    if (filterStatus === "disabled") return k.is_active === false;
    return true;
  });

  const totalIssued = keys.length;
  const totalActivated = keys.filter((k) => k.is_active !== false && !!k.activated_at).length;
  const totalPending = keys.filter((k) => k.is_active !== false && !k.activated_at).length;
  const totalDisabled = keys.filter((k) => k.is_active === false).length;

  // Format 11 digits as XXXX - XXXX - XXX
  const formatKeyDisplay = (str?: string) => {
    if (!str || str.length !== 11) return str || "-";
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
              Pusat Lisensi & Pengguna (Master Admin)
            </h1>
            <p className="text-xs text-[#555555] font-medium mt-0.5">
              Kelola kode akses 11-digit Lynk.id, aktifkan/nonaktifkan akun, dan tautkan ke data pengguna lama
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={refreshAll}
            className="h-10 text-xs font-bold border-2 border-[#1e1e1e] bg-white hover:bg-[#f4f4f4]"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border-2 border-[#1e1e1e] bg-white p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">Total Lisensi</span>
          <span className="text-2xl font-black font-mono text-[#1e1e1e] mt-1 block">{totalIssued}</span>
        </div>
        <div className="border-2 border-[#1e1e1e] bg-white p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#356342] block">Lisensi Aktif</span>
          <span className="text-2xl font-black font-mono text-[#356342] mt-1 block">{totalActivated}</span>
        </div>
        <div className="border-2 border-[#1e1e1e] bg-white p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9a5a21] block">Belum Diaktivasi</span>
          <span className="text-2xl font-black font-mono text-[#9a5a21] mt-1 block">{totalPending}</span>
        </div>
        <div className="border-2 border-[#1e1e1e] bg-white p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#a53a2b] block">Dinonaktifkan</span>
          <span className="text-2xl font-black font-mono text-[#a53a2b] mt-1 block">{totalDisabled}</span>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b-2 border-[#1e1e1e] gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("keys")}
          className={`px-5 py-2.5 font-bold text-xs uppercase tracking-wider border-t-2 border-x-2 border-[#1e1e1e] transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === "keys"
              ? "bg-[#1e1e1e] text-white -mb-[2px] pb-[12px]"
              : "bg-white text-[#555555] hover:bg-[#f4f4f4]"
          }`}
        >
          <KeyRound className="h-4 w-4" />
          Daftar Lisensi 11-Digit ({keys.length})
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("existing_users");
            loadExistingProfiles();
          }}
          className={`px-5 py-2.5 font-bold text-xs uppercase tracking-wider border-t-2 border-x-2 border-[#1e1e1e] transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === "existing_users"
              ? "bg-[#1e1e1e] text-white -mb-[2px] pb-[12px]"
              : "bg-white text-[#555555] hover:bg-[#f4f4f4]"
          }`}
        >
          <Users className="h-4 w-4" />
          Pengguna Lama di Database ({existingProfiles.length})
        </button>
      </div>

      {activeTab === "keys" ? (
        <>
          {/* Issue New Key Card */}
          <Card className="border-2 border-[#1e1e1e] bg-white shadow-none">
            <CardHeader className="border-b border-[#1e1e1e] pb-4">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-[#ff5722]" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#1e1e1e]">
                  Terbitkan Lisensi Baru untuk Pembeli Lynk.id
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-[#555555]">
                Generate 11-digit numerik unik yang siap dikirimkan kepada pembeli produk digital Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleCreateLicense} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      placeholder="Contoh: Danda Nugraha"
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
                    Tip: Kode yang baru diterbitkan dapat langsung disalin dan dikirim via chat WhatsApp / invoice Lynk.id.
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

          {/* Registered Users Table */}
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
                  <button
                    type="button"
                    onClick={() => setFilterStatus("disabled")}
                    className={`px-3 py-1 cursor-pointer transition-colors ${
                      filterStatus === "disabled" ? "bg-[#a53a2b] text-white" : "text-[#a53a2b] hover:bg-[#f4f4f4]"
                    }`}
                  >
                    Dinonaktifkan
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
                    <th className="py-3 px-4">Nama Pengguna</th>
                    <th className="py-3 px-4">WhatsApp / HP</th>
                    <th className="py-3 px-4">11-Digit Access Key</th>
                    <th className="py-3 px-4">Status Akun</th>
                    <th className="py-3 px-4 text-center">Aksi Manajemen</th>
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
                      const isActive = item.is_active !== false;

                      return (
                        <tr key={item.key} className="hover:bg-[#f4f4f4] transition-colors">
                          <td className="py-3 px-3 text-center font-mono font-bold text-[#555555]">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#1e1e1e]">
                            <div className="flex flex-col">
                              <span>{item.user_name || <span className="text-[#999999] italic">Belum diisi</span>}</span>
                              {item.user_id && (
                                <span className="text-[9px] text-[#777777] font-mono">{item.user_id.slice(0, 8)}...</span>
                              )}
                            </div>
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
                          <td className="py-3 px-4">
                            {!isActive ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#a53a2b] bg-[#a53a2b]/10 px-2 py-0.5 border border-[#a53a2b]">
                                Dinonaktifkan
                              </span>
                            ) : isActivated ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#356342] bg-[#356342]/10 px-2 py-0.5 border border-[#356342]">
                                Aktif
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9a5a21] bg-[#9a5a21]/10 px-2 py-0.5 border border-[#9a5a21]">
                                Belum Aktif
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* ACTION: Toggle Aktifkan / Nonaktifkan */}
                              <button
                                type="button"
                                onClick={() => handleToggleActive(item.key, isActive)}
                                title={isActive ? "Nonaktifkan Akses User Ini" : "Aktifkan Kembali Akun User Ini"}
                                className={`px-2 py-1 text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                                  isActive
                                    ? "border-[#a53a2b] text-[#a53a2b] hover:bg-[#a53a2b] hover:text-white"
                                    : "border-[#356342] text-[#356342] hover:bg-[#356342] hover:text-white bg-[#356342]/10"
                                }`}
                              >
                                {isActive ? (
                                  <>
                                    <PowerOff className="h-3 w-3" /> Nonaktifkan
                                  </>
                                ) : (
                                  <>
                                    <Power className="h-3 w-3" /> Aktifkan
                                  </>
                                )}
                              </button>

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
        </>
      ) : (
        /* EXISTING USERS (PENGGUNA LAMA) VIEW */
        <div className="border-2 border-[#1e1e1e] bg-white p-5 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e1e1e] pb-4">
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-[#1e1e1e]">
                Pengguna Lama di Database (Supabase)
              </h2>
              <p className="text-xs text-[#555555] mt-1">
                Data pengguna yang sudah menginput transaksi, dompet, dan kategori. Anda dapat memberikan 11-digit key agar mereka bisa login langsung tanpa kehilangan data!
              </p>
            </div>
            <Button
              type="button"
              onClick={handleSyncAllExistingUsers}
              loading={syncingAll}
              className="bg-[#ff5722] text-white hover:bg-[#e64a19] text-xs font-bold border-2 border-[#1e1e1e] flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Sinkronkan Semua Key User Lama
            </Button>
          </div>

          <div className="overflow-x-auto border border-[#1e1e1e]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1e1e1e] bg-[#eaeaea] text-[#1e1e1e] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 w-12 text-center">No</th>
                  <th className="py-3 px-4">Nama Profil</th>
                  <th className="py-3 px-4">User ID (UUID)</th>
                  <th className="py-3 px-4">11-Digit Access Key</th>
                  <th className="py-3 px-4">Status Lisensi</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e0e0e0]">
                {loadingProfiles ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#555555] font-semibold">
                      Memuat daftar profil pengguna dari database...
                    </td>
                  </tr>
                ) : existingProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#555555] font-semibold">
                      Tidak ada profil pengguna yang ditemukan di tabel public.profiles. Pastikan Anda sudah menjalankan script migration SQL di Supabase.
                    </td>
                  </tr>
                ) : (
                  existingProfiles.map((p, idx) => {
                    const hasKey = p.access_key && p.access_key.length === 11;
                    return (
                      <tr key={p.id} className="hover:bg-[#f4f4f4] transition-colors">
                        <td className="py-3 px-3 text-center font-mono font-bold text-[#555555]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#1e1e1e]">
                          {p.name || <span className="text-[#999999] italic">User MoneyFlow</span>}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-[#555555]">
                          {p.id}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#1e1e1e]">
                          {hasKey ? (
                            <div className="flex items-center gap-2">
                              <span className="bg-[#f0f0f0] px-2 py-0.5 border border-[#1e1e1e]">
                                {formatKeyDisplay(p.access_key)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyKey(p.access_key!)}
                                title="Salin Key"
                                className="p-1 border border-[#1e1e1e] hover:bg-[#1e1e1e] hover:text-white transition-colors cursor-pointer"
                              >
                                {copiedKey === p.access_key ? (
                                  <Check className="h-3 w-3 text-[#356342]" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-[#a53a2b] font-bold uppercase tracking-wider">
                              Belum Punya Key
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {hasKey ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#356342] bg-[#356342]/10 px-2 py-0.5 border border-[#356342]">
                              Tersambung
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9a5a21] bg-[#9a5a21]/10 px-2 py-0.5 border border-[#9a5a21]">
                              Perlu Key
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleAssignKeyToProfile(p)}
                            className="px-3 py-1 text-xs font-bold border border-[#1e1e1e] bg-white hover:bg-[#1e1e1e] hover:text-white transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                          >
                            <KeyRound className="h-3 w-3 text-[#ff5722]" />
                            {hasKey ? "Ganti / Buat Key Baru" : "Buat & Pasangkan Key"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKeys;
