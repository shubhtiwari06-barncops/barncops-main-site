-- Inquiry profile name for the team inbox, and one timing row per routed WhatsApp
-- message (no message text, no phone number).

alter table wa_inquiries add column if not exists profile_name text;

create table if not exists wa_timing (
  id bigserial primary key,
  wamid text,
  phone_number_id text,
  outcome text not null,
  received_at timestamptz not null,
  acked_at timestamptz,
  engine_start timestamptz,
  engine_end timestamptz,
  sent_at timestamptz,
  model_calls integer,
  engine_ms integer,
  handler text,
  background boolean not null default false
);

create index if not exists wa_timing_received_idx on wa_timing (received_at desc);
