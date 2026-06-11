import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Prompten bygges per skole – tjenesten er skolenøytral.
function byggPrompt(skoleNavn: string): string {
  return `Lag 40 korte og underholdende funfacts på norsk. Faktasetningene skal være sanne, enkle å forstå og passe for ungdom på videregående skole.

Skolen heter «${skoleNavn}». Temaene skal være en blanding av:
- Skolen og stedet/regionen der den ligger (utled dette fra skolenavnet)
- Lokalhistorie, natur og landskap i området rundt skolen
- Fagområder og linjer som er vanlige på en slik skole
- Vitenskap, dyr og natur
- Historie og arkeologi

Krav:
- Maks 1 kort setning per funfact.
- Ingen overskrifter, nummerering eller punktlister – bare én setning per linje.
- Variasjon mellom temaene.
- Faktaene skal være morsomme, overraskende eller interessante.
- Unngå tørre lærebokfakta.
- Alle fakta må være korrekte. Hvis du er usikker på lokale forhold, velg heller et generelt faktum enn å gjette.
- Språket skal være lett og muntlig.
- Ikke bruk emojis.
- Ikke gjenta samme type fakta.
- Minst 10 av faktaene skal ha lokal tilknytning til skolen eller området rundt, så sant du kjenner stedet godt nok.

Svar kun med de 40 faktasetningene, én per linje, ingenting annet.`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) return new Response(JSON.stringify({ error: 'Ikke autentisert' }), { status: 401, headers: corsHeaders })

    const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: profile } = await adminClient.from('users').select('role, is_admin_active, school_id').eq('id', caller.id).single()
    if (!profile || (!profile.is_admin_active && profile.role !== 'admin')) {
      return new Response(JSON.stringify({ error: 'Krever admin-tilgang' }), { status: 403, headers: corsHeaders })
    }

    // Hent skolenavn fra innlogget brukers egen skole (ikke fra request body)
    const { data: school } = await adminClient.from('schools').select('name').eq('id', profile.school_id).single()
    if (!school?.name) throw new Error('Fant ikke skolen til brukeren')

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) throw new Error('GEMINI_API_KEY ikke satt')

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: byggPrompt(school.name) }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 2048 },
        }),
      }
    )
    const json = await res.json()
    const raw = json.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const facts = raw.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 5)

    return new Response(JSON.stringify({ facts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
