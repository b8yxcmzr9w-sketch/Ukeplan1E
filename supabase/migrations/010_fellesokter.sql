-- ═══════════════════════════════════════════════════════════════
-- Ukeplan v4 – Fellesundervisning (økt som gjelder flere klasser)
-- En fellesøkt lagres som én rad per klasse, koblet sammen med en
-- felles shared_group_id. Hver klasses plan, RLS, sanntid og iCal
-- fungerer da uendret; appen viser «Felles med …» på kortene.
-- Kjøres manuelt i Supabase Dashboard → SQL Editor.
-- ═══════════════════════════════════════════════════════════════

alter table sessions
  add column if not exists shared_group_id uuid;

create index if not exists idx_sessions_shared_group
  on sessions(shared_group_id) where shared_group_id is not null;
