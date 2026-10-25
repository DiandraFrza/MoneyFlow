/** @format */

// Export Services for MoneyFlow Pro (Excel & PDF)
// Swiss Style / July Palette Design (Clean, Minimalist, & Professional)
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Wallet, Transaction, Budget, SavingsGoal, Debt, UserProfile } from "../types";

interface ExportData {
  profile: UserProfile;
  wallets: Wallet[];
  transactions: Transaction[];
  budgets: Budget[];
  savings: SavingsGoal[];
  debts: Debt[];
  categories: any[];
}

// Helper formatting function
const formatCurrencyStr = (amount: number): string => {
  return `Rp ${amount.toLocaleString("id-ID")}`;
};

// =========================================================================
// EXCEL STYLING HELPERS (Swiss Minimalist / July Palette)
// =========================================================================
const formatSheetTable = (sheet: XLSX.WorkSheet, sheetTitle: string, userName: string, colWidths: Array<{ wch: number }>, headerFill: string = "1E1E1E", centerCols: number[] = [], numberCols: number[] = []) => {
  // A1: Brand Title Banner
  sheet["A1"] = { v: `MONEYFLOW PRO  ·  ${sheetTitle.toUpperCase()}`, t: "s" };

  // A2: Metadata Subtitle
  const printDate = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  sheet["A2"] = {
    v: `Pengguna: ${userName}   |   Tanggal Cetak: ${printDate}   |   Sistem Manajemen Keuangan Pribadi`,
    t: "s",
  };

  sheet["!cols"] = colWidths;

  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");

  // Spacious row heights for clean, modern readability
  const rowsMeta: Array<{ hpt: number }> = [];
  rowsMeta[0] = { hpt: 26 }; // A1 Brand Title
  rowsMeta[1] = { hpt: 18 }; // A2 Subtitle Info
  rowsMeta[2] = { hpt: 10 }; // Empty separator
  rowsMeta[3] = { hpt: 24 }; // Table Header row

  for (let r = 4; r <= range.e.r; r++) {
    rowsMeta[r] = { hpt: 21 }; // Data rows
  }
  sheet["!rows"] = rowsMeta;

  // Apply cell styling across the range
  for (let row = range.s.r; row <= range.e.r; row += 1) {
    for (let col = range.s.c; col <= range.e.c; col += 1) {
      const ref = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = sheet[ref];
      if (!cell) continue;

      if (row === 0) {
        // A1 Title Banner (Swiss Black Ink)
        cell.s = {
          fill: { fgColor: { rgb: "1E1E1E" }, patternType: "solid" },
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 12, name: "Arial" },
          alignment: { vertical: "center", horizontal: "left" },
        };
      } else if (row === 1) {
        // A2 Subtitle Info Strip (Swiss Light Grey)
        cell.s = {
          fill: { fgColor: { rgb: "F4F4F4" }, patternType: "solid" },
          font: { bold: false, color: { rgb: "555555" }, sz: 9, name: "Arial" },
          alignment: { vertical: "center", horizontal: "left" },
        };
      } else if (row === 3) {
        // Table Header Row (A4)
        const isCenter = centerCols.includes(col);
        const isNumber = numberCols.includes(col);
        cell.s = {
          fill: { fgColor: { rgb: headerFill }, patternType: "solid" },
          font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10, name: "Arial" },
          alignment: {
            vertical: "center",
            horizontal: isCenter ? "center" : isNumber ? "right" : "left",
          },
          border: {
            bottom: { style: "medium", color: { rgb: "1E1E1E" } },
            top: { style: "thin", color: { rgb: "1E1E1E" } },
          },
        };
      } else if (row >= 4) {
        // Data Rows with Swiss zebra-striping & crisp borders
        const isAlternate = row % 2 === 1;
        const isNumber = numberCols.includes(col) || typeof cell.v === "number";
        const isCenter = centerCols.includes(col);

        cell.s = {
          fill: { fgColor: { rgb: isAlternate ? "F9FAFB" : "FFFFFF" }, patternType: "solid" },
          font: { sz: 9.5, color: { rgb: "1E1E1E" }, name: "Arial" },
          alignment: {
            vertical: "center",
            horizontal: isCenter ? "center" : isNumber ? "right" : "left",
          },
          border: {
            top: { style: "thin", color: { rgb: "E5E7EB" } },
            bottom: { style: "thin", color: { rgb: "E5E7EB" } },
            left: { style: "thin", color: { rgb: "E5E7EB" } },
            right: { style: "thin", color: { rgb: "E5E7EB" } },
          },
        };

        if (typeof cell.v === "number") {
          cell.z = "#,##0";
        }
      }
    }
  }

  // Set autofilter on header
  sheet["!autofilter"] = { ref: `A4:${XLSX.utils.encode_cell({ r: range.e.r, c: range.e.c })}` };
};

