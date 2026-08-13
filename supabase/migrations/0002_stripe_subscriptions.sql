-- HELD: Stripe subscription fields on users
-- Run this in the Supabase SQL Editor (or `supabase db push` if the project
-- is linked). This file is NOT executed automatically by the app.

alter table users
  add column if not exists stripe_customer_id text,
  add column if not exists subscription_active boolean not null default false;

create index if not exists idx_users_stripe_customer_id
  on users (stripe_customer_id);
