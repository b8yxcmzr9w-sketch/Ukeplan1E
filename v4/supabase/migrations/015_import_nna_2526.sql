-- ═══════════════════════════════════════════════════════════════
-- Import: ekte NNA-plan 25/26 fra dagens løsning (Plan_NNA-arket)
-- Kjør i Supabase SQL Editor.
--
-- Samme mønster som 014 (NPT): soft-sletter alle eksisterende
-- NNA-økter for klassen i 25/26 (de syntetiske fra migrasjon 013) og
-- setter inn de 40 ekte radene (torsdager, uke 33–25, lærer Oddvar).
-- NNA har ingen parti/gruppe-inndeling.
--
-- Lærermapping som i 014: «Oddvar» matches mot users.full_name på
-- fornavn; finnes ikke brukeren, brukes første bruker på skolen og
-- navnet legges i info som «[Lærer: Oddvar]». Kjør skriptet på nytt
-- etter at brukeren er opprettet, så mappes navnet riktig.
--
-- NB: raden i uke 25 (sommeravslutning) ligger utenfor visningen
-- (skoleåret vises uke 33–24), men importeres for fullstendighet.
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
  s_nna      uuid;
  v_fallback uuid;
  v_teacher  uuid;
  v_dagnr    int;
  v_info     text;
  r          record;
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

  -- ── Faget NNA (opprettes om det mangler) ───────────────────────
  select id into s_nna from subjects
  where school_id = v_school and upper(short_code) = 'NNA' and deleted_at is null limit 1;
  if s_nna is null then
    insert into subjects (school_id, name, short_code, color_hex)
    values (v_school, 'Naturbasert næringsaktivitet', 'NNA', '#8d6e63')
    returning id into s_nna;
  end if;

  -- ── Rådata fra Plan_NNA (uke, dag, aktivitet, oppmøte, info, lærer)
  create temp table if not exists nna_rader (
    uke int, dag text, akt text, sted text, info text, laerer text
  ) on commit drop;
  delete from nna_rader;

  insert into nna_rader values
    (33,'torsdag','-','-','','Oddvar'),
    (34,'torsdag','Bli kjent','','','Oddvar'),
    (35,'torsdag','Kameratredning kano','','Kano og aktivitet på vannet, kap. 10','Oddvar'),
    (36,'torsdag','Kanotur','Verneområder','Klær til naturbruk, kap. 2','Oddvar'),
    (37,'torsdag','Forberedelser til overnattingstur og innføring i grunnleggende teori','','Inn i naturen, Klær til naturbruk, Å pakke sekken, Overnatte ute (kap. 1,2,3,6)','Oddvar'),
    (38,'torsdag','Overnattingstur','Mån','Leirplassen, Overnatte ute (kap. 5 og 6)','Oddvar'),
    (39,'torsdag','Førstehjelp, sanking','','Forberedelse/repetisjon til VFL (kap. 1, 2, 3, 6, 10, 11)','Oddvar'),
    (40,'torsdag','Førstehjelp, Film','','Kap. 11, Film «Arthur the King» (inspirasjon til neste tema)','Oddvar'),
    (42,'torsdag','VFL prøve, Orientering','','VFL kap. 1,2,3,10,11. Kart og orientering, kap. 4','Oddvar'),
    (43,'torsdag','Orientering','','Bål og Leirplass kap. 5 og 7','Oddvar'),
    (44,'torsdag','Orientering','','Mat på bål, kap. 8','Oddvar'),
    (45,'torsdag','Praktisk VFL Orientering','','','Oddvar'),
    (46,'torsdag','Praktisk Mat på bål','','Kap. 5, 7 og 8','Oddvar'),
    (47,'torsdag','Praktisk VFL Bål, Førstehjelp i praksis','','Førstehjelp, kap. 11. Pasient på båre.','Oddvar'),
    (48,'torsdag','Film og debatt','','Tema: Ulv','Oddvar'),
    (49,'torsdag','Tur og sanking','','','Oddvar'),
    (50,'torsdag','Vinter-verksted','','','Oddvar'),
    (51,'torsdag','Termin-avslutning, Film','','','Oddvar'),
    (1,'torsdag','','','','Oddvar'),
    (2,'torsdag','Bål/leirplass teori og praksis','','Kap. 5 og 7','Oddvar'),
    (3,'torsdag','Mat på bål praksis','','Kap. 8','Oddvar'),
    (4,'torsdag','Ute om vinteren teori og praksis','','Kap. 8 og 9','Oddvar'),
    (5,'torsdag','VFL teori/praksis','','Kap. 4,5,7,8,9','Oddvar'),
    (6,'torsdag','Planlegge aktiviteter','','Tema: Skidag/ute om vinteren','Oddvar'),
    (7,'torsdag','Gjennomføre planlagte aktiviteter','Ute','','Oddvar'),
    (8,'torsdag','Skidag','','','Oddvar'),
    (10,'torsdag','Gjennomføring av planlagt tur. Vurdering.','','NB! Forbehold om flytting pga mangel på bil','Oddvar'),
    (11,'torsdag','Avspasering for uke 10 FRI','','','Oddvar'),
    (12,'torsdag','Gjennomføring av tur. Vurdering','','','Oddvar'),
    (13,'torsdag','Besøk av Paul Arild og info om det å tjene penger som turveileder','Teori om jakt, fiske og forvaltning av naturen','Kap 13, 14 og 15','Oddvar'),
    (15,'torsdag','Fisketur','Hav','','Oddvar'),
    (16,'torsdag','Fisketur','Ferskvann','','Oddvar'),
    (17,'torsdag','Skyting','Skytebanen','Med rektor','Oddvar'),
    (18,'torsdag','Avspasering for uke 12','','','Oddvar'),
    (19,'torsdag','Overnattingstur','Preikestolen','','Oddvar'),
    (21,'torsdag','Evaluering og refleksjon etter overnattingstur Preikestolen','','','Oddvar'),
    (22,'torsdag','Forberedelser til Årsvurdering','','','Oddvar'),
    (23,'torsdag','Årsvurdering','','','Oddvar'),
    (24,'torsdag','Kano','Klasserommet','Vi padler kano og griller sammen med R-klassen','Oddvar'),
    (25,'torsdag','Sommeravslutning','Strandtur','','Oddvar');

  -- ── 1) Soft-slett eksisterende NNA-økter for klassen i 25/26 ───
  update sessions set deleted_at = now()
  where school_id = v_school and class_id = v_class
    and subject_id = s_nna and school_year = v_sy
    and deleted_at is null;
  get diagnostics slettet = row_count;

  -- ── 2) Sett inn de ekte øktene ─────────────────────────────────
  for r in select * from nna_rader order by uke, dag loop
    v_dagnr := case r.dag
      when 'mandag' then 1 when 'tirsdag' then 2 when 'onsdag' then 3
      when 'torsdag' then 4 when 'fredag' then 5 end;
    if v_dagnr is null then continue; end if;

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
      v_school, v_class, s_nna, null, r.uke, v_dagnr,
      v_teacher, r.akt, r.sted, v_info, v_sy, v_teacher, 1
    );
    satt_inn := satt_inn + 1;
  end loop;

  raise notice 'NNA-import 25/26: % økter satt inn, % gamle soft-slettet. Lærernavn uten brukerkonto (lagt i info): %',
    satt_inn, slettet, coalesce(nullif(array_to_string(umatchet, ', '), ''), 'ingen');
end $$;
