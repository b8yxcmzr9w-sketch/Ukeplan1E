-- ═══════════════════════════════════════════════════════════════
-- Testdata: komplett skoleår 25/26 for første skole / første klasse
-- Kjør i Supabase SQL Editor — slår opp ID-er dynamisk og er
-- idempotent (kan kjøres flere ganger uten duplikater).
--
-- Forutsetninger:
--   • Migrasjon 012 (kalendertyper) er kjørt — skoleruten bruker
--     typene helligdag/planleggingsdag.
--   • Minst én bruker (lærer) finnes på skolen — økter krever
--     teacher_id som peker på auth.users og kan ikke seedes her.
--
-- Innhold:
--   • Skolerute 25/26 (Rogaland-datoer: høstferie uke 41, juleferie,
--     vinterferie uke 9, påskeferie, mai-høytider, planleggingsdager)
--   • Fag: NPT (parti P1/P2), NNA, YFF (gruppe 1/2) + fellesfag
--     (norsk, matematikk, engelsk, naturfag, kroppsøving)
--   • Økter for hele skoleåret (uke 33–24), fast ukeplanmønster med
--     roterende aktiviteter — dager som treffer fridager hoppes over
--   • To flerdagshendelser og fem funfacts (kun hvis ingen finnes)
--
-- SLETT disse radene når ekte data importeres.
-- ═══════════════════════════════════════════════════════════════

-- Hjelpere i pg_temp — forsvinner automatisk når økten lukkes.

create or replace function pg_temp.seed_kal(
  p_school uuid, p_title text, p_start date, p_end date, p_type text
) returns void language plpgsql as $f$
begin
  if not exists (
    select 1 from school_calendar
    where school_id = p_school and title = p_title
      and start_date = p_start and deleted_at is null
  ) then
    insert into school_calendar (school_id, title, start_date, end_date, type)
    values (p_school, p_title, p_start, p_end, p_type::calendar_type_enum);
  end if;
end;$f$;

create or replace function pg_temp.seed_okt(
  p_school uuid, p_class uuid, p_subject uuid, p_division uuid,
  p_week int, p_day int, p_teacher uuid,
  p_activity text, p_meet text, p_info text, p_sy text
) returns int language plpgsql as $f$
begin
  if p_subject is null or p_teacher is null then return 0; end if;
  if exists (
    select 1 from sessions s
    where s.class_id = p_class and s.subject_id = p_subject
      and s.division_id is not distinct from p_division
      and s.week_nr = p_week and s.day_of_week = p_day
      and s.school_year = p_sy and s.deleted_at is null
  ) then
    return 0;
  end if;
  insert into sessions (
    school_id, class_id, subject_id, division_id, week_nr, day_of_week,
    teacher_id, activity, meeting_point, info, school_year, created_by, version
  ) values (
    p_school, p_class, p_subject, p_division, p_week, p_day,
    p_teacher, p_activity, p_meet, p_info, p_sy, p_teacher, 1
  );
  return 1;
end;$f$;

