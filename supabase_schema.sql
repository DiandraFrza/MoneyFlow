  -- Supabase Schema for MoneyFlow Pro
  -- Run this script in the Supabase SQL Editor to set up your database.

  -- Enable UUID extension
  create extension if not exists "uuid-ossp";

  -- 1. PROFILES TABLE
  create table public.profiles (
      id uuid references auth.users(id) on delete cascade primary key,
      name text,
      photo_url text,
      currency text default 'IDR',
      monthly_salary numeric default 0,
      financial_target numeric default 0,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
  );

  -- 2. USER SETTINGS TABLE
  create table public.user_settings (
      id uuid default uuid_generate_v4() primary key,
      user_id uuid references auth.users(id) on delete cascade unique not null,
      theme text default 'light',
      notifications_enabled boolean default true,
      low_balance_threshold numeric default 500000,
      created_at timestamptz default now()
  );

  -- 3. WALLETS TABLE
  create table public.wallets (
      id uuid default uuid_generate_v4() primary key,
      user_id uuid references auth.users(id) on delete cascade not null,
      name text not null,
      type text not null, -- 'cash', 'bank', 'e-wallet', 'crypto', 'other'
      provider text,
      description text,
      balance numeric not null default 0,
      icon text,
      color text,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
  );

  -- 4. CATEGORIES TABLE
  create table public.categories (
      id uuid default uuid_generate_v4() primary key,
      user_id uuid references auth.users(id) on delete cascade, -- nullable for system defaults
      name text not null,
      type text not null, -- 'income', 'expense'
      icon text,
      color text,
      created_at timestamptz default now()
  );

  -- 5. SUB-CATEGORIES TABLE
  create table public.sub_categories (
      id uuid default uuid_generate_v4() primary key,
      category_id uuid references public.categories(id) on delete cascade not null,
      name text not null,
      created_at timestamptz default now()
  );

  -- 6. TRANSACTIONS TABLE
  create table public.transactions (
      id uuid default uuid_generate_v4() primary key,
      user_id uuid references auth.users(id) on delete cascade not null,
      wallet_id uuid references public.wallets(id) on delete cascade not null,
      category_id uuid references public.categories(id) on delete set null,
      sub_category_id uuid references public.sub_categories(id) on delete set null,
      type text not null, -- 'income', 'expense', 'savings', 'debt_payment', 'installment'
      amount numeric not null,
      description text,
      date date not null default current_date,
      receipt_url text,
      created_at timestamptz default now()
  );

  -- 7. WALLET TRANSFERS TABLE
  create table public.wallet_transfers (
      id uuid default uuid_generate_v4() primary key,
      user_id uuid references auth.users(id) on delete cascade not null,
      from_wallet_id uuid references public.wallets(id) on delete cascade not null,
      to_wallet_id uuid references public.wallets(id) on delete cascade not null,
      amount numeric not null,
      description text,
      date date not null default current_date,
      created_at timestamptz default now()
  );

  -- 8. BUDGETS TABLE
  create table public.budgets (
      id uuid default uuid_generate_v4() primary key,
      user_id uuid references auth.users(id) on delete cascade not null,
      category_id uuid references public.categories(id) on delete cascade not null,
      amount numeric not null,
      month integer not null, -- 1 to 12
      year integer not null,
      created_at timestamptz default now(),
      unique (user_id, category_id, month, year)
  );

  -- 9. BUDGET LOGS TABLE (For historical snap-shots)
  create table public.budget_logs (
      id uuid default uuid_generate_v4() primary key,
      budget_id uuid references public.budgets(id) on delete cascade not null,
      user_id uuid references auth.users(id) on delete cascade not null,
      spent numeric default 0,
      month integer not null,
      year integer not null,
      updated_at timestamptz default now()
  );

  -- 10. SAVINGS GOALS TABLE
  create table public.savings_goals (
      id uuid default uuid_generate_v4() primary key,
      user_id uuid references auth.users(id) on delete cascade not null,
      name text not null,
      target_amount numeric not null,
      current_amount numeric default 0,
      deadline date,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
  );

  -- 11. DEBTS TABLE (Track borrowed/lent money)
  create table public.debts (
      id uuid default uuid_generate_v4() primary key,
      user_id uuid references auth.users(id) on delete cascade not null,
      type text not null, -- 'borrowed', 'lent'
      person_name text not null,
      amount numeric not null,
      remaining_amount numeric not null,
      due_date date,
      status text default 'pending', -- 'pending', 'paid'
      description text,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
  );

  -- 12. RECURRING TRANSACTIONS TABLE
  create table public.recurring_transactions (
      id uuid default uuid_generate_v4() primary key,
      user_id uuid references auth.users(id) on delete cascade not null,
      wallet_id uuid references public.wallets(id) on delete cascade not null,
      category_id uuid references public.categories(id) on delete set null,
      sub_category_id uuid references public.sub_categories(id) on delete set null,
      type text not null, -- 'income', 'expense'
      amount numeric not null,
      description text,
      frequency text not null, -- 'weekly', 'monthly', 'yearly'
      interval_day integer not null, -- day of month (1-31) or day of week (0-6)
      last_generated date,
      next_date date not null,
      status text default 'active', -- 'active', 'paused'
      created_at timestamptz default now()
  );

  -- 13. NOTIFICATIONS TABLE
  create table public.notifications (
      id uuid default uuid_generate_v4() primary key,
      user_id uuid references auth.users(id) on delete cascade not null,
      title text not null,
      message text not null,
      type text not null, -- 'budget', 'bill', 'savings', 'debt', 'system'
      is_read boolean default false,
      created_at timestamptz default now()
  );

  -- 14. FINANCIAL HEALTH LOGS TABLE
  create table public.financial_health_logs (
      id uuid default uuid_generate_v4() primary key,
      user_id uuid references auth.users(id) on delete cascade not null,
      score integer not null,
      savings_ratio numeric,
      expense_ratio numeric,
      debt_ratio numeric,
      budget_compliance numeric,
      log_date date default current_date,
      created_at timestamptz default now()
  );

  -- =========================================================================
  -- INDEXES FOR PERFORMANCE
  -- =========================================================================
  create index idx_transactions_user_date on public.transactions(user_id, date);
  create index idx_transactions_wallet on public.transactions(wallet_id);
  create index idx_wallet_transfers_user on public.wallet_transfers(user_id);
  create index idx_budgets_user_date on public.budgets(user_id, year, month);
  create index idx_notifications_user_unread on public.notifications(user_id) where is_read = false;

  -- =========================================================================
  -- ROW LEVEL SECURITY (RLS) POLICIES
  -- =========================================================================
  alter table public.profiles enable row level security;
  alter table public.user_settings enable row level security;
  alter table public.wallets enable row level security;
  alter table public.categories enable row level security;
  alter table public.sub_categories enable row level security;
  alter table public.transactions enable row level security;
  alter table public.wallet_transfers enable row level security;
  alter table public.budgets enable row level security;
  alter table public.budget_logs enable row level security;
  alter table public.savings_goals enable row level security;
  alter table public.debts enable row level security;
  alter table public.recurring_transactions enable row level security;
  alter table public.notifications enable row level security;
  alter table public.financial_health_logs enable row level security;

  -- Policies helper: check if user is the owner
  create policy "Users can access their own profile" on public.profiles
      for all using (auth.uid() = id);

  create policy "Users can access their own settings" on public.user_settings
      for all using (auth.uid() = user_id);

  create policy "Users can access their own wallets" on public.wallets
      for all using (auth.uid() = user_id);

  -- Categories are accessible if they are system defaults (user_id IS NULL) or created by the user
  create policy "Users can access system and own categories" on public.categories
      for all using (user_id is null or auth.uid() = user_id);

  -- Subcategories are accessible if the parent category is accessible
  create policy "Users can access sub-categories of visible categories" on public.sub_categories
      for all using (
          exists (
              select 1 from public.categories c 
              where c.id = category_id and (c.user_id is null or c.user_id = auth.uid())
          )
      );

  create policy "Users can access their own transactions" on public.transactions
      for all using (auth.uid() = user_id);

  create policy "Users can access their own transfers" on public.wallet_transfers
      for all using (auth.uid() = user_id);

  create policy "Users can access their own budgets" on public.budgets
      for all using (auth.uid() = user_id);

  create policy "Users can access their own budget logs" on public.budget_logs
      for all using (auth.uid() = user_id);

  create policy "Users can access their own savings goals" on public.savings_goals
      for all using (auth.uid() = user_id);

  create policy "Users can access their own debts" on public.debts
      for all using (auth.uid() = user_id);

  create policy "Users can access their own recurring transactions" on public.recurring_transactions
      for all using (auth.uid() = user_id);

  create policy "Users can access their own notifications" on public.notifications
      for all using (auth.uid() = user_id);

  create policy "Users can access their own health logs" on public.financial_health_logs
      for all using (auth.uid() = user_id);

  -- =========================================================================
  -- DATABASE TRIGGERS
  -- =========================================================================

  -- Trigger to automatically create profile and settings on user signup
  create or replace function public.handle_new_user()
  returns trigger as $$
  begin
    insert into public.profiles (id, name, currency, monthly_salary)
    values (new.id, coalesce(new.raw_user_meta_data->>'name', 'User'), 'IDR', 0);
    
    insert into public.user_settings (user_id, theme, notifications_enabled, low_balance_threshold)
    values (new.id, 'light', true, 500000);
    
    -- Insert default cash wallet for convenience
    insert into public.wallets (user_id, name, type, balance, icon, color)
    values (new.id, 'Cash', 'cash', 0, 'Wallet', '#10B981');
    
    return new;
  end;
  $$ language plpgsql security definer;

  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

  -- Trigger for Wallet Balance Adjustments based on Transactions
  create or replace function public.update_wallet_balance_on_transaction()
  returns trigger as $$
  declare
    amount_diff numeric := 0;
  begin
    -- INSERT
    if (TG_OP = 'INSERT') then
      if (new.type = 'income') then
        amount_diff := new.amount;
      else
        amount_diff := -new.amount; -- expense, savings, debt_payment, installment subtracts cash
      end if;
      update public.wallets set balance = balance + amount_diff where id = new.wallet_id;
    
    -- UPDATE
    elsif (TG_OP = 'UPDATE') then
      -- Revert old amount
      if (old.type = 'income') then
        amount_diff := -old.amount;
      else
        amount_diff := old.amount;
      end if;
      update public.wallets set balance = balance + amount_diff where id = old.wallet_id;
      
      -- Apply new amount
      if (new.type = 'income') then
        amount_diff := new.amount;
      else
        amount_diff := -new.amount;
      end if;
      update public.wallets set balance = balance + amount_diff where id = new.wallet_id;
    
    -- DELETE
    elsif (TG_OP = 'DELETE') then
      if (old.type = 'income') then
        amount_diff := -old.amount;
      else
        amount_diff := old.amount;
      end if;
      update public.wallets set balance = balance + amount_diff where id = old.wallet_id;
    end if;
    
    return null;
  end;
  $$ language plpgsql security definer;

  create trigger trg_adjust_wallet_balance_transaction
    after insert or update or delete on public.transactions
    for each row execute procedure public.update_wallet_balance_on_transaction();

  -- Trigger for Wallet Balance Adjustments based on Transfers
  create or replace function public.update_wallet_balance_on_transfer()
  returns trigger as $$
  begin
    -- INSERT
    if (TG_OP = 'INSERT') then
      update public.wallets set balance = balance - new.amount where id = new.from_wallet_id;
      update public.wallets set balance = balance + new.amount where id = new.to_wallet_id;
    
    -- UPDATE
    elsif (TG_OP = 'UPDATE') then
      -- Revert old transfer
      update public.wallets set balance = balance + old.amount where id = old.from_wallet_id;
      update public.wallets set balance = balance - old.amount where id = old.to_wallet_id;
      -- Apply new transfer
      update public.wallets set balance = balance - new.amount where id = new.from_wallet_id;
      update public.wallets set balance = balance + new.amount where id = new.to_wallet_id;
    
    -- DELETE
    elsif (TG_OP = 'DELETE') then
      update public.wallets set balance = balance + old.amount where id = old.from_wallet_id;
      update public.wallets set balance = balance - old.amount where id = old.to_wallet_id;
    end if;
    
    return null;
  end;
  $$ language plpgsql security definer;

  create trigger trg_adjust_wallet_balance_transfer
    after insert or update or delete on public.wallet_transfers
    for each row execute procedure public.update_wallet_balance_on_transfer();
