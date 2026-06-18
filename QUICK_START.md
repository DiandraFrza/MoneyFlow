<!-- @format -->

# 🚀 Quick Start Guide - MoneyFlow Pro

## Instalasi & Setup

### 1. Install Dependencies (jika belum)

```bash
npm install
```

### 2. Setup Environment Variables

Buat file `.env.local`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### 3. Run Development Server

```bash
npm run dev
```

## 📖 Penggunaan Dasar

### Import yang Diperlukan

```typescript
import { useModalStore } from "../store/modalStore";
import { useFinanceStore } from "../store/financeStore";
import { useAuthStore } from "../store/authStore";
import { WalletConfigModal, BudgetConfigModal } from "../components/modals";
```

### Contoh Implementasi di Komponen

#### Step 1: Setup State

```typescript
import React, { useState } from "react";
import { useModalStore } from "../store/modalStore";
import { useFinanceStore } from "../store/financeStore";

export const MyComponent: React.FC = () => {
  const { wallets } = useFinanceStore();
  const { activeModal, mode, selectedId, closeModal, openWalletModal } = useModalStore();

  // ... rest of component
};
```

#### Step 2: Add Button to Trigger Modal

```typescript
<Button onClick={() => openWalletModal('add')}>
  ➕ Tambah Dompet
</Button>
```

#### Step 3: Render Modal

```typescript
<WalletConfigModal
  isOpen={activeModal === 'wallet'}
  mode={mode as any}
  wallet={wallets.find(w => w.id === selectedId)}
  onClose={closeModal}
  onSuccess={() => {
    closeModal();
    // Optional: show toast notification
  }}
/>
```

## 💻 Contoh Kode Lengkap

### Simple List dengan CRUD Modal

```typescript
import React from 'react';
import { useModalStore } from '../store/modalStore';
import { useFinanceStore } from '../store/financeStore';
import { WalletConfigModal } from '../components/modals';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Edit2, Trash2, Plus } from 'lucide-react';

export const WalletList: React.FC = () => {
  const { wallets } = useFinanceStore();
  const { activeModal, mode, selectedId, closeModal, openWalletModal } = useModalStore();

  const selectedWallet = wallets.find(w => w.id === selectedId);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Dompet Saya</h2>
        <Button onClick={() => openWalletModal('add')}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah
        </Button>
      </div>

      <div className="space-y-2">
        {wallets.map(wallet => (
          <Card key={wallet.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{wallet.name}</h3>
                <p>Rp {wallet.balance.toLocaleString('id-ID')}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => openWalletModal('edit', wallet.id)}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => openWalletModal('delete', wallet.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <WalletConfigModal
        isOpen={activeModal === 'wallet'}
        mode={mode as any}
        wallet={selectedWallet}
        onClose={closeModal}
        onSuccess={closeModal}
      />
    </div>
  );
};
```

## 🎨 Styling Tips

### Custom Modal Styling

```typescript
// Modal automatically inherits Tailwind dark mode
// Gunakan className untuk custom styling

<div className="bg-primary text-white dark:bg-primary-dark">
  Custom styled content
</div>
```

### Button Variants

```typescript
<Button>Primary</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Delete</Button>
<Button disabled>Disabled</Button>
```

## 📝 Form Validation Tips

### Input Validation

```typescript
const [formData, setFormData] = useState({
  name: "",
  amount: 0,
});

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validasi
  if (!formData.name) {
    setError("Nama wajib diisi");
    return;
  }

  if (formData.amount <= 0) {
    setError("Jumlah harus lebih dari 0");
    return;
  }

  // Proceed dengan submit
};
```

## 🔄 Working with Zustand Stores

### Auth Store

```typescript
const { user, login, logout, updateProfile } = useAuthStore();

// Login
await login("user@example.com", "password");

// Logout
await logout();

// Update profile
await updateProfile({ name: "New Name" });
```

### Finance Store

```typescript
const { wallets, addWallet, updateWallet, deleteWallet } = useFinanceStore();

// Add wallet
await addWallet(userId, {
  name: "My Wallet",
  type: "bank",
  balance: 1000000,
  icon: "Wallet",
  color: "#3B82F6",
});

// Update wallet
await updateWallet(userId, walletId, { name: "New Name" });

// Delete wallet
await deleteWallet(userId, walletId);
```

