<!-- @format -->

# 🏗️ Architecture & Project Structure

## Diagram Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                      MoneyFlow Pro App                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
                          ┌───────────┐
                          │  App.tsx  │
                          └─────┬─────┘
                                ↓
                    ┌───────────────────────────┐
                    │   AppRouter Component      │
                    │  (Smart Dynamic Router)    │
                    └───────────┬───────────────┘
                                ↓
                    ┌───────────────────────────┐
                    │  Is User Authenticated?   │
                    └───────────┬───────────────┘
                        ╱               ╲
                      YES              NO
                       ↓                ↓
            ┌──────────────────┐   ┌──────────┐
            │   AppLayout +    │   │ Auth     │
            │   Protected      │   │ Page     │
            │   Routes         │   └──────────┘
            └────────┬─────────┘
                     ↓
        ┌────────────┴────────────┐
        ↓                         ↓
    ┌─────────────┐        ┌─────────────┐
    │  Dashboard  │        │ Transactions│
    │  Reports    │        │ Settings    │
    │  etc...     │        │ (w/ Modals) │
    └─────────────┘        └──────┬──────┘
                                   ↓
                    ┌──────────────────────────┐
                    │   Modal Store Actions    │
                    │  (Zustand State Mgmt)    │
                    └──────────────────────────┘
                                   ↓
            ┌──────────────────────┴──────────────────────┐
            ↓            ↓            ↓            ↓      ↓
        ┌────────┐  ┌────────┐  ┌────────┐  ┌─────────┐ ┌─────┐
        │Wallet  │  │Budget  │  │ Debt   │  │Recurring│ │Prof.│
        │Modal   │  │ Modal  │  │ Modal  │  │ Modal   │ │Modal│
        └────────┘  └────────┘  └────────┘  └─────────┘ └─────┘
```

## 📁 Direktori Struktur Lengkap

```
src/
├── App.tsx                          # Main app component (updated)
├── main.tsx                         # Entry point
│
├── router/                          # ✨ NEW - Smart Router System
│   ├── types.ts                     # Router type definitions
│   ├── routes.ts                    # Dynamic route config
│   ├── ProtectedRoute.tsx           # Route protection component
│   └── index.tsx                    # Main router component
│
├── components/
│   ├── layout/
│   │   └── AppLayout.tsx            # Main layout component
│   ├── ui/                          # UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── progress.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   └── ...
│   │
│   └── modals/                      # ✨ NEW - CRUD Modals
│       ├── WalletConfigModal.tsx    # Wallet CRUD modal
│       ├── BudgetConfigModal.tsx    # Budget CRUD modal
│       ├── DebtConfigModal.tsx      # Debt CRUD modal
│       ├── RecurringConfigModal.tsx # Recurring CRUD modal
│       ├── ProfileConfigModal.tsx   # Profile edit modal
│       └── index.ts                 # Modal exports
│
├── pages/
│   ├── Auth.tsx                     # Login & Register
│   ├── Dashboard.tsx                # Main dashboard
│   ├── Transactions.tsx             # Transaction management
│   ├── TransactionsExample.tsx      # ✨ NEW - Example with modals
│   ├── Reports.tsx                  # Reports page
│   └── Settings.tsx                 # Settings page
│
├── store/
│   ├── authStore.ts                 # Authentication (enhanced)
│   ├── financeStore.ts              # Finance data management
│   └── modalStore.ts                # ✨ NEW - Modal state management
│
├── hooks/
│   ├── useFinancialHealth.ts        # Financial health calculations
│   ├── useSmartAlerts.ts            # Smart alerts
│   └── useCrudOperations.ts         # ✨ NEW - CRUD operations helper
│
├── lib/
│   ├── exportServices.ts            # Export to PDF/Excel
│   ├── repository.ts                # Data repository layer
│   ├── supabase.ts                  # Supabase config
│   └── utils.ts                     # Utility functions
│
├── types/
│   └── index.ts                     # ✨ UPDATED - Enhanced type definitions
│
├── assets/
│   └── ...                          # Static assets
│
├── App.css                          # Global styles
├── index.css                        # Base styles
│
├── ROUTER_MODAL_GUIDE.md            # ✨ NEW - Comprehensive guide
├── IMPLEMENTATION_SUMMARY.md        # ✨ NEW - Summary of changes
└── QUICK_START.md                   # ✨ NEW - Quick start guide
```

## 🔄 Data Flow Architecture

### Authentication Flow

```
User Input (Email/Password)
           ↓
    useAuthStore.login()
           ↓
    Supabase Auth API / Local Storage
           ↓
    Auth State Updated in Zustand
           ↓
    App re-renders with authenticated UI
           ↓
    Protected Routes become accessible
           ↓
    Finance data starts loading
