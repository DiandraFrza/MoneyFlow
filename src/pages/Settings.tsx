/** @format */

import React, { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useFinanceStore } from "../store/financeStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { User, Wallet as WalletIcon, Scale, Calendar, Plus, Trash2, PiggyBank, CheckCircle2 } from "lucide-react";

export const Settings: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const { wallets, categories, budgets, debts, recurring, addWallet, deleteWallet, setBudget, addDebt, updateDebt, deleteDebt, addRecurring, deleteRecurring } = useFinanceStore();

  const [activeTab, setActiveTab] = useState("profile");

  // Helper formatting currency
  const formatCurrency = (amount: number): string => {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  // -------------------------------------------------------------------------
  // 1. Profile State & Actions
  // -------------------------------------------------------------------------
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileSalary, setProfileSalary] = useState(user?.monthly_salary?.toString() || "0");
  const [profileTarget, setProfileTarget] = useState(user?.financial_target?.toString() || "0");
  const [profileSuccess, setProfileSuccess] = useState("");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileSuccess("");

    await updateProfile({
      name: profileName,
      monthly_salary: parseFloat(profileSalary) || 0,
      financial_target: parseFloat(profileTarget) || 0,
    });
    setProfileSuccess("Profil berhasil diperbarui!");
    setTimeout(() => setProfileSuccess(""), 3000);
  };

  // -------------------------------------------------------------------------
  // 2. Wallet State & Actions
  // -------------------------------------------------------------------------
  const [newWalletName, setNewWalletName] = useState("");
  const [newWalletType, setNewWalletType] = useState<"cash" | "bank" | "e-wallet" | "crypto" | "other">("bank");
  const [newWalletProvider, setNewWalletProvider] = useState("");
  const [newWalletBalance, setNewWalletBalance] = useState("");
  const [newWalletColor, setNewWalletColor] = useState("#2563EB");
  const [newWalletNotes, setNewWalletNotes] = useState("");

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newWalletName) return;

    await addWallet(user.id, {
      name: newWalletName,
      type: newWalletType,
      provider: newWalletProvider || undefined,
      description: newWalletNotes || undefined,
      balance: parseFloat(newWalletBalance) || 0,
      icon: "Wallet",
      color: newWalletColor,
    });

    setNewWalletName("");
    setNewWalletProvider("");
    setNewWalletBalance("");
    setNewWalletNotes("");
  };

  const handleDeleteWallet = async (id: string) => {
    if (!user) return;
    if (window.confirm("Hapus dompet ini? Semua transaksi yang terhubung dengan dompet ini juga akan terpengaruh.")) {
      await deleteWallet(user.id, id);
    }
  };

  // -------------------------------------------------------------------------
  // 3. Budgeting State & Actions
  // -------------------------------------------------------------------------
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const [budgetValues, setBudgetValues] = useState<Record<string, string>>(() => {
    const vals: Record<string, string> = {};
    budgets.forEach((b) => {
      if (b.month === 6 && b.year === 2026) {
        vals[b.category_id] = b.amount.toString();
      }
    });
    return vals;
  });
  const [budgetSuccess, setBudgetSuccess] = useState("");

  const handleSaveBudgets = async () => {
    if (!user) return;
    setBudgetSuccess("");

    for (const catId of Object.keys(budgetValues)) {
      const amount = parseFloat(budgetValues[catId]) || 0;
      await setBudget(user.id, {
        category_id: catId,
        amount: amount,
        month: 6,
        year: 2026,
      });
    }

    setBudgetSuccess("Limit anggaran berhasil disimpan!");
    setTimeout(() => setBudgetSuccess(""), 3000);
  };

  // -------------------------------------------------------------------------
  // 4. Debts State & Actions
  // -------------------------------------------------------------------------
  const [debtType, setDebtType] = useState<"borrowed" | "lent">("borrowed");
  const [debtPerson, setDebtPerson] = useState("");
  const [debtAmount, setDebtAmount] = useState("");
  const [debtDueDate, setDebtDueDate] = useState("");
  const [debtDesc, setDebtDesc] = useState("");

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !debtPerson || !debtAmount) return;

    await addDebt(user.id, {
      type: debtType,
      person_name: debtPerson,
      amount: parseFloat(debtAmount),
      remaining_amount: parseFloat(debtAmount),
      due_date: debtDueDate || undefined,
      description: debtDesc || undefined,
    });

    setDebtPerson("");
    setDebtAmount("");
    setDebtDueDate("");
    setDebtDesc("");
  };

  const handlePayDebt = async (debtId: string, amountToPay: string) => {
    if (!user) return;
    const payVal = parseFloat(amountToPay);
    if (isNaN(payVal) || payVal <= 0) return;

    const targetDebt = debts.find((d) => d.id === debtId);
    if (!targetDebt) return;

    const newRemaining = Math.max(0, targetDebt.remaining_amount - payVal);
    await updateDebt(user.id, debtId, {
      remaining_amount: newRemaining,
      status: newRemaining === 0 ? "paid" : "pending",
    });
  };

  const handleDeleteDebt = async (id: string) => {
    if (!user) return;
    if (window.confirm("Hapus catatan utang/piutang ini?")) {
      await deleteDebt(user.id, id);
    }
  };

  // -------------------------------------------------------------------------
  // 5. Recurring State & Actions
  // -------------------------------------------------------------------------
  const [recDesc, setRecDesc] = useState("");
  const [recWallet, setRecWallet] = useState("");
  const [recCat, setRecCat] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recFreq, setRecFreq] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [recDay, setRecDay] = useState("5");

  const handleAddRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !recDesc || !recAmount || !recWallet) return;

    // Calculate simulated next date (e.g. July 5th, 2026 or similar depending on the day input)
    const nextDate = `2026-07-${recDay.padStart(2, "0")}`;

    await addRecurring(user.id, {
      wallet_id: recWallet,
      category_id: recCat || null,
      type: "expense", // defaults to recurring expense
      amount: parseFloat(recAmount),
      description: recDesc,
      frequency: recFreq,
      interval_day: parseInt(recDay) || 5,
      next_date: nextDate,
    });

    setRecDesc("");
    setRecAmount("");
  };

  const handleDeleteRec = async (id: string) => {
    if (!user) return;
    if (window.confirm("Hapus transaksi rutin ini?")) {
      await deleteRecurring(user.id, id);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Navigation Tabs List */}
        <TabsList className="grid grid-cols-5 gap-1">
          <TabsTrigger value="profile">
            <span className="hidden sm:inline">Profil</span>
            <User className="h-4.5 w-4.5 sm:hidden" />
          </TabsTrigger>
          <TabsTrigger value="wallets">
            <span className="hidden sm:inline">Dompet</span>
            <WalletIcon className="h-4.5 w-4.5 sm:hidden" />
            <Select
              label="Provider (Opsional)"
              value={newWalletProvider}
              onChange={(e) => setNewWalletProvider(e.target.value)}
              options={[
                { value: "", label: "Pilih Provider (opsional)" },
                { value: "Mandiri", label: "Bank Mandiri" },
                { value: "BCA", label: "Bank BCA" },
                { value: "BNI", label: "Bank BNI" },
                { value: "BRI", label: "Bank BRI" },
                { value: "SeaBank", label: "Sea Bank" },
                { value: "Jago", label: "Jago" },
                { value: "GoPay", label: "GoPay" },
                { value: "Dana", label: "Dana" },
                { value: "OVO", label: "OVO" },
                { value: "Other", label: "Lainnya" },
              ]}
            />
          </TabsTrigger>
          <TabsTrigger value="budgets">
            <span className="hidden sm:inline">Anggaran</span>
            <Scale className="h-4.5 w-4.5 sm:hidden" />
          </TabsTrigger>
          <TabsTrigger value="debts">
            <span className="hidden sm:inline">Utang</span>
            <PiggyBank className="h-4.5 w-4.5 sm:hidden" />
          </TabsTrigger>
          <TabsTrigger value="recurring">
            <span className="hidden sm:inline">Rutin</span>
            <Calendar className="h-4.5 w-4.5 sm:hidden" />
            <Input label="Keterangan / Catatan (Opsional)" placeholder="Contoh: Rekening gaji utama atau saldo e-wallet" value={newWalletNotes} onChange={(e) => setNewWalletNotes(e.target.value)} />
          </TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------------------------
            TAB 1: USER PROFILE SETTINGS
            --------------------------------------------------------------------- */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informasi Personal & Gaji
              </CardTitle>
              <CardDescription>Sesuaikan informasi dasar untuk algoritma kesehatan keuangan.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4 max-w-md">
                <Input label="Nama Pengguna" value={profileName} onChange={(e) => setProfileName(e.target.value)} required />

                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" label="Gaji Bulanan (Rp)" value={profileSalary} onChange={(e) => setProfileSalary(e.target.value)} required />
                  <Input type="number" label="Target Jangka Panjang (Rp)" value={profileTarget} onChange={(e) => setProfileTarget(e.target.value)} required />
                </div>

                {profileSuccess && (
                  <p className="text-xs text-success font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    {profileSuccess}
                  </p>
                )}

                <Button type="submit" className="h-11 font-bold mt-2 text-xs">
                  Simpan Perubahan
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------------------
            TAB 2: MULTI WALLET MANAGEMENT
            --------------------------------------------------------------------- */}
        <TabsContent value="wallets">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Add Wallet */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Buat Dompet Baru</CardTitle>
                <CardDescription>Pisahkan uang kas, bank, atau saldo e-wallet.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddWallet} className="flex flex-col gap-4">
                  <Input label="Nama Dompet / Rekening" placeholder="BCA, Jago, GoPay, Tunai" value={newWalletName} onChange={(e) => setNewWalletName(e.target.value)} required />

                  <Select
                    label="Jenis Dompet"
                    value={newWalletType}
                    onChange={(e) => setNewWalletType(e.target.value as any)}
                    options={[
                      { value: "cash", label: "Cash (Tunai)" },
                      { value: "bank", label: "Bank (Rekening)" },
                      { value: "e-wallet", label: "E-Wallet (Dana/GoPay)" },
                      { value: "crypto", label: "Crypto Wallet" },
                      { value: "other", label: "Lainnya" },
                    ]}
                  />

                  <Input type="number" label="Saldo Awal (Rp)" placeholder="0" value={newWalletBalance} onChange={(e) => setNewWalletBalance(e.target.value)} />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-mutedLight tracking-wide">Pilih Warna</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={newWalletColor} onChange={(e) => setNewWalletColor(e.target.value)} className="h-10 w-12 rounded border cursor-pointer" />
                      <span className="text-xs font-mono uppercase font-bold text-text-mutedLight">{newWalletColor}</span>
                    </div>
                  </div>

                  <Button type="submit" className="h-11 font-bold mt-2 text-xs">
                    <Plus className="h-4.5 w-4.5 mr-1.5" />
                    Tambah Dompet
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* List Active Wallets */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Daftar Dompet Aktif ({wallets.length})</CardTitle>
                <CardDescription>Daftar rekening terdaftar dan sisa saldonya.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {wallets.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-3.5 border rounded-xl shadow-soft-sm bg-white dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: w.color }}>
                        <WalletIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black leading-none">{w.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-text-mutedLight dark:text-text-mutedDark uppercase mt-1 inline-block">{w.type}</span>
                          {w.provider && <span className="text-[9px] text-text-mutedLight dark:text-text-mutedDark mt-1">· {w.provider}</span>}
                        </div>
                        {w.description && <p className="text-[10px] text-text-mutedLight dark:text-text-mutedDark mt-1">{w.description}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <h4 className="text-xs font-black">{formatCurrency(w.balance)}</h4>
                      {/* Prevent deleting if only 1 wallet remains */}
                      {wallets.length > 1 && (
                        <button onClick={() => handleDeleteWallet(w.id)} className="p-2 rounded-lg bg-slate-50 hover:bg-red-50 text-text-mutedLight hover:text-red-500 dark:bg-slate-800 dark:hover:bg-red-950/20 transition-all btn-pressable">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------------------
            TAB 3: BUDGET PLANNING per CATEGORY
            --------------------------------------------------------------------- */}
        <TabsContent value="budgets">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Atur Batas Anggaran Bulanan (Juni 2026)</CardTitle>
              <CardDescription>Tentukan limit pengeluaran per kategori agar tidak boros.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 max-w-lg">
              <div className="flex flex-col gap-4">
                {expenseCategories.map((cat) => (
                  <div key={cat.id} className="grid grid-cols-2 items-center gap-4 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/10">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-xs font-bold">{cat.name}</span>
                    </div>
                    <Input
                      type="number"
                      placeholder="Belum ada limit"
                      value={budgetValues[cat.id] || ""}
                      onChange={(e) => {
                        setBudgetValues({ ...budgetValues, [cat.id]: e.target.value });
                      }}
                      className="h-10 text-right"
                    />
                  </div>
                ))}
              </div>

              {budgetSuccess && (
                <p className="text-xs text-success font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  {budgetSuccess}
                </p>
              )}

              <Button onClick={handleSaveBudgets} className="h-11 font-bold mt-2 text-xs">
                Simpan Limit Anggaran
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------------------------------------
            TAB 4: DEBT & LOAN MANAGEMENT
            --------------------------------------------------------------------- */}
        <TabsContent value="debts">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Add Debt */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Catat Utang Baru</CardTitle>
                <CardDescription>Rekam transaksi pinjam atau meminjamkan uang.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddDebt} className="flex flex-col gap-4">
                  <Select
                    label="Tipe Catatan"
                    value={debtType}
                    onChange={(e) => setDebtType(e.target.value as any)}
                    options={[
                      { value: "borrowed", label: "Utang (Kita Pinjam Uang)" },
                      { value: "lent", label: "Piutang (Kita Pinjamkan Uang)" },
                    ]}
                  />

                  <Input label="Nama Orang / Instansi" placeholder="Budi, Bank BCA, dll." value={debtPerson} onChange={(e) => setDebtPerson(e.target.value)} required />

                  <Input type="number" label="Jumlah Uang (Rp)" placeholder="0" value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)} required />

                  <Input type="date" label="Jatuh Tempo (Opsional)" value={debtDueDate} onChange={(e) => setDebtDueDate(e.target.value)} />

                  <Input label="Keterangan / Alasan" placeholder="Pinjam uang makan, talangan ojol" value={debtDesc} onChange={(e) => setDebtDesc(e.target.value)} />

                  <Button type="submit" className="h-11 font-bold mt-2 text-xs">
                    Catat Utang
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* List Active Debts */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Utang & Piutang Aktif ({debts.length})</CardTitle>
                <CardDescription>Kelola cicilan pembayaran dan pelunasan pinjaman.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {debts.map((d) => {
                  const [payVal, setPayVal] = useState("");
                  return (
                    <div key={d.id} className="p-4 border rounded-xl shadow-soft-sm bg-white dark:bg-slate-900 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`text-[9px] font-bold uppercase rounded px-1.5 py-0.5 ${d.type === "borrowed" ? "bg-red-50 text-danger border border-red-100 dark:bg-red-950/20" : "bg-green-50 text-success border border-green-100 dark:bg-green-950/20"}`}>{d.type === "borrowed" ? "HUTANG KITA" : "PIUTANG KITA"}</span>
                          <h4 className="text-xs font-black mt-2">{d.person_name}</h4>
                          {d.description && <p className="text-[10px] text-text-mutedLight dark:text-text-mutedDark mt-0.5">{d.description}</p>}
                        </div>
                        <div className="text-right">
                          <h4 className="text-xs font-black">{formatCurrency(d.remaining_amount)}</h4>
                          <span className="text-[9px] text-text-mutedLight">Sisa dari {formatCurrency(d.amount)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-y-2 border-t border-slate-50 dark:border-slate-800/40 pt-3 text-[10px]">
                        <div className="text-text-mutedLight dark:text-text-mutedDark">
                          {d.due_date && (
                            <span>
                              Tempo: <span className="font-bold">{d.due_date}</span>
                            </span>
                          )}
                          <span className={`ml-3 font-extrabold ${d.status === "paid" ? "text-success" : "text-warning"}`}>{d.status === "paid" ? "LUNAS" : "PENDING"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {d.status !== "paid" && (
                            <div className="flex items-center gap-1.5">
                              <Input type="number" placeholder="Bayar (Rp)" value={payVal} onChange={(e) => setPayVal(e.target.value)} className="h-8 w-24 text-right px-2 text-[10px]" />
                              <Button
                                size="sm"
                                onClick={() => {
                                  handlePayDebt(d.id, payVal);
                                  setPayVal("");
                                }}
                                className="h-8 text-[10px] font-bold py-0 px-2.5"
                              >
                                Cicil
                              </Button>
                            </div>
                          )}
                          <button onClick={() => handleDeleteDebt(d.id)} className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-50 text-text-mutedLight hover:text-red-500 dark:bg-slate-800 dark:hover:bg-red-950/20 transition-all">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---------------------------------------------------------------------
            TAB 5: RECURRING TRANSACTIONS
            --------------------------------------------------------------------- */}
        <TabsContent value="recurring">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Add Recurring */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Transaksi Rutin Baru</CardTitle>
                <CardDescription>Catat otomatis biaya internet, kost, atau langganan bulanan.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddRecurring} className="flex flex-col gap-4">
                  <Input label="Nama Layanan / Catatan" placeholder="Netflix, IndiHome, Kos, Spotify" value={recDesc} onChange={(e) => setRecDesc(e.target.value)} required />

                  <Input type="number" label="Nominal Transaksi (Rp)" placeholder="0" value={recAmount} onChange={(e) => setRecAmount(e.target.value)} required />

                  <Select label="Metode Pembayaran (Dompet)" value={recWallet} onChange={(e) => setRecWallet(e.target.value)} options={[{ value: "", label: "Pilih Dompet..." }, ...wallets.map((w) => ({ value: w.id, label: w.name }))]} />

                  <Select label="Kategori Pengeluaran" value={recCat} onChange={(e) => setRecCat(e.target.value)} options={[{ value: "", label: "Pilih Kategori..." }, ...expenseCategories.map((c) => ({ value: c.id, label: c.name }))]} />

                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Frekuensi"
                      value={recFreq}
                      onChange={(e) => setRecFreq(e.target.value as any)}
                      options={[
                        { value: "weekly", label: "Mingguan" },
                        { value: "monthly", label: "Bulanan" },
                        { value: "yearly", label: "Tahunan" },
                      ]}
                    />
                    <Input type="number" label="Tanggal Tagihan" placeholder="1 s/d 31" value={recDay} onChange={(e) => setRecDay(e.target.value)} required />
                  </div>

                  <Button type="submit" className="h-11 font-bold mt-2 text-xs">
                    Aktifkan Rutinitas
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* List Active Recurring Schedules */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Daftar Transaksi Rutin Aktif ({recurring.length})</CardTitle>
                <CardDescription>Transaksi otomatis yang terdaftar.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3.5">
                {recurring.map((r) => {
                  const walletName = wallets.find((w) => w.id === r.wallet_id)?.name || "N/A";
                  return (
                    <div key={r.id} className="p-3.5 border rounded-xl shadow-soft-sm bg-white dark:bg-slate-900 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-black leading-none">{r.description}</h4>
                        <div className="flex flex-wrap gap-2 text-[9px] text-text-mutedLight dark:text-text-mutedDark mt-1.5 uppercase font-bold">
                          <span>{walletName}</span>
                          <span>• {r.frequency}</span>
                          <span>• Tgl {r.interval_day}</span>
                        </div>
                        <span className="text-[8px] font-bold text-primary mt-1 inline-block">Tempo berikutnya: {r.next_date}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <h4 className="text-xs font-black text-danger">-{formatCurrency(r.amount)}</h4>
                        <button onClick={() => handleDeleteRec(r.id)} className="p-2 rounded-lg bg-slate-50 hover:bg-red-50 text-text-mutedLight hover:text-red-500 dark:bg-slate-800 dark:hover:bg-red-950/20 transition-all btn-pressable">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default Settings;