### Modal Store

```typescript
const { activeModal, openWalletModal, closeModal } = useModalStore();

// Open modal
openWalletModal("add");

// Close modal
closeModal();
```

## 🎯 Common Patterns

### Pattern 1: List with CRUD

```typescript
{items.map(item => (
  <Card key={item.id}>
    <div className="flex justify-between">
      <div>{item.name}</div>
      <div className="flex gap-2">
        <EditButton onClick={() => openModal('edit', item.id)} />
        <DeleteButton onClick={() => openModal('delete', item.id)} />
      </div>
    </div>
    <Modal
      isOpen={selectedId === item.id}
      onClose={closeModal}
      {...modalProps}
    />
  </Card>
))}
```

### Pattern 2: Tabbed Interface

```typescript
const [activeTab, setActiveTab] = useState('wallets');

<div className="flex gap-2 border-b">
  <TabButton active={activeTab === 'wallets'} onClick={() => setActiveTab('wallets')}>
    Wallets
  </TabButton>
  <TabButton active={activeTab === 'budgets'} onClick={() => setActiveTab('budgets')}>
    Budgets
  </TabButton>
</div>

{activeTab === 'wallets' && <WalletsList />}
{activeTab === 'budgets' && <BudgetsList />}
```

## ⚠️ Common Gotchas

### 1. Forget to Close Modal

```typescript
// ❌ Wrong - modal stays open
<Modal isOpen={activeModal === 'wallet'} />

// ✅ Correct - close after action
onSuccess={() => {
  refetchData();
  closeModal();
}}
```

### 2. Type Casting Modal Mode

```typescript
// ❌ Wrong
<Modal mode={mode} />

// ✅ Correct
<Modal mode={mode as 'add' | 'edit' | 'delete'} />
```

### 3. Forgetting to Pass User ID

```typescript
// ❌ Wrong
await addWallet({...});

// ✅ Correct
await addWallet(user.id, {...});
```

## 🧪 Testing Tips

### Mock Modal Store

```typescript
jest.mock("../store/modalStore", () => ({
  useModalStore: () => ({
    activeModal: "wallet",
    mode: "add",
    selectedId: undefined,
    openWalletModal: jest.fn(),
    closeModal: jest.fn(),
  }),
}));
```

### Mock Finance Store

```typescript
jest.mock("../store/financeStore", () => ({
  useFinanceStore: () => ({
    wallets: [
      {
        id: "1",
        name: "Test Wallet",
        balance: 1000000,
      },
    ],
    addWallet: jest.fn(),
  }),
}));
```

## 🐛 Debugging Tips

### Check Active Modal

```typescript
const { activeModal, mode, selectedId } = useModalStore();
console.log({ activeModal, mode, selectedId });
```

### Check Store State

```typescript
const { wallets } = useFinanceStore();
console.log("Wallets:", wallets);
```

### Check Auth Status

```typescript
const { user, loading } = useAuthStore();
console.log("User:", user, "Loading:", loading);
```

## 📚 Resources

- [React Router Docs](https://reactrouter.com/)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 🎓 Next Steps

1. Buka `src/pages/TransactionsExample.tsx` untuk melihat implementasi lengkap
2. Pelajari `ROUTER_MODAL_GUIDE.md` untuk dokumentasi detail
3. Check `src/components/modals/` untuk lihat struktur modal
4. Explore `src/store/` untuk understand state management

## 🆘 Troubleshooting

### Modal Tidak Muncul

1. Pastikan `activeModal` adalah nama modal yang benar
2. Pastikan modal component sudah diimport
3. Check browser console untuk error

### Data Tidak Update

1. Pastikan `onSuccess` callback di-call
2. Pastikan store data sudah di-fetch
3. Check network tab untuk API errors

### Routing Tidak Bekerja

1. Pastikan routes sudah didefinisikan di `src/router/routes.ts`
2. Pastikan component sudah di-import
3. Check browser console untuk routing errors

---

**Happy Coding! 🎉**
