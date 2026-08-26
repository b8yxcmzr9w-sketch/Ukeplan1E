// Ukeplan v4 – iCal Edge Function
// Returns a text/calendar feed for a class (elev) or teacher (laerer)
// Query params: klasse, laerer, school_id, divisions (kommaseparerte division-UUIDs)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const url = new URL(req.url)
  const schoolId   = url.searchParams.get('school_id') ?? ''
  const klasse     = url.searchParams.get('klasse')    ?? ''
  const laerer     = url.searchParams.get('laerer')    ?? ''
  // Ny param: kommaseparerte division-UUIDs for elev-filter
  const divisionsParam = url.searchParams.get('divisions') ?? ''
  const divisionIds = divisionsParam ? divisionsParam.split(',').filter(Boolean) : []

  // Behold bakoverkompatibilitet med gamle parti/gruppe-params (filtrering på navn)
  const parti  = url.searchParams.get('parti')  ?? ''
  const gruppe = url.searchParams.get('gruppe') ?? ''

  if (!schoolId) {
    return new Response('Missing school_id', { status: 400, headers: CORS })
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Fetch school info (inkl. aktivt skoleår)
  const { data: school } = await sb
    .from('schools')
    .select('name, school_year_start_week, school_year_end_week, active_school_year')
    .eq('id', schoolId)
    .single()

  if (!school) return new Response('School not found', { status: 404, headers: CORS })

  const activeYear: string | null = school.active_school_year ?? null

  // Build sessions query – filtrer alltid på aktivt skoleår
  let query = sb
    .from('sessions')
    .select(`
      id, week_nr, day_of_week, activity, meeting_point, info, school_year, version, division_id,
      subjects!inner(name, short_code),
      classes!inner(name),
      users!teacher_id(full_name),
      subject_divisions(name, division_type)
    `)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .gte('week_nr', school.school_year_start_week)
    .lte('week_nr', school.school_year_end_week)

  if (activeYear) query = query.eq('school_year', activeYear)

  if (klasse) {
    const { data: cls } = await sb.from('classes').select('id').eq('school_id', schoolId).eq('name', klasse).single()
    if (cls) query = query.eq('class_id', cls.id)
  }
  if (laerer) {
    const { data: usr } = await sb.from('users').select('id').eq('school_id', schoolId).eq('full_name', laerer).single()
    if (usr) query = query.eq('teacher_id', usr.id)
  }

  const { data: sessions, error: sessionsError } = await query

  if (sessionsError) {
    return new Response(`Database error: ${sessionsError.message}`, { status: 500, headers: CORS })
  }
  if (!sessions) return new Response('No sessions found', { status: 404, headers: CORS })

  // Filtrer på division – ny logikk (UUID-basert) har prioritet over gammel (navn-basert)
  const filtered = sessions.filter((s: any) => {
    if (divisionIds.length > 0) {
      // Ny filterregel: NULL division_id = alltid med; ellers kun valgte
      return s.division_id === null || divisionIds.includes(s.division_id)
    }
    // Bakoverkompatibel: gammel parti/gruppe-filtrering på navn
    if (!s.subject_divisions) return true
    const div = s.subject_divisions
    if (parti  && div?.division_type === 'parti'  && div.name !== parti)  return false
    if (gruppe && div?.division_type === 'gruppe' && div.name !== gruppe) return false
    return true
  })

  // Build iCal
  const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
  const calName = laerer
    ? `${school.name} – ${laerer}`
    : `${school.name} – ${klasse}`

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ukeplan1e//NO',
    `X-WR-CALNAME:${calName}`,
    'X-WR-TIMEZONE:Europe/Oslo',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  for (const s of filtered as any[]) {
    // Utled riktig kalenderår fra skoleåret – speiler skoleaar_kalenderaar() i SQL
    const year = kalenderaarForUke(s.school_year ?? activeYear, s.week_nr, school.school_year_start_week)
    const weekDate = isoWeekToDate(year, s.week_nr, s.day_of_week)
    const dateStr  = weekDate.toISOString().slice(0, 10).replace(/-/g, '')
    const uid      = `${s.id}@ukeplan-v4`
    const summary  = `${s.subjects.short_code}: ${s.activity || s.subjects.name}`
    const location = s.meeting_point || ''
    const desc     = [s.info, `Lærer: ${s.users?.full_name ?? ''}`, `Klasse: ${s.classes?.name ?? ''}`]
      .filter(Boolean).join('\\n')

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${dateStr}`,
      `SUMMARY:${escapeIcal(summary)}`,
      `DESCRIPTION:${escapeIcal(desc)}`,
      `LOCATION:${escapeIcal(location)}`,
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')

  return new Response(lines.join('\r\n'), {
    headers: {
      ...CORS,
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="ukeplan.ics"`,
    },
  })
})

// Speiler skoleaar_kalenderaar() i migrering 004.
function kalenderaarForUke(schoolYear: string | null, weekNr: number, startWeek: number): number {
  if (!schoolYear || !/^\d{2}\/\d{2}$/.test(schoolYear)) return new Date().getFullYear()
  const foersteAar = 2000 + parseInt(schoolYear.split('/')[0], 10)
  const andreAar   = 2000 + parseInt(schoolYear.split('/')[1], 10)
  return weekNr >= startWeek ? foersteAar : andreAar
}

function isoWeekToDate(year: number, week: number, dayOfWeek: number): Date {
  const jan4 = new Date(year, 0, 4)
  const startOfWeek1 = new Date(jan4)
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7))
  const d = new Date(startOfWeek1)
  d.setDate(startOfWeek1.getDate() + (week - 1) * 7 + (dayOfWeek - 1))
  return d
}

function escapeIcal(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}
