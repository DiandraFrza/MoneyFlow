/** @format */

import React, { useState, useEffect, useMemo } from "react";
import { Users, Trash2, Share2, Copy, Receipt, Calculator, Wallet as WalletIcon } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useFinanceStore } from "../store/financeStore";
import { useToastStore } from "../store/toastStore";
import { db } from "../lib/repository";
import type { SplitBill, SplitBillMember } from "../types";
import { cn, formatCurrencyInput, parseCurrencyInput } from "../lib/utils";

const formatRp = (num: number) => `Rp ${Math.round(num).toLocaleString("id-ID")}`;

export const SplitBillPage: React.FC = () => {
  const { user, activeWorkspaceId } = useAuthStore();
  const { wallets, addTransaction } = useFinanceStore();
  const { showToast } = useToastStore();

  // Mode: "create" (form) vs "history" (daftar patungan lampau)
  const [viewTab, setViewTab] = useState<"create" | "history">("create");

  // State Form Patungan
  const [title, setTitle] = useState("Makan Bareng");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [mode, setMode] = useState<"equal" | "itemized">("equal");
  const [targetWalletId, setTargetWalletId] = useState<string>("");
  const [paymentInfo, setPaymentInfo] = useState<string>("");

  // Tagihan Global
  const [subtotalInput, setSubtotalInput] = useState<string>("");
  const [discountInput, setDiscountInput] = useState<string>("0");
  const [taxPercent, setTaxPercent] = useState<number>(10); // Pajak resto standar 10%
  const [servicePercent, setServicePercent] = useState<number>(0);

  // Peserta
  const [members, setMembers] = useState<Array<{ id: string; name: string; isPaid: boolean }>>([
    { id: "m-1", name: "Saya (Anda)", isPaid: true },
    { id: "m-2", name: "Teman 1", isPaid: false },
  ]);
  const [newMemberName, setNewMemberName] = useState("");

  // Item pesanan (Khusus mode Itemized)
  const [items, setItems] = useState<Array<{ id: string; name: string; price: number; memberIds: string[] }>>([
    { id: "i-1", name: "Menu 1", price: 35000, memberIds: ["m-1"] },
    { id: "i-2", name: "Menu 2", price: 40000, memberIds: ["m-2"] },
  ]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  // Riwayat Patungan yang Tersimpan
  const [savedBills, setSavedBills] = useState<SplitBill[]>([]);
  const [isLoadingBills, setIsLoadingBills] = useState<boolean>(true);

  // Load split bills dari DB Supabase & LocalStorage
  useEffect(() => {
    let isMounted = true;
    const fetchBills = async () => {
      if (!user) return;
      try {
        setIsLoadingBills(true);
        const data = await db.splitBills.list(user.id, activeWorkspaceId || undefined);
        if (isMounted) {
          setSavedBills(data);
        }
      } catch (err) {
        console.error("Error loading split bills:", err);
      } finally {
        if (isMounted) setIsLoadingBills(false);
      }
    };
    fetchBills();
    return () => {
      isMounted = false;
    };
  }, [user, activeWorkspaceId]);

  // Auto-fill info rekening dari dompet saat dipilih
  useEffect(() => {
    if (wallets.length > 0 && !targetWalletId) {
      setTargetWalletId(wallets[0].id);
      const w = wallets[0];
      setPaymentInfo(`${w.provider || w.name} a.n ${user?.name || "Saya"}`);
    }
  }, [wallets, targetWalletId, user]);

  const handleWalletChange = (walletId: string) => {
    setTargetWalletId(walletId);
    const selected = wallets.find((w) => w.id === walletId);
    if (selected) {
      setPaymentInfo(`${selected.provider || selected.name} a.n ${user?.name || "Saya"}`);
    }
  };

  // LocalStorage & Supabase sync handled via db.splitBills

  // ── KALKULASI MATEMATIKA PATUNGAN ──────────────────────────────────────────
  const calculations = useMemo(() => {
    const rawDiscount = parseCurrencyInput(discountInput) || 0;

    if (mode === "equal") {
      const rawSubtotal = parseCurrencyInput(subtotalInput) || 0;
      const afterDiscount = Math.max(0, rawSubtotal - rawDiscount);
      const taxAmount = Math.round((afterDiscount * taxPercent) / 100);
      const serviceAmount = Math.round((afterDiscount * servicePercent) / 100);
      const grandTotal = afterDiscount + taxAmount + serviceAmount;

      const memberCount = Math.max(1, members.length);
      const perPerson = Math.round(grandTotal / memberCount);

      const calculatedMembers: SplitBillMember[] = members.map((m, idx) => ({
        id: m.id,
        name: m.name,
        isOwner: idx === 0,
        isPaid: m.isPaid,
        allocatedAmount: perPerson,
      }));

      return {
        subtotal: rawSubtotal,
        discount: rawDiscount,
        taxAmount,
        serviceAmount,
        grandTotal,
        calculatedMembers,
      };
    } else {
      // Mode Itemized
      const itemsSubtotal = items.reduce((sum, item) => sum + item.price, 0);
      const afterDiscount = Math.max(0, itemsSubtotal - rawDiscount);
      const taxAmount = Math.round((afterDiscount * taxPercent) / 100);
      const serviceAmount = Math.round((afterDiscount * servicePercent) / 100);
      const grandTotal = afterDiscount + taxAmount + serviceAmount;

      // Rasio markup pajak & service dibanding subtotal
      const markupRatio = itemsSubtotal > 0 ? grandTotal / itemsSubtotal : 1;

      // Hitung porsi dasar per orang dari item yang mereka patungi
      const memberBaseTotals: Record<string, number> = {};
      members.forEach((m) => {
        memberBaseTotals[m.id] = 0;
      });

      items.forEach((item) => {
        const sharers = item.memberIds.length > 0 ? item.memberIds : [members[0]?.id || "m-1"];
        const splitPrice = item.price / sharers.length;
        sharers.forEach((mId) => {
          if (memberBaseTotals[mId] !== undefined) {
            memberBaseTotals[mId] += splitPrice;
          }
        });
      });

      // Alokasikan pajak & service proporsional
      const calculatedMembers: SplitBillMember[] = members.map((m, idx) => ({
        id: m.id,
        name: m.name,
        isOwner: idx === 0,
        isPaid: m.isPaid,
        allocatedAmount: Math.round((memberBaseTotals[m.id] || 0) * markupRatio),
      }));

      return {
        subtotal: itemsSubtotal,
        discount: rawDiscount,
        taxAmount,
        serviceAmount,
        grandTotal,
        calculatedMembers,
      };
    }
  }, [mode, subtotalInput, discountInput, taxPercent, servicePercent, members, items]);

  // Handler Anggota
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newMemberName.trim();
    if (!clean) return;
    const newId = `m-${Date.now()}`;
    setMembers((prev) => [...prev, { id: newId, name: clean, isPaid: false }]);
    setNewMemberName("");
  };

  const handleRemoveMember = (id: string) => {
    if (members.length <= 1) {
      showToast("Minimal harus ada 1 peserta", "warning");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    // Hapus dari item assignments
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        memberIds: item.memberIds.filter((mId) => mId !== id),
      })),
    );
  };

  const handleToggleMemberPaid = (id: string) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, isPaid: !m.isPaid } : m)));
  };

  // Handler Item (Mode Itemized)
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newItemName.trim();
    const rawPrice = parseCurrencyInput(newItemPrice);
    if (!cleanName || !rawPrice) return;

    const newItem = {
      id: `i-${Date.now()}`,
      name: cleanName,
      price: rawPrice,
      memberIds: members.map((m) => m.id), // Default dibagi ke semua peserta
    };
    setItems((prev) => [...prev, newItem]);
    setNewItemName("");
    setNewItemPrice("");
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleToggleItemMember = (itemId: string, memberId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const exists = item.memberIds.includes(memberId);
        const updated = exists ? item.memberIds.filter((id) => id !== memberId) : [...item.memberIds, memberId];
        return { ...item, memberIds: updated.length > 0 ? updated : [memberId] };
      }),
    );
  };

  // ── GENERATE TEKS WHATSAPP RAFI & ELEGANT ──────────────────────────────────
  const generateWhatsAppText = () => {
    const lines: string[] = [];
    lines.push(`*RINCIAN PATUNGAN: ${title.toUpperCase()}*`);
    lines.push(`Tanggal: ${new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`);
    lines.push(`Total Tagihan: ${formatRp(calculations.grandTotal)}`);
    if (taxPercent > 0 || servicePercent > 0) {
      lines.push(`_(Termasuk Pajak ${taxPercent}% & Service ${servicePercent}%)_`);
    }
    lines.push("");
    lines.push(`*TAGIHAN PER ORANG:*`);

    calculations.calculatedMembers.forEach((m, idx) => {
      const statusIcon = m.isPaid ? "LUNAS" : "BELUM TRANSFER";
      lines.push(`${idx + 1}. *${m.name}*: ${formatRp(m.allocatedAmount)} (${statusIcon})`);
    });

    if (paymentInfo.trim()) {
      lines.push("");
      lines.push(`💳 *Pembayaran / Transfer ke:*`);
      lines.push(`${paymentInfo.trim()}`);
    }

    lines.push("");
    lines.push(`Mohon konfirmasi transfer ya guys, terima kasih! 🙏✨`);
    return lines.join("\n");
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppText();
    navigator.clipboard.writeText(text);
    showToast("Teks rincian berhasil disalin! Siap dipaste ke grup WhatsApp.", "success");
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppText());
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  // ── SIMPAN PATUNGAN & CATAT PORSI KE TRANSAKSI ─────────────────────────────
  const handleSaveBill = async () => {
    if (!user) {
      showToast("Silakan login terlebih dahulu.", "warning");
      return;
    }
    const billData: Omit<SplitBill, "id" | "created_at"> = {
      title: title || "Patungan",
      date,
      mode,
      workspace_id: activeWorkspaceId || undefined,
      subtotal: calculations.subtotal,
      discount: calculations.discount,
      taxPercent,
      taxAmount: calculations.taxAmount,
      servicePercent,
      serviceAmount: calculations.serviceAmount,
      total: calculations.grandTotal,
      paymentInfo,
      targetWalletId,
      members: calculations.calculatedMembers,
      items: mode === "itemized" ? items.map((i) => ({ ...i, assignedToMemberIds: i.memberIds })) : undefined,
    };

    try {
      const created = await db.splitBills.create(user.id, billData);
      setSavedBills((prev) => [created, ...prev.filter((b) => b.id !== created.id)]);
      showToast(`Patungan "${created.title}" berhasil disimpan ke cloud & database!`, "success");
      setViewTab("history");
    } catch (err: any) {
      showToast(err?.message || "Gagal menyimpan patungan", "error");
    }
  };

  const handleRecordMyShare = async () => {
    if (!user) return;
    if (!targetWalletId) {
      showToast("Pilih dompet pembayaran terlebih dahulu.", "warning");
      return;
    }
    const myShare = calculations.calculatedMembers[0]?.allocatedAmount || 0;
    if (myShare <= 0) {
      showToast("Porsi tagihan Anda Rp 0.", "warning");
      return;
    }

    try {
      await addTransaction(user.id, {
        wallet_id: targetWalletId,
        type: "expense",
        amount: myShare,
        description: `Split Bill: ${title} (Porsi Saya)`,
        date: date,
        category_id: null,
      });
      showToast(`Porsi Anda (${formatRp(myShare)}) berhasil dicatat ke pengeluaran dompet!`, "success");
    } catch (err: any) {
      showToast(err?.message || "Gagal mencatat transaksi", "error");
    }
  };

  // Riwayat Handler
  const handleDeleteHistory = async (id: string) => {
    if (!user) return;
    try {
      await db.splitBills.delete(user.id, id);
      setSavedBills((prev) => prev.filter((b) => b.id !== id));
      showToast("Catatan patungan dihapus.", "info");
    } catch (err: any) {
      showToast(err?.message || "Gagal menghapus patungan", "error");
    }
  };

  const handleToggleHistoryPaid = async (billId: string, memberId: string) => {
    if (!user) return;
    const targetBill = savedBills.find((b) => b.id === billId);
    if (!targetBill) return;

    const updatedMembers = targetBill.members.map((m) => (m.id === memberId ? { ...m, isPaid: !m.isPaid } : m));
    // Optimistic update
    setSavedBills((prev) => prev.map((bill) => (bill.id === billId ? { ...bill, members: updatedMembers } : bill)));

    try {
      await db.splitBills.update(user.id, billId, { members: updatedMembers });
    } catch (err: any) {
      showToast("Gagal memperbarui status patungan", "error");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* ── HEADER HALAMAN ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-[#1e1e1e] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-[#ff5722] text-white">Fitur Patungan Cepat</span>
            {/* <span className="text-[10px] font-bold text-[#555555] uppercase">Indonesian Edition</span> */}
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-[#1e1e1e] mt-1 flex items-center gap-2.5">
            <Calculator className="h-7 w-7 text-[#ff5722]" />
            Split Bill & Patungan
          </h1>
          <p className="text-xs text-[#555555] font-medium mt-1">Bagi rata atau hitung per item lengkap dengan pajak & service resto, lalu tagih ke WhatsApp dalam 1 klik.</p>
        </div>

        {/* Tab Switcher: Buat Baru vs Riwayat */}
        <div className="flex border-2 border-[#1e1e1e] bg-[#f4f4f4] select-none">
          <button type="button" onClick={() => setViewTab("create")} className={cn("px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer", viewTab === "create" ? "bg-[#1e1e1e] text-white" : "text-[#1e1e1e] hover:bg-[#ebebeb]")}>
            + Buat Patungan
          </button>
          <button type="button" onClick={() => setViewTab("history")} className={cn("px-4 py-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border-l-2 border-[#1e1e1e]", viewTab === "history" ? "bg-[#1e1e1e] text-white" : "text-[#1e1e1e] hover:bg-[#ebebeb]")}>
            Riwayat ({savedBills.length})
          </button>
        </div>
      </div>

      {viewTab === "history" ? (
        /* ── TAMPILAN RIWAYAT PATUNGAN ───────────────────────────────────── */
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black uppercase tracking-wider text-[#1e1e1e]">Daftar Tagihan Patungan ({savedBills.length})</h2>
            <button type="button" onClick={() => setViewTab("create")} className="text-xs font-bold text-[#ff5722] hover:underline">
              + Hitung Tagihan Baru
            </button>
          </div>

          {savedBills.length === 0 ? (
            <div className="border-2 border-dashed border-[#1e1e1e] bg-[#fafafa] p-12 text-center flex flex-col items-center justify-center gap-3">
              <Receipt className="h-10 w-10 text-[#888]" />
              <p className="text-sm font-bold text-[#1e1e1e]">Belum ada riwayat patungan</p>
              <p className="text-xs text-[#555]">Semua rincian patungan makan bareng atau beli kado yang kamu simpan akan muncul di sini.</p>
              <button type="button" onClick={() => setViewTab("create")} className="mt-2 px-5 py-2.5 border-2 border-[#1e1e1e] bg-[#ff5722] text-white text-xs font-black uppercase tracking-wider hover:bg-[#1e1e1e] transition-colors cursor-pointer">
                Mulai Hitung Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedBills.map((bill) => {
                const paidCount = bill.members.filter((m) => m.isPaid).length;
                const allPaid = paidCount === bill.members.length;
                return (
                  <div key={bill.id} className="border-2 border-[#1e1e1e] bg-white p-5 flex flex-col justify-between gap-4 shadow-2xs">
                    <div>
                      <div className="flex items-start justify-between gap-2 border-b border-[#1e1e1e] pb-3">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 border border-[#1e1e1e] bg-[#f4f4f4]">{bill.mode === "equal" ? "Bagi Rata" : "Per Item"}</span>
                          <h3 className="text-base font-black text-[#1e1e1e] mt-1">{bill.title}</h3>
                          <p className="text-[11px] text-[#555]">{bill.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold uppercase text-[#555]">Total</p>
                          <p className="text-base font-black text-[#ff5722]">{formatRp(bill.total)}</p>
                        </div>
                      </div>

                      {/* Status Progress Bar Pelunasan */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                          <span className="text-[#555]">Status Pelunasan</span>
                          <span className={cn(allPaid ? "text-[#356342]" : "text-[#a53a2b]")}>
                            {paidCount} dari {bill.members.length} Lunas
                          </span>
                        </div>
                        <div className="h-2 w-full bg-[#f0f0f0] border border-[#1e1e1e] overflow-hidden">
                          <div className={cn("h-full transition-all", allPaid ? "bg-[#356342]" : "bg-[#ff5722]")} style={{ width: `${(paidCount / bill.members.length) * 100}%` }} />
                        </div>
                      </div>

                      {/* Checklist Anggota */}
                      <div className="flex flex-col gap-1.5 mt-3">
                        {bill.members.map((m) => (
                          <div key={m.id} className="flex items-center justify-between text-xs p-1.5 border border-[#e5e5e5] bg-[#fafafa]">
                            <span className="font-bold text-[#1e1e1e] truncate">{m.name}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono font-bold text-[#1e1e1e]">{formatRp(m.allocatedAmount)}</span>
                              <button type="button" onClick={() => handleToggleHistoryPaid(bill.id, m.id)} className={cn("text-[10px] font-black uppercase px-1.5 py-0.5 border transition-colors cursor-pointer", m.isPaid ? "bg-[#356342] text-white border-[#356342]" : "bg-white text-[#a53a2b] border-[#a53a2b] hover:bg-[#a53a2b] hover:text-white")}>
                                {m.isPaid ? "✓ Lunas" : "Belum"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-[#1e1e1e] pt-3">
                      <button type="button" onClick={() => handleDeleteHistory(bill.id)} className="text-[11px] font-bold text-[#a53a2b] hover:underline flex items-center gap-1 cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" /> Hapus
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const lines = [`🧾 *PENGINGAT PATUNGAN: ${bill.title.toUpperCase()}*`, `Total: ${formatRp(bill.total)}`, "", ...bill.members.map((m) => `• ${m.name}: ${formatRp(m.allocatedAmount)} (${m.isPaid ? "✅ Lunas" : "⏳ Belum"})`), bill.paymentInfo ? `\n💳 Transfer ke: ${bill.paymentInfo}` : ""].filter(Boolean);
                          const text = encodeURIComponent(lines.join("\n"));
                          window.open(`https://wa.me/?text=${text}`, "_blank");
                        }}
                        className="px-3 py-1.5 border border-[#1e1e1e] bg-[#1e1e1e] text-white hover:bg-[#ff5722] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Share2 className="h-3 w-3" /> Tagih di WA
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ── TAMPILAN PEMBUATAN PATUNGAN (SPLIT BILL CALCULATOR) ────────── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* KOLOM KIRI: INPUT DETAIL & PESERTA (8 Kolom) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* 1. Pengaturan Dasar Patungan */}
            <div className="border-2 border-[#1e1e1e] bg-white p-5 flex flex-col gap-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-[#1e1e1e] flex items-center gap-1.5">
                  <Receipt className="h-4 w-4 text-[#ff5722]" /> Detail Tagihan
                </span>
                {/* Mode Switcher */}
                <div className="flex border border-[#1e1e1e] bg-[#f4f4f4] select-none text-xs font-bold">
                  <button type="button" onClick={() => setMode("equal")} className={cn("px-3 py-1 transition-colors cursor-pointer", mode === "equal" ? "bg-[#1e1e1e] text-white" : "text-[#555] hover:bg-[#ebebeb]")}>
                    Bagi Rata
                  </button>
                  <button type="button" onClick={() => setMode("itemized")} className={cn("px-3 py-1 transition-colors cursor-pointer border-l border-[#1e1e1e]", mode === "itemized" ? "bg-[#1e1e1e] text-white" : "text-[#555] hover:bg-[#ebebeb]")}>
                    Per Item (Menu)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#555] block mb-1">Nama Kegiatan / Tempat</label>
                  <input type="text" placeholder="Contoh: Makan di Resto, Sewa Villa" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-[#1e1e1e] bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#ff5722]" />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#555] block mb-1">Tanggal</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-[#1e1e1e] bg-white px-3 py-2 text-xs font-bold outline-none focus:border-[#ff5722]" />
                </div>
              </div>

              {/* Subtotal (Hanya aktif di mode Bagi Rata) */}
              {mode === "equal" && (
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#555] block mb-1">Total Subtotal Tagihan (Sebelum Pajak & Diskon)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-[#555]">Rp</span>
                    <input type="text" placeholder="0" value={subtotalInput} onChange={(e) => setSubtotalInput(formatCurrencyInput(e.target.value))} className="w-full pl-10 pr-3 py-2.5 border-2 border-[#1e1e1e] bg-[#fafafa] font-mono text-lg font-black text-[#ff5722] outline-none focus:bg-white" />
                  </div>
                </div>
              )}

              {/* Pajak, Service & Diskon */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[#1e1e1e] pt-3">
                {/* Pajak Resto */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase text-[#555]">Pajak (PB1/PPN)</label>
                    <span className="text-[10px] font-bold text-[#ff5722]">{taxPercent}%</span>
                  </div>
                  <div className="flex border border-[#1e1e1e]">
                    {[0, 10, 11].map((pct) => (
                      <button key={pct} type="button" onClick={() => setTaxPercent(pct)} className={cn("flex-1 py-1.5 text-xs font-bold border-r last:border-r-0 border-[#1e1e1e] transition-colors cursor-pointer", taxPercent === pct ? "bg-[#1e1e1e] text-white" : "bg-white text-[#1e1e1e] hover:bg-[#f4f4f4]")}>
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Service Charge */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase text-[#555]">Service Charge</label>
                    <span className="text-[10px] font-bold text-[#ff5722]">{servicePercent}%</span>
                  </div>
                  <div className="flex border border-[#1e1e1e]">
                    {[0, 5, 7].map((pct) => (
                      <button key={pct} type="button" onClick={() => setServicePercent(pct)} className={cn("flex-1 py-1.5 text-xs font-bold border-r last:border-r-0 border-[#1e1e1e] transition-colors cursor-pointer", servicePercent === pct ? "bg-[#1e1e1e] text-white" : "bg-white text-[#1e1e1e] hover:bg-[#f4f4f4]")}>
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Diskon / Promo */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#555] block mb-1">Diskon / Promo (Rp)</label>
                  <input type="text" placeholder="0" value={discountInput} onChange={(e) => setDiscountInput(formatCurrencyInput(e.target.value))} className="w-full border border-[#1e1e1e] bg-white px-2.5 py-1.5 text-xs font-bold font-mono outline-none" />
                </div>
              </div>

              {/* Rekening Pembayaran */}
              <div className="border-t border-[#1e1e1e] pt-3 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-bold uppercase text-[#555] block mb-1">Tujuan Transfer Pembayaran</label>
                  <select value={targetWalletId} onChange={(e) => handleWalletChange(e.target.value)} className="w-full border border-[#1e1e1e] bg-white px-2.5 py-1.5 text-xs font-bold outline-none cursor-pointer">
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.provider || w.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-bold uppercase text-[#555] block mb-1">Nomor Rekening / Catatan Transfer</label>
                  <input type="text" placeholder="Contoh: BCA 1234567890 a.n Danda" value={paymentInfo} onChange={(e) => setPaymentInfo(e.target.value)} className="w-full border border-[#1e1e1e] bg-white px-2.5 py-1.5 text-xs font-bold outline-none" />
                </div>
              </div>
            </div>

            {/* 2. Mode Per Item (Itemized List) */}
            {mode === "itemized" && (
              <div className="border-2 border-[#1e1e1e] bg-white p-5 flex flex-col gap-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-[#1e1e1e]">Daftar Menu & Pesanan ({items.length})</span>
                  <span className="text-[11px] text-[#555] font-semibold">
                    Subtotal Menu: <strong>{formatRp(calculations.subtotal)}</strong>
                  </span>
                </div>

                {/* Form Tambah Menu */}
                <form onSubmit={handleAddItem} className="flex flex-col sm:flex-row gap-2">
                  <input type="text" placeholder="Nama Menu (cth: Ayam Geprek)" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="flex-2 border border-[#1e1e1e] bg-white px-3 py-2 text-xs font-bold outline-none" />
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#555]">Rp</span>
                    <input type="text" placeholder="Harga" value={newItemPrice} onChange={(e) => setNewItemPrice(formatCurrencyInput(e.target.value))} className="w-full pl-8 pr-2.5 py-2 border border-[#1e1e1e] bg-white text-xs font-bold font-mono outline-none" />
                  </div>
                  <button type="submit" className="px-4 py-2 border border-[#1e1e1e] bg-[#1e1e1e] text-white hover:bg-[#ff5722] text-xs font-black uppercase tracking-wider transition-colors cursor-pointer">
                    + Tambah Menu
                  </button>
                </form>

                {/* List Item & Pemesan */}
                <div className="flex flex-col gap-2 mt-2">
                  {items.map((item) => (
                    <div key={item.id} className="p-3 border border-[#1e1e1e] bg-[#fafafa] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-[#1e1e1e]">{item.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs text-[#ff5722]">{formatRp(item.price)}</span>
                          <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-[#a53a2b] hover:text-[#1e1e1e] cursor-pointer" title="Hapus menu">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Siapa saja yang patungan menu ini */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#e5e5e5]">
                        <span className="text-[10px] font-bold uppercase text-[#555] mr-1">Peserta:</span>
                        {members.map((m) => {
                          const isAssigned = item.memberIds.includes(m.id);
                          return (
                            <button key={m.id} type="button" onClick={() => handleToggleItemMember(item.id, m.id)} className={cn("text-[10px] font-black uppercase px-2 py-0.5 border transition-colors cursor-pointer", isAssigned ? "bg-[#1e1e1e] text-white border-[#1e1e1e]" : "bg-white text-[#555] border-[#ccc] hover:border-[#1e1e1e]")}>
                              {isAssigned ? "✓ " : ""}
                              {m.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Daftar Peserta Patungan */}
            <div className="border-2 border-[#1e1e1e] bg-white p-5 flex flex-col gap-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-[#1e1e1e] pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-[#1e1e1e] flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-[#ff5722]" /> Daftar Peserta ({members.length})
                </span>
                <span className="text-[11px] text-[#555]">Klik status untuk tandai lunas</span>
              </div>

              {/* Form Tambah Peserta */}
              <form onSubmit={handleAddMember} className="flex gap-2">
                <input type="text" placeholder="Ketik nama teman (cth: Budi, Siti, Andi)" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="flex-1 border border-[#1e1e1e] bg-white px-3 py-2 text-xs font-bold outline-none" />
                <button type="submit" className="px-4 py-2 border border-[#1e1e1e] bg-[#1e1e1e] text-white hover:bg-[#ff5722] text-xs font-black uppercase tracking-wider transition-colors cursor-pointer">
                  + Tambah Teman
                </button>
              </form>

              {/* Peserta Chips & Status */}
              <div className="flex flex-col gap-2 mt-1">
                {members.map((member, idx) => (
                  <div key={member.id} className="p-3 border border-[#1e1e1e] bg-[#fafafa] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 bg-[#1e1e1e] text-white text-[10px] font-black flex items-center justify-center">{idx + 1}</span>
                      <span className="font-bold text-xs text-[#1e1e1e]">{member.name}</span>
                      {idx === 0 && <span className="text-[9px] font-bold uppercase px-1 border border-[#1e1e1e] bg-white text-[#ff5722]">Pembuat</span>}
                    </div>

                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => handleToggleMemberPaid(member.id)} className={cn("text-[10px] font-black uppercase px-2.5 py-1 border transition-colors cursor-pointer", member.isPaid ? "bg-[#356342] text-white border-[#356342]" : "bg-white text-[#a53a2b] border-[#a53a2b] hover:bg-[#a53a2b] hover:text-white")}>
                        {member.isPaid ? "Sudah Transfer" : "Belum Bayar"}
                      </button>
                      {idx > 0 && (
                        <button type="button" onClick={() => handleRemoveMember(member.id)} className="text-[#a53a2b] hover:text-[#1e1e1e] cursor-pointer">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: RINGKASAN PEMBAGIAN & SHARE WHATSAPP (5 Kolom Sticky) */}
          <div className="lg:col-span-5 flex flex-col gap-5 sticky top-6">
            {/* Kartu Ringkasan Pembagian */}
            <div className="border-2 border-[#1e1e1e] bg-white p-5 shadow-2xs">
              <div className="border-b-2 border-[#1e1e1e] pb-3 mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#ff5722]">Hasil Hitung</span>
                <h3 className="text-xl font-black uppercase tracking-tight text-[#1e1e1e]">Ringkasan Patungan</h3>
              </div>

              {/* Rincian Finansial */}
              <div className="flex flex-col gap-2 text-xs border-b border-[#1e1e1e] pb-3 mb-3">
                <div className="flex justify-between text-[#555]">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-[#1e1e1e]">{formatRp(calculations.subtotal)}</span>
                </div>
                {calculations.discount > 0 && (
                  <div className="flex justify-between text-[#356342]">
                    <span>Diskon Promo:</span>
                    <span className="font-mono font-bold">-{formatRp(calculations.discount)}</span>
                  </div>
                )}
                {taxPercent > 0 && (
                  <div className="flex justify-between text-[#555]">
                    <span>Pajak ({taxPercent}%):</span>
                    <span className="font-mono font-bold text-[#1e1e1e]">+{formatRp(calculations.taxAmount)}</span>
                  </div>
                )}
                {servicePercent > 0 && (
                  <div className="flex justify-between text-[#555]">
                    <span>Service ({servicePercent}%):</span>
                    <span className="font-mono font-bold text-[#1e1e1e]">+{formatRp(calculations.serviceAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-[#1e1e1e] pt-2 border-t border-[#e5e5e5]">
                  <span>TOTAL AKHIR:</span>
                  <span className="font-mono text-[#ff5722]">{formatRp(calculations.grandTotal)}</span>
                </div>
              </div>

              {/* Rincian per Orang */}
              <div className="flex flex-col gap-2 mb-5">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#555]">Tagihan Masing-Masing:</span>
                {calculations.calculatedMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-2.5 border border-[#1e1e1e] bg-[#fafafa]">
                    <div>
                      <p className="font-bold text-xs text-[#1e1e1e] leading-tight">{m.name}</p>
                      <span className={cn("text-[9px] font-black uppercase", m.isPaid ? "text-[#356342]" : "text-[#a53a2b]")}>{m.isPaid ? "✓ Lunas" : "Belum Bayar"}</span>
                    </div>
                    <span className="font-mono font-black text-sm text-[#ff5722]">{formatRp(m.allocatedAmount)}</span>
                  </div>
                ))}
              </div>

              {/* Action Buttons: WhatsApp & Simpan */}
              <div className="flex flex-col gap-2">
                <button type="button" onClick={handleOpenWhatsApp} className="w-full py-3 border-2 border-[#1e1e1e] bg-[#25D366] text-black hover:bg-[#1ebd59] font-black text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs">
                  <Share2 className="h-4 w-4" /> Kirim Tagihan ke WhatsApp
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={handleCopyWhatsApp} className="py-2.5 border border-[#1e1e1e] bg-white hover:bg-[#f4f4f4] text-[#1e1e1e] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                    <Copy className="h-3.5 w-3.5" /> Salin Teks
                  </button>

                  <button type="button" onClick={handleSaveBill} className="py-2.5 border border-[#1e1e1e] bg-[#1e1e1e] hover:bg-[#ff5722] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                    Simpan Riwayat
                  </button>
                </div>

                {/* Catat porsi saya ke pengeluaran */}
                <button type="button" onClick={handleRecordMyShare} className="w-full mt-1 py-2 border border-dashed border-[#1e1e1e] bg-[#fafafa] hover:bg-[#ffffff] text-[#1e1e1e] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer" title="Otomatis kurangi saldo dompet Anda sebesar porsi Anda">
                  <WalletIcon className="h-3.5 w-3.5 text-[#ff5722]" />
                  Catat Porsi Saya ({formatRp(calculations.calculatedMembers[0]?.allocatedAmount || 0)}) ke Dompet
                </button>
              </div>
            </div>

            {/* Tips Singkat */}
            <div className="border border-[#1e1e1e] bg-[#f9f9f9] p-4 text-[11px] text-[#555] leading-relaxed">
              <p className="font-bold text-[#1e1e1e] mb-1">Tips Patungan Cepat:</p>
              Gunakan mode <strong>Per Item</strong> jika memesan menu bersama (cth: Pizza dibagi berdua, Teh manis diminum sendiri). Pajak resto 10% & service akan dialokasikan proporsional secara otomatis.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SplitBillPage;
