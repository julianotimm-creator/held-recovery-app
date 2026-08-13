-- HELD: allow anonymous users (no email yet)
-- Run this in the Supabase SQL Editor (or `supabase db push` if the project
-- is linked). This file is NOT executed automatically by the app.
--
-- Users are now created anonymously on first /chat visit (no signup screen).
-- Email is collected later (e.g. at checkout), so it can no longer be
-- required at insert time.

alter table users alter column email drop not null;
