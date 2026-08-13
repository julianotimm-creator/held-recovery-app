-- HELD: preferred-name profile fields + conversation auto-compilation
-- Run this in the Supabase SQL Editor (or `supabase db push` if the project
-- is linked). This file is NOT executed automatically by the app.

create extension if not exists pgcrypto;

-- 1. Preferred display name on users.
-- name_lookup_hash is sha256(trim(lower(name))) computed by the app — it is
-- for internal dedupe/analytics only. It must never be used to look up or
-- restore another person's account: names are not secrets, and doing so
-- would let anyone type a guessed name and read someone else's recovery
-- conversation history.
alter table users
  add column if not exists preferred_name text,
  add column if not exists name_lookup_hash text;

create index if not exists idx_users_name_lookup_hash
  on users (name_lookup_hash);

-- 2. Rolling conversation summaries ("auto-compilation").
-- Every 10 messages in a conversation, the oldest 10 are summarized by
-- Claude Haiku into one row here and then deleted from `messages` to keep
-- storage bounded. The last 3 summaries per user are used to give Claude
-- short-term memory across conversations without replaying raw messages.
create table if not exists conversation_summaries (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  summary text not null,
  message_count integer not null default 10,
  created_at timestamptz not null default now()
);

create index if not exists idx_conversation_summaries_user_created
  on conversation_summaries (user_id, created_at desc);

create index if not exists idx_conversation_summaries_conversation
  on conversation_summaries (conversation_id);
