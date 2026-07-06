/** @format */

import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useFinanceStore } from "../store/financeStore";
import { useModalStore } from "../store/modalStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { BeginnerGuide } from "../components/ui/BeginnerGuide";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { User, Wallet as WalletIcon, Scale, Calendar, Plus, Trash2, PiggyBank, CheckCircle2, Tag } from "lucide-react";
import { useToastStore } from "../store/toastStore";

export const Settings: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const { wallets, categories, subcategories, budgets, debts, recurring, addWallet, setBudget, addDebt, updateDebt, addRecurring, addCategory, addSubcategory, addTransaction } = useFinanceStore();
  const { openWalletModal, openBudgetModal, openDebtModal, openRecurringModal, openProfileModal } = useModalStore();
  const { showToast } = useToastStore();

  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("tab") || "profile";
  }, [location.search]);

  const setActiveTab = (tab: string) => {
    navigate(`/settings?tab=${tab}`);
  };

  // -------------------------------------------------------------------------
  // Kategori & Subkategori State & Actions
  // -------------------------------------------------------------------------
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState<string>("");
  const [newSubcategoryName, setNewSubcategoryName] = useState<string>("");
  const [newCategoryName, setNewCategoryName] = useState<string>("");
  const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">("expense");
  const [newCategoryColor, setNewCategoryColor] = useState<string>("#3B82F6");

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCategoryName.trim()) return;
    try {
      await addCategory(user.id, {
        name: newCategoryName.trim(),
        type: newCategoryType,
        icon: "Tag",
        color: newCategoryColor,
      });
      setNewCategoryName("");
      showToast("Kategori baru berhasil ditambahkan!", "success");
    } catch (err) {
      showToast("Gagal menambahkan kategori", "error");
    }
  };

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryForSub || !newSubcategoryName.trim()) return;
    try {
      await addSubcategory(selectedCategoryForSub, newSubcategoryName.trim());
      setNewSubcategoryName("");
      showToast("Subkategori berhasil ditambahkan!", "success");
    } catch (err) {
      showToast("Gagal menambahkan subkategori", "error");
    }
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentMonthLabel = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date());

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

  useEffect(() => {
    setProfileName(user?.name || "");
    setProfileSalary(user?.monthly_salary?.toString() || "0");
    setProfileTarget(user?.financial_target?.toString() || "0");
  }, [user]);

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



  // -------------------------------------------------------------------------
  // 3. Budgeting State & Actions
  // -------------------------------------------------------------------------
  const expenseCategories = categories.filter((c) => c.type === "expense");
  const [budgetValues, setBudgetValues] = useState<Record<string, string>>(() => {
    const vals: Record<string, string> = {};
    budgets.forEach((b) => {
      if (b.month === currentMonth && b.year === currentYear) {
        vals[b.category_id] = b.amount.toString();
      }
    });
    return vals;
  });

  useEffect(() => {
    const vals: Record<string, string> = {};
    budgets.forEach((b) => {
      if (b.month === currentMonth && b.year === currentYear) {
        vals[b.category_id] = b.amount.toString();
      }
    });
    setBudgetValues((prev) => (Object.keys(prev).length === 0 ? vals : prev));
  }, [budgets, currentMonth, currentYear]);
  const [budgetSuccess, setBudgetSuccess] = useState("");

  const handleSaveBudgets = async () => {
    if (!user) return;
    setBudgetSuccess("");

    for (const catId of expenseCategories.map((cat) => cat.id)) {
      const amount = parseFloat(budgetValues[catId]) || 0;
      await setBudget(user.id, {
        category_id: catId,
        amount: amount,
        month: currentMonth,
        year: currentYear,
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
  const [debtWallet, setDebtWallet] = useState("");
  const [payVals, setPayVals] = useState<Record<string, string>>({});
  const [payWallets, setPayWallets] = useState<Record<string, string>>({});

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !debtPerson || !debtAmount) return;

    try {
      await addDebt(user.id, {
        type: debtType,
        person_name: debtPerson,
        amount: parseFloat(debtAmount),
        remaining_amount: parseFloat(debtAmount),
        due_date: debtDueDate || undefined,
        description: debtDesc || undefined,
      });

      // Automatically create transaction if wallet is selected
      if (debtWallet) {
        const isBorrowed = debtType === "borrowed";
        const txDesc = `${isBorrowed ? "Pinjaman Masuk" : "Pinjaman Keluar"} (${debtPerson})${
          debtDesc ? `: ${debtDesc}` : ""
        }`;
        
        await addTransaction(user.id, {
          wallet_id: debtWallet,
          category_id: null,
          sub_category_id: null,
          type: isBorrowed ? "income" : "expense",
          amount: parseFloat(debtAmount),
          description: txDesc,
          date: new Date().toISOString().split("T")[0],
        });
      }

      showToast("Catatan utang berhasil dibuat!", "success");

      setDebtPerson("");
      setDebtAmount("");
      setDebtDueDate("");
      setDebtDesc("");
      setDebtWallet("");
    } catch (err) {
      showToast("Gagal menyimpan catatan utang", "error");
    }
  };

  const handlePayDebt = async (debtId: string, amountToPay: string, payWalletId: string) => {
    if (!user) return;
    const payVal = parseFloat(amountToPay);
    if (isNaN(payVal) || payVal <= 0) {
      showToast("Masukkan jumlah cicilan yang valid", "warning");
      return;
    }
    if (!payWalletId) {
      showToast("Pilih dompet pembayaran terlebih dahulu", "warning");
      return;
    }

    const targetDebt = debts.find((d) => d.id === debtId);
    if (!targetDebt) return;

    try {
      const newRemaining = Math.max(0, targetDebt.remaining_amount - payVal);
      await updateDebt(user.id, debtId, {
        remaining_amount: newRemaining,
        status: newRemaining === 0 ? "paid" : "pending",
      });

      // Create transaction for payment
      const isBorrowed = targetDebt.type === "borrowed";
      const txDesc = `Pembayaran ${isBorrowed ? "Utang" : "Piutang"}: ${targetDebt.person_name}`;
      
      await addTransaction(user.id, {
        wallet_id: payWalletId,
        category_id: null,
        sub_category_id: null,
        type: isBorrowed ? "expense" : "income", // paying debt is expense, receiving piutang is income
        amount: payVal,
        description: txDesc,
        date: new Date().toISOString().split("T")[0],
      });

      showToast("Pembayaran utang berhasil dicatat!", "success");
    } catch (err) {
      showToast("Gagal mencatat pembayaran utang", "error");
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

    const today = new Date();
    let nextMonth = today.getMonth() + 1; // getMonth is 0-indexed, so +1 for next month
    let nextYear = today.getFullYear();
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    const nextDate = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${recDay.padStart(2, "0")}`;

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



  return (
    <div className="flex flex-col gap-6">
      <BeginnerGuide pageKey="settings" />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 h-auto">
          <TabsTrigger value="profile">
            <span className="hidden sm:inline">Profil</span>
            <User className="h-4.5 w-4.5 sm:hidden" />
          </TabsTrigger>
          <TabsTrigger value="wallets">
            <span className="hidden sm:inline">Dompet</span>
            <WalletIcon className="h-4.5 w-4.5 sm:hidden" />
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
          </TabsTrigger>
          <TabsTrigger value="categories">
            <span className="hidden sm:inline">Kategori</span>
            <Tag className="h-4.5 w-4.5 sm:hidden" />
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
              <div className="flex flex-col gap-4 max-w-md">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold mb-2">Nama: {user?.name || "N/A"}</h3>
                    <h3 className="text-xs font-bold mb-2">Gaji Bulanan: {user?.monthly_salary ? `Rp ${user.monthly_salary.toLocaleString("id-ID")}` : "Belum diatur"}</h3>
                    <h3 className="text-xs font-bold">Target Jangka Panjang: {user?.financial_target ? `Rp ${user.financial_target.toLocaleString("id-ID")}` : "Belum diatur"}</h3>
                  </div>
                  <Button onClick={() => openProfileModal()} className="h-11 font-bold text-xs">
                    Edit Profil
                  </Button>
                </div>

                {profileSuccess && (
                  <p className="text-xs text-success font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    {profileSuccess}
                  </p>
                )}

                <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
                  <Input label="Nama Pengguna" value={profileName} onChange={(e) => setProfileName(e.target.value)} required />

                  <div className="grid grid-cols-2 gap-3">
                    <Input type="number" label="Gaji Bulanan (Rp)" value={profileSalary} onChange={(e) => setProfileSalary(e.target.value)} required />
                    <Input type="number" label="Target Jangka Panjang (Rp)" value={profileTarget} onChange={(e) => setProfileTarget(e.target.value)} required />
                  </div>

                  <Button type="submit" className="h-11 font-bold mt-2 text-xs">
                    Simpan Perubahan
                  </Button>
                </form>
              </div>
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

                  <Input type="number" label="Saldo Awal (Rp)" placeholder="0" value={newWalletBalance} onChange={(e) => setNewWalletBalance(e.target.value)} />

                  <Input label="Keterangan / Catatan (Opsional)" placeholder="Contoh: Rekening gaji utama atau saldo e-wallet" value={newWalletNotes} onChange={(e) => setNewWalletNotes(e.target.value)} />

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
                  <Button type="button" variant="outline" onClick={() => openWalletModal("add")} className="h-11 font-bold text-xs">
                    atau Gunakan Modal
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
                      <div className="flex gap-2">
                        <button onClick={() => openWalletModal("edit", w.id)} className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 transition-all btn-pressable text-[10px] font-bold">
                          Edit
                        </button>
                        {/* Prevent deleting if only 1 wallet remains */}
                        {wallets.length > 1 && (
                          <button onClick={() => openWalletModal("delete", w.id)} className="p-2 rounded-lg bg-slate-50 hover:bg-red-50 text-text-mutedLight hover:text-red-500 dark:bg-slate-800 dark:hover:bg-red-950/20 transition-all btn-pressable">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
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
              <CardTitle className="text-base flex items-center justify-between">
                <span>Atur Batas Anggaran Bulanan ({currentMonthLabel})</span>
                <Button onClick={() => openBudgetModal("add")} className="h-9 text-xs">
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Budget
                </Button>
              </CardTitle>
              <CardDescription>Tentukan limit pengeluaran per kategori agar tidak boros.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 max-w-lg">
              <div className="flex flex-col gap-4">
                {expenseCategories.map((cat) => {
                  const catBudget = budgets.find((b) => b.category_id === cat.id && b.month === 6 && b.year === 2026);
                  return (
                    <div key={cat.id} className="grid grid-cols-2 items-center gap-4 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/10">
                      <div className="flex items-center gap-2.5">
                        <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-xs font-bold">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="Belum ada limit"
                          value={budgetValues[cat.id] || ""}
                          onChange={(e) => {
                            setBudgetValues({ ...budgetValues, [cat.id]: e.target.value });
                          }}
                          className="h-10 text-right flex-1 px-2"
                        />
                        {catBudget && (
                          <button onClick={() => openBudgetModal("edit", catBudget.id)} className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/20 text-[10px] font-bold">
                            Edit
                          </button>
                        )}
                        {catBudget && (
                          <button onClick={() => openBudgetModal("delete", catBudget.id)} className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
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

                  <Select
                    label="Gunakan Dompet (Salurkan Dana)"
                    value={debtWallet}
                    onChange={(e) => setDebtWallet(e.target.value)}
                    options={[
                      { value: "", label: "-- Tanpa Transaksi Dompet --" },
                      ...wallets.map((w) => ({ value: w.id, label: `${w.name} (Saldo: Rp${w.balance.toLocaleString("id-ID")})` })),
                    ]}
                  />

                  <Input label="Nama Orang / Instansi" placeholder="Budi, Bank BCA, dll." value={debtPerson} onChange={(e) => setDebtPerson(e.target.value)} required />

                  <Input type="number" label="Jumlah Uang (Rp)" placeholder="0" value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)} required />

                  <Input type="date" label="Jatuh Tempo (Opsional)" value={debtDueDate} onChange={(e) => setDebtDueDate(e.target.value)} />

                  <Input label="Keterangan / Alasan" placeholder="Pinjam uang makan, talangan ojol" value={debtDesc} onChange={(e) => setDebtDesc(e.target.value)} />

                  <Button type="submit" className="h-11 font-bold mt-2 text-xs">
                    Catat Utang
                  </Button>
                  <Button type="button" variant="outline" onClick={() => openDebtModal("add")} className="h-11 font-bold text-xs">
                    atau Gunakan Modal
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
                  const payVal = payVals[d.id] || "";
                  const payWallet = payWallets[d.id] || "";
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
                              <select
                                value={payWallet}
                                onChange={(e) => setPayWallets({ ...payWallets, [d.id]: e.target.value })}
                                className="h-8 text-[10px] w-28 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 focus:outline-none focus:border-primary text-text-light dark:text-text-dark"
                              >
                                <option value="">-- Pilih Dompet --</option>
                                {wallets.map((w) => (
                                  <option key={w.id} value={w.id}>
                                    {w.name}
                                  </option>
                                ))}
                              </select>
                              <Input type="number" placeholder="Bayar (Rp)" value={payVal} onChange={(e) => setPayVals({ ...payVals, [d.id]: e.target.value })} className="h-8 w-24 text-right px-2 text-[10px]" />
                              <Button
                                size="sm"
                                onClick={() => {
                                  handlePayDebt(d.id, payVal, payWallet);
                                  setPayVals({ ...payVals, [d.id]: "" });
                                  setPayWallets({ ...payWallets, [d.id]: "" });
                                }}
                                className="h-8 text-[10px] font-bold py-0 px-2.5"
                              >
                                Cicil
                              </Button>
                            </div>
                          )}
                          <button onClick={() => openDebtModal("edit", d.id)} className="px-2 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/20 text-[9px] font-bold">
                            Edit
                          </button>
                          <button onClick={() => openDebtModal("delete", d.id)} className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-50 text-text-mutedLight hover:text-red-500 dark:bg-slate-800 dark:hover:bg-red-950/20 transition-all">
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
                  <Button type="button" variant="outline" onClick={() => openRecurringModal("add")} className="h-11 font-bold text-xs">
                    atau Gunakan Modal
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

                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-danger">-{formatCurrency(r.amount)}</h4>
                        <button onClick={() => openRecurringModal("edit", r.id)} className="px-2 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/20 text-[9px] font-bold">
                          Edit
                        </button>
                        <button onClick={() => openRecurringModal("delete", r.id)} className="p-2 rounded-lg bg-slate-50 hover:bg-red-50 text-text-mutedLight hover:text-red-500 dark:bg-slate-800 dark:hover:bg-red-950/20 transition-all btn-pressable">
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

        {/* ---------------------------------------------------------------------
            TAB 6: CATEGORIES & SUBCATEGORIES MANAGEMENT
            --------------------------------------------------------------------- */}
        <TabsContent value="categories">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category List Column */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary" />
                  Daftar Kategori
                </CardTitle>
                <CardDescription>Pilih kategori untuk melihat atau menambah subkategori.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryForSub(cat.id);
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        selectedCategoryForSub === cat.id
                          ? "border-primary bg-primary/5 dark:bg-primary/10 font-bold"
                          : "border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-xs">{cat.name}</span>
                      </div>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        cat.type === "income" ? "bg-green-50 text-success dark:bg-green-950/20" : "bg-red-50 text-danger dark:bg-red-950/20"
                      }`}>
                        {cat.type === "income" ? "Masuk" : "Keluar"}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Add Category Form */}
                <form onSubmit={handleAddCategory} className="border-t border-slate-50 dark:border-slate-800/40 pt-4 flex flex-col gap-3">
                  <h4 className="text-xs font-bold">Tambah Kategori Baru</h4>
                  <Input
                    placeholder="Nama Kategori (misal: Zakat)"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    required
                    className="h-9 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={newCategoryType}
                      onChange={(e) => setNewCategoryType(e.target.value as any)}
                      options={[
                        { value: "expense", label: "Pengeluaran" },
                        { value: "income", label: "Pemasukan" }
                      ]}
                      className="h-9 text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newCategoryColor}
                        onChange={(e) => setNewCategoryColor(e.target.value)}
                        className="h-9 w-10 border rounded-lg cursor-pointer p-0.5"
                      />
                      <span className="text-[10px] text-text-mutedLight dark:text-text-mutedDark">Warna</span>
                    </div>
                  </div>
                  <Button type="submit" size="sm" className="h-9 text-xs font-bold">
                    Tambah Kategori
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Subcategory List Column */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Subkategori
                </CardTitle>
                <CardDescription>
                  {selectedCategoryForSub
                    ? `Daftar subkategori untuk "${categories.find((c) => c.id === selectedCategoryForSub)?.name}"`
                    : "Pilih kategori di samping terlebih dahulu untuk mengelola subkategori."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {selectedCategoryForSub ? (
                  <>
                    <div className="flex flex-wrap gap-2 min-h-[100px]">
                      {subcategories.filter((sc) => sc.category_id === selectedCategoryForSub).length === 0 ? (
                        <p className="text-xs text-text-mutedLight dark:text-text-mutedDark py-6 italic w-full text-center">
                          Belum ada subkategori untuk kategori ini.
                        </p>
                      ) : (
                        subcategories
                          .filter((sc) => sc.category_id === selectedCategoryForSub)
                          .map((sc) => (
                            <span
                              key={sc.id}
                              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold rounded-xl text-text-light dark:text-text-dark"
                            >
                              {sc.name}
                            </span>
                          ))
                      )}
                    </div>

                    {/* Add Subcategory Form */}
                    <form onSubmit={handleAddSubcategory} className="border-t border-slate-50 dark:border-slate-800/40 pt-4 flex flex-col gap-3 max-w-sm">
                      <h4 className="text-xs font-bold">Tambah Subkategori Baru</h4>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nama Subkategori (misal: Kopi Sore)"
                          value={newSubcategoryName}
                          onChange={(e) => setNewSubcategoryName(e.target.value)}
                          required
                          className="h-10 text-xs flex-1"
                        />
                        <Button type="submit" className="h-10 text-xs font-bold px-4">
                          Tambah
                        </Button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-300 dark:text-slate-700">
                    <Tag className="h-12 w-12 stroke-[1.5]" />
                    <p className="text-xs text-text-mutedLight dark:text-text-mutedDark mt-2">Pilih kategori untuk melihat subkategori</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default Settings;