// =========================================================================
// 1. EXCEL EXPORT (Swiss Style July Palette - Clean & Professional)
// =========================================================================
export const exportToExcel = (data: ExportData) => {
  const wb = XLSX.utils.book_new();

  // A. Summary Sheet
  const totalBalance = data.wallets.reduce((sum, w) => sum + w.balance, 0);
  const totalIncome = data.transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = data.transactions.filter((t) => t.type === "expense" || t.type === "installment").reduce((sum, t) => sum + t.amount, 0);
  const totalSavings = data.transactions.filter((t) => t.type === "savings").reduce((sum, t) => sum + t.amount, 0);
  const netCashFlow = totalIncome - totalExpense;

  const currentMonthName = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const summaryRows = [
    { No: 1, "Metrik Finansial": "Nama Pengguna", "Nilai (Rp / Teks)": data.profile.name, Keterangan: "Profil Terdaftar" },
    { No: 2, "Metrik Finansial": "Gaji Bulanan", "Nilai (Rp / Teks)": formatCurrencyStr(data.profile.monthly_salary), Keterangan: "Penghasilan Tetap" },
    { No: 3, "Metrik Finansial": "Total Saldo Dompet", "Nilai (Rp / Teks)": formatCurrencyStr(totalBalance), Keterangan: "Likuiditas Keseluruhan" },
    { No: 4, "Metrik Finansial": `Total Pemasukan (${currentMonthName})`, "Nilai (Rp / Teks)": formatCurrencyStr(totalIncome), Keterangan: "Arus Kas Masuk Periode Ini" },
    { No: 5, "Metrik Finansial": `Total Pengeluaran (${currentMonthName})`, "Nilai (Rp / Teks)": formatCurrencyStr(totalExpense), Keterangan: "Arus Kas Keluar Periode Ini" },
    { No: 6, "Metrik Finansial": "Arus Kas Bersih (Net Cash Flow)", "Nilai (Rp / Teks)": formatCurrencyStr(netCashFlow), Keterangan: netCashFlow >= 0 ? "Surplus Finansial" : "Defisit Finansial" },
    { No: 7, "Metrik Finansial": "Total Alokasi Tabungan", "Nilai (Rp / Teks)": formatCurrencyStr(totalSavings), Keterangan: "Tabungan / Investasi Mandiri" },
    { No: 8, "Metrik Finansial": "Rasio Tabungan Terhadap Pemasukan", "Nilai (Rp / Teks)": `${totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0}%`, Keterangan: "Tingkat Tabungan Bulanan" },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows, { origin: "A4" } as any);
  formatSheetTable(
    summarySheet,
    "Ringkasan Analisis Finansial",
    data.profile.name,
    [{ wch: 8 }, { wch: 36 }, { wch: 28 }, { wch: 34 }],
    "1E1E1E", // Swiss Black Ink
    [0], // Center: No
    [],
  );
  XLSX.utils.book_append_sheet(wb, summarySheet, "Ringkasan");

  // B. Transactions Sheet
  const categoryMap = new Map(data.categories.map((c) => [c.id, c.name]));
  const walletMap = new Map(data.wallets.map((w) => [w.id, w.name]));

  const transactionRows = data.transactions.map((t, idx) => ({
    No: idx + 1,
    Tanggal: t.date,
    "Tipe Transaksi": t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : t.type === "savings" ? "Tabungan" : t.type === "debt_payment" ? "Bayar Utang" : "Cicilan",
    Dompet: walletMap.get(t.wallet_id) || "N/A",
    Kategori: categoryMap.get(t.category_id || "") || "Lainnya",
    "Nominal (Rp)": t.amount,
    Catatan: t.description || "-",
  }));
  const txSheet = XLSX.utils.json_to_sheet(transactionRows, { origin: "A4" } as any);
  formatSheetTable(
    txSheet,
    "Riwayat Transaksi Keuangan",
    data.profile.name,
    [{ wch: 8 }, { wch: 14 }, { wch: 18 }, { wch: 20 }, { wch: 22 }, { wch: 20 }, { wch: 34 }],
    "1E1E1E", // Swiss Black Ink
    [0, 1, 2], // Center: No, Tanggal, Tipe Transaksi
    [5], // Number: Nominal
  );
  XLSX.utils.book_append_sheet(wb, txSheet, "Transaksi");

  // C. Wallets Sheet (Swiss Green #356342)
  const walletRows = data.wallets.map((w, idx) => ({
    No: idx + 1,
    "Nama Dompet": w.name,
    "Jenis Akun": w.type.toUpperCase(),
    "Saldo Terakhir (Rp)": w.balance,
    Status: w.balance >= 0 ? "Aman" : "Minus",
  }));
  const walletSheet = XLSX.utils.json_to_sheet(walletRows, { origin: "A4" } as any);
  formatSheetTable(
    walletSheet,
    "Status Saldo & Dompet",
    data.profile.name,
    [{ wch: 8 }, { wch: 26 }, { wch: 16 }, { wch: 24 }, { wch: 16 }],
    "356342", // Swiss Green
    [0, 2, 4], // Center: No, Jenis, Status
    [3], // Number: Saldo
  );
  XLSX.utils.book_append_sheet(wb, walletSheet, "Dompet");

  // D. Budgets Sheet (Swiss Bronze #9A5A21)
  const budgetRows = data.budgets.map((b, idx) => {
    const spent = data.transactions.filter((t) => t.category_id === b.category_id && (t.type === "expense" || t.type === "installment")).reduce((sum, t) => sum + t.amount, 0);
    const balance = b.amount - spent;
    return {
      No: idx + 1,
      "Kategori Anggaran": categoryMap.get(b.category_id) || "Lainnya",
      "Limit Anggaran (Rp)": b.amount,
      "Realisasi Belanja (Rp)": spent,
      "Sisa Anggaran (Rp)": balance,
      "Persentase Terpakai": `${Math.round((spent / b.amount) * 100)}%`,
      Status: spent > b.amount ? "OVER BUDGET" : "TERKENDALI",
    };
  });
  const budgetSheet = XLSX.utils.json_to_sheet(budgetRows, { origin: "A4" } as any);
  formatSheetTable(
    budgetSheet,
    "Kepatuhan Anggaran Pengeluaran",
    data.profile.name,
    [{ wch: 8 }, { wch: 24 }, { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 20 }, { wch: 18 }],
    "9A5A21", // Swiss Bronze
    [0, 5, 6], // Center: No, Persentase, Status
    [2, 3, 4], // Number: Limit, Realisasi, Sisa
  );
  XLSX.utils.book_append_sheet(wb, budgetSheet, "Anggaran");

  // E. Savings Sheet (Swiss Orange #FF5722)
  const savingsRows = data.savings.map((s, idx) => ({
    No: idx + 1,
    "Nama Rencana": s.name,
    "Target Sasaran (Rp)": s.target_amount,
    "Dana Terkumpul (Rp)": s.current_amount,
    "Kekurangan (Rp)": Math.max(0, s.target_amount - s.current_amount),
    "Tenggat Waktu": s.deadline || "-",
    "Progres Capaian": `${Math.round((s.current_amount / s.target_amount) * 100)}%`,
  }));
  const savingsSheet = XLSX.utils.json_to_sheet(savingsRows, { origin: "A4" } as any);
  formatSheetTable(
    savingsSheet,
    "Rencana & Target Tabungan",
    data.profile.name,
    [{ wch: 8 }, { wch: 26 }, { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 18 }, { wch: 18 }],
    "FF5722", // Swiss Primary Orange
    [0, 5, 6], // Center: No, Tenggat, Progres
    [2, 3, 4], // Number: Target, Terkumpul, Kekurangan
  );
  XLSX.utils.book_append_sheet(wb, savingsSheet, "Target Tabungan");

  // F. Debts Sheet (Swiss Brick Red #A53A2B)
  const debtRows = data.debts.map((d, idx) => ({
    No: idx + 1,
    "Pihak Terkait": d.person_name,
    "Jenis Catatan": d.type === "borrowed" ? "Hutang (Kita Pinjam)" : "Piutang (Kita Pinjamkan)",
    "Jumlah Awal (Rp)": d.amount,
    "Sisa Tagihan (Rp)": d.remaining_amount,
    "Jatuh Tempo": d.due_date || "-",
    Status: d.status === "paid" ? "Lunas" : "Belum Lunas",
    Keterangan: d.description || "-",
  }));
  const debtSheet = XLSX.utils.json_to_sheet(debtRows, { origin: "A4" } as any);
  formatSheetTable(
    debtSheet,
    "Pencatatan Utang & Piutang",
    data.profile.name,
    [{ wch: 8 }, { wch: 24 }, { wch: 24 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 32 }],
    "A53A2B", // Swiss Red
    [0, 2, 5, 6], // Center: No, Jenis, Jatuh Tempo, Status
    [3, 4], // Number: Jumlah Awal, Sisa Tagihan
  );
  XLSX.utils.book_append_sheet(wb, debtSheet, "Utang-Piutang");

  // Save the workbook
  XLSX.writeFile(wb, `Laporan_MoneyFlow_Pro_${new Date().toISOString().split("T")[0]}.xlsx`);
};

