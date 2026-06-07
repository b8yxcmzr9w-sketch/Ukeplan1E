-- ═══════════════════════════════════════════════════════════════
-- Testdata: 3 uker med økter for første klasse / første lærer
-- Kjør i Supabase SQL Editor – slår opp ID-er dynamisk.
-- SLETT denne filen / disse radene før produksjon.
-- ═══════════════════════════════════════════════════════════════

do $$
declare
  v_school_id   uuid;
  v_class_id    uuid;
  v_teacher_id  uuid;
  v_school_year text;
  subj          record;
  subj_ids      uuid[];
  i             int;
  dag           int;
  uke           int;
begin
  -- Hent første skole
  select id, active_school_year into v_school_id, v_school_year
  from schools order by created_at limit 1;

  if v_school_id is null then
    raise notice 'Ingen skole funnet – avbryter.';
    return;
  end if;

  -- Hent første klasse for skolen
  select id into v_class_id
  from classes where school_id = v_school_id and deleted_at is null
  order by name limit 1;

  if v_class_id is null then
    raise notice 'Ingen klasse funnet – avbryter.';
    return;
  end if;

  -- Hent første lærer for skolen
  select id into v_teacher_id
  from users where school_id = v_school_id and deleted_at is null
  order by full_name limit 1;

  if v_teacher_id is null then
    raise notice 'Ingen lærer funnet – avbryter.';
    return;
  end if;

  -- Samle maks 5 fag for skolen
  select array_agg(id order by name)
  into subj_ids
  from (select id, name from subjects
        where school_id = v_school_id and deleted_at is null
        order by name limit 5) s;

  if subj_ids is null or array_length(subj_ids, 1) = 0 then
    raise notice 'Ingen fag funnet – avbryter.';
    return;
  end if;

  -- Sett inn 2 økter per dag (man–fre) i uke 1, 2 og 3
  -- (uke 1–3 er trygge testverdier uansett skoleår-konfig)
  for uke in 1..3 loop
    for dag in 1..5 loop
      for i in 1..2 loop
        -- Unngå duplikater
        if not exists (
          select 1 from sessions
          where class_id = v_class_id
            and subject_id = subj_ids[ ((dag + i - 2) % array_length(subj_ids,1)) + 1 ]
            and week_nr = uke and day_of_week = dag
        ) then
          insert into sessions (
            school_id, class_id, subject_id,
            week_nr, day_of_week,
            teacher_id, activity, meeting_point, info,
            school_year, created_by, version
          ) values (
            v_school_id, v_class_id,
            subj_ids[ ((dag + i - 2) % array_length(subj_ids,1)) + 1 ],
            uke, dag,
            v_teacher_id,
            'Testaktivitet uke ' || uke || ' dag ' || dag,
            'Rom A' || (10 + dag),
            'Testøkt – kan slettes',
            v_school_year, v_teacher_id, 1
          );
        end if;
      end loop;
    end loop;
  end loop;

  raise notice 'Testøkter satt inn: skole=%, klasse=%, lærer=%, skoleår=%',
    v_school_id, v_class_id, v_teacher_id, v_school_year;
end $$;
