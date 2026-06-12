-- ═══════════════════════════════════════════════════════════════
-- Import: ekte fellesfag-plan 25/26 fra dagens løsning (Plan_Fag-arket)
-- Kjør i Supabase SQL Editor.
--
-- Arket har en egen Fag-kolonne (her: kun Naturfag, tirsdager,
-- lærer Willy). Skriptet soft-sletter eksisterende økter for hvert
-- fag som finnes i arket (dvs. de syntetiske Naturfag-øktene fra
-- migrasjon 013) og setter inn de 34 ekte radene. Øvrige syntetiske
-- fellesfag (norsk, matematikk, engelsk, kroppsøving) røres ikke.
--
-- Lærermapping som i 014/015: fornavn mot users.full_name; uten
-- treff brukes første bruker på skolen og navnet legges i info som
-- «[Lærer: Willy]».
--
-- Trygt å kjøre flere ganger. Forutsetter migrasjon 012 og minst én
-- bruker på skolen.
-- ═══════════════════════════════════════════════════════════════

create or replace function pg_temp.finn_laerer(p_school uuid, p_navn text)
returns uuid language sql stable as $f$
  select id from users
  where school_id = p_school and deleted_at is null
    and (full_name ilike p_navn || '%' or full_name ilike '% ' || p_navn || '%')
  order by full_name limit 1;
$f$;

do $$
declare
  v_school   uuid;
  v_class    uuid;
  v_sy       text := '25/26';
  v_subject  uuid;
  v_fallback uuid;
  v_teacher  uuid;
  v_dagnr    int;
  v_info     text;
  r          record;
  f          record;
  slettet    int := 0;
  satt_inn   int := 0;
  umatchet   text[] := '{}';
