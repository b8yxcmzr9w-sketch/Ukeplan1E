import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PROMPT = `Lag 40 korte og underholdende funfacts på norsk. Faktasetningene skal være sanne, enkle å forstå og passe for ungdom på videregående skole.

Temaene skal være en blanding av:
- Øksnevad videregående skole
- Naturbruk
- Jordbruk og gårdsdrift
- Husdyr (ku, sau, gris, høne, hest osv.)
- Traktorer og landbruksmaskiner
- Jæren
- Lokalhistorie
- Fornminner
- Vikinger
- Arkeologi
- Natur og landskap i Rogaland

Krav:
- Maks 1 kort setning per funfact.
- Ingen overskrifter, nummerering eller punktlister – bare én setning per linje.
- Variasjon mellom temaene.
- Faktaene skal være morsomme, overraskende eller interessante.
- Unngå tørre lærebokfakta.
- Alle fakta må være korrekte.
- Språket skal være lett og muntlig.
- Ikke bruk emojis.
- Ikke gjenta samme type fakta.
- Minst 10 av faktaene skal ha lokal tilknytning til Jæren, Øksnevad eller Rogaland.

Svar kun med de 40 faktasetningene, én per linje, ingenting annet.`

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
    const { data: profile } = await adminClient.from('users').select('role, is_admin_active').eq('id', caller.id).single()
    if (!profile || !profile.is_admin_active) {
      return new Response(JSON.stringify({ error: 'Krever admin-tilgang' }), { status: 403, headers: corsHeaders })
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) throw new Error('GEMINI_API_KEY ikke satt')

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: PROMPT }] }],
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