```

### CRUD Modal Flow

```
User clicks "Add/Edit/Delete" button
           ↓
    openWalletModal('add'/'edit'/'delete', id?)
           ↓
    Modal Store state updates
           ↓
    Modal component renders with:
    - Form fields (for add/edit)
    - Confirmation (for delete)
           ↓
    User submits
           ↓
    Validation check
           ↓
    Call Finance Store action
    (addWallet/updateWallet/deleteWallet)
           ↓
    API call to Supabase/Local DB
           ↓
    Success? Update store state
           ↓
    Call onSuccess callback
           ↓
    Close modal
           ↓
    UI reflects changes (auto-update from store)
```

### Router Flow

```
App initializes
       ↓
Check authentication status
       ↓
   ┌────────┬────────┐
   ↓        ↓
Authenticated  Not Authenticated
   ↓        ↓
Protected  Auth Page
Routes
   ↓
Read route config from routes.ts
       ↓
Generate protected routes
       ↓
Match URL to route config
       ↓
Render appropriate component
```

## 🎯 Component Hierarchy

```
App
├── AppRouter
│   ├── Auth Page (public)
│   └── AppLayout (authenticated)
│       ├── Sidebar Navigation
│       ├── Header
│       └── Main Content Area
│           └── Routes
│               ├── Dashboard
│               │   └── Financial widgets
│               ├── Transactions
│               │   ├── Tabs
│               │   │   ├── Wallets List
│               │   │   │   ├── WalletItem
│               │   │   │   └── [WalletConfigModal]
│               │   │   ├── Budgets List
│               │   │   │   ├── BudgetItem
│               │   │   │   └── [BudgetConfigModal]
│               │   │   ├── Debts List
│               │   │   │   ├── DebtItem
│               │   │   │   └── [DebtConfigModal]
│               │   │   └── Recurring List
│               │   │       ├── RecurringItem
│               │   │       └── [RecurringConfigModal]
│               │   └── [ProfileConfigModal]
│               ├── Reports
│               └── Settings
```

## 💾 State Management Architecture

### Zustand Stores (Global State)

```
┌─────────────────────────────────────────────────────────┐
│                   Zustand Stores                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. AuthStore (useAuthStore)                           │
│     ├── user: UserProfile                             │
│     ├── settings: UserSettings                        │
│     ├── loading: boolean                              │
│     ├── Actions:                                       │
│     │   ├── initialize()                              │
│     │   ├── login(email, password)                    │
│     │   ├── register(email, password, name)           │
│     │   ├── logout()                                  │
│     │   ├── updateProfile()                           │
│     │   └── updateSettings()                          │
│     └── Error handling                                │
│                                                         │
│  2. FinanceStore (useFinanceStore)                    │
│     ├── Data Collections:                             │
│     │   ├── wallets[]                                 │
│     │   ├── transactions[]                            │
│     │   ├── budgets[]                                 │
│     │   ├── debts[]                                   │
│     │   ├── recurring[]                               │
│     │   ├── categories[]                              │
│     │   ├── etc...                                    │
│     ├── Actions:                                       │
│     │   ├── fetchData(userId)                         │
│     │   ├── addWallet/updateWallet/deleteWallet      │
│     │   ├── addBudget/updateBudget/deleteBudget      │
│     │   ├── addDebt/updateDebt/deleteDebt            │
│     │   ├── addRecurring/updateRecurring/deleteRec. │
│     │   └── etc...                                    │
│     └── Error handling                                │
│                                                         │
│  3. ModalStore (useModalStore)                        │
│     ├── activeModal: 'wallet' | 'budget' | ...        │
│     ├── mode: 'add' | 'edit' | 'delete'              │
│     ├── selectedId: string | undefined               │
│     ├── Actions:                                       │
│     │   ├── openWalletModal(mode, id?)               │
│     │   ├── openBudgetModal(mode, id?)               │
│     │   ├── openDebtModal(mode, id?)                 │
│     │   ├── openRecurringModal(mode, id?)            │
│     │   ├── openProfileModal()                        │
│     │   └── closeModal()                              │
│     └── Used by Modal components                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## 🔌 API Integration