begin
  -- ── Skole, klasse, fallback-lærer ──────────────────────────────
  select id into v_school from schools order by created_at limit 1;
  if v_school is null then
    raise notice 'Ingen skole funnet – avbryter.'; return;
  end if;

  select id into v_class from classes
  where school_id = v_school and deleted_at is null
  order by case when name = '1E' then 0 else 1 end, sort_order, name
  limit 1;
  if v_class is null then
    raise notice 'Ingen klasse funnet – avbryter.'; return;
  end if;

  select id into v_fallback from users
  where school_id = v_school and deleted_at is null
  order by full_name limit 1;
  if v_fallback is null then
    raise notice 'Ingen brukere funnet – opprett minst én lærer først. Avbryter.';
    return;
  end if;

  -- ── Rådata fra Plan_Fag (uke, dag, fag, aktivitet, oppmøte, info, lærer)
  create temp table if not exists fag_rader (
    uke int, dag text, fag text, akt text, sted text, info text, laerer text
  ) on commit drop;
  delete from fag_rader;

  insert into fag_rader values
    (35,'tirsdag','Naturfag','Introduksjon og årsplan','','Bli kjent. Gjennomgang årsplan og kompetansemål. Kapittel 1: Naturvitenskap. Introduksjon til tverrfaglig prosjekt Helse og livsmestring (som skal forgå hele skoleåret).','Willy'),
    (36,'tirsdag','Naturfag','Introduksjon og årsplan','','Bli kjent. Gjennomgang årsplan og kompetansemål. Kapittel 1: Naturvitenskap. Introduksjon til tverrfaglig prosjekt Helse og livsmestring (som skal forgå hele skoleåret).','Willy'),
    (37,'tirsdag','Naturfag','Introduksjon og årsplan','','Bli kjent. Gjennomgang årsplan og kompetansemål. Kapittel 1: Naturvitenskap. Introduksjon til tverrfaglig prosjekt Helse og livsmestring (som skal forgå hele skoleåret).','Willy'),
    (38,'tirsdag','Naturfag','Kapittel 4: Næringsstoffer','','Karbohydrater. Proteiner. Fett. Vitaminer og mineraler.','Willy'),
    (39,'tirsdag','Naturfag','Kapittel 4: Næringsstoffer','','Karbohydrater. Proteiner. Fett. Vitaminer og mineraler.','Willy'),
    (40,'tirsdag','Naturfag','Kapittel 4: Næringsstoffer','','Karbohydrater. Proteiner. Fett. Vitaminer og mineraler.','Willy'),
    (42,'tirsdag','Naturfag','Kapittel 4: Fordøyelse og energi','','Hvor blir det av næringsstoffene? Energi i cellene.','Willy'),
    (43,'tirsdag','Naturfag','Kapittel 4: Fordøyelse og energi','','Hvor blir det av næringsstoffene? Energi i cellene.','Willy'),
    (44,'tirsdag','Naturfag','Kapittel 4: Fordøyelse og energi','','Hvor blir det av næringsstoffene? Energi i cellene.','Willy'),
    (46,'tirsdag','Naturfag','Kapittel 5: Kosthold og livsstil.','','Bærekraftig kosthold og matproduksjon. Helse, energiforbruk, fysisk aktivitet og appetittregulering. Registrere data til prosjekt helse og livsmestring.','Willy'),
    (47,'tirsdag','Naturfag','Kapittel 5: Kosthold og livsstil.','','Bærekraftig kosthold og matproduksjon. Helse, energiforbruk, fysisk aktivitet og appetittregulering. Registrere data til prosjekt helse og livsmestring.','Willy'),
    (48,'tirsdag','Naturfag','Kapittel 5: Kosthold og livsstil.','','Bærekraftig kosthold og matproduksjon. Helse, energiforbruk, fysisk aktivitet og appetittregulering. Registrere data til prosjekt helse og livsmestring. Registrere data til prosjekt helse og livsmestring.','Willy'),
    (49,'tirsdag','Naturfag','Kapittel 5: Kosthold og livsstil.','','Bærekraftig kosthold og matproduksjon. Helse, energiforbruk, fysisk aktivitet og appetittregulering. Registrere data til prosjekt helse og livsmestring. Registrere data til prosjekt helse og livsmestring.','Willy'),
    (50,'tirsdag','Naturfag','Kapittel 5: Kosthold og livsstil.','','Bærekraftig kosthold og matproduksjon. Helse, energiforbruk, fysisk aktivitet og appetittregulering. Registrere data til prosjekt helse og livsmestring.','Willy'),
    (2,'tirsdag','Naturfag','Kapittel 3: Livet på jorda','','Grunnstoffer og kretsløp. Økosystemer og arealbruk. Globale utfordringer.','Willy'),
    (3,'tirsdag','Naturfag','Kapittel 3: Livet på jorda','','Grunnstoffer og kretsløp. Økosystemer og arealbruk. Globale utfordringer.','Willy'),
    (4,'tirsdag','Naturfag','Kapittel 3: Livet på jorda','','Grunnstoffer og kretsløp. Økosystemer og arealbruk. Globale utfordringer.','Willy'),
    (5,'tirsdag','Naturfag','Kapittel 3: Livet på jorda','','Grunnstoffer og kretsløp. Økosystemer og arealbruk. Globale utfordringer.','Willy'),
    (6,'tirsdag','Naturfag','Kapittel 3: Livet på jorda','','Grunnstoffer og kretsløp. Økosystemer og arealbruk. Globale utfordringer.','Willy'),
    (7,'tirsdag','Naturfag','Kapittel 3: Livet på jorda','','Grunnstoffer og kretsløp. Økosystemer og arealbruk. Globale utfordringer.','Willy'),
    (8,'tirsdag','Naturfag','Kapittel 3: Livet på jorda','','Grunnstoffer og kretsløp. Økosystemer og arealbruk. Globale utfordringer.','Willy'),
    (10,'tirsdag','Naturfag','Prosjektraprosjekt Helse og livsmestringpport og vurdering','','Registrere data til prosjekt Helse og livsmestring. Begynne på sluttrapport Helse og livsmestring. Underveisvurderinger.','Willy'),
    (11,'tirsdag','Naturfag','Prosjektraprosjekt Helse og livsmestringpport og vurdering','','Registrere data til prosjekt Helse og livsmestring. Begynne på sluttrapport Helse og livsmestring. Underveisvurderinger.','Willy'),
    (12,'tirsdag','Naturfag','Prosjektraprosjekt Helse og livsmestringpport og vurdering','','Registrere data til prosjekt Helse og livsmestring. Begynne på sluttrapport Helse og livsmestring. Underveisvurderinger.','Willy'),
    (13,'tirsdag','Naturfag','Kapittel 2: Bærekraftig teknologi','','Bærekraftig utvikling, klimaendringer, artsmangfold, teknologi og landbruket.','Willy'),
    (15,'tirsdag','Naturfag','Kapittel 2: Bærekraftig teknologi','','Bærekraftig utvikling, klimaendringer, artsmangfold, teknologi og landbruket.','Willy'),
    (16,'tirsdag','Naturfag','Kapittel 2: Bærekraftig teknologi','','Bærekraftig utvikling, klimaendringer, artsmangfold, teknologi og landbruket.','Willy'),
    (17,'tirsdag','Naturfag','Kapittel 2: Bærekraftig teknologi','','Bærekraftig utvikling, klimaendringer, artsmangfold, teknologi og landbruket.','Willy'),
    (18,'tirsdag','Naturfag','Kapittel 2: Bærekraftig teknologi','','Bærekraftig utvikling, klimaendringer, artsmangfold, teknologi og landbruket.','Willy'),
    (19,'tirsdag','Naturfag','Kapittel 2: Bærekraftig teknologi','','Bærekraftig utvikling, klimaendringer, artsmangfold, teknologi og landbruket.','Willy'),
    (20,'tirsdag','Naturfag','Kapittel 2: Bærekraftig teknologi','','Bærekraftig utvikling, klimaendringer, artsmangfold, teknologi og landbruket.','Willy'),
    (21,'tirsdag','Naturfag','Eksamensforberedelser','','Oppsummering/repetisjon/bearbeiding/vurderinger. Øving til eventuell muntlig eksamen.','Willy'),
    (22,'tirsdag','Naturfag','Eksamensforberedelser','','Bærekraftig utvikling, klimaendringer, artsmangfold, teknologi og landbruket.','Willy'),
    (24,'tirsdag','Naturfag','Siste time','','SjekkTeams','Willy');

  -- ── 1) Soft-slett eksisterende økter for fagene i arket ────────
  for f in select distinct fag from fag_rader loop
    update sessions se set deleted_at = now()
    from subjects s
    where s.id = se.subject_id
      and se.school_id = v_school and se.class_id = v_class
      and se.school_year = v_sy and se.deleted_at is null
      and (lower(s.name) = lower(f.fag) or upper(s.short_code) = upper(f.fag));
    get diagnostics satt_inn = row_count;  -- gjenbrukes som teller her
    slettet := slettet + satt_inn;
  end loop;
  satt_inn := 0;

  -- ── 2) Sett inn de ekte øktene ─────────────────────────────────
  for r in select * from fag_rader order by uke, dag loop
    v_dagnr := case r.dag
      when 'mandag' then 1 when 'tirsdag' then 2 when 'onsdag' then 3
      when 'torsdag' then 4 when 'fredag' then 5 end;
    if v_dagnr is null then continue; end if;

    -- Slå opp faget (på navn eller kortkode), opprett om det mangler
    select id into v_subject from subjects
    where school_id = v_school and deleted_at is null
      and (lower(name) = lower(r.fag) or upper(short_code) = upper(r.fag))
    limit 1;
    if v_subject is null then
      insert into subjects (school_id, name, short_code, color_hex)
      values (v_school, r.fag, upper(left(r.fag, 3)), '#26a69a')
      returning id into v_subject;
    end if;

    v_teacher := pg_temp.finn_laerer(v_school, r.laerer);
    v_info := r.info;
    if v_teacher is null then
      v_teacher := v_fallback;
      if r.laerer <> '' then
        v_info := trim(v_info || ' [Lærer: ' || r.laerer || ']');
        if not (r.laerer = any(umatchet)) then
          umatchet := umatchet || r.laerer;
        end if;
      end if;
    end if;

    insert into sessions (
      school_id, class_id, subject_id, division_id, week_nr, day_of_week,
      teacher_id, activity, meeting_point, info, school_year, created_by, version
    ) values (
      v_school, v_class, v_subject, null, r.uke, v_dagnr,
      v_teacher, r.akt, r.sted, v_info, v_sy, v_teacher, 1
    );
    satt_inn := satt_inn + 1;
  end loop;

  raise notice 'Fellesfag-import 25/26: % økter satt inn, % gamle soft-slettet. Lærernavn uten brukerkonto (lagt i info): %',
    satt_inn, slettet, coalesce(nullif(array_to_string(umatchet, ', '), ''), 'ingen');
end $$;
