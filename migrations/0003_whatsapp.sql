-- WhatsApp Cloud automation: contacts, thread, callbacks.
-- Unowned rows: protected at the API / admin-token boundary.

create table if not exists whatsapp_contacts (
  id uuid primary key,
  phone text not null unique,
  wa_id text,
  profile_name text,
  stage text not null default 'new',
  name text,
  role text,
  geography text,
  need_type text,
  timeline text,
  challenge text,
  path_choice text,
  last_inbound text,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  unread boolean not null default true,
  escalated boolean not null default false,
  escalated_at timestamptz,
  escalation_reason text,
  reference_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_contacts_updated_idx
  on whatsapp_contacts (updated_at desc);

create index if not exists whatsapp_contacts_stage_idx
  on whatsapp_contacts (stage);

create table if not exists whatsapp_messages (
  id uuid primary key,
  contact_id uuid not null references whatsapp_contacts (id),
  wamid text unique,
  direction text not null check (direction in ('in', 'out')),
  msg_type text not null default 'text',
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_messages_contact_idx
  on whatsapp_messages (contact_id, created_at desc);

create table if not exists callback_requests (
  id uuid primary key,
  contact_id uuid references whatsapp_contacts (id),
  phone text not null,
  callback_phone text not null,
  preferred_time text,
  name text,
  geography text,
  need_type text,
  challenge text,
  status text not null default 'new' check (status in ('new', 'scheduled', 'done', 'declined')),
  reference_id text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists callback_requests_created_idx
  on callback_requests (created_at desc);
