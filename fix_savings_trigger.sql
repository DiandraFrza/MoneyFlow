-- Run this script in your Supabase SQL Editor to update the savings trigger logic.
-- This ensures that transactions with type 'savings' do NOT decrease your wallet balance,
-- because the money physically remains in your bank account/wallet.

create or replace function public.update_wallet_balance_on_transaction()
returns trigger as $$
declare
  amount_diff numeric := 0;
begin
  -- INSERT
  if (TG_OP = 'INSERT') then
    if (new.type = 'income') then
      amount_diff := new.amount;
    elsif (new.type = 'savings') then
      amount_diff := 0; -- savings does not deduct from wallet
    else
      amount_diff := -new.amount; -- expense, debt_payment, installment subtracts cash
    end if;
    update public.wallets set balance = balance + amount_diff where id = new.wallet_id;
  
  -- UPDATE
  elsif (TG_OP = 'UPDATE') then
    -- Revert old amount
    if (old.type = 'income') then
      amount_diff := -old.amount;
    elsif (old.type = 'savings') then
      amount_diff := 0;
    else
      amount_diff := old.amount;
    end if;
    update public.wallets set balance = balance + amount_diff where id = old.wallet_id;
    
    -- Apply new amount
    if (new.type = 'income') then
      amount_diff := new.amount;
    elsif (new.type = 'savings') then
      amount_diff := 0;
    else
      amount_diff := -new.amount;
    end if;
    update public.wallets set balance = balance + amount_diff where id = new.wallet_id;
  
  -- DELETE
  elsif (TG_OP = 'DELETE') then
    if (old.type = 'income') then
      amount_diff := -old.amount;
    elsif (old.type = 'savings') then
      amount_diff := 0;
    else
      amount_diff := old.amount;
    end if;
    update public.wallets set balance = balance + amount_diff where id = old.wallet_id;
  end if;
  
  return null;
end;
$$ language plpgsql security definer;
