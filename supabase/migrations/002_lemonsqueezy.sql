-- Swap Stripe columns for Lemon Squeezy
alter table public.profiles
  rename column stripe_customer_id to ls_customer_id;

alter table public.profiles
  rename column stripe_subscription_id to ls_subscription_id;

alter table public.profiles
  add column if not exists ls_portal_url text;