```
Frontend (React)
       ↓
    Axios/Fetch
       ↓
┌──────────────────────────────────┐
│    Repository Layer (repository.ts)
│  (Abstraction for API calls)
└──────────────────────────────────┘
       ↓
┌──────────────────────────────────┐
│  Supabase Client / Local DB      │
│  (API/Local Storage Layer)       │
└──────────────────────────────────┘
       ↓
┌──────────────────────────────────┐
│  Backend (Supabase)              │
│  (Real-time DB + Auth)          │
└──────────────────────────────────┘
```

## 🔐 Authentication Architecture

```
┌────────────────────────────────────────────────┐
│        Authentication System                   │
├────────────────────────────────────────────────┤
│                                                │
│  Supabase Configured?                         │
│         ↓                                      │
│    ┌─────────┬─────────┐                     │
│    YES      NO                               │
│    ↓         ↓                                │
│ Supabase   Local Storage                     │
│ Auth       (Guest Mode)                      │
│    ↓         ↓                                │
│ Email/Pass  Demo/Local                      │
│ Login       Credentials                      │
│                                               │
│  Protected Routes ←─ Auth Status              │
│  Redirect to Auth ←─ No Auth                 │
│                                               │
└────────────────────────────────────────────────┘
```

## 📊 Type System Architecture

```
┌─────────────────────────────────────────────────┐
│              Type Definitions                    │
│              (types/index.ts)                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ✅ UserProfile                                 │
│  ✅ UserSettings                                │
│  ✅ Wallet                                      │
│  ✅ Category                                    │
│  ✅ SubCategory                                 │
│  ✅ Transaction                                 │
│  ✅ WalletTransfer                              │
│  ✅ Budget                                      │
│  ✅ SavingsGoal                                 │
│  ✨ Debt (UPDATED)                              │
│  ✨ RecurringTransaction (UPDATED)              │
│  ✅ AppNotification                             │
│  ✅ FinancialHealthLog                          │
│                                                 │
│  Router Types (router/types.ts)                │
│  ├── UserRole                                  │
│  ├── RouteConfig                               │
│  ├── RouterState                               │
│  ├── BreadcrumbItem                            │
│  └── NavigationItem                            │
│                                                 │
│  Modal Types (store/modalStore.ts)             │
│  ├── ModalMode                                 │
│  └── ModalType                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 🎨 UI Component Tree

```
UI Components (components/ui/)
├── button.tsx         - Reusable button
├── card.tsx           - Card container
├── dialog.tsx         - Modal/dialog
├── input.tsx          - Text input
├── progress.tsx       - Progress bar
├── select.tsx         - Select dropdown
└── tabs.tsx           - Tab navigation

Modal Components (components/modals/)
├── WalletConfigModal   - Uses: button, card, dialog, input
├── BudgetConfigModal   - Uses: button, card, dialog, input, select
├── DebtConfigModal     - Uses: button, card, dialog, input
├── RecurringConfigModal- Uses: button, card, dialog, input, select
└── ProfileConfigModal  - Uses: button, card, dialog, input, select

Layout Components (components/layout/)
└── AppLayout          - Wraps all authenticated pages
    ├── Sidebar        - Navigation
    ├── Header         - Top bar
    └── Main Content   - Page content
```

## 🚀 Performance Optimization

```
┌─────────────────────────────────────────┐
│    Performance Strategies              │
├─────────────────────────────────────────┤
│                                         │
│  ✅ Zustand (lightweight state)         │
│  ✅ React Router lazy loading           │
│  ✅ Memoization (useMemo)               │
│  ✅ Tailwind CSS (optimized build)      │
│  ✅ Code splitting (by page)            │
│  ✅ Image optimization                  │
│  ✅ API caching                         │
│  ✅ Debouncing for search               │
│                                         │
└─────────────────────────────────────────┘
```

## 🔄 Development Workflow

```
1. Feature Request
        ↓
2. Update Types (if needed)
        ↓
3. Update Store (if needed)
        ↓
4. Create/Update Component
        ↓
5. Add Modal (if CRUD)
        ↓
6. Wire up in Page
        ↓
7. Test locally
        ↓
8. Commit & Push
```

## 📈 Scalability Roadmap

```
Current:
└── Basic CRUD modals for 5 main modules

Phase 2:
├── Advanced filtering & search
├── Batch operations
└── Custom category management

Phase 3:
├── Reporting dashboard
├── Budget forecasting
└── Investment tracking

Phase 4:
├── Multi-currency support
├── Multi-account support
└── Family/shared budgets
```

---

**Sistem ini dibangun dengan arsitektur yang scalable dan maintainable untuk pertumbuhan jangka panjang.** 🚀
