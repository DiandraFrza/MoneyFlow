<!-- @format -->

# MoneyFlow Pro - Smart Router & CRUD Modal System

## 📋 Overview

Sistem router yang smart dan dinamis dengan modal konfigurasi untuk setiap aksi CRUD (Create, Read, Update, Delete) pada modul-modul keuangan.

## 🏗️ Struktur Sistem

### Router (`src/router/`)

- **`types.ts`** - Tipe TypeScript untuk routing
- **`routes.ts`** - Konfigurasi rute dinamis
- **`ProtectedRoute.tsx`** - Komponen untuk melindungi rute yang memerlukan autentikasi
- **`index.tsx`** - Router utama aplikasi

### Modal Components (`src/components/modals/`)

- **`WalletConfigModal.tsx`** - Modal CRUD untuk Dompet
- **`BudgetConfigModal.tsx`** - Modal CRUD untuk Anggaran
- **`DebtConfigModal.tsx`** - Modal CRUD untuk Catatan Utang
- **`RecurringConfigModal.tsx`** - Modal CRUD untuk Transaksi Rutin
- **`ProfileConfigModal.tsx`** - Modal untuk Edit Profil

### Store (`src/store/`)

- **`modalStore.ts`** - Zustand store untuk mengelola state modal

## 🔐 Fitur Autentikasi

### Login dengan Email & Password

```typescript
const { login } = useAuthStore();
await login("user@example.com", "password");
```

### Register Pengguna

```typescript
const { register } = useAuthStore();
await register("user@example.com", "password", "Nama Lengkap");
```

### Reset Password

```typescript
const { forgotPassword } = useAuthStore();
await forgotPassword("user@example.com");
```

### Mode Guest (Lokal)

Jika Supabase tidak dikonfigurasi, sistem otomatis beralih ke mode lokal/guest.

## 🎯 Fitur CRUD Modal

Setiap modal mendukung tiga mode operasi:

- **Add** (Tambah) - Membuat data baru
- **Edit** (Ubah) - Mengubah data yang ada
- **Delete** (Hapus) - Menghapus data

### 1. **Wallet Modal** (Dompet)

Mengelola dompet keuangan dengan berbagai jenis (Cash, Bank, E-wallet, Crypto)

```typescript
import { useModalStore } from "../store/modalStore";

const { openWalletModal } = useModalStore();

// Tambah dompet
openWalletModal("add");

// Edit dompet
openWalletModal("edit", walletId);

// Hapus dompet
openWalletModal("delete", walletId);
```

### 2. **Budget Modal** (Anggaran)

Mengatur batas anggaran per kategori per bulan

```typescript
const { openBudgetModal } = useModalStore();

// Tambah anggaran
openBudgetModal("add");

// Edit anggaran
openBudgetModal("edit", budgetId);

// Hapus anggaran
openBudgetModal("delete", budgetId);
```

### 3. **Debt Modal** (Utang)

Mencatat utang dengan detail bunga dan tanggal jatuh tempo

```typescript
const { openDebtModal } = useModalStore();

// Catat utang baru
openDebtModal("add");

// Update catatan utang
openDebtModal("edit", debtId);

// Hapus catatan utang
openDebtModal("delete", debtId);
```

### 4. **Recurring Modal** (Transaksi Rutin)

Mengatur transaksi otomatis yang berulang (gaji, biaya langganan, dll)

```typescript
const { openRecurringModal } = useModalStore();

// Tambah transaksi rutin
openRecurringModal("add");

// Edit transaksi rutin
openRecurringModal("edit", recurringId);

// Hapus transaksi rutin
openRecurringModal("delete", recurringId);
```

### 5. **Profile Modal** (Profil)

Edit informasi profil, gaji bulanan, dan target keuangan

```typescript
const { openProfileModal } = useModalStore();

// Edit profil
openProfileModal();
```

## 🎨 Penggunaan di Komponen

### Contoh di Halaman Transactions

