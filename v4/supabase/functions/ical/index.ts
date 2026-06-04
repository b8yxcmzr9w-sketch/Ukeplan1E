// Ukeplan v4 – iCal Edge Function
// Returns a text/calendar feed for a class (elev) or teacher (laerer)
// Query params: klasse, laerer, parti, gruppe, school_id

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const schoolId  = url.searchParams.get('school_id') ?? ''
  const klasse    = url.searchParams.get('klasse')    ?? ''
  const laerer    = url.searchParams.get('laerer')    ?? ''
  const parti     = url.searchParams.get('parti')     ?? ''
  const gruppe    = url.searchParams.get('gruppe')    ?? ''

  if (!schoolId) {
    return new Response('Missing school_id', { status: 400 })
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Fetch school info
  const { data: school } = await sb
    .from('schools')
    .select('name, school_year_start_week, school_year_end_week')
    .eq('id', schoolId)
    .single()

  if (!school) return new Response('School not found', { status: 404 })

  // Build sessions query
  let query = sb
    .from('sessions')
    .select(`
      id, week_nr, day_of_week, activity, meeting_point, info, version,
      subjects!inner(name, short_code),
      classes!inner(name),
      users!teacher_id(full_name),
      subject_divisions(name, division_type)
    `)
    .eq('school_id', schoolId)
    .is('deleted_at', null)
    .gte('week_nr', school.school_year_start_week)
    .lte('week_nr', school.school_year_end_week)

  if (klasse) {
    const { data: cls } = await sb.from('classes').select('id').eq('school_id', schoolId).eq('name', klasse).single()
    if (cls) query = query.eq('class_id', cls.id)
  }
  if (laerer) {
    const { data: usr } = await sb.from('users').select('id').eq('school_id', schoolId).eq('full_name', laerer).single()
    if (usr) query = query.eq('teacher_id', usr.id)
  }

  const { data: sessions } = await query

  if (!sessions) return new Response('No sessions found', { status: 404 })

  // Filter by parti/gruppe client-side (after fetch)
  const filtered = sessions.filter((s: any) => {
    if (!s.subject_divisions) return true
    const div = s.subject_divisions
    if (parti  && div?.division_type === 'parti'  && div.name !== parti)  return false
    if (gruppe && div?.division_type === 'gruppe' && div.name !== gruppe) return false
    return true
  })

  // Build iCal
  const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
  const calName = laerer
    ? `Ukeplan – ${laerer} (${school.name})`
    : `Ukeplan – ${klasse} (${school.name})`

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ukeplan v4//NO',
    `X-WR-CALNAME:${calName}`,
    'X-WR-TIMEZONE:Europe/Oslo',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  const year = new Date().getFullYear()

  for (const s of filtered as any[]) {
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
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="ukeplan.ics"`,
    },
  })
})

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
