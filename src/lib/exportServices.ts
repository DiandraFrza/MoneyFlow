// Export Services for MoneyFlow Pro (Excel & PDF)
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Wallet, Transaction, Budget, SavingsGoal, Debt, UserProfile } from '../types';

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
  return `Rp ${amount.toLocaleString('id-ID')}`;
};

// =========================================================================
// 1. EXCEL EXPORT
// =========================================================================
export const exportToExcel = (data: ExportData) => {
  const wb = XLSX.utils.book_new();

  // A. Summary Sheet
  const totalBalance = data.wallets.reduce((sum, w) => sum + w.balance, 0);
  const totalIncome = data.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = data.transactions.filter(t => t.type === 'expense' || t.type === 'installment').reduce((sum, t) => sum + t.amount, 0);
  const totalSavings = data.transactions.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0);
  
  const currentMonthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const summaryRows = [
    { 'Parameter Keuangan': 'Nama Pengguna', 'Nilai': data.profile.name },
    { 'Parameter Keuangan': 'Gaji Bulanan', 'Nilai': formatCurrencyStr(data.profile.monthly_salary) },
    { 'Parameter Keuangan': 'Total Saldo Saat Ini', 'Nilai': formatCurrencyStr(totalBalance) },
    { 'Parameter Keuangan': `Total Pemasukan ${currentMonthName}`, 'Nilai': formatCurrencyStr(totalIncome) },
    { 'Parameter Keuangan': `Total Pengeluaran ${currentMonthName}`, 'Nilai': formatCurrencyStr(totalExpense) },
    { 'Parameter Keuangan': 'Total Tabungan Dialokasikan', 'Nilai': formatCurrencyStr(totalSavings) },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 30 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Ringkasan');

  // B. Transactions Sheet
  const categoryMap = new Map(data.categories.map(c => [c.id, c.name]));
  const walletMap = new Map(data.wallets.map(w => [w.id, w.name]));
  
  const transactionRows = data.transactions.map(t => ({
    'ID': t.id,
    'Tanggal': t.date,
    'Tipe': t.type === 'income' ? 'Pemasukan' : 
            t.type === 'expense' ? 'Pengeluaran' : 
            t.type === 'savings' ? 'Tabungan' : 
            t.type === 'debt_payment' ? 'Bayar Utang' : 'Cicilan',
    'Dompet': walletMap.get(t.wallet_id) || 'N/A',
    'Kategori': categoryMap.get(t.category_id || '') || 'Lainnya',
    'Jumlah (Rp)': t.amount,
    'Catatan': t.description || '-'
  }));
  const txSheet = XLSX.utils.json_to_sheet(transactionRows);
  txSheet['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, txSheet, 'Transaksi');

  // C. Wallets Sheet
  const walletRows = data.wallets.map(w => ({
    'Nama Dompet': w.name,
    'Jenis': w.type.toUpperCase(),
    'Saldo Saat Ini (Rp)': w.balance,
    'Warna': w.color
  }));
  const walletSheet = XLSX.utils.json_to_sheet(walletRows);
  walletSheet['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, walletSheet, 'Dompet');

  // D. Budgets Sheet
  const budgetRows = data.budgets.map(b => {
    // calculate spent
    const spent = data.transactions
      .filter(t => t.category_id === b.category_id && (t.type === 'expense' || t.type === 'installment'))
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      'Kategori': categoryMap.get(b.category_id) || 'Lainnya',
      'Limit Anggaran (Rp)': b.amount,
      'Terpakai (Rp)': spent,
      'Sisa (Rp)': b.amount - spent,
      'Persentase Terpakai': `${Math.round((spent / b.amount) * 100)}%`
    };
  });
  const budgetSheet = XLSX.utils.json_to_sheet(budgetRows);
  budgetSheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, budgetSheet, 'Anggaran');

  // E. Savings Sheet
  const savingsRows = data.savings.map(s => ({
    'Nama Target': s.name,
    'Jumlah Target (Rp)': s.target_amount,
    'Terkumpul (Rp)': s.current_amount,
    'Kekurangan (Rp)': s.target_amount - s.current_amount,
    'Tenggat Waktu': s.deadline || '-',
    'Progress': `${Math.round((s.current_amount / s.target_amount) * 100)}%`
  }));
  const savingsSheet = XLSX.utils.json_to_sheet(savingsRows);
  savingsSheet['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, savingsSheet, 'Target Tabungan');

  // F. Debts Sheet
  const debtRows = data.debts.map(d => ({
    'Nama Orang/Instansi': d.person_name,
    'Tipe': d.type === 'borrowed' ? 'Hutang (Kita Pinjam)' : 'Piutang (Dia Pinjam)',
    'Jumlah Awal (Rp)': d.amount,
    'Sisa Harus Dibayar (Rp)': d.remaining_amount,
    'Status': d.status === 'paid' ? 'Lunas' : 'Belum Lunas',
    'Jatuh Tempo': d.due_date || '-',
    'Keterangan': d.description || '-'
  }));
  const debtSheet = XLSX.utils.json_to_sheet(debtRows);
  debtSheet['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, debtSheet, 'Utang-Piutang');

  // Save the workbook
  XLSX.writeFile(wb, `Laporan_MoneyFlow_Pro_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// =========================================================================
// 2. PDF EXPORT
// =========================================================================
export const exportToPDF = (data: ExportData, healthScore: number, healthStatus: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header Style
  doc.setFillColor(37, 99, 235); // Blue Primary #2563EB
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('MONEYFLOW PRO', 14, 18);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Laporan Ringkasan Analisis Keuangan Pribadi', 14, 25);
  doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')} | Pengguna: ${data.profile.name}`, 14, 31);
  
  // Reset text color
  doc.setTextColor(15, 23, 42); // slate-900

  // 1. FINANCIAL SUMMARY SECTION
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('I. Rangkuman Finansial', 14, 50);

  const totalBalance = data.wallets.reduce((sum, w) => sum + w.balance, 0);
  const totalIncome = data.transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = data.transactions.filter(t => t.type === 'expense' || t.type === 'installment').reduce((sum, t) => sum + t.amount, 0);
  const totalSavings = data.transactions.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0);

  const currentMonthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const summaryHeaders = [['Kategori Rangkuman', 'Nominal']];
  const summaryBody = [
    [`Total Pendapatan Terdaftar (${currentMonthName})`, formatCurrencyStr(totalIncome)],
    [`Total Pengeluaran Terdaftar (${currentMonthName})`, formatCurrencyStr(totalExpense)],
    [`Total Alokasi Tabungan (${currentMonthName})`, formatCurrencyStr(totalSavings)],
    ['Sisa Saldo Kumulatif Dompet', formatCurrencyStr(totalBalance)],
    ['Skor Kesehatan Finansial', `${healthScore}/100 (${healthStatus})`],
  ];

  autoTable(doc, {
    startY: 55,
    head: summaryHeaders,
    body: summaryBody,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 12;

  // 2. WALLET SUMMARY SECTION
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('II. Daftar Sisa Saldo Dompet', 14, currentY);

  const walletHeaders = [['Nama Dompet', 'Jenis Dompet', 'Saldo Terakhir']];
  const walletBody = data.wallets.map(w => [
    w.name,
    w.type.toUpperCase(),
    formatCurrencyStr(w.balance)
  ]);

  autoTable(doc, {
    startY: currentY + 5,
    head: walletHeaders,
    body: walletBody,
    theme: 'grid',
    headStyles: { fillColor: [16, 185, 129] }, // Emerald Success #10B981
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // 3. BUDGET SUMMARY
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('III. Analisis Kepatuhan Anggaran', 14, currentY);

  const categoryMap = new Map(data.categories.map(c => [c.id, c.name]));
  const budgetHeaders = [['Kategori Anggaran', 'Limit Anggaran', 'Realisasi Belanja', 'Sisa', 'Status']];
  
  const budgetBody = data.budgets.map(b => {
    const spent = data.transactions
      .filter(t => t.category_id === b.category_id && (t.type === 'expense' || t.type === 'installment'))
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = b.amount - spent;
    const isOver = spent > b.amount;
    
    return [
      categoryMap.get(b.category_id) || 'Lainnya',
      formatCurrencyStr(b.amount),
      formatCurrencyStr(spent),
      formatCurrencyStr(balance),
      isOver ? 'OVER BUDGET' : 'OK'
    ];
  });

  autoTable(doc, {
    startY: currentY + 5,
    head: budgetHeaders,
    body: budgetBody,
    theme: 'grid',
    headStyles: { fillColor: [245, 158, 11] }, // Amber Warning #F59E0B
    columnStyles: {
      4: { fontStyle: 'bold', textColor: [239, 68, 68] } // Red text for status
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Page break for details
  doc.addPage();
  
  // Header on Page 2
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('MONEYFLOW PRO - Laporan Detail Tabungan, Hutang, & Riwayat Transaksi', 14, 10);
  
  doc.setTextColor(15, 23, 42);
  currentY = 25;

  // 4. SAVINGS GOALS
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('IV. Target Tabungan / Investasi', 14, currentY);

  const savingsHeaders = [['Nama Rencana', 'Target Sasaran', 'Dana Terkumpul', 'Kekurangan', 'Progres']];
  const savingsBody = data.savings.map(s => [
    s.name,
    formatCurrencyStr(s.target_amount),
    formatCurrencyStr(s.current_amount),
    formatCurrencyStr(Math.max(0, s.target_amount - s.current_amount)),
    `${Math.round((s.current_amount / s.target_amount) * 100)}%`
  ]);

  autoTable(doc, {
    startY: currentY + 5,
    head: savingsHeaders,
    body: savingsBody,
    theme: 'striped',
    headStyles: { fillColor: [14, 165, 233] }, // Sky Blue
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // 5. DEBTS AND LOANS
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('V. Catatan Piutang & Hutang', 14, currentY);

  const debtHeaders = [['Nama Orang', 'Jenis Catatan', 'Jumlah Awal', 'Sisa Tagihan', 'Jatuh Tempo', 'Status']];
  const debtBody = data.debts.map(d => [
    d.person_name,
    d.type === 'borrowed' ? 'HUTANG (Kita Pinjam)' : 'PIUTANG (Kita Pinjamkan)',
    formatCurrencyStr(d.amount),
    formatCurrencyStr(d.remaining_amount),
    d.due_date || '-',
    d.status.toUpperCase()
  ]);

  autoTable(doc, {
    startY: currentY + 5,
    head: debtHeaders,
    body: debtBody,
    theme: 'grid',
    headStyles: { fillColor: [139, 92, 246] }, // Violet
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // 6. RECENT TRANSACTIONS (Top 10)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('VI. Riwayat Transaksi Terbaru (10 Terakhir)', 14, currentY);

  const walletMapObj = new Map(data.wallets.map(w => [w.id, w.name]));
  const recentTransactions = data.transactions.slice(0, 10);
  const txHeaders = [['Tanggal', 'Tipe', 'Dompet', 'Kategori', 'Jumlah', 'Catatan']];
  
  const txBody = recentTransactions.map(t => [
    t.date,
    t.type === 'income' ? 'Pemasukan' : 
    t.type === 'expense' ? 'Pengeluaran' : 
    t.type === 'savings' ? 'Tabungan' : 
    t.type === 'debt_payment' ? 'Bayar Utang' : 'Cicilan',
    walletMapObj.get(t.wallet_id) || 'N/A',
    categoryMap.get(t.category_id || '') || 'Lainnya',
    formatCurrencyStr(t.amount),
    t.description || '-'
  ]);

  autoTable(doc, {
    startY: currentY + 5,
    head: txHeaders,
    body: txBody,
    theme: 'striped',
    headStyles: { fillColor: [71, 85, 105] }, // Slate-600
  });

  // Footer page number
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 10);
    doc.text('MoneyFlow Pro - Catat Cepat, Pantau Sehat, Keuangan Hebat.', 14, doc.internal.pageSize.getHeight() - 10);
  }

  // Save the PDF
  doc.save(`Laporan_Keuangan_MoneyFlow_Pro_${new Date().toISOString().split('T')[0]}.pdf`);
};