```typescript
import React, { useState } from 'react';
import { useFinanceStore } from '../store/financeStore';
import { useModalStore } from '../store/modalStore';
import {
  WalletConfigModal,
  BudgetConfigModal,
  DebtConfigModal,
  RecurringConfigModal,
} from '../components/modals';
import { Button } from '../components/ui/button';

export const Transactions: React.FC = () => {
  const { wallets, budgets, debts, recurring } = useFinanceStore();
  const { activeModal, mode, selectedId, closeModal, openWalletModal } = useModalStore();

  const handleRefresh = () => {
    // Refresh data setelah CRUD operation
    closeModal();
  };

  return (
    <div className="space-y-6">
      {/* Wallets Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Dompet</h2>
          <Button onClick={() => openWalletModal('add')}>+ Tambah Dompet</Button>
        </div>
        <div className="grid gap-4">
          {wallets.map((wallet) => (
            <div key={wallet.id} className="flex justify-between items-center p-4 border rounded">
              <div>
                <p className="font-semibold">{wallet.name}</p>
                <p className="text-sm text-gray-500">Rp {wallet.balance.toLocaleString()}</p>
              </div>
              <div className="space-x-2">
                <Button
                  size="sm"
                  onClick={() => openWalletModal('edit', wallet.id)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => openWalletModal('delete', wallet.id)}
                >
                  Hapus
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <WalletConfigModal
        isOpen={activeModal === 'wallet'}
        mode={mode as any}
        wallet={
          selectedId ? wallets.find((w) => w.id === selectedId) : undefined
        }
        onClose={closeModal}
        onSuccess={handleRefresh}
      />
    </div>
  );
};
```

## 🌐 Rute Aplikasi

```
/                    → Dashboard
/transactions        → Transaksi Utama
  /transactions/wallets   → Dompet
  /transactions/budgets   → Anggaran
  /transactions/debts     → Utang
  /transactions/recurring → Transaksi Rutin
/reports            → Laporan & Analisis
/settings           → Pengaturan Profil
/auth               → Login & Register
```

## 🔒 Proteksi Rute

Hanya user yang login dapat mengakses rute yang dilindungi:

```typescript
<ProtectedRoute requiredRoles={['user']}>
  <Dashboard />
</ProtectedRoute>
```

## 📱 Responsive Design

Semua modal dan komponen menggunakan Tailwind CSS dan mendukung:

- Mobile (< 640px)
- Tablet (640px - 1024px)
- Desktop (> 1024px)

## 💾 State Management

### Auth Store

```typescript
const { user, login, register, logout, updateProfile } = useAuthStore();
```

### Finance Store

```typescript
const { wallets, budgets, debts, recurring, addWallet, updateWallet, deleteWallet, setBudget, addDebt, updateDebt, deleteDebt, addRecurring, updateRecurring, deleteRecurring } = useFinanceStore();
```

### Modal Store

```typescript
const { activeModal, mode, selectedId, openWalletModal, openBudgetModal, openDebtModal, openRecurringModal, openProfileModal, closeModal } = useModalStore();
```

## 🎯 Integrasi dengan Supabase

Sistem mendukung integrasi penuh dengan Supabase:

- Autentikasi berbasis email
- Sinkronisasi data real-time
- Fallback ke mode lokal jika tidak dikonfigurasi

## 📝 Validasi & Error Handling

Semua modal memiliki:

- Validasi form lengkap
- Error messaging yang user-friendly
- Loading state untuk operasi async
- Konfirmasi untuk operasi destruktif (delete)

## 🚀 Cara Menggunakan

1. **Impor yang diperlukan**

```typescript
import { useModalStore } from "../store/modalStore";
import { WalletConfigModal } from "../components/modals";
```

2. **Setup modal state**

```typescript
const { activeModal, mode, selectedId, closeModal, openWalletModal } = useModalStore();
```

3. **Render modal**

```typescript
<WalletConfigModal
  isOpen={activeModal === 'wallet'}
  mode={mode}
  wallet={selectedWallet}
  onClose={closeModal}
  onSuccess={() => {
    // Handle success
    closeModal();
  }}
/>
```

## 📌 Best Practices

1. **Selalu tutup modal setelah operasi berhasil**

```typescript
onSuccess={() => {
  closeModal();
  // Optional: show success toast
}}
```

2. **Gunakan hook useCrudOperations untuk consistency**

```typescript
import { useCrudOperations } from "../hooks/useCrudOperations";
const { handleWalletAdd, handleWalletEdit, handleWalletDelete } = useCrudOperations();
```

3. **Selalu validasi user sebelum operasi**

```typescript
if (!user) {
  console.error("User tidak ditemukan");
  return;
}
```

---

**Sistem ini dirancang untuk memberikan pengalaman pengguna yang seamless dan responsif dengan modal konfigurasi yang konsisten untuk semua operasi CRUD.**