do $$
declare
  v_school   uuid;
  v_class    uuid;
  v_sy       text := '25/26';
  aar_host   int  := 2025;  -- uke 33–52
  aar_vaar   int  := 2026;  -- uke 1–24
  teachers   uuid[];
  n_t        int;
  antall     int := 0;

  -- fag og inndelinger
  s_npt uuid; s_nna uuid; s_yff uuid;
  s_nor uuid; s_mat uuid; s_eng uuid; s_nat uuid; s_kro uuid;
  npt_parti  boolean; yff_gruppe boolean;
  d_p1 uuid; d_p2 uuid; d_g1 uuid; d_g2 uuid;

  -- faste lærere per fag (rotert fra lærerlisten)
  t_npt uuid; t_nna uuid; t_yff uuid;
  t_nor uuid; t_mat uuid; t_eng uuid; t_nat uuid; t_kro uuid;

  w int; dag int; aar int; dato date; i int;

  npt_akt text[] := array[
    'Fôring og stell i fjøset','Traktorkjøring – vedlikehold og bruk',
    'Gartneri: såing og prikling i veksthuset','Sau og lam – stell og helsesjekk',
    'Skogbruk: planting og rydding','Hestestell og leiing i stallen',
    'Service på redskap i maskinhallen','Grønnsaksproduksjon: ugressing og hausting'];
  npt_sted text[] := array[
    'Fjøset','Maskinhallen','Veksthuset','Sauefjøset',
    'Skogen ved skolen','Stallen','Maskinhallen','Grønnsaksfeltet'];
  nna_akt text[] := array[
    'Gjerding og beitepleie','Friluftsliv: tur med kart og kompass',
    'Vedproduksjon','Stell av uteområder og grøntanlegg',
    'Fisk og vilt: stell av utstyr','Birøkt og insekthotell'];
  nna_sted text[] := array[
    'Uteområdet','Friluftsområdet','Vedskjulet',
    'Skolegården','Naturbruksrommet','Bigården'];
  yff_akt text[] := array[
    'YFF: praksis i stallen','YFF: praksis i fjøset',
    'YFF: maskin og teknikk','YFF: anleggsgartnerarbeid','YFF: smådyrstell'];
  yff_sted text[] := array[
    'Stallen','Fjøset','Maskinhallen','Uteanlegget','Smådyravdelingen'];
  nor_akt text[] := array[
    'Lesing og tekstarbeid','Skriveverksted: fagartikkel',
    'Muntlig fremføring','Grammatikk og rettskriving','Sammensatte tekster'];
  mat_akt text[] := array[
    'Tall og algebra','Geometri i praksis',
    'Økonomi: budsjett og regnskap','Funksjoner','Måling og enheter'];
  eng_akt text[] := array[
    'Reading and vocabulary','Writing workshop',
    'Oral presentations','Listening comprehension','Grammar focus'];
  nat_akt text[] := array[
    'Celler og mikroorganismer','Økologi: feltarbeid',
    'Kjemi: stoffer og reaksjoner','Ernæring og helse','Energi og bærekraft'];
  kro_akt text[] := array[
    'Ballspill i hallen','Styrketrening','Utholdenhet: løpeøkt',
    'Friluftsliv','Dans og bevegelse'];