// =========================================================================
// 2. PDF EXPORT (Swiss Style July Palette - Clean & Professional)
// =========================================================================
export const exportToPDF = (data: ExportData, healthScore: number, healthStatus: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // -------------------------------------------------------------
  // HERO HEADER BANNER (Page 1) - Swiss Dark Ink #1e1e1e + July Accent #ff5722
  // -------------------------------------------------------------
  doc.setFillColor(30, 30, 30); // #1e1e1e
  doc.rect(0, 0, pageWidth, 36, "F");

  // Accent line
  doc.setFillColor(255, 87, 34); // #ff5722
  doc.rect(0, 36, pageWidth, 2.5, "F");

  // Brand Logo Badge
  doc.setFillColor(255, 87, 34);
  doc.rect(14, 8, 12, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("MF", 20, 16, { align: "center" });

  // Brand Title & Subtitle
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("MONEYFLOW PRO", 30, 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(215, 215, 215);
  doc.text("LAPORAN RINGKASAN & ANALISIS KEUANGAN PRIBADI", 30, 22);

  doc.setFontSize(7.5);
  doc.setTextColor(180, 180, 180);
  const printDateStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  doc.text(`Pengguna: ${data.profile.name}   |   Dicetak: ${printDateStr}   |   Format Resmi`, 30, 29);

  // Health Score Badge Box (Right side of header)
  doc.setFillColor(45, 45, 45);
  doc.rect(pageWidth - 58, 7, 44, 22, "F");
  doc.setDrawColor(255, 87, 34);
  doc.setLineWidth(0.6);
  doc.rect(pageWidth - 58, 7, 44, 22, "S");

  doc.setTextColor(255, 87, 34);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.text("SKOR KESEHATAN", pageWidth - 36, 12, { align: "center" });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text(`${healthScore}/100`, pageWidth - 36, 19, { align: "center" });

  doc.setTextColor(220, 220, 220);
  doc.setFontSize(6.5);
  doc.text(healthStatus.toUpperCase(), pageWidth - 36, 25, { align: "center" });

  // -------------------------------------------------------------
  // SECTION 1: FINANCIAL SUMMARY
  // -------------------------------------------------------------
  let currentY = 46;

  // Section Header with Swiss Orange Accent Bar
  doc.setFillColor(255, 87, 34);
  doc.rect(14, currentY, 3, 6, "F");
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("I. RANGKUMAN FINANSIAL", 20, currentY + 4.8);

  const totalBalance = data.wallets.reduce((sum, w) => sum + w.balance, 0);
  const totalIncome = data.transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = data.transactions.filter((t) => t.type === "expense" || t.type === "installment").reduce((sum, t) => sum + t.amount, 0);
  const totalSavings = data.transactions.filter((t) => t.type === "savings").reduce((sum, t) => sum + t.amount, 0);
  const netCashFlow = totalIncome - totalExpense;

  const currentMonthName = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const summaryHeaders = [["Parameter Analisis", "Nominal / Status", "Keterangan"]];
  const summaryBody = [
    [`Total Pendapatan Terdaftar (${currentMonthName})`, formatCurrencyStr(totalIncome), "Arus Kas Masuk"],
    [`Total Pengeluaran Terdaftar (${currentMonthName})`, formatCurrencyStr(totalExpense), "Arus Kas Keluar"],
    [`Arus Kas Bersih (Net Cash Flow)`, formatCurrencyStr(netCashFlow), netCashFlow >= 0 ? "Surplus Keuangan" : "Defisit Keuangan"],
    [`Total Alokasi Tabungan (${currentMonthName})`, formatCurrencyStr(totalSavings), "Tabungan Mandiri"],
    ["Sisa Saldo Kumulatif Dompet", formatCurrencyStr(totalBalance), "Aset Likuid Saat Ini"],
    ["Skor Kesehatan Finansial", `${healthScore}/100 (${healthStatus})`, "Hasil Evaluasi Otomatis"],
  ];

  autoTable(doc, {
    startY: currentY + 8,
    head: summaryHeaders,
    body: summaryBody,
    theme: "grid",
    headStyles: {
      fillColor: [30, 30, 30],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      lineWidth: 0.2,
      lineColor: [30, 30, 30],
    },
    bodyStyles: {
      textColor: [30, 30, 30],
      fontSize: 8,
      lineWidth: 0.2,
      lineColor: [225, 225, 225],
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // -------------------------------------------------------------
  // SECTION 2: WALLET SUMMARY
  // -------------------------------------------------------------
  doc.setFillColor(53, 99, 66); // Swiss Green Accent
  doc.rect(14, currentY, 3, 6, "F");
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("II. DAFTAR SALDO & DOMPET", 20, currentY + 4.8);

  const walletHeaders = [["Nama Dompet", "Jenis Dompet", "Saldo Terakhir", "Status"]];
  const walletBody = data.wallets.map((w) => [w.name, w.type.toUpperCase(), formatCurrencyStr(w.balance), w.balance >= 0 ? "Aktif / Sehat" : "Perlu Perhatian"]);

  autoTable(doc, {
    startY: currentY + 8,
    head: walletHeaders,
    body: walletBody,
    theme: "grid",
    headStyles: {
      fillColor: [53, 99, 66], // Swiss Green #356342
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      lineWidth: 0.2,
      lineColor: [53, 99, 66],
    },
    bodyStyles: {
      textColor: [30, 30, 30],
      fontSize: 8,
      lineWidth: 0.2,
      lineColor: [225, 225, 225],
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // -------------------------------------------------------------
  // SECTION 3: BUDGET PERFORMANCE
  // -------------------------------------------------------------
  doc.setFillColor(154, 90, 33); // Swiss Bronze Accent
  doc.rect(14, currentY, 3, 6, "F");
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("III. KEPATUHAN ANGGARAN BULANAN", 20, currentY + 4.8);

  const categoryMap = new Map(data.categories.map((c) => [c.id, c.name]));
  const budgetHeaders = [["Kategori Anggaran", "Limit Anggaran", "Realisasi Belanja", "Sisa", "Evaluasi"]];

  const budgetBody = data.budgets.map((b) => {
    const spent = data.transactions.filter((t) => t.category_id === b.category_id && (t.type === "expense" || t.type === "installment")).reduce((sum, t) => sum + t.amount, 0);
    const balance = b.amount - spent;
    const isOver = spent > b.amount;

    return [categoryMap.get(b.category_id) || "Lainnya", formatCurrencyStr(b.amount), formatCurrencyStr(spent), formatCurrencyStr(balance), isOver ? "OVER BUDGET" : "TERKENDALI"];
  });

  autoTable(doc, {
    startY: currentY + 8,
    head: budgetHeaders,
    body: budgetBody,
    theme: "grid",
    headStyles: {
      fillColor: [154, 90, 33], // Swiss Bronze #9A5A21
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      lineWidth: 0.2,
      lineColor: [154, 90, 33],
    },
    bodyStyles: {
      textColor: [30, 30, 30],
      fontSize: 8,
      lineWidth: 0.2,
      lineColor: [225, 225, 225],
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    columnStyles: {
      4: { fontStyle: "bold" },
    },
    didParseCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === 4) {
        if (hookData.cell.raw === "OVER BUDGET") {
          hookData.cell.styles.textColor = [165, 58, 43]; // Swiss Red
        } else {
          hookData.cell.styles.textColor = [53, 99, 66]; // Swiss Green
        }
      }
    },
  });

  // -------------------------------------------------------------
  // PAGE 2: SAVINGS, DEBTS & TRANSACTIONS
  // -------------------------------------------------------------
  doc.addPage();

  // Compact Header on Page 2
  doc.setFillColor(30, 30, 30);
  doc.rect(0, 0, pageWidth, 15, "F");

  doc.setFillColor(255, 87, 34);
  doc.rect(0, 15, pageWidth, 1.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("MONEYFLOW PRO  ·  DETAIL TABUNGAN, UTANG & RIWAYAT TRANSAKSI", 14, 10);

  doc.setFontSize(7.5);
  doc.setTextColor(215, 215, 215);
  doc.text(`User: ${data.profile.name}`, pageWidth - 14, 10, { align: "right" });

  currentY = 24;

  // -------------------------------------------------------------
  // SECTION 4: SAVINGS GOALS
  // -------------------------------------------------------------
  doc.setFillColor(255, 87, 34); // Swiss Orange Accent
  doc.rect(14, currentY, 3, 6, "F");
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("IV. TARGET TABUNGAN & INVESTASI", 20, currentY + 4.8);

  const savingsHeaders = [["Nama Rencana", "Target Sasaran", "Dana Terkumpul", "Kekurangan", "Progres"]];
  const savingsBody = data.savings.map((s) => [s.name, formatCurrencyStr(s.target_amount), formatCurrencyStr(s.current_amount), formatCurrencyStr(Math.max(0, s.target_amount - s.current_amount)), `${Math.round((s.current_amount / s.target_amount) * 100)}%`]);

  autoTable(doc, {
    startY: currentY + 8,
    head: savingsHeaders,
    body: savingsBody,
    theme: "grid",
    headStyles: {
      fillColor: [255, 87, 34], // Swiss Primary #FF5722
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      lineWidth: 0.2,
      lineColor: [255, 87, 34],
    },
    bodyStyles: {
      textColor: [30, 30, 30],
      fontSize: 8,
      lineWidth: 0.2,
      lineColor: [225, 225, 225],
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // -------------------------------------------------------------
  // SECTION 5: DEBTS & RECEIVABLES
  // -------------------------------------------------------------
  doc.setFillColor(165, 58, 43); // Swiss Red Accent
  doc.rect(14, currentY, 3, 6, "F");
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("V. PENCATATAN UTANG & PIUTANG", 20, currentY + 4.8);

  const debtHeaders = [["Pihak Terkait", "Jenis Catatan", "Jumlah Awal", "Sisa Tagihan", "Jatuh Tempo", "Status"]];
  const debtBody = data.debts.map((d) => [d.person_name, d.type === "borrowed" ? "HUTANG (Kita Pinjam)" : "PIUTANG (Kita Pinjamkan)", formatCurrencyStr(d.amount), formatCurrencyStr(d.remaining_amount), d.due_date || "-", d.status.toUpperCase()]);

  autoTable(doc, {
    startY: currentY + 8,
    head: debtHeaders,
    body: debtBody,
    theme: "grid",
    headStyles: {
      fillColor: [165, 58, 43], // Swiss Red #A53A2B
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      lineWidth: 0.2,
      lineColor: [165, 58, 43],
    },
    bodyStyles: {
      textColor: [30, 30, 30],
      fontSize: 8,
      lineWidth: 0.2,
      lineColor: [225, 225, 225],
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  // -------------------------------------------------------------
  // SECTION 6: RECENT TRANSACTIONS
  // -------------------------------------------------------------
  doc.setFillColor(30, 30, 30);
  doc.rect(14, currentY, 3, 6, "F");
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("VI. RIWAYAT TRANSAKSI TERBARU (10 TERAKHIR)", 20, currentY + 4.8);

  const walletMapObj = new Map(data.wallets.map((w) => [w.id, w.name]));
  const recentTransactions = data.transactions.slice(0, 10);
  const txHeaders = [["Tanggal", "Tipe", "Dompet", "Kategori", "Jumlah", "Catatan"]];

  const txBody = recentTransactions.map((t) => [t.date, t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : t.type === "savings" ? "Tabungan" : t.type === "debt_payment" ? "Bayar Utang" : "Cicilan", walletMapObj.get(t.wallet_id) || "N/A", categoryMap.get(t.category_id || "") || "Lainnya", formatCurrencyStr(t.amount), t.description || "-"]);

  autoTable(doc, {
    startY: currentY + 8,
    head: txHeaders,
    body: txBody,
    theme: "grid",
    headStyles: {
      fillColor: [30, 30, 30], // Swiss Black Ink #1E1E1E
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      lineWidth: 0.2,
      lineColor: [30, 30, 30],
    },
    bodyStyles: {
      textColor: [30, 30, 30],
      fontSize: 8,
      lineWidth: 0.2,
      lineColor: [225, 225, 225],
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
  });

  // -------------------------------------------------------------
  // FOOTER (ALL PAGES)
  // -------------------------------------------------------------
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Bottom Swiss Divider Line
    doc.setDrawColor(30, 30, 30);
    doc.setLineWidth(0.4);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    // Left Footer
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("MONEYFLOW PRO", 14, pageHeight - 7.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("· Laporan Ringkasan Analisis Keuangan Pribadi", 44, pageHeight - 7.5);

    // Right Footer: Page Numbers
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pageHeight - 7.5, { align: "right" });
  }

  // Save the PDF
  doc.save(`Laporan_Keuangan_MoneyFlow_Pro_${new Date().toISOString().split("T")[0]}.pdf`);
};
