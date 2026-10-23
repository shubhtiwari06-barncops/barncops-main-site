-- One row per WhatsApp webhook verdict (signature_fail, ignored_number, ignored_type, duplicate,
-- admitted, config_mismatch, atlas, send_fail, handler_error). Names and codes only: no message
-- text, no customer number, no secret.

create table if not exists wa_webhook_events (
  id bigserial primary key,
  at timestamptz not null default now(),
  verdict text not null,
  line text,
  detail text
);

create index if not exists wa_webhook_events_at_idx on wa_webhook_events (at desc);
create index if not exists wa_webhook_events_verdict_idx on wa_webhook_events (verdict, at desc);