begin
  -- ── Skole ──────────────────────────────────────────────────────
  select id into v_school from schools order by created_at limit 1;
  if v_school is null then
    raise notice 'Ingen skole funnet – avbryter.';
    return;
  end if;

  -- ── Lærere (kan ikke opprettes her — FK til auth.users) ────────
  select array_agg(id) into teachers
  from (select id from users
        where school_id = v_school and deleted_at is null
        order by full_name) u;
  if teachers is null then
    raise notice 'Ingen brukere funnet – opprett minst én lærer først. Avbryter.';
    return;
  end if;
  n_t := array_length(teachers, 1);
  t_npt := teachers[1 + (0 % n_t)];
  t_nna := teachers[1 + (1 % n_t)];
  t_yff := teachers[1 + (2 % n_t)];
  t_nor := teachers[1 + (3 % n_t)];
  t_mat := teachers[1 + (4 % n_t)];
  t_eng := teachers[1 + (5 % n_t)];
  t_nat := teachers[1 + (6 % n_t)];
  t_kro := teachers[1 + (7 % n_t)];

  -- ── Klasse: foretrekk «1E», ellers første; opprett om ingen ────
  select id into v_class from classes
  where school_id = v_school and deleted_at is null
  order by case when name = '1E' then 0 else 1 end, sort_order, name
  limit 1;
  if v_class is null then
    insert into classes (school_id, name, sort_order)
    values (v_school, '1E', 1) returning id into v_class;
  end if;

  -- ── Fag: slå opp på short_code, opprett om mangler ─────────────
  select id, has_parti into s_npt, npt_parti from subjects
  where school_id = v_school and upper(short_code) = 'NPT' and deleted_at is null limit 1;
  if s_npt is null then
    insert into subjects (school_id, name, short_code, color_hex, has_parti)
    values (v_school, 'Naturbasert produksjon og tjenesteyting', 'NPT', '#4caf50', true)
    returning id into s_npt;
    npt_parti := true;
  end if;

  select id into s_nna from subjects
  where school_id = v_school and upper(short_code) = 'NNA' and deleted_at is null limit 1;
  if s_nna is null then
    insert into subjects (school_id, name, short_code, color_hex)
    values (v_school, 'Naturbasert næringsaktivitet', 'NNA', '#8d6e63')
    returning id into s_nna;
  end if;

  select id, has_gruppe into s_yff, yff_gruppe from subjects
  where school_id = v_school and upper(short_code) = 'YFF' and deleted_at is null limit 1;
  if s_yff is null then
    insert into subjects (school_id, name, short_code, color_hex, has_gruppe)
    values (v_school, 'Yrkesfaglig fordypning', 'YFF', '#ff9800', true)
    returning id into s_yff;
    yff_gruppe := true;
  end if;

  select id into s_nor from subjects
  where school_id = v_school and upper(short_code) = 'NOR' and deleted_at is null limit 1;
  if s_nor is null then
    insert into subjects (school_id, name, short_code, color_hex)
    values (v_school, 'Norsk', 'NOR', '#42a5f5') returning id into s_nor;
  end if;

  select id into s_mat from subjects
  where school_id = v_school and upper(short_code) = 'MAT' and deleted_at is null limit 1;
  if s_mat is null then
    insert into subjects (school_id, name, short_code, color_hex)
    values (v_school, 'Matematikk', 'MAT', '#ab47bc') returning id into s_mat;
  end if;

  select id into s_eng from subjects
  where school_id = v_school and upper(short_code) = 'ENG' and deleted_at is null limit 1;
  if s_eng is null then
    insert into subjects (school_id, name, short_code, color_hex)
    values (v_school, 'Engelsk', 'ENG', '#ef5350') returning id into s_eng;
  end if;

  select id into s_nat from subjects
  where school_id = v_school and upper(short_code) = 'NAT' and deleted_at is null limit 1;
  if s_nat is null then
    insert into subjects (school_id, name, short_code, color_hex)
    values (v_school, 'Naturfag', 'NAT', '#26a69a') returning id into s_nat;
  end if;

  select id into s_kro from subjects
  where school_id = v_school and upper(short_code) = 'KRO' and deleted_at is null limit 1;
  if s_kro is null then
    insert into subjects (school_id, name, short_code, color_hex)
    values (v_school, 'Kroppsøving', 'KRO', '#ffca28') returning id into s_kro;
  end if;

  -- ── Inndelinger: NPT-partier og YFF-grupper ────────────────────
  if npt_parti then
    select id into d_p1 from subject_divisions
    where subject_id = s_npt and division_type = 'parti' and deleted_at is null
    order by sort_order limit 1;
    if d_p1 is null then
      insert into subject_divisions (subject_id, division_type, name, sort_order)
      values (s_npt, 'parti', 'P1', 1) returning id into d_p1;
      insert into subject_divisions (subject_id, division_type, name, sort_order)
      values (s_npt, 'parti', 'P2', 2) returning id into d_p2;
    else
      select id into d_p2 from subject_divisions
      where subject_id = s_npt and division_type = 'parti' and deleted_at is null
      order by sort_order offset 1 limit 1;
      if d_p2 is null then d_p2 := d_p1; end if;
    end if;
  end if;

  if yff_gruppe then
    select id into d_g1 from subject_divisions
    where subject_id = s_yff and division_type = 'gruppe' and deleted_at is null
    order by sort_order limit 1;
    if d_g1 is null then
      insert into subject_divisions (subject_id, division_type, name, sort_order)
      values (s_yff, 'gruppe', 'Gruppe 1', 1) returning id into d_g1;
      insert into subject_divisions (subject_id, division_type, name, sort_order)
      values (s_yff, 'gruppe', 'Gruppe 2', 2) returning id into d_g2;
    else
      select id into d_g2 from subject_divisions
      where subject_id = s_yff and division_type = 'gruppe' and deleted_at is null
      order by sort_order offset 1 limit 1;
      if d_g2 is null then d_g2 := d_g1; end if;
    end if;
  end if;

  -- ── Skolerute 25/26 (17. mai 2026 er en søndag — ingen rad) ────
  perform pg_temp.seed_kal(v_school, 'Planleggingsdager (skolestart)', '2025-08-11', '2025-08-13', 'planleggingsdag');
  perform pg_temp.seed_kal(v_school, 'Høstferie',                      '2025-10-06', '2025-10-10', 'ferie');
  perform pg_temp.seed_kal(v_school, 'Juleferie',                      '2025-12-22', '2026-01-02', 'helligdag');
  perform pg_temp.seed_kal(v_school, 'Vinterferie',                    '2026-02-23', '2026-02-27', 'ferie');
  perform pg_temp.seed_kal(v_school, 'Påskeferie',                     '2026-03-30', '2026-04-06', 'helligdag');
  perform pg_temp.seed_kal(v_school, 'Offentlig høytidsdag (1. mai)',  '2026-05-01', '2026-05-01', 'helligdag');
  perform pg_temp.seed_kal(v_school, 'Kristi himmelfartsdag',          '2026-05-14', '2026-05-14', 'helligdag');
  perform pg_temp.seed_kal(v_school, 'Planleggingsdag',                '2026-05-15', '2026-05-15', 'planleggingsdag');
  perform pg_temp.seed_kal(v_school, '2. pinsedag',                    '2026-05-25', '2026-05-25', 'helligdag');

  -- ── Flerdagshendelser ──────────────────────────────────────────
  if not exists (select 1 from multi_day_events
                 where school_id = v_school and title = 'YFF utplasseringsuke'
                   and deleted_at is null) then
    insert into multi_day_events (school_id, class_id, title, description,
                                  start_date, end_date, school_year, created_by)
    values (v_school, v_class, 'YFF utplasseringsuke',
            'Utplassering i bedrift hele uka. Oppmøte direkte hos praksisvert.',
            '2025-11-17', '2025-11-21', v_sy, teachers[1]);
  end if;
  if not exists (select 1 from multi_day_events
                 where school_id = v_school and title = 'Heldagsprøver'
                   and deleted_at is null) then
    insert into multi_day_events (school_id, class_id, title, description,
                                  start_date, end_date, school_year, created_by)
    values (v_school, null, 'Heldagsprøver',
            'Heldagsprøver i fellesfag. Egen romplan henges opp.',
            '2026-06-08', '2026-06-10', v_sy, teachers[1]);
  end if;

  -- ── Funfacts (kun hvis skolen ikke har noen) ───────────────────
  if not exists (select 1 from school_facts
                 where school_id = v_school and deleted_at is null) then
    insert into school_facts (school_id, fact_text) values
      (v_school, 'Kuer har bestevenner og blir stresset når de skilles fra dem.'),
      (v_school, 'En moderne traktor kan veie over 7 tonn — like mye som en voksen elefant.'),
      (v_school, 'Hester kan sove både stående og liggende, men trenger å ligge for å drømme.'),
      (v_school, 'Honningbier forteller hverandre hvor blomstene er ved å danse.'),
      (v_school, 'Sauer kan kjenne igjen opptil 50 andre sauefjes — og huske dem i årevis.');
  end if;

  -- ── Økter: uke 33–52 (2025) og 1–24 (2026) ─────────────────────
  for w in
    select wk from (
      select generate_series(33, 52) as wk
      union all
      select generate_series(1, 24)
    ) q
  loop
    aar := case when w >= 33 then aar_host else aar_vaar end;
    for dag in 1..5 loop
      dato := to_date(aar::text || '-' || lpad(w::text, 2, '0') || '-' || dag, 'IYYY-IW-ID');

      -- hopp over fridager (samme typer som finnFridag i app.js)
      if exists (select 1 from school_calendar c
                 where c.school_id = v_school
                   and dato between c.start_date and c.end_date
                   and c.type in ('ferie', 'helligdag', 'planleggingsdag')
                   and c.deleted_at is null) then
        continue;
      end if;

      if dag = 1 then  -- mandag: NPT parti-delt + norsk
        i := 1 + (w % array_length(npt_akt, 1));
        antall := antall + pg_temp.seed_okt(v_school, v_class, s_npt, d_p1, w, dag, t_npt,
          npt_akt[i], npt_sted[i],
          case when npt_sted[i] in ('Fjøset','Sauefjøset','Stallen') then 'Husk kjeledress og vernesko' else '' end, v_sy);
        i := 1 + ((w + 3) % array_length(npt_akt, 1));
        antall := antall + pg_temp.seed_okt(v_school, v_class, s_npt, d_p2, w, dag, t_npt,
          npt_akt[i], npt_sted[i],
          case when npt_sted[i] in ('Fjøset','Sauefjøset','Stallen') then 'Husk kjeledress og vernesko' else '' end, v_sy);
        i := 1 + (w % array_length(nor_akt, 1));
        antall := antall + pg_temp.seed_okt(v_school, v_class, s_nor, null, w, dag, t_nor,
          nor_akt[i], 'Klasserom 1E', '', v_sy);

      elsif dag = 2 then  -- tirsdag: matematikk + NNA
        i := 1 + (w % array_length(mat_akt, 1));
        antall := antall + pg_temp.seed_okt(v_school, v_class, s_mat, null, w, dag, t_mat,
          mat_akt[i], 'Klasserom 1E', '', v_sy);
        i := 1 + (w % array_length(nna_akt, 1));
        antall := antall + pg_temp.seed_okt(v_school, v_class, s_nna, null, w, dag, t_nna,
          nna_akt[i], nna_sted[i],
          case when i = 2 then 'Ta med matpakke — vi er ute hele økta' else '' end, v_sy);

      elsif dag = 3 then  -- onsdag: YFF gruppe-delt + engelsk
        i := 1 + (w % array_length(yff_akt, 1));
        antall := antall + pg_temp.seed_okt(v_school, v_class, s_yff, d_g1, w, dag, t_yff,
          yff_akt[i], yff_sted[i], 'Husk arbeidsklær', v_sy);
        i := 1 + ((w + 2) % array_length(yff_akt, 1));
        antall := antall + pg_temp.seed_okt(v_school, v_class, s_yff, d_g2, w, dag, t_yff,
          yff_akt[i], yff_sted[i], 'Husk arbeidsklær', v_sy);
        i := 1 + (w % array_length(eng_akt, 1));
        antall := antall + pg_temp.seed_okt(v_school, v_class, s_eng, null, w, dag, t_eng,
          eng_akt[i], 'Klasserom 1E', '', v_sy);

      elsif dag = 4 then  -- torsdag: NPT parti-delt + naturfag
        i := 1 + ((w + 5) % array_length(npt_akt, 1));
        antall := antall + pg_temp.seed_okt(v_school, v_class, s_npt, d_p1, w, dag, t_npt,
          npt_akt[i], npt_sted[i], '', v_sy);
        i := 1 + ((w + 1) % array_length(npt_akt, 1));
        antall := antall + pg_temp.seed_okt(v_school, v_class, s_npt, d_p2, w, dag, t_npt,
          npt_akt[i], npt_sted[i], '', v_sy);
        i := 1 + (w % array_length(nat_akt, 1));
        antall := antall + pg_temp.seed_okt(v_school, v_class, s_nat, null, w, dag, t_nat,
          nat_akt[i], 'Naturfagrommet', '', v_sy);

      else  -- fredag: kroppsøving + norsk
        i := 1 + (w % array_length(kro_akt, 1));
        antall := antall + pg_temp.seed_okt(v_school, v_class, s_kro, null, w, dag, t_kro,
          kro_akt[i], case when i = 4 then 'Uteområdet' else 'Gymsalen' end,
          'Husk gymtøy', v_sy);
        i := 1 + ((w + 2) % array_length(nor_akt, 1));
        antall := antall + pg_temp.seed_okt(v_school, v_class, s_nor, null, w, dag, t_nor,
          nor_akt[i], 'Klasserom 1E', '', v_sy);
      end if;
    end loop;
  end loop;

  raise notice 'Testdata 25/26: % nye økter. skole=%, klasse=%, % lærer(e) i rotasjon.',
    antall, v_school, v_class, n_t;
end $$;
