-- ═══════════════════════════════════════════════════════════════
-- Import: ekte NPT-plan 25/26 fra dagens løsning (Plan_NPT-arket)
-- Kjør i Supabase SQL Editor.
--
-- Hva skriptet gjør:
--   1. Soft-sletter ALLE eksisterende NPT-økter for klassen i 25/26
--      (dvs. de syntetiske øktene fra migrasjon 013) — de ekte
--      dataene erstatter dem.
--   2. Setter inn 111 ekte økter (uke 35–24, mandag/onsdag/torsdag,
--      parti p1/p2) fra produksjonsarket.
--
-- Lærermapping: navnene i arket (Mari, Cathrine, Olav, Torill, Geir)
-- matches mot users.full_name på fornavn. Finnes ikke brukeren, brukes
-- første bruker på skolen som eier, og det opprinnelige navnet legges
-- i info-feltet som «[Lærer: X]». Kjør skriptet på nytt etter at
-- brukerne er opprettet, så mappes navnene riktig (gammel import
-- soft-slettes og erstattes).
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
  s_npt      uuid;
  npt_parti  boolean;
  d_p1 uuid; d_p2 uuid;
  v_fallback uuid;
  v_teacher  uuid;
  v_div      uuid;
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

  -- ── Faget NPT med partier P1/P2 (opprettes om de mangler) ──────
  select id, has_parti into s_npt, npt_parti from subjects
  where school_id = v_school and upper(short_code) = 'NPT' and deleted_at is null limit 1;
  if s_npt is null then
    insert into subjects (school_id, name, short_code, color_hex, has_parti)
    values (v_school, 'Naturbasert produksjon og tjenesteyting', 'NPT', '#4caf50', true)
    returning id into s_npt;
    npt_parti := true;
  end if;
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

  -- ── Rådata fra Plan_NPT (uke, dag, parti, aktivitet, oppmøte, info, lærer)
  create temp table if not exists npt_rader (
    uke int, dag text, parti text, akt text, sted text, info text, laerer text
  ) on commit drop;
  delete from npt_rader;

  insert into npt_rader values
    (35,'mandag','p1','Sammen med P2','Klasserom','','Mari'),
    (35,'mandag','p2','Sammen med P1','Klasserom','','Cathrine'),
    (36,'mandag','p1','Reise til HCpet og stelle fisk','Resepsjonen kl. 0800','','Cathrine'),
    (37,'mandag','p1','HMS-dag','Auditoriet kl. 08.00','','Alle'),
    (37,'mandag','p2','HMS-dag','Auditoriet kl. 08.00','','Alle'),
    (38,'onsdag','p2','Potetopptak / traktoropplæring','Traktorgarasje','','Olav'),
    (38,'mandag','p1','Reise til HCpet og stelle fisk/smådyr','Resepsjonen kl. 0800','','Cathrine'),
    (39,'mandag','p1','Avspasering frem til lunsj','','Vi går i kufjøset kl 13.30 på tirsdag og slutter senere enn vanlig. Møt ved resepsjonen kl. 13.30 på tirsdag!','Mari'),
    (39,'mandag','p2','Grave ned t-skjorter osv','Traktorgarasje klokken 08.00','I klær tilpasset været','Torill'),
    (40,'onsdag','p1','Flytte kviger ol l','Fjøset 08.00','','Torill'),
    (40,'onsdag','p2','Flytte kviger ol l','Fjøset 08.00','','Mari'),
    (40,'mandag','p1','Reise ut og handle til hus 37','Klasserom kl. 0800','','Cathrine'),
    (40,'mandag','p2','Gå i grishuset og ta opp poteter','Grisehuset kl. 08.00','Ta på arbeidsklær (Elin sa det kunne vere lurt med tynne hansker også)','Mari'),
    (42,'mandag','p1','Gå i grishuset, hjelpe Elin i veksthuset eller se på ny robot i fjøset','Resepsjonen kl. 08.00','','Mari'),
    (42,'mandag','p2','Reise til HCpet og stelle fisk/smådyr','Resepsjonen kl. 0800','','Cathrine'),
    (43,'onsdag','p1','Besøk til avløysarlaget Nord Jæren','Klasserom 08.00','Hele klassen. Trenger ikke arbeidstøy','Torill'),
    (43,'onsdag','p2','Besøk til avløysarlaget Nord Jæren','Klasserom 08.00','Hele klassen. Trenger ikke arbeidstøy','Mari'),
    (43,'mandag','p1','Reise til Ålgård rideklubb','Resepsjonen kl 0800','','Cathrine'),
    (43,'mandag','p2','Reise til Ålgård rideklubb','Resepsjonen kl. 0800','','Mari'),
    (44,'onsdag','p1','Grave ned t-skjorter osv','Traktorgarasjen klokken 8','Møt i klær tilpasset været. Hvis det regner betyr det klær som tåler regn','Torill'),
    (44,'onsdag','p2','Potetopptak / traktoropplæring','Traktorgarasje','','Olav'),
    (44,'mandag','p1','','','','Geir'),
    (44,'mandag','p2','Reise til HCpet og stelle dyr','Resepsjonen kl. 0800','','Cathrine'),
    (45,'onsdag','p1','Traktoropplæring / potetopptak','Traktorgarasje','','Olav'),
    (45,'onsdag','p2','Grønnsaker eller veksthus','Traktorgarasjen klokken 8','','Torill'),
    (45,'mandag','p1','Reise til Ålgård rideklubb','Resepsjonen kl. 0800','','Cathrine'),
    (45,'mandag','p2','Reise til Ålgård rideklubb','Resepsjonen kl. 0800','','Mari'),
    (46,'onsdag','p2','Traktoropplæring / potetopptak?','Traktorgarasje','','Olav'),
    (46,'mandag','p1','Holdvurdering av kyr, se på jur og beinstilling. Pakke poteter','Fjøsinngangen kl. 08.00','','Mari'),
    (46,'mandag','p2','Bygge rottebur','Sløydsal kl. 0800','','Cathrine'),
    (47,'onsdag','p1','Traktor / potet','Traktorgarasje','','Olav'),
    (47,'onsdag','p2','Grønnsaker og veksthus','Veksthus klokken 08.00','I klær som er reine. Vi skal starte inne. Deretter går vi ut. Vi skifter til arbeidstøy og vernesko før vi går ut','Torill'),
    (47,'mandag','p1','Reise til Ålgård rideklubb. VURDERING','Resepsjonen kl 0800','','Cathrine'),
    (47,'mandag','p2','Reise til Ålgård rideklubb. VURDERING','Resepsjonen kl 0800','','Mari'),
    (48,'onsdag','p1','Gå i grishuset og plukke tomater','Inngangen til grishuset kl. 08.00','','Mari'),
    (48,'mandag','p1','Gjøre daglig stell og klippe kyr i fjøset. Plukke tomater i veksthuset','Fjøsinngangen på mandag kl. 08.00','Ta på klær dere ikke er redde for. I veksthuset er det lurt å ha t-skjorte (ikke lov med fjøsklær!) for det kan bli varmt','Mari'),
    (48,'mandag','p2','Tomater og veksthus','Veksthus klokken 08.00','','Torill'),
    (49,'onsdag','p2','Gjøre daglig stell og klippe kyr i fjøset. Plukke tomater i veksthuset','Fjøsinngangen kl. 08.00','Ta på klær dere ikke er redde for. I veksthuset er det lurt å ha t-skjorte (ikke lov med fjøsklær!) for det kan bli varmt','Mari'),
    (49,'mandag','p1','Reise til Lucas dyrevern','Resepsjonen kl. 0800','','Cathrine'),
    (49,'mandag','p2','Gjøre daglig stell i grishuset, klargjøre varmelamper og binger til grising. Klippe og måle kviger i fjøset','Grisehusinngangen kl. 08.00','','Mari'),
    (50,'onsdag','p1','Gjøre daglig stell i grishuset, klargjøre varmelamper og binger til grising. Klippe og måle kviger i fjøset','Grisehusinngangen kl. 08.00','','Mari'),
    (50,'onsdag','p2','Verkstedsarbeid','verkstedet','','Olav'),
    (50,'mandag','p1','Gå i veksthuset','Resepsjonen kl. 08.00','Dere kan gå med vanlige klær som dere IKKE er redde for','Mari'),
    (50,'mandag','p2','Reise til Lucas dyrevern','Resepsjonen kl. 0800','','Cathrine'),
    (51,'onsdag','p1','Veksthus Tomater og diverse','Veksthus 08.00','','Torill'),
    (51,'onsdag','p2','Verkstedsarbeid','Verkstedet','','Olav'),
    (51,'mandag','p1','Reise til Lucas dyrevern','Resepsjonen kl. 0800','','Cathrine'),
    (51,'mandag','p2','Gjøre daglig stell i grishuset, fjøset og sauehuset','Inngangen til grishuset kl. 08.00','Vi har ikke fått noen ekstra oppgaver. Når vi er ferdig med det kan vi ta lunsj','Mari'),
    (52,'mandag','p1','Gå i fjøset og sauehuset','Fjosinngangen kl. 08.00','','Mari'),
    (52,'mandag','p2','Reise til Lucas dyrevern','Resepsjonen kl. 0800','','Cathrine'),
    (1,'onsdag','p1','Verktøykunnskap, bruk av vinkelsliper','Teknikk, verksted/smia','','Olav'),
    (1,'onsdag','p2','Veksthuset','Veksthus 08.00','','Torill'),
    (2,'mandag','p2','Lage griseleker og gi dem til grisene i grisehuset, observere reaksjoner','Teknikk/ verkstad','Ta på arbeidsklær','Mari'),
    (4,'onsdag','p1','Veksthus','Veksthus 08.00','Ta med PC','Torill'),
    (4,'onsdag','p2','Verktøykunnskap/sveising','Smia','','Olav'),
    (4,'mandag','p1','Lage griseleker og gi dem til grisene i grisehuset, observere reaksjoner. Måle vannmengde i drikkeniplene','Teknikken/ verkstaden kl. 08.00','Ta på arbeidsklær','Mari'),
    (4,'mandag','p2','Reise til Lucas Dyrevern og stelle katt','','','Cathrine'),
    (5,'onsdag','p1','Butikk og tomater','Veksthuset 08.00','Ta med PC','Torill'),
    (5,'onsdag','p2','Møte Olav på den vanlige plassen','Smia','','Olav'),
    (5,'mandag','p1','Reise til Lucas Dyrevern og stelle katt','','','Cathrine'),
    (5,'mandag','p2','Pakke poteter, deretter plukke tomater i veksthuset, eventuelt plante','Kjøla','','Mari'),
    (7,'mandag','p1','Gjøre daglig stell hos kuer, kalver og sauer i fjøset og sauehuset. Se på utforming av binger i grishuset','Inngangen til fjoset kl. 08.00','','Mari'),
    (7,'mandag','p2','Rottebur','Resepsjon kl. 0800','','Cathrine'),
    (8,'onsdag','p1','Gårdsbutikk, kjøle, veksthus','Veksthus 08.00','Ta med PC','Torill'),
    (8,'onsdag','p2','Verktøykunnskap/sveising','Smia','','Olav'),
    (8,'mandag','p1','Rottebur','Resepsjon kl. 0800','','Cathrine'),
    (8,'mandag','p2','Gjøre daglig stell hos kuer, kalver og sauer i fjøset og sauehuset. Se på utforming av binger i grishuset','Inngangen til fjoset kl. 08.00','','Mari'),
    (10,'mandag','p2','Veksthus, tomat, butikk, blomster (film?)','Veksthus 08.00','','Torill'),
    (10,'onsdag','p1','Verktøykunnskap/sveising','Smia','','Olav'),
    (10,'onsdag','p2','Gå i veksthuset og så/plante','Veksthuset kl. 08.00','','Mari'),
    (11,'mandag','p1','Hund økt 1','Fjøsloft kl. 0800','','Cathrine'),
    (11,'mandag','p2','Gjøre daglig stell i grishuset','Grishus inngangen kl. 08.00','','Mari'),
    (11,'onsdag','p1','Veksthus, blomster, tomater og alt slags','Veksthus 08.00','','Torill'),
    (11,'onsdag','p2','Verktøykunnskap/sveising','Smia','','Olav'),
    (12,'mandag','p1','Gjøre daglig stell i fjøset og sauehuset. Klippe jur og haler. Tilrettelegge for sauer i kjelleren','Fjos inngangen kl. 08.00','','Mari'),
    (12,'mandag','p2','Jordprøver','Kantinen kl. 08.00','Vi skal være ute hele økten så ha på klær som passer til dagens vær. Det blir ikke mulighet å gå inn under økten. Hansker er lurt','Torill'),
    (12,'onsdag','p1','Verktøykunnskap/sveising/våronn klargjøring','Smia','','Olav'),
    (12,'onsdag','p2','Gjøre daglig stell i grishuset','Grishus inngangen kl. 08.00','','Mari'),
    (13,'mandag','p1','Hund, økt 2','Fjøsloft kl. 0800','','Cathrine'),
    (13,'mandag','p2','Stelle hobbyhøner og hest, eventuelt ri på min gård','Resepsjonen kl. 08.00','Ta på klær dere ikke er redde for','Mari'),
    (13,'onsdag','p1','Jordprøver','Kantinen kl. 08.00','Vi skal være ute hele økten så ha på klær som passer til dagens vær. Det blir ikke mulighet å gå inn under økten. Hansker er lurt','Torill'),
    (13,'onsdag','p2','Verktøykunnskap/sveising/våronn klargjøring','Smia','','Olav'),
    (15,'onsdag','p2','Gjøre planterelatert arbeid i veksthuset','Veksthuset kl. 08.00','','Mari'),
    (16,'mandag','p1','Hund økt 3','Fjøsloft kl. 0800','','Cathrine'),
    (16,'mandag','p2','Gjøre daglig stell i fjøset og sauehuset','Fjosinngangen kl. 08.00','','Mari'),
    (16,'onsdag','p1','Stelle hobbyhøner og hest, litt ridning og vedarbeid hjemme hos Mari','Resepsjonen kl. 08.00','','Mari'),
    (17,'mandag','p1','Gjøre daglig stell i fjøset og sauehuset','Fjos inngangen kl. 08.00','','Mari'),
    (17,'onsdag','p2','Vedlikehold av beite på Mari sin gård','Resepsjonen','','Mari'),
    (18,'mandag','p1','Hund økt 4','Fjøsloft kl. 0800','','Cathrine'),
    (18,'mandag','p2','Gjøre daglig stell i grishuset','Grishus inngangen kl. 08.00','','Mari'),
    (18,'onsdag','p1','Holdvurdering av sau. Se på ugress på beite eller gå i grishuset','Fjosinngangen kl. 08.00','Ta med blyant. Kommer an på hva Emma trenger mest hjelp med','Mari'),
    (19,'mandag','p1','Gjøre daglig stell i fjøset og sauehuset','Fjos inngangen kl. 08.00','','Mari'),
    (19,'mandag','p2','Hund, økt 1','Fjøsloft kl. 0800','','Cathrine'),
    (19,'onsdag','p1','Frokost, utstyr og volleyball','Kantine kl. 0800','Sammen med P2','Mari'),
    (19,'onsdag','p2','Frokost, utstyr og volleyball','Kantine kl. 0800','Sammen med P1','Cathrine'),
    (20,'mandag','p1','Vurdering: Ta opp nedgravde ting og skrive rapport','Hovedinngangen 08.00','Ta med PC!!! Rapporten vil bli vurdert','Torill'),
    (20,'mandag','p2','Fjoset','Fjosinngangen kl. 08.00','Gjøre ekstra oppgaver i fjøset og sauehuset, som vedlikehold på beite','Mari'),
    (20,'onsdag','p1','Veksthuset','Veksthuset kl. 08.00','Plukke tomater og gjøre planterelatert arbeid i veksthuset','Mari'),
    (20,'onsdag','p2','Gamle truser','Hovedinngangen 08.00','Vurdering: Ta opp nedgravde ting og skrive rapport. Ta med PC!!! Rapporten vil bli vurdert','Torill'),
    (21,'mandag','p1','Vedlikehold av beite','Resepsjonen kl. 08.00','Vedlikehold av beite hjemme hos Mari','Mari'),
    (21,'mandag','p2','Hund','Fjøsloftet','','Cathrine'),
    (21,'onsdag','p1','Grønnsaker','Kantinen i arbeidsklær og vernesko','Vi starter prosjekt grønnsaker. Husk arbeidstøy som passer til været','Torill'),
    (21,'onsdag','p2','Husdyr','Fjosinngangen','Vi skal ha tilsyn på dyra på beite, fortsette litt med salting av tistler og eventuelt sjekke gjerder + annet Emma trenger hjelp med','Mari'),
    (22,'onsdag','p1','Ut å plante grønnsaker','Veksthuset kl.08.00','Vi skal være med Elin ut å plante grønnsaker. Møt opp i tide så vi kan gå samlet ut der vi skal plante','Mari'),
    (22,'onsdag','p2','Hund, økt 3','Fjøsloft','Tur, teori og trening','Cathrine'),
    (23,'mandag','p2','Daglig stell av sauer og kyr','Fjosinngangen kl. 08.00','Vi skal gjøre daglig stell i fjoset og sauehuset + eventuelt annet Emma trenger hjelp med','Mari'),
    (23,'onsdag','p1','Grønnsaker. Arbeidsklær og vernesko','Kantinen klokka 08.00','Vi fortsetter planting ute på grønnsaksfeltet. Dvs arbeidsklær som passer til været. Hansker er lurt. Vernesko/støvler med vernetå','Torill'),
    (23,'onsdag','p2','Vedlikehold av beite','Resepsjonen kl. 08.00','Vi skal hjem til meg og gjøre vedlikehold av beite','Mari'),
    (24,'mandag','p1','Daglig stell av sauer og kyr','Fjosinngangen kl. 08.00','Vi skal gjøre daglig stell i fjoset og sauehuset + eveltuelt annet Emma trenger hjelp med','Mari'),
    (24,'mandag','p2','Sjekk teams','','melding på teams','Cathrine'),
    (24,'onsdag','p1','Vedlikehold av beite','Resepsjonen kl. 08.00','Vi skal hjem til meg og gjøre vedlikehold av beite','Mari');

  -- ── 1) Soft-slett eksisterende NPT-økter for klassen i 25/26 ───
  update sessions set deleted_at = now()
  where school_id = v_school and class_id = v_class
    and subject_id = s_npt and school_year = v_sy
    and deleted_at is null;
  get diagnostics slettet = row_count;

  -- ── 2) Sett inn de ekte øktene ─────────────────────────────────
  for r in select * from npt_rader order by uke, dag, parti loop
    v_dagnr := case r.dag
      when 'mandag' then 1 when 'tirsdag' then 2 when 'onsdag' then 3
      when 'torsdag' then 4 when 'fredag' then 5 end;
    if v_dagnr is null then continue; end if;

    v_div := case r.parti when 'p1' then d_p1 when 'p2' then d_p2 else null end;

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
      v_school, v_class, s_npt, v_div, r.uke, v_dagnr,
      v_teacher, r.akt, r.sted, v_info, v_sy, v_teacher, 1
    );
    satt_inn := satt_inn + 1;
  end loop;

  raise notice 'NPT-import 25/26: % økter satt inn, % gamle soft-slettet. Lærernavn uten brukerkonto (lagt i info): %',
    satt_inn, slettet, coalesce(nullif(array_to_string(umatchet, ', '), ''), 'ingen');
end $$;
