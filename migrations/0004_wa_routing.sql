-- WhatsApp routing: Meta message ids already handled, and business inquiries
-- (one per number per inactivity window) with their thread entries.
-- Unowned rows: written only by the webhook, read at the admin-token boundary.

create table if not exists wa_seen_messages (
  wamid text primary key,
  phone_number_id text,
  received_at timestamptz not null default now()
);

create index if not exists wa_seen_messages_received_idx
  on wa_seen_messages (received_at);

create table if not exists wa_inquiries (
  id bigserial primary key,
  phone text not null,
  phone_number_id text not null,
  source text not null,
  opened_at timestamptz not null default now(),
  last_at timestamptz not null default now(),
  emailed_at timestamptz,
  acked_at timestamptz
);

create index if not exists wa_inquiries_phone_last_idx
  on wa_inquiries (phone, phone_number_id, last_at desc);

create table if not exists wa_inquiry_messages (
  id bigserial primary key,
  inquiry_id bigint not null references wa_inquiries (id) on delete cascade,
  wamid text unique,
  direction text not null,
  kind text not null,
  body text,
  created_at timestamptz not null default now()
);

create index if not exists wa_inquiry_messages_inquiry_idx
  on wa_inquiry_messages (inquiry_id, created_at);
