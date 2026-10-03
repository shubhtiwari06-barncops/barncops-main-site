-- Confidential intake and short info-request submissions.
-- Unowned rows (no user_id): protected at the API boundary, not by accounts.

create table if not exists intake_requests (
  id uuid primary key,
  created_at timestamptz not null default now(),
  type text not null check (type in ('intake', 'info')),
  name text not null,
  role text,
  geography text,
  timeline text,
  challenge text,
  room text,
  need_type text,
  contact_channel text,
  email text not null,
  phone text,
  source_page text,
  consent boolean not null default false,
  reference_id text not null unique,
  status text not null default 'new' check (status in ('new', 'reviewing', 'engaged', 'declined'))
);

create index if not exists intake_requests_created_at_idx
  on intake_requests (created_at desc);

create index if not exists intake_requests_type_idx
  on intake_requests (type);

create table if not exists admin_audit_log (
  id uuid primary key,
  actor text not null,
  action text not null,
  target_id text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
  on admin_audit_log (created_at desc);
