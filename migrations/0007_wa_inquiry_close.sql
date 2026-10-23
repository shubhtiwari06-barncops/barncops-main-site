-- "Close & resume bot" from the team inbox, and a test-number flag on webhook verdicts.

alter table wa_inquiries add column if not exists closed_at timestamptz;
alter table wa_webhook_events add column if not exists test boolean not null default false;
