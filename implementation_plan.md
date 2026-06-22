# Implementation Plan - MoneyFlow Pro

MoneyFlow Pro is a modern, mobile-first personal finance management web application built with React 19, Vite, TypeScript, Tailwind CSS, and Supabase. It features a multi-wallet system, budgeting, financial health scoring, debt tracking, savings goals, recurring transactions, smart alerts, reports, and data export (Excel/PDF).

## User Review Required

> [!IMPORTANT]
> **React 19 & Shadcn/UI Compatibility:**
> Some npm packages (including shadcn/ui CLI components) might have peer dependency issues with React 19. To ensure stability, we will build custom, high-fidelity components matching the Shadcn/UI design spec directly in the codebase. This guarantees React 19 compatibility and eliminates compile-time dependency conflicts.
>
> **Dual-Mode Data Layer (Supabase + LocalStorage):**
> We will implement a repository pattern that seamlessly connects to Supabase if the API keys are provided in `.env`. If not, it falls back to a complete local storage repository. This makes the application fully functional and testable immediately without requiring database setups first.

---

## Proposed Changes

### 1. Database Schema (Supabase)

We will design a schema with 14 tables, fully optimized with Indexes, Foreign Keys, Triggers, and Row-Level Security (RLS) policies.

#### [NEW] [supabase_schema.sql](file:///d:/laragon/www/MoneyFlow/supabase_schema.sql)
A SQL script that sets up:
* **`profiles`**: User profiles (salary, target, avatar).
* **`wallets`**: Multiple wallets (Cash, BCA, Dana, etc.) tracking balances.
* **`categories`**: Transaction categories (Income/Expense).
* **`sub_categories`**: Detailed categories.
* **`transactions`**: Cash flows (Income, Expense, Transfer, Savings, Debt, Installments).
* **`wallet_transfers`**: Tracks transfers between wallets.
* **`budgets`**: Monthly limits per category.
* **`budget_logs`**: Tracks monthly budget performance.
* **`savings_goals`**: Progress tracker for savings targets.
* **`debts`**: Borrowed and lent money tracking.
* **`recurring_transactions`**: Recurring templates (weekly, monthly, yearly).
* **`notifications`**: System, budget, and bill alerts.
* **`user_settings`**: Dark mode, threshold levels.
* **`financial_health_logs`**: Historical snapshots of health scores.
* **RLS Policies**: Restrict database access to authenticated owners.
* **Triggers**: Automated balance adjustments in wallets when transactions or transfers are created/updated/deleted.

---

### 2. Frontend Architecture & Folder Structure

```
src/
├── components/
│   ├── layout/          # Mobile Bottom Nav, Desktop Sidebar, Header
│   ├── ui/              # Button, Card, Dialog, Input, Progress, Select, Tabs, etc.
│   ├── dashboard/       # WalletCards, ChartCards, FinancialHealthCard, SmartAlerts
│   ├── transactions/    # QuickAddModal, TransactionList, ReceiptUpload
│   └── shared/          # ThemeProvider, ErrorBoundary, SkeletonLoader
├── context/             # Global contexts (e.g. SupabaseContext)
├── hooks/               # useFinancialHealth, useRecurringEngine, useSmartInsights
├── lib/                 # supabaseClient, pdfExport, excelExport, utils
├── pages/               # Auth, Dashboard, Transactions, Reports, Settings
├── store/               # Zustand state management (authStore, financeStore, alertStore)
├── types/               # Type definitions for all entities
├── App.tsx              # React Router setup & global layouts
├── index.css            # Base styles and theme configurations
└── main.tsx             # Application entry point
```

#### [NEW] [index.css](file:///d:/laragon/www/MoneyFlow/src/index.css)
Configure Tailwind variables to match the requested color palette:
* Primary: `#2563EB` (Blue)
* Success: `#10B981` (Emerald)
* Warning: `#F59E0B` (Amber)
* Danger: `#EF4444` (Red)
* Background: Light `#F8FAFC` / Dark `#0F172A`
* Font family: `Inter`, `Outfit` or system UI.

#### [NEW] [store/financeStore.ts](file:///d:/laragon/www/MoneyFlow/src/store/financeStore.ts)
Zustand store that coordinates application state (wallets, transactions, budgets, goals, debts, categories) and interacts with the repository layer. It supports:
* Optimistic updates for seamless mobile experience.
* Synchronous updates between memory, LocalStorage, and Supabase.

---

### 3. Core Features Implementation

#### Quick Add Floating Action Button (FAB)
A floating button accessible from all primary tabs.
* Opens a simplified modal optimized for mobile screen keyboards.
* Users can record a transaction in **under 5 seconds** (pre-selected active wallet, type toggle, numeric pad focus, quick categories).

#### Financial Health Engine
A utility hook `useFinancialHealth` that computes a real-time rating (0-100) based on:
* **Savings Ratio**: (Income - Expense) / Income (Target > 20%).
* **Expense Ratio**: Expense / Income (Target < 50%).
* **Budget Compliance**: Ratio of categories within budget.
* **Debt Ratio**: Debt obligations / Monthly salary.
* It outputs an interactive score, rating message, and specific recommendations.

#### Smart Alert & Recommendation Engine
Scans transaction logs to detect anomalies:
* **Low Balance Alert:** Total balance < Rp500,000.
* **Low Income Ratio:** Remaining balance <= 20% of monthly income.
* **Overspending Alert:** Today's spending > 150% of the 7-day average.
* **Budget Exceeded Alert:** Active category consumption > 100%.
* **Bill Reminder:** Recurring bills due in <= 3 days.
* Generates notifications stored in the `notifications` store & database.

#### Smart Insights Card
Synthesizes logs to provide contextual recommendations:
* "Food spending increased by 18% compared to last month."
* "You spent Rp450,000 on coffee this month."
* "Transportation is your largest expense category."

#### Export Services (`xlsx` & `jsPDF`)
* **Excel:** Generates a structured multi-sheet workbook (Summary, Transactions, Budgets, Savings, Debts).
* **PDF:** Generates a professional visual PDF document containing currency summaries, mini tables for categories, savings progress bars, and debts.

---

## Verification Plan

### Automated Verification
* Run `tsc --noEmit` to verify type safety.
* Run `npm run build` to confirm bundler success.
* Test LocalStorage fallback logic under mock offline conditions.

### Manual Verification
1. **Authentication Flow:** Register, login, reset password simulation.
2. **Quick Add FAB:** Verify time-to-input is < 5 seconds.
3. **Transaction Flow:** Add income/expense/transfer, confirm wallet balance updates.
4. **Budget Progress:** Create budget, add expense, check color change when exceeded.
5. **Smart Alerts:** Lower balance manually to see low balance warning trigger.
6. **Reports & Exports:** Export Excel/PDF, verify data matches current view.
7. **Responsive UI:** View on DevTools responsive widths: 320px, 375px, 390px, 414px.
