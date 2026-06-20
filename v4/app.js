// Ukeplan v4 - Norwegian School Weekly Planner
// Single-file vanilla JS app using Supabase JS v2

const SUPABASE_URL = 'https://zstjfatkeqbbekqgbsgb.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_c-knXQEaZswHBZ4_TPgnWw_Tg6OA04J'

// Vakt: hvis Supabase-CDN ikke lastet (treg/blokkert nettverk), vis en tydelig
// feilmelding i stedet for at app.js kaster og siden henger på «Laster…».
if (!window.supabase || !window.supabase.createClient) {
  const m = document.getElementById('app-main')
  if (m) {
    m.innerHTML = '<div class="tom-uke" style="padding:40px;text-align:center">' +
      'Kunne ikke laste appen (nettverksfeil mot Supabase-biblioteket).<br><br>' +
      '<button class="btn btn-p" onclick="location.reload()">Prøv igjen</button></div>'
  }
  throw new Error('window.supabase ikke tilgjengelig – CDN lastet ikke')
}

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

window.APP = {
  user: null,
  profile: null,
  school: null,
  facts: [],
  currentView: null,
  realtimeChannel: null,
  isAdminActive: false,
  renderToken: 0,
  klasseVelger: null,    // { aktivKlasse, setKlasse } – satt av renderMinKlasseTab (klassevelger-fanen)
}

// Registreres umiddelbart (ikke i init) slik at PASSWORD_RECOVERY/invitasjon
// fra recovery-lenken i URL-en ikke går tapt før init() rekker å kjøre.
let _recoveryHandtert = false
sb.auth.onAuthStateChange((event, session) => {
  // ⚠️ Callbacken kjører MENS supabase-js holder auth-låsen (navigator
  // LockManager). Gjør vi awaitede Supabase-kall (f.eks. fetchProfile →
  // sb.from(...), som internt tar samme lås) direkte her, deadlocker vi:
  // låsen slippes aldri, og ALLE påfølgende spørringer henger til brukeren
  // sletter nettstedsdata. Utsett derfor arbeidet til etter at låsen er
  // sluppet. Se: supabase-js – «Avoid awaiting calls inside onAuthStateChange».
  setTimeout(() => { handterAuthEndring(event, session) }, 0)
})

async function handterAuthEndring(event, session) {
  if (event === 'SIGNED_OUT') {
    APP.user = null
    APP.profile = null
    APP.isAdminActive = false
    oppdaterHeader()
    navigate('#/')
  } else if (event === 'PASSWORD_RECOVERY') {
    if (_recoveryHandtert) return
    _recoveryHandtert = true
    APP.user = session?.user || APP.user
    if (session && !APP.profile) {
      try { APP.profile = await fetchProfile(session.user.id) } catch {}
    }
    oppdaterHeader()
    visSettPassordModal({
      tvungen: true,
      tittel: 'Velg nytt passord',
      ingress: 'Du fulgte en tilbakestillingslenke. Velg et nytt passord for å fullføre.',
      onFerdig: () => navigate('#/laerer'),
    })
  } else if (event === 'SIGNED_IN' && session) {
    APP.user = session.user
    if (!APP.profile) {
      try { APP.profile = await fetchProfile(session.user.id) } catch {}
    }
    APP.isAdminActive = APP.profile?.is_admin_active || false
    oppdaterHeader()
    // Invitasjonslenke: ny bruker uten passord – be om å sette ett
    if (!_recoveryHandtert && (location.hash.includes('type=invite') || location.search.includes('type=invite'))) {
      _recoveryHandtert = true
      visSettPassordModal({
        tvungen: true,
        tittel: 'Velkommen! Velg et passord',
        ingress: 'Kontoen din er opprettet. Velg et passord for å logge inn.',
        onFerdig: () => navigate('#/laerer'),
      })
    }
  }
}

const FUNNY_TEXTS = [
  'Sender tanker til skyene…',
  'Overtaler databasen…',
  'Stokker bits…',
  'Ber om tillatelse fra serveren…',
  'Teller piksler…',
  'Varmer opp serveren…',
  'Rydder i skapet…',
  'Krysser fingrene…',
]

// ─────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

function isoWeekToDate(year, week, dayOfWeek) {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7))
  const dow = simple.getUTCDay()
  const isoStart = simple
  if (dow <= 4) isoStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1)
  else isoStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay())
  isoStart.setUTCDate(isoStart.getUTCDate() + (dayOfWeek - 1))
  return isoStart
}

function getCurrentISOWeek() {
  const now = new Date()
  // Fredag (5) etter kl. 18 → vis neste uke
  if (now.getDay() === 5 && now.getHours() >= 18) {
    return getISOWeek(new Date(now.getTime() + 7 * 86400000))
  }
  // Helg (lørdag/søndag) → vis neste uke
  if (now.getDay() === 6 || now.getDay() === 0) {
    return getISOWeek(new Date(now.getTime() + 7 * 86400000))
  }
  return getISOWeek(now)
}

// Lineær posisjon i skoleåret (33→52→1→24). Brukes for grensesjekk på uke-navigasjon.
function ukePosisjon(uke, startWeek = 33) {
  return uke >= startWeek ? uke - startWeek : uke + (52 - startWeek)
}

function dagNavn(n) {
  return ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag'][n - 1]
}

// Visningstekst for school_calendar.type — databaseverdien «helligdag»
// beholdes, men vises for brukeren som «høytid».
function kalenderTypeNavn(t) {
  return t === 'helligdag' ? 'høytid' : t
}

// Returnerer neste skoleår som 'YY/YY', f.eks. '25/26' → '26/27'.
function nesteSkolear(sy) {
  if (!sy || !/^\d{2}\/\d{2}$/.test(sy)) return null
  const a = (parseInt(sy.split('/')[0]) + 1) % 100
  const b = (a + 1) % 100
  return `${String(a).padStart(2, '0')}/${String(b).padStart(2, '0')}`
}

// Fra og med 17. mai er planleggingsvinduet for neste skoleår åpent.
function erNesteAarVinduApent() {
  const now = new Date()
  return (now.getMonth() + 1) > 5 || ((now.getMonth() + 1) === 5 && now.getDate() >= 17)
}

// Kalenderår for en gitt uke innenfor et skoleår.
// Uker f.o.m. oppstartsuka hører til første årstall, resten til andre.
// Eksempel: '25/26', uke 40, startUke 33 → 2025; uke 10 → 2026.
// Speiler SQL-funksjonen skoleaar_kalenderaar() i migrering 004.
function skoleaarKalenderaar(schoolYear, weekNr, startWeek) {
  if (!schoolYear || !/^\d{2}\/\d{2}$/.test(schoolYear)) return new Date().getFullYear()
  const foersteAar = 2000 + parseInt(schoolYear.split('/')[0], 10)
  const andreAar   = 2000 + parseInt(schoolYear.split('/')[1], 10)
  return weekNr >= (startWeek || 1) ? foersteAar : andreAar
}

// Datointervallet et skoleår dekker: 1. aug år1 – 31. jul år2.
// Eksempel: '25/26' → { aar1: 2025, aar2: 2026, fra: '2025-08-01', til: '2026-07-31' }
function skoleaarIntervall(sy) {
  if (!sy || !/^\d{2}\/\d{2}$/.test(sy)) return null
  const aar1 = 2000 + parseInt(sy.slice(0, 2), 10)
  const aar2 = 2000 + parseInt(sy.slice(3, 5), 10)
  return { aar1, aar2, fra: `${aar1}-08-01`, til: `${aar2}-07-31` }
}

function truncate(s, n = 60) {
  if (!s) return ''
  return s.length > n ? s.slice(0, n) + '…' : s
}

function formatDatoNO(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit' })
}

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v)
    else e.setAttribute(k, v)
  }
  for (const c of children) {
    if (c == null) continue
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c)
  }
  return e
}

function clearEl(element) {
  while (element.firstChild) element.removeChild(element.firstChild)
}

function showToast(msg, type = 'info') {
  const toast = el('div', { class: `toast toast--${type}` }, msg)
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3500)
}

// Deaktiverer lagreKnapp til brukeren endrer noe i skjemaet
function overvakSkjema(form, lagreKnapp) {
  lagreKnapp.disabled = true
  lagreKnapp.classList.add('btn-passiv')

  function snapshot() {
    return Array.from(form.querySelectorAll('input,select,textarea'))
      .map(e => (e.type === 'checkbox' || e.type === 'radio') ? `${e.value}:${e.checked}` : e.value)
      .join('§')
  }

  const initial = snapshot()

  function sjekk() {
    const endret = snapshot() !== initial
    lagreKnapp.disabled = !endret
    lagreKnapp.classList.toggle('btn-passiv', !endret)
  }

  form.addEventListener('input', sjekk)
  form.addEventListener('change', sjekk)
}

// ─────────────────────────────────────────
// SAVE OVERLAY
// ─────────────────────────────────────────

async function medLagreOverlay(asyncFn) {
  const overlay = el('div', { class: 'lagre-overlay' })
  const box = el('div', { class: 'overlay-boks' })
  const spinner = el('div', { class: 'spinner' })
  const msgEl = el('p', { class: 'overlay-tekst', style: 'visibility:hidden' }, '…')
  box.appendChild(spinner)
  box.appendChild(msgEl)
  overlay.appendChild(box)
  document.body.appendChild(overlay)

  // Vis morsomt sitat etter 3 sekunder
  const sitatTimer = setTimeout(() => {
    const texts = APP.facts.length
      ? [...FUNNY_TEXTS, ...APP.facts.map(f => f.fact_text)]
      : FUNNY_TEXTS
    msgEl.textContent = texts[Math.floor(Math.random() * texts.length)]
    msgEl.style.visibility = 'visible'
  }, 3000)

  try {
    const result = await asyncFn()
    clearTimeout(sitatTimer)
    clearEl(box)
    box.appendChild(el('div', { class: 'overlay-ok' }, '✓'))
    box.appendChild(el('p', {}, 'Lagret!'))
    await new Promise(r => setTimeout(r, 1200))
    overlay.remove()
    return result
  } catch (err) {
    clearTimeout(sitatTimer)
    clearEl(box)
    box.appendChild(el('p', { class: 'feil-tekst' }, `Feil: ${err.message}`))
    box.appendChild(el('button', { class: 'btn btn-s', onclick: () => overlay.remove() }, 'Lukk'))
    throw err
  }
}

// «AI jobber»-overlay: fullskjerm med animasjon, tittel og roterende
// funfacts fra APP.facts. Fjernes alltid i finally; feil kastes videre
// slik at kallerens feilhåndtering (toast) virker som før.
async function medAIOverlay(tittel, asyncFn) {
  const overlay = el('div', { class: 'ai-overlay' })
  const boks = el('div', { class: 'ai-overlay-boks' })
  boks.appendChild(el('div', { class: 'ai-overlay-ikon' }, '✨'))
  boks.appendChild(el('h3', { class: 'ai-overlay-tittel' }, tittel))
  boks.appendChild(el('p', { class: 'ai-overlay-under' }, 'Dette kan ta litt tid.'))

  let intervall = null
  let fadeTimer = null

  if (APP.facts.length) {
    const tekstEl = el('p', { class: 'ai-overlay-fakta-tekst' }, '')

    // Stokket kø; fylles på nytt når den er tom, uten samme fakta to ganger på rad
    let koe = []
    let forrige = null
    function nesteFakta() {
      if (!koe.length) {
        koe = [...APP.facts]
        for (let i = koe.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[koe[i], koe[j]] = [koe[j], koe[i]]
        }
        if (koe.length > 1 && koe[koe.length - 1]?.id === forrige?.id) {
          ;[koe[koe.length - 1], koe[0]] = [koe[0], koe[koe.length - 1]]
        }
      }
      forrige = koe.pop()
      // Tell visning: oppdater lokalt + DB (ikke-blokkerende, omgår RLS via SECURITY DEFINER)
      if (forrige?.id) {
        forrige.view_count = (forrige.view_count || 0) + 1
        sb.rpc('increment_fact_view', { p_fact_id: forrige.id }).catch(() => {})
      }
      return forrige?.fact_text ?? ''
    }
    function visNeste(medFade) {
      if (!medFade) { tekstEl.textContent = nesteFakta(); return }
      tekstEl.classList.add('fade-ut')
      fadeTimer = setTimeout(() => {
        tekstEl.textContent = nesteFakta()
        tekstEl.classList.remove('fade-ut')
      }, 300)
    }
    function startIntervall() {
      clearInterval(intervall)
      intervall = setInterval(() => visNeste(true), 10000)
    }

    const fakta = el('div', { class: 'ai-overlay-fakta' })
    const tekstWrap = el('div', { class: 'ai-overlay-fakta-innhold' })
    tekstWrap.appendChild(el('span', { class: 'ai-overlay-fakta-label' }, 'Mens du venter …'))
    tekstWrap.appendChild(tekstEl)
    fakta.appendChild(tekstWrap)
    fakta.appendChild(el('button', {
      type: 'button', class: 'ai-overlay-neste', title: 'Neste fakta',
      'aria-label': 'Neste fakta',
      onclick: () => { clearTimeout(fadeTimer); visNeste(true); startIntervall() },
    }, '→'))
    boks.appendChild(fakta)

    visNeste(false)
    startIntervall()
  }

  overlay.appendChild(boks)
  document.body.appendChild(overlay)

  try {
    return await asyncFn()
  } finally {
    clearInterval(intervall)
    clearTimeout(fadeTimer)
    overlay.remove()
    // Ikke-blokkerende etterspill: forny funfacts-pølja om terskelen er nådd
    sjekkOgFornyFunfacts().catch(() => {})
  }
}

// Sjekk om funfacts-pølja bør fornyes (terskel: ≥ 3 visninger på én setning).
// Krever admin-tilgang siden generate-facts er adminbeskyttet. Feil svelges stille.
async function sjekkOgFornyFunfacts() {
  if (!APP.school || !APP.facts.length) return
  if (!APP.profile?.is_admin_active && !harAdminTilgang()) return
  if (!APP.facts.some(f => (f.view_count || 0) >= 3)) return
  try {
    await fornyFunfactsRotasjon()
  } catch (e) {
    console.warn('[funfacts] Automatisk fornyelse feilet (ufarlig):', e.message)
  }
}

// Bytt ut de 5 mest viste aktive setningene med 5 nye AI-genererte.
async function fornyFunfactsRotasjon() {
  const { data, error } = await sb.functions.invoke('generate-facts', { body: { school_id: APP.school.id } })
  if (error || !data?.facts?.length) throw new Error(error?.message || 'Tomt svar fra generate-facts')
  const nyeFakta = data.facts.slice(0, 5)
  const sortert = [...APP.facts].sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
  const skalSlettes = sortert.slice(0, Math.min(5, sortert.length)).map(f => f.id)
  if (skalSlettes.length) {
    const { error: delErr } = await sb.from('school_facts')
      .update({ deleted_at: new Date().toISOString() }).in('id', skalSlettes)
    if (delErr) throw new Error(delErr.message)
  }
  const { error: insErr } = await sb.from('school_facts')
    .insert(nyeFakta.map(txt => ({ school_id: APP.school.id, fact_text: txt })))
  if (insErr) throw new Error(insErr.message)
  APP.facts = APP.facts.filter(f => !skalSlettes.includes(f.id))
  console.log('[funfacts] Fornyet: 5 sett ut, 5 nye inn.')
}

// ─────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────

async function login(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

async function logout() {
  await sb.auth.signOut()
  APP.user = null
  APP.profile = null
  APP.isAdminActive = false
  oppdaterHeader()
  navigate('#/')
}

async function fetchProfile(userId) {
  const { data, error } = await sb.from('users').select('*').eq('id', userId).single()
  if (error) throw error
  return data
}

// Admin-tilgang avgjøres av is_admin. role==='admin' beholdes som fallback
// for overgangen før migrasjon 018 er kjørt (da finnes ikke is_admin-kolonnen
// ennå, og en ny frontend ville ellers skjult admin-menyen for alle).
function harAdminTilgang(p = APP.profile) {
  return !!(p && (p.is_admin || p.role === 'admin'))
}

async function byttPassord(nytt) {
  const { error } = await sb.auth.updateUser({ password: nytt })
  if (error) throw error
}

async function byttEpost(nyEpost) {
  const { error } = await sb.auth.updateUser(
    { email: nyEpost },
    { emailRedirectTo: window.location.origin + window.location.pathname }
  )
  if (error) throw error
}

// Kaller admin-user Edge Function (krever aktiv admin-sesjon)
async function kallAdminUser(action, payload = {}) {
  const { data: { session } } = await sb.auth.getSession()
  const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ action, ...payload }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Ukjent feil')
  return json
}

async function toggleAdminModus() {
  const ny = !APP.isAdminActive
  await sb.from('users').update({ is_admin_active: ny }).eq('id', APP.profile.id)
  APP.isAdminActive = ny
  APP.profile.is_admin_active = ny
  oppdaterHeader()
  // Veksle KUN rettighetsnivå i gjeldende visning – aldri bytte rute.
  // router() re-rendrer samme hash på nytt med oppdatert is_admin_active.
  router()
}

async function erFerdigSattOpp() {
  const { data: klasser } = await sb.from('classes').select('id').eq('school_id', APP.school.id).limit(1)
  const { data: fag } = await sb.from('subjects').select('id').eq('school_id', APP.school.id).limit(1)
  return (klasser?.length > 0) && (fag?.length > 0)
}

async function sjekkVentendeOverforinger() {
  if (!APP.profile) return
  const { data } = await sb.from('pending_transfers')
    .select('*, sessions(*)')
    .eq('to_user', APP.profile.id)
  if (data && data.length > 0) {
    showToast(`Du har ${data.length} ventende overføring(er)`, 'info')
  }
}

function renderLoginForm() {
  const main = document.getElementById('app-main')
  clearEl(main)

  const wrap = el('div', { class: 'login-wrap' })
  const kort = el('div', { class: 'login-kort' })

  const feilMelding = el('p', { class: 'feil-tekst skjult' })

  const form = el('form', { class: 'skjema', onsubmit: async (e) => {
    e.preventDefault()
    feilMelding.classList.add('skjult')
    const email = form.querySelector('[name=email]').value
    const password = form.querySelector('[name=password]').value
    const btn = form.querySelector('button[type=submit]')
    btn.disabled = true
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password })
      if (error) throw error
      APP.user = data.user
      APP.profile = await fetchProfile(data.user.id)
      APP.isAdminActive = APP.profile.is_admin_active || false
      oppdaterHeader()
      await sjekkVentendeOverforinger()
      showToast(`Velkommen, ${APP.profile.full_name}!`, 'info')
      const erAdmin = harAdminTilgang() || APP.isAdminActive
      if (erAdmin && !(await erFerdigSattOpp())) {
        APP.isAdminActive = true
        navigate('#/admin')
      } else {
        APP.isAdminActive = false
        await sb.from('users').update({ is_admin_active: false }).eq('id', APP.profile.id)
        navigate('#/laerer')
      }
    } catch (err) {
      feilMelding.textContent = 'Feil e-post eller passord'
      feilMelding.classList.remove('skjult')
      btn.disabled = false
    }
  }})

  kort.appendChild(el('h2', {}, 'Logg inn'))
  kort.appendChild(feilMelding)
  form.appendChild(el('label', { class: 'felt-label' }, 'E-post'))
  form.appendChild(el('input', { name: 'email', type: 'email', class: 'felt input', required: 'true', placeholder: 'din@epost.no' }))
  form.appendChild(el('label', { class: 'felt-label' }, 'Passord'))
  form.appendChild(el('input', { name: 'password', type: 'password', class: 'felt input', required: 'true' }))
  form.appendChild(el('button', { type: 'submit', class: 'btn btn-p', style: 'width:100%;margin-top:8px' }, 'Logg inn'))

  // Glemt passord
  const infoMelding = el('p', { class: 'info-tekst skjult', style: 'font-size:.85rem;color:var(--tekst-svak);margin-top:10px;text-align:center' })
  const glemt = el('button', { type: 'button', class: 'btn-lenke', style: 'margin-top:12px;font-size:.85rem;color:var(--tekst-svak);background:none;border:none;cursor:pointer;display:block;width:100%;text-align:center' }, 'Glemt passord?')
  glemt.addEventListener('click', async () => {
    feilMelding.classList.add('skjult')
    const email = form.querySelector('[name=email]').value.trim()
    if (!email) {
      feilMelding.textContent = 'Fyll inn e-postadressen din først'
      feilMelding.classList.remove('skjult')
      return
    }
    glemt.disabled = true
    glemt.textContent = 'Sender…'
    // Av sikkerhetshensyn avslører vi ikke om e-posten finnes – samme svar uansett
    await sb.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname
    })
    infoMelding.textContent = 'Hvis ' + email + ' er registrert, sender vi en e-post med en lenke for å tilbakestille passordet. Sjekk også søppelpost.'
    infoMelding.classList.remove('skjult')
    glemt.textContent = 'Glemt passord?'
    glemt.disabled = false
  })
  form.appendChild(glemt)
  form.appendChild(infoMelding)

  kort.appendChild(form)
  wrap.appendChild(kort)
  main.appendChild(wrap)
}

// Fleksibel «sett nytt passord»-modal.
// opts.tvungen = true: kan ikke avbrytes (brukes etter recovery-/invitasjonslenke)
function visSettPassordModal(opts = {}) {
  const { tvungen = false, tittel = 'Bytt passord', ingress = null, onFerdig = null } = opts
  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, tittel))
  if (ingress) box.appendChild(el('p', { class: 'tekst-svak', style: 'font-size:.88rem;margin:0 0 12px' }, ingress))

  const feil = el('p', { class: 'feil-tekst skjult' })
  box.appendChild(feil)

  const form = el('form', { class: 'skjema' })
  const nytt = el('input', { type: 'password', placeholder: 'Nytt passord (minst 8 tegn)', class: 'felt input', autocomplete: 'new-password', minlength: 8, required: 'true' })
  const bekreft = el('input', { type: 'password', placeholder: 'Gjenta nytt passord', class: 'felt input', autocomplete: 'new-password', required: 'true', style: 'margin-top:10px' })
  form.appendChild(nytt)
  form.appendChild(bekreft)

  const bunn = el('div', { class: 'modal-bunn' })
  if (!tvungen) {
    bunn.appendChild(el('button', { type: 'button', class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))
  }
  bunn.appendChild(el('button', { type: 'submit', class: 'btn btn-p' }, 'Lagre'))
  form.appendChild(bunn)

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    feil.classList.add('skjult')
    if (nytt.value.length < 8) {
      feil.textContent = 'Passordet må være minst 8 tegn'; feil.classList.remove('skjult'); return
    }
    if (nytt.value !== bekreft.value) {
      feil.textContent = 'Passordene er ikke like'; feil.classList.remove('skjult'); return
    }
    try {
      await medLagreOverlay(() => byttPassord(nytt.value))
      modal.remove()
      showToast('Passordet er oppdatert', 'ok')
      if (onFerdig) onFerdig()
    } catch (err) {
      feil.textContent = err.message; feil.classList.remove('skjult')
    }
  })

  box.appendChild(form)
  modal.appendChild(box)
  document.body.appendChild(modal)
  if (!tvungen) modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

// ─────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────

function oppdaterKlasseStatisk(navn) {
  const el2 = document.getElementById('hdr-klasse-statisk')
  if (!el2) return
  if (navn) {
    el2.textContent = `klasse ${navn}`
    el2.classList.remove('skjult')
  } else {
    el2.classList.add('skjult')
  }
}

function oppdaterHeader() {
  // Skolenavn + logo
  const skolenavn = document.getElementById('hdr-skolenavn')
  const logo = document.getElementById('hdr-logo')
  if (skolenavn) skolenavn.textContent = APP.school ? APP.school.name : 'Ukeplan1e'

  // Skoleår før skolenavn
  const skolearEl = document.getElementById('hdr-skolear')
  if (skolearEl) {
    const sy = APP.school?.active_school_year
    if (sy) {
      skolearEl.textContent = sy
      skolearEl.classList.remove('skjult')
    } else {
      skolearEl.classList.add('skjult')
    }
  }

  // Valgt klasse i header – kun statisk tekst. Klassevelgeren er flyttet til
  // første fane i lærervisningen; #hdr-klasse-containeren brukes ikke lenger.
  const klasseEl = document.getElementById('hdr-klasse')
  if (klasseEl) {
    clearEl(klasseEl)
    klasseEl.classList.add('skjult')
  }
  if (APP.klasseVelger?.aktivKlasse?.name) {
    oppdaterKlasseStatisk(APP.klasseVelger.aktivKlasse.name)
  } else if (APP.currentKlasse) {
    oppdaterKlasseStatisk(APP.currentKlasse)
  } else {
    oppdaterKlasseStatisk(null)
  }
  const favicon = document.getElementById('favicon')
  if (logo && APP.school && (APP.school.logo_url || APP.school.logo_file_path)) {
    logo.src = APP.school.logo_file_path
      ? `${SUPABASE_URL}/storage/v1/object/public/logos/${APP.school.logo_file_path}`
      : APP.school.logo_url
    logo.classList.remove('skjult')
    if (favicon) favicon.href = logo.src
  } else {
    if (favicon) favicon.href = 'unoicon.png'
  }

  // Tema
  if (APP.school && APP.school.color_theme) {
    document.documentElement.dataset.theme = APP.school.color_theme
  }

  // Alltid-synlige toggle-brytere i headeren
  const laererBtn  = document.getElementById('hdr-laerer-btn')
  const adminToggle= document.getElementById('hdr-admin-toggle')

  // Hamburger-elementer
  const hamburger        = document.getElementById('hdr-hamburger')
  const dropdown         = document.getElementById('hdr-dropdown')
  const ddNavn           = document.getElementById('hdr-dropdown-navn')
  const ddProfil         = document.getElementById('hdr-dd-profil')
  const ddInnstillinger  = document.getElementById('hdr-dd-innstillinger')
  const ddLogout         = document.getElementById('hdr-dd-logout')
  const ddLogin          = document.getElementById('hdr-dd-login')

  if (APP.user && APP.profile) {
    const visAdmin = harAdminTilgang()
    const skjulLaerer = harAdminTilgang() && APP.isAdminActive

    // Toggle: Elevvisning / Lærervisning (alltid synlig)
    if (laererBtn) {
      laererBtn.classList.toggle('skjult', skjulLaerer)
      const erILaerer = APP.currentView === 'laerer'
      laererBtn.textContent = erILaerer ? 'Elevvisning' : 'Lærervisning'
      laererBtn.onclick = () => navigate(erILaerer ? '#/' : '#/laerer')
      laererBtn.title = erILaerer ? 'Bytt til elevvisning' : 'Gå til lærervisning'
    }
    // Toggle: Admin av/på (alltid synlig for admin)
    if (adminToggle && visAdmin) {
      adminToggle.classList.remove('skjult')
      adminToggle.textContent = 'Admin'
      adminToggle.classList.toggle('admin-aktiv', APP.isAdminActive)
      adminToggle.onclick = toggleAdminModus
      adminToggle.title = APP.isAdminActive ? 'Bytt til lærervisning' : 'Bytt til adminvisning'
    } else if (adminToggle) adminToggle.classList.add('skjult')

    // Hamburger: brukernavn · Profil · Innstillinger (kun admin) · Logg ut
    if (hamburger) { hamburger.classList.remove('skjult'); hamburger.title = 'Åpne meny' }
    if (ddNavn)   { ddNavn.textContent = APP.profile.full_name; ddNavn.classList.remove('skjult') }
    if (ddLogin)  ddLogin.classList.add('skjult')
    if (ddProfil) {
      ddProfil.classList.remove('skjult')
      ddProfil.onclick = () => { dropdown?.classList.add('skjult'); navigate('#/laerer/innstillinger') }
    }
    if (ddInnstillinger) {
      ddInnstillinger.classList.toggle('skjult', !visAdmin)
      ddInnstillinger.onclick = () => { dropdown?.classList.add('skjult'); navigate('#/admin') }
    }
    if (ddLogout) { ddLogout.classList.remove('skjult'); ddLogout.onclick = () => { dropdown?.classList.add('skjult'); logout() } }
  } else {
    if (laererBtn)   laererBtn.classList.add('skjult')
    if (adminToggle) adminToggle.classList.add('skjult')

    if (hamburger) { hamburger.classList.remove('skjult'); hamburger.title = 'Åpne meny' }
    if (ddNavn)          ddNavn.classList.add('skjult')
    if (ddProfil)        ddProfil.classList.add('skjult')
    if (ddInnstillinger) ddInnstillinger.classList.add('skjult')
    if (ddLogout)        ddLogout.classList.add('skjult')
    if (ddLogin)  { ddLogin.classList.remove('skjult'); ddLogin.onclick = () => { dropdown?.classList.add('skjult'); navigate('#/login') } }
  }

  // Hamburger toggle
  if (hamburger && dropdown) {
    hamburger.onclick = (e) => { e.stopPropagation(); dropdown.classList.toggle('skjult') }
  }

  settHeaderHoyde()
}

// Måler headerens høyde og eksponerer den som --header-h, slik at den
// sticky faneraden kan feste seg rett under headeren (høyden varierer med
// skjermbredde og ev. linjebryting i headeren).
function settHeaderHoyde() {
  const header = document.getElementById('app-header')
  if (header) {
    document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`)
  }
}

// ─────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────

function navigate(hash) {
  window.location.hash = hash
}

async function router() {
  const hash = window.location.hash || '#/'
  const main = document.getElementById('app-main')

  // Cleanup realtime
  if (APP.realtimeChannel) {
    sb.removeChannel(APP.realtimeChannel)
    APP.realtimeChannel = null
  }

  if (hash === '#/login') {
    renderLoginForm()
    return
  }

  if (hash.startsWith('#/laerer')) {
    if (!APP.user) { navigate('#/login'); return }
    renderLaererView()
    return
  }

  if (hash.startsWith('#/admin')) {
    if (!APP.user) { navigate('#/login'); return }
    if (!APP.isAdminActive && !harAdminTilgang()) { navigate('#/laerer'); return }
    renderAdminPanel()
    return
  }

  // Elev view
  const klasseMatch = hash.match(/^#\/klasse\/(.+)$/)
  const klasseNavn = klasseMatch ? decodeURIComponent(klasseMatch[1]) : null
  await renderElevView(klasseNavn)
}

// ─────────────────────────────────────────
// REALTIME
// ─────────────────────────────────────────

function subscribeSessions(classId, weekNr, callback) {
  const channel = sb.channel(`sessions-${classId}-${weekNr}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'sessions',
      filter: `class_id=eq.${classId}`,
    }, payload => {
      if (payload.new?.week_nr === weekNr || payload.old?.week_nr === weekNr) {
        callback(payload)
      }
    })
    .subscribe()
  return channel
}

async function lagreOkt(id, data, expectedVersion) {
  const { data: current, error } = await sb.from('sessions')
    .select('version, last_modified_at, users!last_modified_by(full_name)')
    .eq('id', id).single()
  if (error) throw error
  if (current.version !== expectedVersion) {
    showConflictWarning(current)
    return false
  }
  const { error: updateError } = await sb.from('sessions')
    .update({ ...data, last_modified_by: APP.profile.id, version: expectedVersion + 1 })
    .eq('id', id)
  if (updateError) throw updateError
  return true
}

// Kollegahjelp: tydelig advarsel før en lærer endrer en annens økt.
// Endringen er tillatt, men skal være et bevisst valg.
function bekreftKollegahjelp(s) {
  const eier = s.users?.full_name || 'en annen lærer'
  return confirm(`⚠️ Denne økten tilhører ${eier}.\n\nDu kan endre den som kollegahjelp, men gjør det helst etter avtale. Vil du fortsette?`)
}

// Fellesundervisning: merk økter som deles med andre klasser.
// Slår opp søsken-rader med samme shared_group_id og legger
// klassenavnene på s._fellesMed (brukes av renderSessionCard).
async function merkFellesOkter(sessions) {
  const gids = [...new Set((sessions || []).filter(s => s.shared_group_id).map(s => s.shared_group_id))]
  if (!gids.length) return
  const { data: sosken } = await sb.from('sessions')
    .select('shared_group_id, class_id, classes(name)')
    .in('shared_group_id', gids)
    .is('deleted_at', null)
  const perGruppe = {}
  for (const r of sosken || []) {
    (perGruppe[r.shared_group_id] = perGruppe[r.shared_group_id] || []).push(r)
  }
  for (const s of sessions || []) {
    if (!s.shared_group_id) continue
    const andre = (perGruppe[s.shared_group_id] || [])
      .filter(r => r.class_id !== s.class_id)
      .map(r => r.classes?.name)
      .filter(Boolean)
    if (andre.length) s._fellesMed = [...new Set(andre)].sort((a, b) => a.localeCompare(b, 'nb'))
  }
}

// Skolerute-oppslag: returnerer fridag-oppføringen (ferie/helligdag/
// planleggingsdag) som treffer gitt uke+dag i skoleåret, ellers null.
// Type 'annet' blokkerer ikke – det kan være arrangement på vanlig skoledag.
async function finnFridag(weekNr, dayOfWeek, schoolYear) {
  const sy = schoolYear || APP.school?.active_school_year
  const startWeek = APP.school?.school_year_start_week || 33
  const aar = skoleaarKalenderaar(sy, weekNr, startWeek)
  const dato = isoWeekToDate(aar, weekNr, dayOfWeek).toISOString().slice(0, 10)
  const { data } = await sb.from('school_calendar')
    .select('*')
    .eq('school_id', APP.school.id)
    .is('deleted_at', null)
    .lte('start_date', dato)
    .gte('end_date', dato)
    .in('type', ['ferie', 'helligdag', 'planleggingsdag'])
  return (data && data[0]) || null
}

// Konfliktvarsel ved samtidig redigering. Sier hvem som endret økten
// og når (fra sporbarheten), så ingen endringer går tapt i stillhet.
function showConflictWarning(konflikt) {
  const navn = konflikt?.users?.full_name
  const tid = konflikt?.last_modified_at
    ? new Date(konflikt.last_modified_at).toLocaleString('nb-NO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : ''
  const melding = navn
    ? `Økten er endret av ${navn}${tid ? ` (${tid})` : ''} — last inn på nytt før du lagrer, så ingen endringer går tapt.`
    : 'Noen andre har endret denne økten. Last siden på nytt for å se siste versjon.'
  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, 'Økten er endret'))
  box.appendChild(el('p', {}, melding))
  box.appendChild(el('button', { class: 'btn btn-p', onclick: () => { modal.remove(); window.location.reload() } }, 'Last på nytt'))
  box.appendChild(el('button', { class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))
  modal.appendChild(box)
  document.body.appendChild(modal)
}

// ─────────────────────────────────────────
// ELEV VIEW
// ─────────────────────────────────────────

async function renderElevView(klasseNavn) {
  const myToken = ++APP.renderToken
  const main = document.getElementById('app-main')
  // Rydd opp overflow-lytter fra forrige elevvisning
  if (APP._closeOverflowFn) { document.removeEventListener('click', APP._closeOverflowFn); APP._closeOverflowFn = null }
  clearEl(main)
  APP.currentView = 'elev'
  APP.klasseVelger = null

  let klasse = null
  let alleKlasser = []

  const { data: klasser } = await sb.from('classes').select('*').order('name')
  if (myToken !== APP.renderToken) return  // nyere render har startet
  alleKlasser = klasser || []

  if (klasseNavn) {
    klasse = alleKlasser.find(k => k.name === klasseNavn)
  }

  // Header: vis valgt klasse (informativt)
  APP.currentKlasse = klasse ? klasse.name : null
  oppdaterHeader()

  if (!klasse) {
    // Wrapper for velkomstside
    const wrap = el('div', { class: 'side-wrap' })
    main.appendChild(wrap)
    const velkomst = el('div', { class: 'velkomst-side' })

    if (APP.school?.logo_url) {
      velkomst.appendChild(el('img', { src: APP.school.logo_url, alt: 'Logo', class: 'velkomst-logo' }))
    }
    velkomst.appendChild(el('h1', { class: 'velkomst-tittel' }, APP.school?.name || 'Ukeplan'))
    velkomst.appendChild(el('p', { class: 'velkomst-ingress' }, 'Velg klassen din for å se ukeplanen:'))

    if (alleKlasser.length === 0) {
      velkomst.appendChild(el('p', { class: 'velkomst-tom' }, 'Lærerne er i gang med å sette opp ukeplanen – kom tilbake snart!'))
    } else {
      const liste = el('div', { class: 'velkomst-klasser' })
      for (const k of alleKlasser) {
        const lenke = el('a', {
          href: `#/klasse/${encodeURIComponent(k.name)}`,
          class: 'velkomst-klasse-btn'
        }, k.name)
        liste.appendChild(lenke)
      }
      velkomst.appendChild(liste)
    }

    wrap.appendChild(velkomst)
    return
  }

  // Week state
  const schoolStart = APP.school?.school_year_start_week || 1
  const schoolEnd = APP.school?.school_year_end_week || 52
  let currentWeek = getCurrentISOWeek()
  if (currentWeek < schoolStart) currentWeek = schoolStart
  if (currentWeek > schoolEnd) currentWeek = schoolEnd

  const aktivtSkolear = APP.school?.active_school_year

  // Filter state – leses fra localStorage, lagres som JSON-array av division-UUIDs
  const filterKey = `ukeplan_elevfilter_${klasse.name}`
  const savedFilter = localStorage.getItem(filterKey)
  const valgteDivisjoner = new Set(savedFilter ? JSON.parse(savedFilter) : [])

  // Hent distinkte divisjoner som faktisk forekommer i klassens sessions (via session_divisions)
  const fagGrupper = []
  {
    let divQ = sb.from('sessions')
      .select('subjects(id, name), session_divisions(division_id, subject_divisions(name, division_type))')
      .eq('class_id', klasse.id)
      .is('deleted_at', null)
    if (aktivtSkolear) divQ = divQ.eq('school_year', aktivtSkolear)
    const { data: divSessions } = await divQ
    const seenIds = new Set()
    for (const s of divSessions || []) {
      const fagNavn = s.subjects?.name || 'Ukjent'
      const fagId = s.subjects?.id || fagNavn
      for (const sd of s.session_divisions || []) {
        if (!sd.division_id || seenIds.has(sd.division_id)) continue
        seenIds.add(sd.division_id)
        const div = sd.subject_divisions
        if (!div) continue
        let fag = fagGrupper.find(f => f.fagId === fagId)
        if (!fag) { fag = { fagId, fagNavn, divisjoner: [] }; fagGrupper.push(fag) }
        fag.divisjoner.push({ id: sd.division_id, name: div.name || '', division_type: div.division_type || 'gruppe' })
      }
    }
    fagGrupper.sort((a, b) => a.fagNavn.localeCompare(b.fagNavn, 'nb'))
    for (const f of fagGrupper) f.divisjoner.sort((a, b) => a.name.localeCompare(b.name, 'nb'))
    // Fjern eventuelle lagrede valg som ikke lenger finnes i klassens sessions
    const alleDivIds = new Set(fagGrupper.flatMap(f => f.divisjoner.map(d => d.id)))
    for (const id of [...valgteDivisjoner]) { if (!alleDivIds.has(id)) valgteDivisjoner.delete(id) }
  }

  // Filterpanel-container – utenfor #week-container, overlever ukenavigering
  const filterContainer = el('div', { id: 'elev-filter' })
  main.appendChild(filterContainer)

  let filterPanel = null
  if (fagGrupper.length > 0) {
    filterPanel = el('div', { class: 'elev-filter-panel', style: 'display:none' })
    for (const fag of fagGrupper) {
      const fagDiv = el('div', { class: 'elev-filter-fag' })
      fagDiv.appendChild(el('span', { class: 'elev-filter-fagnavn' }, fag.fagNavn + ':'))
      for (const div of fag.divisjoner) {
        const lbl = el('label', { class: 'elev-filter-lbl' })
        const cb = el('input', { type: 'checkbox' })
        if (valgteDivisjoner.has(div.id)) cb.checked = true
        cb.addEventListener('change', () => {
          if (cb.checked) valgteDivisjoner.add(div.id)
          else valgteDivisjoner.delete(div.id)
          localStorage.setItem(filterKey, JSON.stringify([...valgteDivisjoner]))
          renderUke(currentWeek)
        })
        lbl.appendChild(cb)
        lbl.appendChild(document.createTextNode(div.name))
        fagDiv.appendChild(lbl)
      }
      filterPanel.appendChild(fagDiv)
    }
    filterPanel.appendChild(el('button', { class: 'btn btn-s', style: 'margin-left:auto', onclick: () => {
      valgteDivisjoner.clear()
      localStorage.setItem(filterKey, JSON.stringify([]))
      filterPanel.querySelectorAll('input[type=checkbox]').forEach(cb => { cb.checked = false })
      renderUke(currentWeek)
    }}, 'Vis alt'))
    filterContainer.appendChild(filterPanel)
  }

  let closeOverflowFn = null

  async function renderUke(weekNr) {
    const weekContainer = document.getElementById('week-container')
    if (weekContainer) clearEl(weekContainer)
    const wc = weekContainer || el('div', { id: 'week-container' })
    if (!weekContainer) main.appendChild(wc)

    // Fetch sessions
    let sesjonQuery = sb.from('sessions')
      .select('*, subjects(name, color_hex, short_code), users!teacher_id(full_name), session_divisions(division_id, subject_divisions(name, division_type))')
      .eq('class_id', klasse.id)
      .eq('week_nr', weekNr)
      .order('day_of_week')
    if (aktivtSkolear) sesjonQuery = sesjonQuery.eq('school_year', aktivtSkolear)
    const { data: sessions, error: sessionsError } = await sesjonQuery
    if (sessionsError) {
      console.error('Feil ved henting av økter:', sessionsError)
      showToast(`Kunne ikke hente ukeplanen: ${sessionsError.message}`, 'error')
    }
    await merkFellesOkter(sessions)

    // Fetch calendar events for the week (kalenderår utledet fra skoleåret)
    const visKalenderaar = skoleaarKalenderaar(aktivtSkolear, weekNr, APP.school?.school_year_start_week)
    const weekStartDate = isoWeekToDate(visKalenderaar, weekNr, 1)
    const weekEndDate = isoWeekToDate(visKalenderaar, weekNr, 5)
    const wStart = weekStartDate.toISOString().slice(0, 10)
    const wEnd = weekEndDate.toISOString().slice(0, 10)

    const { data: calEvents } = await sb.from('school_calendar')
      .select('*')
      .is('deleted_at', null)
      .lte('start_date', wEnd)
      .gte('end_date', wStart)

    const { data: multiDayEvents } = await sb.from('multi_day_events')
      .select('*')
      .is('deleted_at', null)
      .eq('school_id', APP.school.id)
      .or(`class_id.eq.${klasse.id},class_id.is.null`)
      .lte('start_date', wEnd)
      .gte('end_date', wStart)

    // Utskrift-hode (vises kun ved print)
    const utskriftHode = document.getElementById('utskrift-hode')
    if (utskriftHode) {
      const filtrertTekst = valgteDivisjoner.size > 0 ? ' (filtrert)' : ''
      utskriftHode.textContent = `${aktivtSkolear ? aktivtSkolear + ' ' : ''}${APP.school?.name || 'Ukeplan1e'}, klasse ${klasse.name} – Uke ${weekNr}${filtrertTekst}`
    }

    // Week navigation
    const navRow = el('div', { class: 'nav-bar' })
    const prevBtn = el('button', { class: 'btn btn-s', title: 'Gå til forrige uke', onclick: () => {
      if (ukePosisjon(weekNr, schoolStart) > 0) { currentWeek = weekNr === 1 ? 52 : weekNr - 1; renderUke(currentWeek) }
    }}, '← Forrige')
    if (ukePosisjon(weekNr, schoolStart) === 0) prevBtn.setAttribute('disabled', 'true')

    const weekInput = el('input', { type: 'number', class: 'uke-nr-input', value: weekNr,
      title: 'Skriv inn ukenummer og trykk Enter',
      min: 1, max: 52,
      onchange: (e) => {
        const v = parseInt(e.target.value)
        const p = ukePosisjon(v, schoolStart)
        if (p >= 0 && p <= ukePosisjon(schoolEnd, schoolStart)) { currentWeek = v; renderUke(currentWeek) }
      }
    })

    const nextBtn = el('button', { class: 'btn btn-s', title: 'Gå til neste uke', onclick: () => {
      if (ukePosisjon(weekNr, schoolStart) < ukePosisjon(schoolEnd, schoolStart)) { currentWeek = weekNr === 52 ? 1 : weekNr + 1; renderUke(currentWeek) }
    }}, 'Neste →')
    if (ukePosisjon(weekNr, schoolStart) >= ukePosisjon(schoolEnd, schoolStart)) nextBtn.setAttribute('disabled', 'true')

    const naaWeek = Math.min(Math.max(getCurrentISOWeek(), schoolStart), schoolEnd)
    const naaBtn = el('button', { class: 'btn btn-s', title: 'Gå til gjeldende uke', onclick: () => {
      currentWeek = naaWeek; renderUke(currentWeek)
    }}, 'Nå')
    if (weekNr === naaWeek) naaBtn.setAttribute('disabled', 'true')

    navRow.appendChild(prevBtn)
    navRow.appendChild(el('span', { class: 'uke-label' }, 'Uke '))
    navRow.appendChild(weekInput)
    navRow.appendChild(nextBtn)
    navRow.appendChild(naaBtn)

    // Filter-badge – åpner/lukker filterpanelet; vises kun om klassen har delte fag
    if (fagGrupper.length > 0) {
      const aktiveDivNavn = fagGrupper.flatMap(f => f.divisjoner).filter(d => valgteDivisjoner.has(d.id)).map(d => d.name)
      const badgeTekst = aktiveDivNavn.length > 0 ? `● ${aktiveDivNavn.join(', ')}` : 'Filter'
      const filterBadge = el('button', {
        class: 'btn btn-s elev-filter-badge' + (aktiveDivNavn.length > 0 ? ' elev-filter-badge--aktiv' : ''),
        title: 'Åpne/lukk filter for parti og grupper',
        onclick: (e) => {
          if (filterPanel) filterPanel.style.display = filterPanel.style.display === 'none' ? '' : 'none'
          e.stopPropagation()
        }
      }, badgeTekst)
      navRow.appendChild(filterBadge)
    }

    // [•••] overflow-meny for print og iCal
    const overflowWrap = el('div', { class: 'elev-overflow-wrap' })
    const overflowMenu = el('div', { class: 'elev-overflow-menu skjult' })
    overflowMenu.appendChild(el('button', { class: 'elev-overflow-item', onclick: () => { window.print(); overflowMenu.classList.add('skjult') }}, '🖨️ Skriv ut'))
    overflowMenu.appendChild(el('button', { class: 'elev-overflow-item', onclick: () => { visICalModal(klasse); overflowMenu.classList.add('skjult') }}, '📅 iCal-abonnement'))
    overflowWrap.appendChild(el('button', { class: 'btn btn-s', title: 'Skriv ut / iCal', onclick: (e) => { overflowMenu.classList.toggle('skjult'); e.stopPropagation() }}, '•••'))
    overflowWrap.appendChild(overflowMenu)
    navRow.appendChild(overflowWrap)

    // Lukk overflow-meny ved klikk utenfor
    if (closeOverflowFn) document.removeEventListener('click', closeOverflowFn)
    closeOverflowFn = (e) => { if (!overflowWrap.contains(e.target)) overflowMenu.classList.add('skjult') }
    document.addEventListener('click', closeOverflowFn)
    APP._closeOverflowFn = closeOverflowFn

    wc.appendChild(navRow)

    // Flerdagsbjelke-rad
    const weekDates = Array.from({length: 5}, (_, i) => isoWeekToDate(visKalenderaar, weekNr, i + 1).toISOString().slice(0, 10))
    const bjelkeRad = renderFlerdagsBjelkeRad(weekDates, multiDayEvents)
    if (bjelkeRad) wc.appendChild(bjelkeRad)

    // Week grid
    const grid = el('div', { class: 'uke-grid' })
    for (let dag = 1; dag <= 5; dag++) {
      const dayCol = el('div', { class: 'dag-kol' })
      const dateForDay = isoWeekToDate(visKalenderaar, weekNr, dag)
      const dayHeader = el('div', { class: 'dag-tittel' })
      dayHeader.appendChild(document.createTextNode(dagNavn(dag)))
      dayHeader.appendChild(el('span', { class: 'dag-dato' }, ` ${formatDatoNO(dateForDay.toISOString().slice(0, 10))}`))
      dayCol.appendChild(dayHeader)

      let daySessions = (sessions || []).filter(s => s.day_of_week === dag)
      // Vis økt hvis ingen divisjon (udelt fag) ELLER minst én valgt divisjon er blant øktens divisjoner
      if (valgteDivisjoner.size > 0) {
        daySessions = daySessions.filter(s => {
          const sdIds = (s.session_divisions || []).map(sd => sd.division_id)
          return sdIds.length === 0 || sdIds.some(id => valgteDivisjoner.has(id))
        })
      }
      // Sort alphabetically by subject name
      daySessions.sort((a, b) => (a.subjects?.name || '').localeCompare(b.subjects?.name || '', 'nb'))

      const sessionList = el('div', { class: 'dag-okter' })
      for (const s of daySessions) {
        const card = renderSessionCard(s, false)
        sessionList.appendChild(card)
      }

      // Check holiday for this day
      const dayStr = dateForDay.toISOString().slice(0, 10)
      if (calEvents) {
        const dayHoliday = calEvents.find(e => e.start_date <= dayStr && e.end_date >= dayStr && e.type === 'helligdag')
        if (dayHoliday) {
          dayCol.classList.add('day-col--holiday')
          dayCol.appendChild(el('div', { class: 'holiday-label' }, dayHoliday.title))
        }
      }

      dayCol.appendChild(sessionList)
      grid.appendChild(dayCol)
    }
    wc.appendChild(grid)

    // Realtime subscription
    if (APP.realtimeChannel) { sb.removeChannel(APP.realtimeChannel) }
    APP.realtimeChannel = subscribeSessions(klasse.id, weekNr, () => renderUke(weekNr))
  }

  await renderUke(currentWeek)
}

// Bygg "all-day"-rad med horisontale bjelker for flerdagshendelser.
// weekDates: array med 5 dato-strenger ['2026-02-23', ..., '2026-02-27'] (man→fre).
// Returnerer et DOM-element, eller null om ingen hendelser.
function renderFlerdagsBjelkeRad(weekDates, multiDayEvents) {
  if (!multiDayEvents || !multiDayEvents.length) return null
  const rad = el('div', { class: 'fdag-bjelke-rad' })
  for (const mde of multiDayEvents) {
    // Finn første synlige dag (startkolonne 1–5)
    let startCol = 1
    for (let i = 0; i < 5; i++) {
      if (mde.start_date <= weekDates[i]) { startCol = i + 1; break }
    }
    // Finn siste synlige dag (endkolonne 2–6, eksklusiv)
    let endCol = 6
    for (let i = 4; i >= 0; i--) {
      if (mde.end_date >= weekDates[i]) { endCol = i + 2; break }
    }
    rad.appendChild(el('div', {
      class: 'fdag-bjelke',
      style: `grid-column: ${startCol} / ${endCol}`,
      title: mde.title
    }, mde.title))
  }
  return rad.children.length ? rad : null
}

// ─── Økt-handlingsmeny (delt av kebab-klikk og sveip) ────────────────────────
let aktivHandlingsmeny = null

function visOktHandlinger(actions, anchorEl) {
  if (aktivHandlingsmeny) { aktivHandlingsmeny.remove(); aktivHandlingsmeny = null }

  const meny = el('div', { class: 'okt-handlingsmeny' })
  for (const { key, label, fare } of [
    { key: 'edit',     label: '✏️ Rediger' },
    { key: 'copy',     label: '📋 Kopier' },
    { key: 'del',      label: '🗑️ Slett',   fare: true },
    { key: 'transfer', label: '↗️ Overfør' },
  ]) {
    if (!actions[key]) continue
    meny.appendChild(el('button', {
      class: 'okt-handlingsrad' + (fare ? ' okt-handlingsrad--fare' : ''),
      onclick: (e) => { e.stopPropagation(); meny.remove(); aktivHandlingsmeny = null; actions[key]() }
    }, label))
  }

  document.body.appendChild(meny)
  aktivHandlingsmeny = meny

  const aR = anchorEl.getBoundingClientRect()
  const mR = meny.getBoundingClientRect()
  let top  = aR.bottom + 4
  let left = aR.right - mR.width
  if (left < 4) left = 4
  if (left + mR.width  > window.innerWidth  - 4) left = window.innerWidth  - mR.width  - 4
  if (top  + mR.height > window.innerHeight - 4) top  = aR.top - mR.height - 4
  meny.style.top  = top  + 'px'
  meny.style.left = left + 'px'

  const lukkUtenfor = (e) => {
    if (!meny.contains(e.target)) {
      meny.remove(); aktivHandlingsmeny = null
      document.removeEventListener('click',   lukkUtenfor, true)
      document.removeEventListener('keydown', lukkEsc)
    }
  }
  const lukkEsc = (e) => {
    if (e.key === 'Escape') {
      meny.remove(); aktivHandlingsmeny = null
      document.removeEventListener('click',   lukkUtenfor, true)
      document.removeEventListener('keydown', lukkEsc)
    }
  }
  setTimeout(() => {
    document.addEventListener('click',   lukkUtenfor, true)
    document.addEventListener('keydown', lukkEsc)
  }, 0)
}

function renderSessionCard(s, showActions, actions = {}) {
  const color = s.subjects?.color_hex || '#4a90d9'
  const card = el('div', { class: 'okt-kort', style: `border-left: 4px solid ${color}` })

  card.appendChild(el('div', { class: 'fag-badge' }, s.subjects?.name || 'Ukjent fag'))
  if (s.activity) card.appendChild(el('div', { class: 'aktivitet' }, truncate(s.activity)))

  if (showActions) {
    card.classList.add('okt-kort--handlinger')

    // Sekundærinnhold: på mobil skjult som standard, tap utvider
    const detaljer = el('div', { class: 'okt-detaljer' })
    if (s.meeting_point) detaljer.appendChild(el('div', { class: 'session-card__meeting' }, `📍 ${s.meeting_point}`))
    if (s.info) detaljer.appendChild(el('div', { class: 'session-card__info' }, truncate(s.info)))
    if (s.users) detaljer.appendChild(el('div', { class: 'session-card__teacher' }, s.users.full_name))
    for (const sd of s.session_divisions || []) {
      if (sd.subject_divisions) detaljer.appendChild(el('div', { class: 'div-badge' }, sd.subject_divisions.name))
    }
    if (s._fellesMed?.length) detaljer.appendChild(el('div', { class: 'felles-badge', title: 'Fellesundervisning' }, `👥 Felles med ${s._fellesMed.join(', ')}`))
    if (detaljer.children.length) card.appendChild(detaljer)

    // Kebab-knapp (⋮) — diskret, åpner handlingsmeny
    const kebabBtn = el('button', { class: 'okt-kebab', title: 'Handlinger',
      onclick: (e) => { e.stopPropagation(); visOktHandlinger(actions, kebabBtn) }
    }, '⋮')
    card.appendChild(kebabBtn)

    // Høyreklikk — valgfri snarvei på desktop
    card.addEventListener('contextmenu', (e) => { e.preventDefault(); visOktHandlinger(actions, kebabBtn) })

    // Touch-gester: sveip venstre = handlinger, kort trykk = utvid detaljer
    let tX = 0, tY = 0, dX = 0, dY = 0, sveip = false
    card.addEventListener('touchstart', (e) => {
      tX = e.touches[0].clientX; tY = e.touches[0].clientY
      dX = 0; dY = 0; sveip = false
    }, { passive: true })
    card.addEventListener('touchmove', (e) => {
      if (!e.touches[0]) return
      dX = e.touches[0].clientX - tX
      dY = e.touches[0].clientY - tY
      if (!sveip && Math.abs(dX) > 10 && Math.abs(dX) > Math.abs(dY) * 2) sveip = true
      if (sveip) e.preventDefault()
    }, { passive: false })
    card.addEventListener('touchend', () => {
      if (sveip && dX < -50 && Math.abs(dY) < 30) {
        visOktHandlinger(actions, kebabBtn)
      } else if (!sveip && Math.abs(dX) < 10 && Math.abs(dY) < 10) {
        if (detaljer.parentNode) detaljer.classList.toggle('okt-detaljer--apnet')
      }
      sveip = false
    })
  } else {
    // Elevvisning — alle detaljer alltid synlige
    if (s.meeting_point) card.appendChild(el('div', { class: 'session-card__meeting' }, `📍 ${s.meeting_point}`))
    if (s.info) card.appendChild(el('div', { class: 'session-card__info' }, truncate(s.info)))
    if (s.users) card.appendChild(el('div', { class: 'session-card__teacher' }, s.users.full_name))
    for (const sd of s.session_divisions || []) {
      if (sd.subject_divisions) card.appendChild(el('div', { class: 'div-badge' }, sd.subject_divisions.name))
    }
    if (s._fellesMed?.length) card.appendChild(el('div', { class: 'felles-badge', title: 'Fellesundervisning' }, `👥 Felles med ${s._fellesMed.join(', ')}`))
  }

  return card
}

function visICalModal(klasse) {
  const baseUrl = `${SUPABASE_URL}/functions/v1/ical`
  const schoolId = APP.school?.id ?? ''

  // Les elevens filter fra localStorage om dette gjelder en klasse
  let divisionParam = ''
  let erFiltrert = false
  if (klasse) {
    const savedFilter = localStorage.getItem(`ukeplan_elevfilter_${klasse.name}`)
    const valgte = savedFilter ? JSON.parse(savedFilter) : []
    if (Array.isArray(valgte) && valgte.length > 0) {
      divisionParam = `&divisions=${valgte.join(',')}`
      erFiltrert = true
    }
  }

  const url = klasse
    ? `${baseUrl}?school_id=${schoolId}&klasse=${encodeURIComponent(klasse.name)}${divisionParam}`
    : `${baseUrl}?school_id=${schoolId}&laerer=${encodeURIComponent(APP.profile?.full_name ?? '')}`

  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal', style: 'max-width:380px;text-align:center' })
  box.appendChild(el('h3', {}, 'iCal-abonnement'))

  // QR-kode
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
  box.appendChild(el('img', { src: qrUrl, alt: 'QR-kode', style: 'display:block;margin:10px auto;border:1px solid var(--kant);border-radius:6px;width:160px;height:160px' }))

  // URL-felt + kopier
  const urlRad = el('div', { style: 'display:flex;gap:6px;margin:10px 0' })
  const input = el('input', { class: 'felt input', value: url, readonly: 'true', style: 'flex:1;font-size:.75rem' })
  urlRad.appendChild(input)
  urlRad.appendChild(el('button', { class: 'btn btn-s', title: 'Kopier lenke', onclick: () => {
    navigator.clipboard.writeText(url); showToast('Kopiert!', 'success')
  }}, 'Kopier'))
  box.appendChild(urlRad)

  // Direkte kalender-knapper
  const knRad = el('div', { style: 'display:flex;flex-direction:column;gap:8px;margin:12px 0' })
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(url)}`
  const appleUrl = url  // webcal:// fungerer ikke alltid; bruk direktelenke
  const outlookUrl = `https://outlook.live.com/calendar/0/addcalendar?url=${encodeURIComponent(url)}`
  knRad.appendChild(el('a', { href: googleUrl, target: '_blank', class: 'btn btn-s', style: 'text-decoration:none;text-align:center' }, '📅 Legg til i Google Kalender'))
  knRad.appendChild(el('a', { href: `webcal://${url.replace(/^https?:\/\//, '')}`, class: 'btn btn-s', style: 'text-decoration:none;text-align:center' }, '🍎 Legg til i Apple Kalender'))
  knRad.appendChild(el('a', { href: outlookUrl, target: '_blank', class: 'btn btn-s', style: 'text-decoration:none;text-align:center' }, '📧 Legg til i Outlook'))
  box.appendChild(knRad)

  if (erFiltrert) {
    box.appendChild(el('p', { class: 'tekst-svak', style: 'font-size:.82rem;margin:10px 0 6px;text-align:left' },
      '🔍 Lenken er filtrert til dine valgte parti/grupper. Hent ny lenke her hvis du endrer filteret.'))
  }
  box.appendChild(el('button', { class: 'btn btn-s', style: 'width:100%', onclick: () => modal.remove() }, 'Lukk'))
  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

// ─────────────────────────────────────────
// LÆRER VIEW
// ─────────────────────────────────────────

async function renderLaererView() {
  const main = document.getElementById('app-main')
  clearEl(main)
  APP.currentView = 'laerer'
  APP.currentKlasse = null
  if (!APP.profile || !APP.school) {
    main.appendChild(el('div', { class: 'laster-start' }, 'Laster…'))
    return
  }
  oppdaterHeader()

  const isKontakt = APP.profile?.role === 'kontaktlaerer' || APP.isAdminActive

  // Klasser til velgeren (gjelder alle roller): «Dine klasser» via user_classes,
  // «Andre klasser» = resten av skolens klasser. RLS tillater lesing av alle
  // ikke-slettede klasser, så også vanlige lærere får hele skolens liste.
  const { data: mineRows } = await sb.from('user_classes')
    .select('classes(*)')
    .eq('user_id', APP.profile.id)
  const mineKlasser = (mineRows || []).map(r => r.classes).filter(Boolean)
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'no'))
  const mineIds = new Set(mineKlasser.map(k => k.id))
  const { data: alleRows } = await sb.from('classes')
    .select('*').eq('school_id', APP.school.id).order('name')
  const andreKlasser = (alleRows || []).filter(k => !mineIds.has(k.id))
  let aktivKlasse = mineKlasser[0] || andreKlasser[0] || null

  const tabs = ['Min klasse', 'Alle mine økter', 'Søk']
  const tabSlugs = ['klasse', 'alle', 'sok']
  if (isKontakt) { tabs.push('Klasse-admin'); tabSlugs.push('klasse-admin') }
  // «Profil» (innstillinger) ligger i hamburgeren, ikke som synlig fane. Slug-en
  // beholdes så #/laerer/innstillinger fortsatt rendrer innholdet via setTab.
  tabs.push('Profil'); tabSlugs.push('innstillinger')

  const hashTab = location.hash.split('/')[2]
  const initTab = Math.max(0, tabSlugs.indexOf(hashTab))

  const tabBar = el('div', { class: 'fane-bar' })
  const tabContent = el('div', { class: 'fane-innhold' })

  function setTab(idx) {
    const slug = tabSlugs[idx]
    history.replaceState(null, '', `#/laerer/${slug}`)
    tabBar.querySelectorAll('.fane').forEach((b, i) => b.classList.toggle('aktiv', i === idx))
    clearEl(tabContent)
    if (slug !== 'klasse') { APP.klasseVelger = null; oppdaterHeader() }
    if (slug === 'klasse') renderMinKlasseTab(tabContent, aktivKlasse)
    else if (slug === 'alle') renderAlleOkterTab(tabContent)
    else if (slug === 'sok') renderSokTab(tabContent)
    else if (slug === 'klasse-admin') renderKlasseAdminTab(tabContent)
    else if (slug === 'innstillinger') renderInnstillingerTab(tabContent)
  }

  // Fane 0 = klassevelger: native <select> med optgroup «Dine»/«Andre klasser».
  // Alltid åpningsbar (også med kun én egen klasse).
  const velgerSel = el('select', { class: 'fane-velger-sel', title: 'Velg klasse' })
  const leggTilGruppe = (label, liste) => {
    if (!liste.length) return
    const og = el('optgroup', { label })
    for (const k of liste) {
      const opt = el('option', { value: k.id }, k.name)
      if (aktivKlasse && k.id === aktivKlasse.id) opt.selected = true
      og.appendChild(opt)
    }
    velgerSel.appendChild(og)
  }
  leggTilGruppe('Dine klasser', mineKlasser)
  leggTilGruppe('Andre klasser', andreKlasser)
  // Hindre at klikk på selve nedtrekkslista trigger fane-byttet (som ville
  // re-rendre uke-visningen og nullstille valgt uke).
  velgerSel.addEventListener('click', (e) => e.stopPropagation())
  velgerSel.addEventListener('change', () => {
    const k = [...mineKlasser, ...andreKlasser].find(x => x.id === velgerSel.value)
    if (!k) return
    aktivKlasse = k
    oppdaterKlasseStatisk(k.name)
    // På klasse-fanen: bytt klasse uten å miste valgt uke. Ellers: gå til fanen.
    if (APP.klasseVelger && APP.klasseVelger.setKlasse) APP.klasseVelger.setKlasse(k)
    else setTab(0)
  })
  const velgerFane = el('div',
    { class: 'fane fane-velger', title: 'Velg klasse',
      onclick: () => { if (!velgerFane.classList.contains('aktiv')) setTab(0) } },
    'Klasse ', velgerSel)

  tabs.forEach((t, i) => {
    if (i === 0) { tabBar.appendChild(velgerFane); return }
    if (tabSlugs[i] === 'innstillinger') return  // vises via hamburger («Profil»)
    const btn = el('button', { class: 'fane', title: `Gå til ${t}`, onclick: () => setTab(i) }, t)
    tabBar.appendChild(btn)
  })

  const wrap = el('div', { class: 'side-wrap' })
  wrap.appendChild(tabBar)
  wrap.appendChild(tabContent)
  main.appendChild(wrap)
  setTab(initTab)
}

async function renderInnstillingerTab(container) {
  const wrap = el('div', { class: 'skjema-smal' })
  wrap.appendChild(el('h3', {}, 'Profil'))

  // Kontoinfo
  const { data: { user } } = await sb.auth.getUser()
  const naavaerendeEpost = user?.email || ''

  const info = el('div', { class: 'subj-config-box', style: 'margin-bottom:18px' })
  info.appendChild(el('div', { style: 'font-weight:600;margin-bottom:2px' }, APP.profile?.full_name || ''))
  info.appendChild(el('div', { class: 'tekst-svak', style: 'font-size:.88rem' }, naavaerendeEpost))
  const rolleNavn = { laerer: 'Lærer', kontaktlaerer: 'Kontaktlærer', admin: 'Administrator' }
  info.appendChild(el('div', { class: 'tekst-svak', style: 'font-size:.82rem;margin-top:4px' }, rolleNavn[APP.profile?.role] || APP.profile?.role || ''))
  wrap.appendChild(info)

  // Bytt passord
  wrap.appendChild(el('div', { class: 'seksjon-tittel', style: 'margin-top:18px' }, 'Passord'))
  wrap.appendChild(el('button', { class: 'btn btn-p', title: 'Endre ditt innloggingspassord', onclick: () => visSettPassordModal({ tittel: 'Bytt passord' }) }, 'Bytt passord'))

  // Bytt e-post
  wrap.appendChild(el('div', { class: 'seksjon-tittel', style: 'margin-top:18px' }, 'E-postadresse'))
  const epostForm = el('form', { class: 'skjema' })
  const epostFeil = el('p', { class: 'feil-tekst skjult' })
  epostForm.appendChild(epostFeil)
  const epostInput = el('input', { type: 'email', class: 'felt input', value: naavaerendeEpost, required: 'true' })
  epostForm.appendChild(lagFormRad('Ny e-postadresse', epostInput))
  const epostBtn = el('button', { type: 'submit', class: 'btn btn-p' }, 'Endre e-post')
  epostForm.appendChild(epostBtn)
  epostForm.appendChild(el('p', { class: 'tekst-svak', style: 'font-size:.82rem;margin-top:8px' },
    'Du må bekrefte endringen via en lenke som sendes til både den gamle og den nye adressen.'))
  epostForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    epostFeil.classList.add('skjult')
    const ny = epostInput.value.trim()
    if (!ny || ny === naavaerendeEpost) {
      epostFeil.textContent = 'Skriv inn en ny e-postadresse'; epostFeil.classList.remove('skjult'); return
    }
    try {
      await medLagreOverlay(() => byttEpost(ny))
      showToast('Bekreftelse sendt – sjekk e-posten din', 'info')
    } catch (err) {
      epostFeil.textContent = err.message; epostFeil.classList.remove('skjult')
    }
  })
  wrap.appendChild(epostForm)

  container.appendChild(wrap)
}

async function renderMinKlasseTab(container, klasse) {
  // Aktiv klasse styres av klassevelger-fanen (renderLaererView). Faller tilbake
  // til en informativ melding hvis skolen ikke har noen klasser.
  let aktivKlasse = klasse
  if (!aktivKlasse) {
    container.appendChild(el('p', {}, 'Det finnes ingen klasser å vise ennå.'))
    return
  }

  const schoolStart = APP.school?.school_year_start_week || 1
  const schoolEnd = APP.school?.school_year_end_week || 52
  let currentWeek = getCurrentISOWeek()
  if (currentWeek < schoolStart) currentWeek = schoolStart
  if (currentWeek > schoolEnd) currentWeek = schoolEnd

  // Hent tilgjengelige skoleår for denne skolen (for skoleår-velger)
  const aktivtSkolear = APP.school?.active_school_year || null
  const nesteAar = nesteSkolear(aktivtSkolear)
  let valgtSkolear = aktivtSkolear
  let tilgjengeligeSkolear = aktivtSkolear ? [aktivtSkolear] : []
  try {
    const { data: aarRows } = await sb.from('sessions')
      .select('school_year')
      .eq('school_id', APP.school.id)
      .not('school_year', 'is', null)
    const unikeAar = [...new Set((aarRows || []).map(r => r.school_year))].sort().reverse()
    if (unikeAar.length) {
      tilgjengeligeSkolear = unikeAar
      if (!valgtSkolear) valgtSkolear = unikeAar[0]
    }
  } catch {}

  // Fra 17. mai: legg til neste skoleår i velgeren som planleggingsvindu
  if (nesteAar && erNesteAarVinduApent() && !tilgjengeligeSkolear.includes(nesteAar)) {
    tilgjengeligeSkolear = [nesteAar, ...tilgjengeligeSkolear]
  }

  // Eksponer klassevelger-koblingen for fanen (renderLaererView): setKlasse
  // bytter klasse uten å miste valgt uke. aktivKlasse brukes også av
  // oppdaterHeader til den statiske «klasse X»-teksten.
  APP.klasseVelger = { aktivKlasse, setKlasse: (k) => { aktivKlasse = k; APP.klasseVelger.aktivKlasse = k; renderUke() } }
  oppdaterHeader()

  const topRow = el('div', { class: 'laerer-top' })

  // Skoleår-velger (vises når det finnes mer enn ett alternativ)
  let aarSel = null
  if (tilgjengeligeSkolear.length > 1) {
    aarSel = el('select', { class: 'skolear-sel', title: 'Velg skoleår å vise' })
    for (const aa of tilgjengeligeSkolear) {
      let label = aa
      if (aa === aktivtSkolear) label += ' (aktivt)'
      else if (aa === nesteAar && erNesteAarVinduApent()) label += ' (planlegg)'
      const opt = el('option', { value: aa }, label)
      if (aa === valgtSkolear) opt.selected = true
      aarSel.appendChild(opt)
    }
    aarSel.addEventListener('change', () => { valgtSkolear = aarSel.value; renderUke() })
    topRow.appendChild(aarSel)
  }

  const nyOktBtn = el('button', { class: 'btn btn-p', title: 'Legg til en ny økt denne uken', onclick: () => visNyOktModal(aktivKlasse, currentWeek, renderUke, valgtSkolear) }, '+ Ny økt')
  topRow.appendChild(nyOktBtn)
  topRow.appendChild(el('button', { class: 'btn btn-s', title: 'Lim inn ukeplan som tekst og la AI tolke den', onclick: () => visAIPasteModal(aktivKlasse, renderUke) }, '🤖 Lim inn med AI'))

  const delWrapper = el('div', { class: 'del-dropdown-wrapper' })
  const delBtn = el('button', { class: 'btn btn-s', title: 'Del eller skriv ut' }, '🔗 Del elevlenke ▾')
  const delMenu = el('div', { class: 'del-dropdown-menu skjult' })
  delMenu.appendChild(el('button', { class: 'del-dropdown-item', onclick: () => { delMenu.classList.add('skjult'); visElevLenkeModal(aktivKlasse) } }, '🔗 Elevlenke'))
  delMenu.appendChild(el('button', { class: 'del-dropdown-item', onclick: () => { delMenu.classList.add('skjult'); window.print() } }, '🖨️ Skriv ut'))
  delMenu.appendChild(el('button', { class: 'del-dropdown-item', onclick: () => { delMenu.classList.add('skjult'); visICalModal(aktivKlasse) } }, '📅 iCal-abonnement'))
  delBtn.onclick = (e) => { e.stopPropagation(); delMenu.classList.toggle('skjult') }
  document.addEventListener('click', () => delMenu.classList.add('skjult'), { capture: false })
  delWrapper.appendChild(delBtn)
  delWrapper.appendChild(delMenu)
  topRow.appendChild(delWrapper)
  container.appendChild(topRow)

  const weekArea = el('div', { id: 'laerer-week-area' })
  container.appendChild(weekArea)

  let bulkSelected = new Set()
  let ukeRenderToken = 0

  async function renderUke() {
    const myToken = ++ukeRenderToken
    clearEl(weekArea)
    bulkSelected.clear()

    // Skrivebeskyttet for historiske år; aktivt år OG neste år (planleggingsvindu) er skrivbare
    const erSkrivbar = !valgtSkolear || valgtSkolear === aktivtSkolear ||
      (valgtSkolear === nesteAar && erNesteAarVinduApent())
    const erAktivtAar = erSkrivbar  // brukes videre for tilgangskontroll på knapper

    // Vis/skjul "+ Ny økt"-knapp basert på skrivetilgang
    if (nyOktBtn) nyOktBtn.style.display = erSkrivbar ? '' : 'none'

    // Utskrift-hode (vises kun ved print)
    const utskriftHode = document.getElementById('utskrift-hode')
    if (utskriftHode) {
      utskriftHode.textContent = `${APP.school?.name || 'Ukeplan1e'} – ${aktivKlasse.name} – Uke ${currentWeek}`
    }

    const navRow = el('div', { class: 'nav-bar' })
    const prevBtn = el('button', { class: 'btn btn-s', title: 'Gå til forrige uke', onclick: () => {
      if (ukePosisjon(currentWeek, schoolStart) > 0) { currentWeek = currentWeek === 1 ? 52 : currentWeek - 1; renderUke() }
    }}, '← Forrige')
    if (ukePosisjon(currentWeek, schoolStart) === 0) prevBtn.setAttribute('disabled', 'true')

    const nextBtn = el('button', { class: 'btn btn-s', title: 'Gå til neste uke', onclick: () => {
      if (ukePosisjon(currentWeek, schoolStart) < ukePosisjon(schoolEnd, schoolStart)) { currentWeek = currentWeek === 52 ? 1 : currentWeek + 1; renderUke() }
    }}, 'Neste →')
    if (ukePosisjon(currentWeek, schoolStart) >= ukePosisjon(schoolEnd, schoolStart)) nextBtn.setAttribute('disabled', 'true')

    const weekInput = el('input', { type: 'number', class: 'uke-nr-input', value: currentWeek,
      title: 'Skriv inn ukenummer og trykk Enter',
      min: schoolStart, max: schoolEnd,
      onchange: (e) => {
        const v = parseInt(e.target.value)
        if (v >= schoolStart && v <= schoolEnd) { currentWeek = v; renderUke() }
      }
    })

    const naaWeek = Math.min(Math.max(getCurrentISOWeek(), schoolStart), schoolEnd)
    const naaBtn = el('button', { class: 'btn btn-s', title: 'Gå til gjeldende uke', onclick: () => {
      currentWeek = naaWeek; renderUke()
    }}, 'Nå')
    if (currentWeek === naaWeek) naaBtn.setAttribute('disabled', 'true')

    navRow.appendChild(prevBtn)
    navRow.appendChild(el('span', { class: 'uke-label' }, 'Uke '))
    navRow.appendChild(weekInput)
    navRow.appendChild(nextBtn)
    navRow.appendChild(naaBtn)
    navRow.appendChild(el('button', { class: 'btn btn-s', title: 'Skriv ut ukeplanen', onclick: () => window.print() }, '🖨️'))
    navRow.appendChild(el('button', { class: 'btn btn-s', title: 'Abonner på kalender (iCal)', onclick: () => visICalModal(null) }, '📅'))
    weekArea.appendChild(navRow)

    // Banner: les-modus for historiske år / planlegging for neste år
    if (!erSkrivbar) {
      weekArea.appendChild(el('div', { class: 'tidligare-aar-banner' },
        `📚 Du leser skoleår ${valgtSkolear}. Du kan kopiere økter, men ikke redigere eller slette.`
      ))
    } else if (valgtSkolear === nesteAar) {
      weekArea.appendChild(el('div', { class: 'neste-aar-banner' },
        `📅 Planleggingsvindu for ${valgtSkolear}. Øktene blir synlige for elever når dette settes som aktivt skoleår.`
      ))
    }

    let laererSesjonQuery = sb.from('sessions')
      .select('*, subjects(name, color_hex, short_code), users!teacher_id(full_name), session_divisions(division_id, subject_divisions(name, division_type))')
      .eq('class_id', aktivKlasse.id)
      .eq('week_nr', currentWeek)
    if (valgtSkolear) laererSesjonQuery = laererSesjonQuery.eq('school_year', valgtSkolear)
    const { data: sessions, error: sessionsError } = await laererSesjonQuery
    if (myToken !== ukeRenderToken) return  // nyere render har startet, avbryt denne
    if (sessionsError) {
      console.error('Feil ved henting av økter:', sessionsError)
      showToast(`Kunne ikke hente ukeplanen: ${sessionsError.message}`, 'error')
    }
    await merkFellesOkter(sessions)
    if (myToken !== ukeRenderToken) return

    // Hent skolerute og flerdagshendelser for uka
    const visKalenderaarL = skoleaarKalenderaar(valgtSkolear, currentWeek, APP.school?.school_year_start_week)
    const weekStartL = isoWeekToDate(visKalenderaarL, currentWeek, 1).toISOString().slice(0, 10)
    const weekEndL = isoWeekToDate(visKalenderaarL, currentWeek, 5).toISOString().slice(0, 10)
    const [{ data: calEvents }, { data: multiDayEventsL }] = await Promise.all([
      sb.from('school_calendar').select('*').is('deleted_at', null)
        .eq('school_id', APP.school.id)
        .lte('start_date', weekEndL).gte('end_date', weekStartL),
      sb.from('multi_day_events').select('*').is('deleted_at', null)
        .eq('school_id', APP.school.id)
        .or(`class_id.eq.${aktivKlasse.id},class_id.is.null`)
        .lte('start_date', weekEndL).gte('end_date', weekStartL)
    ])
    if (myToken !== ukeRenderToken) return

    // Bulk edit bar
    const bulkBar = el('div', { class: 'bulk-bar', style: 'display:none' })
    const bulkCount = el('span', {}, '0 valgt')
    bulkBar.appendChild(bulkCount)
    bulkBar.appendChild(el('button', { class: 'btn btn-s', title: 'Rediger alle valgte økter samtidig', onclick: () => visBulkEditModal([...bulkSelected], renderUke) }, 'Rediger valgte'))
    bulkBar.appendChild(el('button', { class: 'btn btn-s', title: 'Kopier alle valgte økter til en annen uke', onclick: () => {
      const valgte = (sessions || []).filter(s => bulkSelected.has(s.id))
      visBulkKopierModal(valgte, renderUke)
    }}, 'Kopier valgte'))
    bulkBar.appendChild(el('button', { class: 'btn btn-f', title: 'Slett alle valgte økter', onclick: async () => {
      if (!confirm('Slette alle valgte?')) return
      await medLagreOverlay(async () => {
        for (const id of bulkSelected) {
          await sb.from('sessions').delete().eq('id', id)
        }
      })
      renderUke()
    }}, 'Slett valgte'))
    weekArea.appendChild(bulkBar)

    function oppdaterBulkBar() {
      bulkBar.style.display = bulkSelected.size > 0 ? 'flex' : 'none'
      bulkCount.textContent = `${bulkSelected.size} valgt`
    }

    const grid = el('div', { class: 'uke-grid' })
    for (let dag = 1; dag <= 5; dag++) {
      const dayCol = el('div', { class: 'dag-kol' })
      const dateForDayL = isoWeekToDate(visKalenderaarL, currentWeek, dag)
      const dayStrL = dateForDayL.toISOString().slice(0, 10)
      const dayHeader = el('div', { class: 'dag-tittel' })
      dayHeader.appendChild(document.createTextNode(dagNavn(dag)))
      dayHeader.appendChild(el('span', { class: 'dag-dato' }, ` ${formatDatoNO(dayStrL)}`))
      dayCol.appendChild(dayHeader)

      const dayHoliday = (calEvents || []).find(e => e.start_date <= dayStrL && e.end_date >= dayStrL && e.type === 'helligdag')
      if (dayHoliday) {
        dayCol.classList.add('day-col--holiday')
        dayCol.appendChild(el('div', { class: 'holiday-label' }, dayHoliday.title))
      }

      let daySessions = (sessions || []).filter(s => s.day_of_week === dag)
      daySessions.sort((a, b) => (a.subjects?.name || '').localeCompare(b.subjects?.name || '', 'nb'))

      for (const s of daySessions) {
        const isMine = s.teacher_id === APP.profile.id
        const isKontakt = APP.profile?.role === 'kontaktlaerer' || APP.isAdminActive

        const wrapper = el('div', { class: 'session-wrapper' })

        if (erAktivtAar && (isMine || isKontakt)) {
          const cb = el('input', { type: 'checkbox', class: 'session-cb' })
          if (isMine) {
            cb.addEventListener('change', () => {
              if (cb.checked) bulkSelected.add(s.id)
              else bulkSelected.delete(s.id)
              oppdaterBulkBar()
            })
          } else {
            cb.setAttribute('disabled', 'true')
          }
          wrapper.appendChild(cb)
        }

        const card = renderSessionCard(s, true, {
          // Kollegahjelp: alle lærere kan redigere, men andres økter krever bekreftelse
          edit: erAktivtAar ? () => {
            if (!isMine && !isKontakt && !bekreftKollegahjelp(s)) return
            visRedigerOktModal(s, renderUke)
          } : null,
          copy: () => visKopierOktModal(s, renderUke),
          del: erAktivtAar && (isMine || isKontakt) ? () => slettOkt(s.id, renderUke) : null,
          transfer: erAktivtAar && isMine ? () => visOverforModal(s, renderUke) : null,
        })
        wrapper.appendChild(card)
        dayCol.appendChild(wrapper)
      }

      grid.appendChild(dayCol)
    }

    const weekDatesL = Array.from({length: 5}, (_, i) => isoWeekToDate(visKalenderaarL, currentWeek, i + 1).toISOString().slice(0, 10))
    const bjelkeRadL = renderFlerdagsBjelkeRad(weekDatesL, multiDayEventsL)
    if (bjelkeRadL) weekArea.appendChild(bjelkeRadL)
    weekArea.appendChild(grid)

    if (APP.realtimeChannel) sb.removeChannel(APP.realtimeChannel)
    APP.realtimeChannel = subscribeSessions(aktivKlasse.id, currentWeek, (payload) => {
      if (payload.eventType === 'UPDATE' && payload.new?.teacher_id !== APP.profile.id) {
        showToast(`Endret av ${payload.new?.teacher_name || 'noen andre'}`, 'info')
      }
      renderUke()
    })
  }

  await renderUke()
}

async function renderAlleOkterTab(container) {
  const aktivtSkolear = APP.school?.active_school_year
  let alleOkterQuery = sb.from('sessions')
    .select('*, subjects(name, color_hex, short_code), classes(name), session_divisions(division_id, subject_divisions(name, division_type))')
    .eq('teacher_id', APP.profile.id)
    .order('week_nr')
    .order('day_of_week')
  if (aktivtSkolear) alleOkterQuery = alleOkterQuery.eq('school_year', aktivtSkolear)
  const { data: sessions } = await alleOkterQuery

  if (!sessions || !sessions.length) {
    container.appendChild(el('p', {}, 'Ingen økter funnet.'))
    return
  }

  // Group by week
  const byWeek = {}
  for (const s of sessions) {
    if (!byWeek[s.week_nr]) byWeek[s.week_nr] = []
    byWeek[s.week_nr].push(s)
  }

  for (const week of Object.keys(byWeek).sort((a, b) => a - b)) {
    container.appendChild(el('h3', {}, `Uke ${week}`))
    const list = el('div', { class: 'dag-okter' })
    for (const s of byWeek[week]) {
      const card = renderSessionCard(s, true, {
        edit: () => visRedigerOktModal(s, () => renderAlleOkterTab(container)),
        copy: () => visKopierOktModal(s, () => renderAlleOkterTab(container)),
        del: () => slettOkt(s.id, () => renderAlleOkterTab(container)),
        transfer: () => visOverforModal(s, () => renderAlleOkterTab(container)),
      })
      const klasseLabel = el('span', { class: 'session-card__class' }, s.classes?.name || '')
      card.prepend(klasseLabel)
      list.appendChild(card)
    }
    container.appendChild(list)
  }
}

async function renderSokTab(container) {
  const aktivtSkolear = APP.school?.active_school_year || null

  // Hent tilgjengelige skoleår for filter
  let tilgjengeligeSkolear = aktivtSkolear ? [aktivtSkolear] : []
  try {
    const { data: aarRows } = await sb.from('sessions')
      .select('school_year')
      .eq('teacher_id', APP.profile.id)
      .not('school_year', 'is', null)
    const unikeAar = [...new Set((aarRows || []).map(r => r.school_year))].sort().reverse()
    if (unikeAar.length) tilgjengeligeSkolear = unikeAar
  } catch {}

  let valgtSkolear = aktivtSkolear

  const searchInput = el('input', { type: 'search', class: 'felt input', placeholder: 'Søk i aktivitet, sted, info, fag, lærer…', style: 'flex:1;min-width:200px' })
  const results = el('div', { class: 'search-results' })

  // Skoleår-filter (vises bare hvis det finnes mer enn ett år)
  let aarSel = null
  if (tilgjengeligeSkolear.length > 1) {
    aarSel = el('select', { class: 'skolear-sel', title: 'Velg skoleår å søke i' })
    for (const aa of tilgjengeligeSkolear) {
      const opt = el('option', { value: aa }, aa + (aa === aktivtSkolear ? ' (aktivt)' : ''))
      if (aa === valgtSkolear) opt.selected = true
      aarSel.appendChild(opt)
    }
    aarSel.addEventListener('change', () => { valgtSkolear = aarSel.value; doSearch() })
  }

  async function doSearch() {
    const q = searchInput.value.trim()
    clearEl(results)
    if (!q) return

    let sokQuery = sb.from('sessions')
      .select('*, subjects(name, color_hex), users!teacher_id(full_name), classes(name)')
      .or(`activity.ilike.%${q}%,meeting_point.ilike.%${q}%,info.ilike.%${q}%`)
      .eq('teacher_id', APP.profile.id)
    if (valgtSkolear) sokQuery = sokQuery.eq('school_year', valgtSkolear)
    const { data } = await sokQuery

    // Also search by subject name and teacher name with a join – approximate via client side
    if (!data || !data.length) {
      results.appendChild(el('p', {}, 'Ingen resultater.'))
      return
    }

    // Skrivebeskyttet for tidligere skoleår – kun les + kopi
    const erAktivtAar = !valgtSkolear || valgtSkolear === aktivtSkolear

    for (const s of data) {
      const card = renderSessionCard(s, true, {
        edit: erAktivtAar ? () => visRedigerOktModal(s, doSearch) : null,
        copy: () => visKopierOktModal(s, doSearch),
        del: erAktivtAar ? () => slettOkt(s.id, doSearch) : null,
      })
      const klasseLabel = el('span', { class: 'session-card__class' }, `${s.classes?.name} – Uke ${s.week_nr} ${dagNavn(s.day_of_week)}`)
      card.prepend(klasseLabel)
      results.appendChild(card)
    }
  }

  searchInput.addEventListener('input', doSearch)

  const sokRad = el('div', { class: 'laerer-top' })
  sokRad.appendChild(searchInput)
  if (aarSel) sokRad.appendChild(aarSel)
  container.appendChild(sokRad)
  container.appendChild(results)
}

// ─────────────────────────────────────────
// SESSION MODALS
// ─────────────────────────────────────────

function visElevLenkeModal(klasse) {
  const url = `${location.origin}${location.pathname}#/klasse/${encodeURIComponent(klasse.name)}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}`

  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal', style: 'max-width:360px;text-align:center' })

  box.appendChild(el('h3', {}, `Elevlenke – ${klasse.name}`))
  box.appendChild(el('img', { src: qrUrl, alt: 'QR-kode', style: 'display:block;margin:12px auto;border:1px solid var(--kant);border-radius:6px' }))
  box.appendChild(el('p', { style: 'font-size:.8rem;color:var(--tekst-svak);word-break:break-all;margin:0 0 12px' }, url))

  const kopierBtn = el('button', { class: 'btn btn-p', onclick: async () => {
    await navigator.clipboard.writeText(url)
    kopierBtn.textContent = 'Kopiert!'
    setTimeout(() => { kopierBtn.textContent = 'Kopier lenke' }, 2000)
  }}, 'Kopier lenke')

  const lukkBtn = el('button', { class: 'btn btn-s', onclick: () => modal.remove() }, 'Lukk')

  const bunn = el('div', { class: 'modal-bunn' })
  bunn.appendChild(kopierBtn)
  bunn.appendChild(lukkBtn)
  box.appendChild(bunn)

  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function visNyOktModal(defaultKlasse, defaultWeek, onSave, skoleAar) {
  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, 'Ny økt'))

  const { data: klasser } = await sb.from('classes').select('*')
  const { data: teachers } = await sb.from('users').select('*').eq('school_id', APP.school.id)
  const { data: subjects } = await sb.from('subjects').select('*').order('name')

  const form = el('form', { class: 'skjema', onsubmit: async (e) => {
    e.preventDefault()
    const fd = new FormData(form)
    const klassId = fd.get('class_id')
    const subjId = fd.get('subject_id')
    const weekNr = parseInt(fd.get('week_nr'))
    const dagOfWeek = parseInt(fd.get('day_of_week'))

    // Duplicate check
    const { data: dup } = await sb.from('sessions')
      .select('id')
      .eq('class_id', klassId)
      .eq('subject_id', subjId)
      .eq('week_nr', weekNr)
      .eq('day_of_week', dagOfWeek)
    if (dup && dup.length) {
      if (!confirm('Det finnes allerede en lignende økt. Fortsette likevel?')) return
    }

    // Conflict check
    const { data: conflict } = await sb.from('sessions')
      .select('id')
      .eq('teacher_id', fd.get('teacher_id'))
      .eq('week_nr', weekNr)
      .eq('day_of_week', dagOfWeek)
    if (conflict && conflict.length) {
      if (!confirm('Du har allerede en økt denne dagen. Fortsette likevel?')) return
    }

    // Fridagssjekk – skoleruten blokkerer økter på fridager
    const fridag = await finnFridag(weekNr, dagOfWeek, skoleAar || APP.school?.active_school_year)
    if (fridag) {
      showToast(`Kan ikke legge økt på fridag: ${fridag.title} (${ukeTekst(fridag.start_date, fridag.end_date)}, ${formatDatoNO(fridag.start_date)}–${formatDatoNO(fridag.end_date)})`, 'error')
      return
    }

    // Fellesundervisning: én rad per valgt klasse, koblet med shared_group_id
    const ekstraKlasser = [...form.querySelectorAll('[name=felles_klasse]:checked')]
      .map(c => c.value).filter(id => id !== klassId)
    const alleKlasseIds = [klassId, ...ekstraKlasser]
    const gruppeId = alleKlasseIds.length > 1 ? crypto.randomUUID() : null

    const valteDivIder = [...form.querySelectorAll('[name=selected_divisions]:checked')].map(c => c.value)
    await medLagreOverlay(async () => {
      const rader = alleKlasseIds.map(cid => ({
        school_id: APP.school.id,
        class_id: cid,
        subject_id: subjId,
        division_id: null,
        week_nr: weekNr,
        day_of_week: dagOfWeek,
        teacher_id: fd.get('teacher_id'),
        activity: fd.get('activity') || '',
        meeting_point: fd.get('meeting_point') || '',
        info: fd.get('info') || '',
        school_year: skoleAar || APP.school?.active_school_year,
        created_by: APP.profile.id,
        shared_group_id: gruppeId,
        version: 1,
      }))
      const { data: inserted, error } = await sb.from('sessions').insert(rader).select('id')
      if (error) throw error
      if (valteDivIder.length && inserted?.length) {
        const sdRader = inserted.flatMap(s => valteDivIder.map(did => ({ session_id: s.id, division_id: did })))
        const { error: sdErr } = await sb.from('session_divisions').insert(sdRader)
        if (sdErr) throw sdErr
      }
    })
    modal.remove()
    if (onSave) onSave()
  }})

  // Class
  const klasseSel = el('select', { name: 'class_id', class: 'felt select', required: 'true', onchange: async (e) => {
    await oppdaterFagSel(e.target.value)
    // oppdaterFagSel kaller oppdaterDivisionCheckboxes med ny classId
  }})
  for (const k of klasser || []) {
    const opt = el('option', { value: k.id }, k.name)
    if (defaultKlasse && k.id === defaultKlasse.id) opt.setAttribute('selected', 'true')
    klasseSel.appendChild(opt)
  }
  form.appendChild(lagFormRad('Klasse', klasseSel))

  // Fellesundervisning: kryss av for flere klasser som skal ha samme økt
  if ((klasser || []).length > 1) {
    const fellesWrap = el('div', { class: 'felles-velger' })
    for (const k of klasser || []) {
      const lbl = el('label', { class: 'felles-velger__valg', 'data-class-id': k.id })
      lbl.appendChild(el('input', { type: 'checkbox', name: 'felles_klasse', value: k.id }))
      lbl.appendChild(document.createTextNode(` ${k.name}`))
      fellesWrap.appendChild(lbl)
    }
    // Skjul valgt hovedklasse i listen (den er alltid med)
    const oppdaterFellesValg = () => {
      for (const lbl of fellesWrap.querySelectorAll('.felles-velger__valg')) {
        const erHoved = lbl.getAttribute('data-class-id') === klasseSel.value
        lbl.style.display = erHoved ? 'none' : ''
        if (erHoved) lbl.querySelector('input').checked = false
      }
    }
    klasseSel.addEventListener('change', oppdaterFellesValg)
    oppdaterFellesValg()
    form.appendChild(lagFormRad('Felles med', fellesWrap))
  }

  // Subject
  const fagSel = el('select', { name: 'subject_id', class: 'felt select', required: 'true', onchange: async (e) => {
    await oppdaterDivisionCheckboxes(e.target.value, klasseSel.value)
  }})
  form.appendChild(lagFormRad('Fag', fagSel))

  // Division – checkboxes (partier for valgt klasse + grupper for skolen)
  const divContainer = el('div', { class: 'div-checkboxes' })
  form.appendChild(lagFormRad('Parti/gruppe', divContainer))

  async function oppdaterFagSel(classId) {
    clearEl(fagSel)
    const { data: subj } = await sb.from('subjects').select('*').eq('school_id', APP.school.id).order('name')
    for (const s of subj || []) {
      fagSel.appendChild(el('option', { value: s.id }, s.name))
    }
    if (fagSel.options.length) await oppdaterDivisionCheckboxes(fagSel.value, classId)
  }

  async function oppdaterDivisionCheckboxes(subjectId, classId) {
    clearEl(divContainer)
    if (!subjectId || !classId) return
    const { data: divs } = await sb.from('subject_divisions')
      .select('*')
      .eq('subject_id', subjectId)
      .or(`class_id.is.null,class_id.eq.${classId}`)
      .is('deleted_at', null)
      .order('sort_order')
    if (!(divs || []).length) return
    for (const d of divs) {
      const lbl = el('label', { class: 'div-check-lbl' })
      lbl.appendChild(el('input', { type: 'checkbox', name: 'selected_divisions', value: d.id }))
      lbl.appendChild(document.createTextNode(` ${d.division_type === 'parti' ? 'Parti' : 'Gruppe'}: ${d.name}`))
      divContainer.appendChild(lbl)
    }
  }

  if (defaultKlasse) await oppdaterFagSel(defaultKlasse.id)

  // Week
  const weekInput = el('input', { name: 'week_nr', type: 'number', class: 'felt input',
    value: defaultWeek, min: 1, max: 53, required: 'true' })
  form.appendChild(lagFormRad('Uke', weekInput))

  // Day
  const dagSel = el('select', { name: 'day_of_week', class: 'felt select' })
  for (let i = 1; i <= 5; i++) dagSel.appendChild(el('option', { value: i }, dagNavn(i)))
  form.appendChild(lagFormRad('Dag', dagSel))

  // Teacher
  const laererSel = el('select', { name: 'teacher_id', class: 'felt select' })
  for (const t of teachers || []) {
    const opt = el('option', { value: t.id }, t.full_name)
    if (t.id === APP.profile.id) opt.setAttribute('selected', 'true')
    laererSel.appendChild(opt)
  }
  form.appendChild(lagFormRad('Lærer', laererSel))

  form.appendChild(lagFormRad('Aktivitet', el('input', { name: 'activity', type: 'text', class: 'felt input' })))
  form.appendChild(lagFormRad('Møtested', el('input', { name: 'meeting_point', type: 'text', class: 'felt input' })))
  form.appendChild(lagFormRad('Info', el('textarea', { name: 'info', class: 'felt textarea' })))

  const lagreKnapp = el('button', { type: 'submit', class: 'btn btn-p' }, 'Lagre'); form.appendChild(lagreKnapp); overvakSkjema(form, lagreKnapp)
  form.appendChild(el('button', { type: 'button', class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))

  box.appendChild(form)
  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function visRedigerOktModal(session, onSave) {
  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, 'Rediger økt'))

  const [{ data: subjects }, { data: divisions }, { data: teachers }, { data: currentSd }] = await Promise.all([
    sb.from('subjects').select('*').eq('school_id', APP.school.id).order('name'),
    sb.from('subject_divisions').select('*')
      .eq('subject_id', session.subject_id)
      .or(`class_id.is.null,class_id.eq.${session.class_id}`)
      .is('deleted_at', null)
      .order('sort_order'),
    sb.from('users').select('*').eq('school_id', APP.school.id),
    sb.from('session_divisions').select('division_id').eq('session_id', session.id),
  ])
  const currentDivIds = new Set((currentSd || []).map(r => r.division_id))

  // Sporbarhet: hvem opprettet og sist endret økten
  const brukerNavn = (id) => (teachers || []).find(t => t.id === id)?.full_name || null
  const sporDeler = []
  const opprettetAv = brukerNavn(session.created_by)
  if (opprettetAv) sporDeler.push(`Opprettet av ${opprettetAv}`)
  const endretAv = brukerNavn(session.last_modified_by)
  if (endretAv && (session.last_modified_by !== session.created_by || session.version > 1)) {
    sporDeler.push(`Sist endret av ${endretAv}${session.last_modified_at ? ` ${formatDatoNO(session.last_modified_at)}` : ''}`)
  }
  if (sporDeler.length) box.appendChild(el('p', { class: 'sporbarhet-info' }, sporDeler.join(' · ')))

  const form = el('form', { class: 'skjema', onsubmit: async (e) => {
    e.preventDefault()
    const fd = new FormData(form)
    const valteDivIder = [...form.querySelectorAll('[name=selected_divisions]:checked')].map(c => c.value)
    const data = {
      subject_id: fd.get('subject_id'),
      division_id: null,
      week_nr: parseInt(fd.get('week_nr')),
      day_of_week: parseInt(fd.get('day_of_week')),
      teacher_id: fd.get('teacher_id'),
      activity: fd.get('activity') || null,
      meeting_point: fd.get('meeting_point') || null,
      info: fd.get('info') || null,
    }
    // Fridagssjekk – gjelder også flytting av økt til annen uke/dag
    const fridag = await finnFridag(data.week_nr, data.day_of_week, session.school_year)
    if (fridag) {
      showToast(`Kan ikke legge økt på fridag: ${fridag.title} (${ukeTekst(fridag.start_date, fridag.end_date)}, ${formatDatoNO(fridag.start_date)}–${formatDatoNO(fridag.end_date)})`, 'error')
      return
    }
    await medLagreOverlay(async () => {
      const ok = await lagreOkt(session.id, data, session.version)
      if (!ok) throw new Error('Konfliktvarsling – prøv igjen')
      await sb.from('session_divisions').delete().eq('session_id', session.id)
      if (valteDivIder.length) {
        const { error: sdErr } = await sb.from('session_divisions')
          .insert(valteDivIder.map(did => ({ session_id: session.id, division_id: did })))
        if (sdErr) throw sdErr
      }
    })
    modal.remove()
    if (onSave) onSave()
  }})

  const fagSel = el('select', { name: 'subject_id', class: 'felt select' })
  for (const s of subjects || []) {
    const opt = el('option', { value: s.id }, s.name)
    if (s.id === session.subject_id) opt.setAttribute('selected', 'true')
    fagSel.appendChild(opt)
  }
  form.appendChild(lagFormRad('Fag', fagSel))

  const divContainer = el('div', { class: 'div-checkboxes' })
  for (const d of divisions || []) {
    const lbl = el('label', { class: 'div-check-lbl' })
    const cb = el('input', { type: 'checkbox', name: 'selected_divisions', value: d.id })
    if (currentDivIds.has(d.id)) cb.checked = true
    lbl.appendChild(cb)
    lbl.appendChild(document.createTextNode(` ${d.division_type === 'parti' ? 'Parti' : 'Gruppe'}: ${d.name}`))
    divContainer.appendChild(lbl)
  }
  form.appendChild(lagFormRad('Parti/gruppe', divContainer))

  const weekInput = el('input', { name: 'week_nr', type: 'number', class: 'felt input',
    value: session.week_nr, min: 1, max: 53 })
  form.appendChild(lagFormRad('Uke', weekInput))

  const dagSel = el('select', { name: 'day_of_week', class: 'felt select' })
  for (let i = 1; i <= 5; i++) {
    const opt = el('option', { value: i }, dagNavn(i))
    if (i === session.day_of_week) opt.setAttribute('selected', 'true')
    dagSel.appendChild(opt)
  }
  form.appendChild(lagFormRad('Dag', dagSel))

  const laererSel = el('select', { name: 'teacher_id', class: 'felt select' })
  for (const t of teachers || []) {
    const opt = el('option', { value: t.id }, t.full_name)
    if (t.id === session.teacher_id) opt.setAttribute('selected', 'true')
    laererSel.appendChild(opt)
  }
  form.appendChild(lagFormRad('Lærer', laererSel))

  const actInput = el('input', { name: 'activity', type: 'text', class: 'felt input', value: session.activity || '' })
  form.appendChild(lagFormRad('Aktivitet', actInput))

  const mpInput = el('input', { name: 'meeting_point', type: 'text', class: 'felt input', value: session.meeting_point || '' })
  form.appendChild(lagFormRad('Møtested', mpInput))

  const infoTA = el('textarea', { name: 'info', class: 'felt textarea' }, session.info || '')
  form.appendChild(lagFormRad('Info', infoTA))

  const lagreKnapp = el('button', { type: 'submit', class: 'btn btn-p' }, 'Lagre'); form.appendChild(lagreKnapp); overvakSkjema(form, lagreKnapp)
  form.appendChild(el('button', { type: 'button', class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))

  box.appendChild(form)
  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function visKopierOktModal(session, onSave) {
  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, 'Kopier økt'))

  const aktivtSkolear = APP.school?.active_school_year
  // Kopier alltid inn i aktivt skoleår – også når kilden er et tidligere år.
  if (session.school_year && aktivtSkolear && session.school_year !== aktivtSkolear) {
    box.appendChild(el('p', { class: 'kopi-hint' },
      `Kopien lagres i aktivt skoleår (${aktivtSkolear}). Du kan endre detaljene før du lagrer.`))
  } else {
    box.appendChild(el('p', { class: 'kopi-hint' }, 'Endre detaljene før du lagrer kopien:'))
  }

  const [{ data: subjects }, { data: teachers }, { data: kildeSd }] = await Promise.all([
    sb.from('subjects').select('*').eq('school_id', APP.school.id).order('name'),
    sb.from('users').select('*').eq('school_id', APP.school.id),
    sb.from('session_divisions').select('division_id').eq('session_id', session.id),
  ])
  const kildeDivIds = new Set((kildeSd || []).map(r => r.division_id))

  const form = el('form', { class: 'skjema', onsubmit: async (e) => {
    e.preventDefault()
    const fd = new FormData(form)
    const valteDivIder = [...form.querySelectorAll('[name=selected_divisions]:checked')].map(c => c.value)
    // Fridagssjekk – skoleruten blokkerer økter på fridager
    const fridag = await finnFridag(parseInt(fd.get('week_nr')), parseInt(fd.get('day_of_week')), aktivtSkolear)
    if (fridag) {
      showToast(`Kan ikke legge økt på fridag: ${fridag.title} (${ukeTekst(fridag.start_date, fridag.end_date)}, ${formatDatoNO(fridag.start_date)}–${formatDatoNO(fridag.end_date)})`, 'error')
      return
    }
    await medLagreOverlay(async () => {
      const { data: inserted, error } = await sb.from('sessions').insert({
        school_id: APP.school.id,
        class_id: session.class_id,
        subject_id: fd.get('subject_id'),
        division_id: null,
        week_nr: parseInt(fd.get('week_nr')),
        day_of_week: parseInt(fd.get('day_of_week')),
        teacher_id: fd.get('teacher_id'),
        activity: fd.get('activity') || '',
        meeting_point: fd.get('meeting_point') || '',
        info: fd.get('info') || '',
        school_year: aktivtSkolear,
        created_by: APP.profile.id,
        version: 1,
      }).select('id')
      if (error) throw error
      if (valteDivIder.length && inserted?.length) {
        const { error: sdErr } = await sb.from('session_divisions')
          .insert(valteDivIder.map(did => ({ session_id: inserted[0].id, division_id: did })))
        if (sdErr) throw sdErr
      }
    })
    modal.remove()
    if (onSave) onSave()
  }})

  // Fag
  const fagSel = el('select', { name: 'subject_id', class: 'felt select', required: 'true',
    onchange: async (e) => oppdaterDivisionCheckboxes(e.target.value) })
  for (const s of subjects || []) {
    const opt = el('option', { value: s.id }, s.name)
    if (s.id === session.subject_id) opt.setAttribute('selected', 'true')
    fagSel.appendChild(opt)
  }
  form.appendChild(lagFormRad('Fag', fagSel))

  // Parti/gruppe – checkboxes, kildeøktens valg forhåndsmerket
  const divContainer = el('div', { class: 'div-checkboxes' })
  form.appendChild(lagFormRad('Parti/gruppe', divContainer))

  async function oppdaterDivisionCheckboxes(subjectId) {
    clearEl(divContainer)
    if (!subjectId) return
    const { data: divs } = await sb.from('subject_divisions')
      .select('*')
      .eq('subject_id', subjectId)
      .or(`class_id.is.null,class_id.eq.${session.class_id}`)
      .is('deleted_at', null)
      .order('sort_order')
    if (!(divs || []).length) return
    for (const d of divs) {
      const lbl = el('label', { class: 'div-check-lbl' })
      const cb = el('input', { type: 'checkbox', name: 'selected_divisions', value: d.id })
      if (kildeDivIds.has(d.id)) cb.checked = true
      lbl.appendChild(cb)
      lbl.appendChild(document.createTextNode(` ${d.division_type === 'parti' ? 'Parti' : 'Gruppe'}: ${d.name}`))
      divContainer.appendChild(lbl)
    }
  }
  await oppdaterDivisionCheckboxes(session.subject_id)

  // Uke
  const weekInput = el('input', { name: 'week_nr', type: 'number', class: 'felt input',
    value: session.week_nr, min: 1, max: 53, required: 'true' })
  form.appendChild(lagFormRad('Uke', weekInput))

  // Dag
  const dagSel = el('select', { name: 'day_of_week', class: 'felt select' })
  for (let i = 1; i <= 5; i++) {
    const opt = el('option', { value: i }, dagNavn(i))
    if (i === session.day_of_week) opt.setAttribute('selected', 'true')
    dagSel.appendChild(opt)
  }
  form.appendChild(lagFormRad('Dag', dagSel))

  // Lærer (standard: meg)
  const laererSel = el('select', { name: 'teacher_id', class: 'felt select' })
  for (const t of teachers || []) {
    const opt = el('option', { value: t.id }, t.full_name)
    if (t.id === APP.profile.id) opt.setAttribute('selected', 'true')
    laererSel.appendChild(opt)
  }
  form.appendChild(lagFormRad('Lærer', laererSel))

  form.appendChild(lagFormRad('Aktivitet', el('input', { name: 'activity', type: 'text', class: 'felt input', value: session.activity || '' })))
  form.appendChild(lagFormRad('Møtested', el('input', { name: 'meeting_point', type: 'text', class: 'felt input', value: session.meeting_point || '' })))
  form.appendChild(lagFormRad('Info', el('textarea', { name: 'info', class: 'felt textarea' }, session.info || '')))

  const lagreKnapp = el('button', { type: 'submit', class: 'btn btn-p' }, 'Lagre kopi'); form.appendChild(lagreKnapp); overvakSkjema(form, lagreKnapp)
  form.appendChild(el('button', { type: 'button', class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))

  box.appendChild(form)
  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function slettOkt(id, onSave) {
  if (!confirm('Slette denne økten?')) return
  await medLagreOverlay(async () => {
    const { error } = await sb.from('sessions').delete().eq('id', id)
    if (error) throw error
  })
  if (onSave) onSave()
}

async function visOverforModal(session, onSave) {
  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, 'Overfør økt'))

  const { data: teachers } = await sb.from('users')
    .select('*')
    .eq('school_id', APP.school.id)
    .neq('id', APP.profile.id)

  const sel = el('select', { class: 'felt select' })
  for (const t of teachers || []) {
    sel.appendChild(el('option', { value: t.id }, t.full_name))
  }

  box.appendChild(lagFormRad('Ny lærer', sel))
  box.appendChild(el('button', { class: 'btn btn-p', onclick: async () => {
    const targetId = sel.value
    await medLagreOverlay(async () => {
      await sb.from('sessions').update({ teacher_id: targetId, last_modified_by: APP.profile.id }).eq('id', session.id)
      await sb.from('pending_transfers').insert({
        session_id: session.id,
        from_user: APP.profile.id,
        to_user: targetId,
      })
      await sb.from('audit_log').insert({
        table_name: 'sessions',
        record_id: session.id,
        action: 'update',
        changed_by: APP.profile.id,
        new_data: { transferred_to: targetId },
      })
    })
    modal.remove()
    if (onSave) onSave()
  }}, 'Overfør'))
  box.appendChild(el('button', { class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))

  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function visBulkEditModal(ids, onSave) {
  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, `Bulk-rediger ${ids.length} økt(er)`))

  const weekInput = el('input', { type: 'number', class: 'felt input', placeholder: 'Ny uke (blank = uendret)', min: 1, max: 53 })
  const dagSel = el('select', { class: 'felt select' })
  dagSel.appendChild(el('option', { value: '' }, '(uendret)'))
  for (let i = 1; i <= 5; i++) dagSel.appendChild(el('option', { value: i }, dagNavn(i)))
  const infoInput = el('textarea', { class: 'felt textarea', placeholder: 'Ny info (blank = uendret)' })

  box.appendChild(lagFormRad('Uke', weekInput))
  box.appendChild(lagFormRad('Dag', dagSel))
  box.appendChild(lagFormRad('Info', infoInput))

  box.appendChild(el('button', { class: 'btn btn-p', onclick: async () => {
    const updates = {}
    if (weekInput.value) updates.week_nr = parseInt(weekInput.value)
    if (dagSel.value) updates.day_of_week = parseInt(dagSel.value)
    if (infoInput.value) updates.info = infoInput.value

    if (!Object.keys(updates).length) { modal.remove(); return }
    updates.last_modified_by = APP.profile.id

    await medLagreOverlay(async () => {
      for (const id of ids) {
        await sb.from('sessions').update(updates).eq('id', id)
      }
    })
    modal.remove()
    if (onSave) onSave()
  }}, 'Lagre'))
  box.appendChild(el('button', { class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))

  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

// Bulk-kopi Nivå A: kopier valgte økter til én mål-uke (dag beholdes).
// Kopiene stemples alltid med aktivt skoleår.
async function visBulkKopierModal(valgte, onSave) {
  if (!valgte || !valgte.length) return
  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, `Kopier ${valgte.length} økt(er)`))

  const aktivtSkolear = APP.school?.active_school_year
  const kildeUke = valgte[0].week_nr

  box.appendChild(el('p', { class: 'kopi-hint' },
    `Øktene kopieres til valgt mål-uke (samme ukedag beholdes)${aktivtSkolear ? `, i aktivt skoleår ${aktivtSkolear}` : ''}.`))

  // AI-påminnelse ved mange økter
  if (valgte.length >= 6) {
    box.appendChild(el('p', { class: 'ai-paaminnelse' },
      '💡 Tips: For mange økter på en gang kan «🤖 Lim inn med AI» være raskere.'))
  }

  const weekInput = el('input', { type: 'number', class: 'felt input', value: kildeUke, min: 1, max: 53, placeholder: 'Mål-uke' })
  box.appendChild(lagFormRad('Mål-uke', weekInput))

  const beholdLaerer = el('input', { type: 'checkbox', class: 'felt-cb' })
  beholdLaerer.checked = false
  box.appendChild(lagFormRad('Behold opprinnelig lærer', beholdLaerer))

  box.appendChild(el('button', { class: 'btn btn-p', onclick: async () => {
    const malUke = parseInt(weekInput.value)
    if (!malUke || malUke < 1 || malUke > 53) { showToast('Ugyldig ukenummer', 'error'); return }

    // Fridagssjekk i mål-uken: hopp over økter som lander på fridag
    const kopierbare = []
    const hoppetOver = []
    for (const s of valgte) {
      const fridag = await finnFridag(malUke, s.day_of_week, aktivtSkolear)
      if (fridag) hoppetOver.push(`${dagNavn(s.day_of_week)} (${fridag.title})`)
      else kopierbare.push(s)
    }
    if (!kopierbare.length) {
      showToast(`Ingen økter kopiert – alle treffer fridag i uke ${malUke}: ${[...new Set(hoppetOver)].join(', ')}`, 'error')
      return
    }

    await medLagreOverlay(async () => {
      const rader = kopierbare.map(s => ({
        school_id: APP.school.id,
        class_id: s.class_id,
        subject_id: s.subject_id,
        division_id: s.division_id,
        week_nr: malUke,
        day_of_week: s.day_of_week,
        teacher_id: beholdLaerer.checked ? s.teacher_id : APP.profile.id,
        activity: s.activity || '',
        meeting_point: s.meeting_point || '',
        info: s.info || '',
        school_year: aktivtSkolear,
        created_by: APP.profile.id,
        version: 1,
      }))
      const { error } = await sb.from('sessions').insert(rader)
      if (error) throw error
    })
    if (hoppetOver.length) {
      showToast(`${kopierbare.length} økt(er) kopiert til uke ${malUke}. ${hoppetOver.length} hoppet over pga. fridag: ${[...new Set(hoppetOver)].join(', ')}`, 'info')
    } else {
      showToast(`${kopierbare.length} økt(er) kopiert til uke ${malUke}`, 'success')
    }
    modal.remove()
    if (onSave) onSave()
  }}, 'Kopier'))
  box.appendChild(el('button', { class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))

  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function visAIPasteModal(defaultKlasse, onSave) {
  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal modal-xl' })
  box.appendChild(el('h3', {}, 'Importer økter med AI'))

  const textarea = el('textarea', { class: 'felt textarea textarea-large', placeholder: 'Lim inn tekst her…' })
  box.appendChild(textarea)

  const preview = el('div', { class: 'ai-preview' })
  box.appendChild(preview)

  box.appendChild(el('button', { class: 'btn btn-p', onclick: async () => {
    if (!textarea.value.trim()) return
    clearEl(preview)

    try {
      // Hent kontekstdata for AI-en
      const [{ data: subjects }, { data: klasser }, { data: teachers }, { data: divisions }] = await Promise.all([
        sb.from('subjects').select('id, name, short_code').eq('school_id', APP.school.id),
        sb.from('classes').select('id, name').eq('school_id', APP.school.id),
        sb.from('users').select('id, full_name').eq('school_id', APP.school.id).eq('role', 'teacher'),
        sb.from('divisions').select('id, name, subject_id, division_type').eq('school_id', APP.school.id),
      ])

      const { data, error } = await medAIOverlay('AI tolker teksten til økter …', () =>
        sb.functions.invoke('ai-parse-sessions', {
          body: {
            text: textarea.value,
            context: { subjects: subjects || [], classes: klasser || [], teachers: teachers || [], divisions: divisions || [] },
          }
        }))
      if (error) throw error

      clearEl(preview)
      const parsed = (data.sessions || data || [])
      if (!parsed.length) { preview.appendChild(el('p', {}, 'Ingen økter funnet.')); return }

      if (data.warnings?.length) {
        preview.appendChild(el('p', { class: 'advarsel-tekst' }, `⚠️ ${data.warnings.join(' | ')}`))
      }

      // Slå opp navn fra kontekst
      const subjectMap = Object.fromEntries((subjects || []).map(s => [s.id, s.name]))
      const klassMap   = Object.fromEntries((klasser || []).map(k => [k.id, k.name]))

      const table = el('table', { class: 'preview-table' })
      const thead = el('thead')
      thead.appendChild(el('tr', {},
        el('th', {}, ''),
        el('th', {}, 'Klasse'),
        el('th', {}, 'Fag'),
        el('th', {}, 'Uke'),
        el('th', {}, 'Dag'),
        el('th', {}, 'Aktivitet'),
        el('th', {}, 'Sikkerhet'),
        el('th', {}, 'Merknad'),
      ))
      table.appendChild(thead)
      const tbody = el('tbody')

      const selected = new Set(parsed.map((_, i) => i))

      for (let i = 0; i < parsed.length; i++) {
        const s = parsed[i]
        const tr = el('tr', {})
        const cb = el('input', { type: 'checkbox' })
        cb.checked = true
        cb.addEventListener('change', () => { if (cb.checked) selected.add(i); else selected.delete(i) })
        tr.appendChild(el('td', {}, cb))
        tr.appendChild(el('td', {}, klassMap[s.class_id] || (defaultKlasse?.name || '')))
        tr.appendChild(el('td', {}, subjectMap[s.subject_id] || ''))
        tr.appendChild(el('td', {}, String(s.week_nr || '')))
        tr.appendChild(el('td', {}, dagNavn(s.day_of_week) || ''))
        tr.appendChild(el('td', {}, s.activity || ''))
        const conf = s._confidence || 'low'
        tr.appendChild(el('td', { class: `conf--${conf}` }, conf === 'high' ? 'Høy' : conf === 'medium' ? 'Middels' : 'Lav'))
        tr.appendChild(el('td', {}, s._note || ''))
        tbody.appendChild(tr)
      }
      table.appendChild(tbody)
      preview.appendChild(table)

      preview.appendChild(el('button', { class: 'btn btn-p', style: 'margin-top:10px', onclick: async () => {
        const valgteOkter = parsed.filter((_, i) => selected.has(i))
        // Fridagssjekk: hopp over økter som lander på fridag i skoleruten
        const toImport = []
        const hoppetOver = []
        for (const s of valgteOkter) {
          const fridag = await finnFridag(s.week_nr, s.day_of_week, APP.school?.active_school_year)
          if (fridag) hoppetOver.push(`uke ${s.week_nr} ${dagNavn(s.day_of_week)} (${fridag.title})`)
          else toImport.push(s)
        }
        if (!toImport.length) {
          showToast(`Ingen økter importert – alle treffer fridag: ${[...new Set(hoppetOver)].join(', ')}`, 'error')
          return
        }
        await medLagreOverlay(async () => {
          for (const s of toImport) {
            await sb.from('sessions').insert({
              school_id: APP.school.id,
              class_id: s.class_id || defaultKlasse?.id,
              subject_id: s.subject_id || null,
              division_id: s.division_id || null,
              week_nr: s.week_nr,
              day_of_week: s.day_of_week,
              teacher_id: APP.profile.id,
              activity: s.activity || '',
              meeting_point: s.meeting_point || '',
              info: s.info || '',
              school_year: APP.school?.active_school_year,
              created_by: APP.profile.id,
              version: 1,
            })
          }
        })
        if (hoppetOver.length) {
          showToast(`${toImport.length} økt(er) importert. ${hoppetOver.length} hoppet over pga. fridag: ${[...new Set(hoppetOver)].join(', ')}`, 'info')
        }
        modal.remove()
        if (onSave) onSave()
      }}, 'Importer valgte'))
    } catch (err) {
      clearEl(preview)
      preview.appendChild(el('p', { class: 'feil-tekst' }, `Feil: ${err.message}`))
    }
  }}, 'Analyser med AI'))

  box.appendChild(el('button', { class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))
  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

// ─────────────────────────────────────────
// KONTAKTLÆRER – Klasse-admin tab
// ─────────────────────────────────────────

async function renderKlasseAdminTab(container) {
  const { data: mine } = await sb.from('user_classes')
    .select('classes(*)')
    .eq('user_id', APP.profile.id)
  const klasser = (mine || []).map(r => r.classes).filter(Boolean)

  if (!klasser.length) {
    container.appendChild(el('p', {}, 'Ingen klasser tilknyttet.'))
    return
  }

  let aktivKlasse = klasser[0]

  const klasseSel = el('select', { class: 'felt select', onchange: (e) => {
    aktivKlasse = klasser.find(k => k.id === e.target.value)
    renderKlasseAdminInnhold()
  }})
  for (const k of klasser) klasseSel.appendChild(el('option', { value: k.id }, k.name))
  container.appendChild(el('label', {}, 'Klasse: '))
  container.appendChild(klasseSel)

  const innhold = el('div', { class: 'klasse-admin-innhold' })
  container.appendChild(innhold)

  async function renderKlasseAdminInnhold() {
    clearEl(innhold)

    // Multi-day events
    innhold.appendChild(el('h3', {}, 'Flerdagsarrangementer'))
    const { data: mde } = await sb.from('multi_day_events')
      .select('*').eq('class_id', aktivKlasse.id).order('start_date')

    for (const e of mde || []) {
      const row = el('div', { class: 'mde-row' })
      row.appendChild(el('span', {}, `${e.title} · ${ukeTekst(e.start_date, e.end_date)} (${formatDatoNO(e.start_date)} – ${formatDatoNO(e.end_date)})`))
      row.appendChild(el('button', { class: 'btn btn-ikon', title: 'Rediger arrangement', onclick: () => visRedigerMDEModal(e, renderKlasseAdminInnhold) }, '✏️'))
      row.appendChild(el('button', { class: 'btn btn-ikon btn-f', title: 'Slett arrangement', onclick: async () => {
        if (!confirm('Slette?')) return
        await medLagreOverlay(() => sb.from('multi_day_events').delete().eq('id', e.id))
        renderKlasseAdminInnhold()
      }}, '🗑️'))
      innhold.appendChild(row)
    }
    innhold.appendChild(el('button', { class: 'btn btn-s', title: 'Legg til flerdagsarrangement', onclick: () => visNyMDEModal(aktivKlasse.id, renderKlasseAdminInnhold) }, '+ Nytt arrangement'))

    // Partier for denne klassen (kun fag med has_parti = true)
    const { data: fagMedParti } = await sb.from('subjects').select('*')
      .eq('school_id', APP.school.id)
      .eq('has_parti', true)
      .is('deleted_at', null)
      .order('name')

    if ((fagMedParti || []).length > 0) {
      innhold.appendChild(el('h3', {}, 'Partier'))
      for (const subj of fagMedParti) {
        const subjBox = el('div', { class: 'subj-config-box' })
        subjBox.appendChild(el('strong', {}, subj.name))

        const { data: partier } = await sb.from('subject_divisions').select('*')
          .eq('subject_id', subj.id)
          .eq('division_type', 'parti')
          .eq('class_id', aktivKlasse.id)
          .is('deleted_at', null)
          .order('sort_order')

        const divList = el('div', { class: 'div-list' })
        for (const p of partier || []) {
          const divRow = el('div', { class: 'div-row' })
          const nameInput = el('input', { type: 'text', class: 'felt input input-sm', value: p.name })
          divRow.appendChild(nameInput)
          divRow.appendChild(el('button', { class: 'btn btn-ikon', title: 'Lagre navn på parti', onclick: async () => {
            await medLagreOverlay(() => sb.from('subject_divisions').update({ name: nameInput.value }).eq('id', p.id))
            showToast('Lagret', 'success')
          }}, '💾'))
          divRow.appendChild(el('button', { class: 'btn btn-ikon btn-f', title: 'Slett parti', onclick: async () => {
            if (!confirm(`Slette partiet «${p.name}»?`)) return
            await medLagreOverlay(() => sb.from('subject_divisions')
              .update({ deleted_at: new Date().toISOString() }).eq('id', p.id))
            renderKlasseAdminInnhold()
          }}, '🗑️'))
          divList.appendChild(divRow)
        }
        if ((partier || []).length < 8) {
          divList.appendChild(el('button', { class: 'btn btn-sm', title: 'Legg til parti', onclick: async () => {
            const navn = prompt(`Navn på nytt parti for ${subj.name}:`)
            if (!navn) return
            await medLagreOverlay(() => sb.from('subject_divisions').insert({
              subject_id: subj.id,
              division_type: 'parti',
              class_id: aktivKlasse.id,
              name: navn,
              sort_order: (partier || []).length,
            }))
            renderKlasseAdminInnhold()
          }}, '+ Legg til parti'))
        }
        subjBox.appendChild(divList)
        innhold.appendChild(subjBox)
      }
    }

    // Backup
    innhold.appendChild(el('h3', {}, 'Sikkerhetskopiering'))
    innhold.appendChild(el('button', { class: 'btn btn-s', title: 'Last ned alle økter som JSON-fil', onclick: () => lastNedSikkerhetskopi(aktivKlasse) }, '⬇️ Last ned sikkerhetskopi'))
    const uploadInput = el('input', { type: 'file', accept: '.json', onchange: (e) => {
      if (e.target.files[0]) lastOppSikkerhetskopi(e.target.files[0], aktivKlasse)
    }})
    innhold.appendChild(el('label', { class: 'btn btn-s' }, '⬆️ Last opp sikkerhetskopi', uploadInput))
  }

  await renderKlasseAdminInnhold()
}

async function visNyMDEModal(classId, onSave) {
  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, 'Nytt flerdagsarrangement'))

  const titleInput = el('input', { type: 'text', class: 'felt input', placeholder: 'Tittel' })
  const descInput = el('textarea', { class: 'felt textarea', placeholder: 'Beskrivelse' })
  const startInput = el('input', { type: 'date', class: 'felt input' })
  const endInput = el('input', { type: 'date', class: 'felt input' })

  const mdeUkeHintNy = el('p', { class: 'tekst-svak skjult', style: 'margin:2px 0 6px; font-size:.9rem' })
  const oppdaterMdeUkeHintNy = () => {
    const ut = ukeTekst(startInput.value || null, endInput.value || null)
    mdeUkeHintNy.textContent = ut ? `→ ${ut}` : ''
    mdeUkeHintNy.classList.toggle('skjult', !ut)
  }
  startInput.addEventListener('change', oppdaterMdeUkeHintNy)
  endInput.addEventListener('change', oppdaterMdeUkeHintNy)

  box.appendChild(lagFormRad('Tittel', titleInput))
  box.appendChild(lagFormRad('Beskrivelse', descInput))
  box.appendChild(lagFormRad('Fra', startInput))
  box.appendChild(lagFormRad('Til', endInput))
  box.appendChild(mdeUkeHintNy)

  box.appendChild(el('button', { class: 'btn btn-p', onclick: async () => {
    if (!titleInput.value || !startInput.value || !endInput.value) return
    // Overlap warning
    const { data: overlap } = await sb.from('sessions')
      .select('id')
      .eq('class_id', classId)
      .gte('week_nr', getISOWeek(new Date(startInput.value)))
      .lte('week_nr', getISOWeek(new Date(endInput.value)))
    if (overlap && overlap.length) {
      if (!confirm(`Det finnes ${overlap.length} økt(er) i denne perioden. Fortsette?`)) return
    }
    await medLagreOverlay(async () => {
      const { error } = await sb.from('multi_day_events').insert({
        class_id: classId,
        title: titleInput.value,
        description: descInput.value || null,
        start_date: startInput.value,
        end_date: endInput.value,
        school_year: APP.school?.active_school_year,
      })
      if (error) throw error
    })
    modal.remove()
    if (onSave) onSave()
  }}, 'Lagre'))
  box.appendChild(el('button', { class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))

  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function visRedigerMDEModal(mde, onSave) {
  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, 'Rediger arrangement'))

  const titleInput = el('input', { type: 'text', class: 'felt input', value: mde.title })
  const descInput = el('textarea', { class: 'felt textarea' }, mde.description || '')
  const startInput = el('input', { type: 'date', class: 'felt input', value: mde.start_date })
  const endInput = el('input', { type: 'date', class: 'felt input', value: mde.end_date })

  const mdeUkeHintRed = el('p', { class: 'tekst-svak', style: 'margin:2px 0 6px; font-size:.9rem' })
  const oppdaterMdeUkeHintRed = () => {
    const ut = ukeTekst(startInput.value || null, endInput.value || null)
    mdeUkeHintRed.textContent = ut ? `→ ${ut}` : ''
  }
  startInput.addEventListener('change', oppdaterMdeUkeHintRed)
  endInput.addEventListener('change', oppdaterMdeUkeHintRed)
  oppdaterMdeUkeHintRed()

  box.appendChild(lagFormRad('Tittel', titleInput))
  box.appendChild(lagFormRad('Beskrivelse', descInput))
  box.appendChild(lagFormRad('Fra', startInput))
  box.appendChild(lagFormRad('Til', endInput))
  box.appendChild(mdeUkeHintRed)

  box.appendChild(el('button', { class: 'btn btn-p', onclick: async () => {
    await medLagreOverlay(async () => {
      const { error } = await sb.from('multi_day_events').update({
        title: titleInput.value,
        description: descInput.value || null,
        start_date: startInput.value,
        end_date: endInput.value,
      }).eq('id', mde.id)
      if (error) throw error
    })
    modal.remove()
    if (onSave) onSave()
  }}, 'Lagre'))
  box.appendChild(el('button', { class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))

  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function lastNedSikkerhetskopi(klasse) {
  const { data: sessions } = await sb.from('sessions').select('*').eq('class_id', klasse.id)
  const { data: subjects } = await sb.from('subjects').select('*').eq('class_id', klasse.id)
  const { data: mde } = await sb.from('multi_day_events').select('*').eq('class_id', klasse.id)
  const backup = { klasse, sessions, subjects, mde, exportedAt: new Date().toISOString() }
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = el('a', { href: url, download: `backup-${klasse.name}-${new Date().toISOString().slice(0, 10)}.json` })
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

async function lastOppSikkerhetskopi(file, klasse) {
  const text = await file.text()
  const backup = JSON.parse(text)
  const sessions = backup.sessions || []
  if (!sessions.length) { showToast('Ingen økter i filen', 'info'); return }

  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, 'Importer sikkerhetskopi'))
  box.appendChild(el('p', {}, `Filen inneholder ${sessions.length} økt(er). Velg hvilke du vil importere:`))

  const selected = new Set(sessions.map((_, i) => i))
  const list = el('div', { class: 'backup-list' })
  sessions.forEach((s, i) => {
    const row = el('div', {})
    const cb = el('input', { type: 'checkbox' })
    cb.checked = true
    cb.addEventListener('change', () => { if (cb.checked) selected.add(i); else selected.delete(i) })
    row.appendChild(cb)
    row.appendChild(el('span', {}, ` Uke ${s.week_nr} ${dagNavn(s.day_of_week)} – ${s.activity || s.subject_id}`))
    list.appendChild(row)
  })
  box.appendChild(list)

  box.appendChild(el('button', { class: 'btn btn-p', onclick: async () => {
    const toImport = sessions.filter((_, i) => selected.has(i))
    await medLagreOverlay(async () => {
      for (const s of toImport) {
        // Fjern sporbarhets-, slette- og fellesfelter fra kopien – importen er en ny opprettelse
        const { id, created_by, last_modified_at, last_modified_by, deleted_at, deleted_by, shared_group_id, ...rest } = s
        await sb.from('sessions').insert({ ...rest, school_id: APP.school.id, class_id: klasse.id,
          school_year: APP.school?.active_school_year, created_by: APP.profile.id, version: 1 })
      }
    })
    modal.remove()
    showToast(`Importerte ${toImport.length} økt(er)`, 'success')
  }}, 'Importer valgte'))
  box.appendChild(el('button', { class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))

  modal.appendChild(box)
  document.body.appendChild(modal)
}

// ─────────────────────────────────────────
// ADMIN PANEL
// ─────────────────────────────────────────

async function renderAdminPanel() {
  const main = document.getElementById('app-main')
  clearEl(main)
  APP.currentView = 'admin'
  APP.currentKlasse = null
  APP.klasseVelger = null
  oppdaterHeader()

  const tabs = ['Skoleinfo', 'Skoleår', 'Fag', 'Klasser', 'Brukere', 'Skolerute', 'Funfacts']
  const tabSlugs = ['skoleinfo', 'skolear', 'fag', 'klasser', 'brukere', 'skolerute', 'funfacts']

  const hashTab = location.hash.split('/')[2]
  const initTab = Math.max(0, tabSlugs.indexOf(hashTab))

  const tabBar = el('div', { class: 'fane-bar' })
  const tabContent = el('div', { class: 'fane-innhold' })

  function setTab(idx) {
    history.replaceState(null, '', `#/admin/${tabSlugs[idx]}`)
    tabBar.querySelectorAll('.fane').forEach((b, i) => b.classList.toggle('aktiv', i === idx))
    clearEl(tabContent)
    switch (idx) {
      case 0: renderSkoleInfoTab(tabContent); break
      case 1: renderSkoleaarTab(tabContent); break
      case 2: renderFagTab(tabContent); break
      case 3: renderKlasserTab(tabContent); break
      case 4: renderBrukereTab(tabContent); break
      case 5: renderSkolerute(tabContent); break
      case 6: renderFaktaTab(tabContent); break
    }
  }

  tabs.forEach((t, i) => {
    const btn = el('button', { class: 'fane', title: `Gå til ${t}`, onclick: () => setTab(i) }, t)
    tabBar.appendChild(btn)
  })

  const adminWrap = el('div', { class: 'side-wrap' })
  adminWrap.appendChild(tabBar)
  adminWrap.appendChild(tabContent)
  main.appendChild(adminWrap)
  setTab(initTab)
}

async function renderSkoleInfoTab(container) {
  const school = APP.school

  const form = el('form', { class: 'skjema skjema-smal', onsubmit: async (e) => {
    e.preventDefault()
    const fd = new FormData(form)
    const updates = {
      name: fd.get('name'),
      school_year_start_week: parseInt(fd.get('start_week')),
      school_year_end_week: parseInt(fd.get('end_week')),
      color_theme: fd.get('color_theme'),
    }
    const logoUrl = fd.get('logo_url')
    if (logoUrl) updates.logo_url = logoUrl
    await medLagreOverlay(async () => {
      const { data: oppdatert, error } = await sb
        .from('schools').update(updates).eq('id', APP.school.id).select().single()
      if (error) throw error
      if (!oppdatert) throw new Error('Ingen rader ble oppdatert – sjekk admin-tilgang i databasen')
      APP.school = oppdatert
      document.getElementById('hdr-skolenavn').textContent = oppdatert.name
      document.documentElement.dataset.theme = oppdatert.color_theme || 'standard'
      oppdaterHeader()
    })
  }})

  // Skolenavn med tegnteller
  const navnInput = el('input', { name: 'name', type: 'text', class: 'felt input', value: school.name, maxlength: 30, style: 'width:100%' })
  const navnTeller = el('span', { class: 'tegnteller', style: 'float:right;font-size:.8rem;opacity:.6' }, `${(school.name||'').length}/30`)
  navnInput.addEventListener('input', () => { navnTeller.textContent = `${navnInput.value.length}/30` })
  const navnWrap = el('div')
  navnWrap.appendChild(navnTeller)
  navnWrap.appendChild(navnInput)
  form.appendChild(lagFormRad('Skolenavn', navnWrap))

  // Uker på samme linje
  function ukeHint(uke) {
    if (!uke) return ''
    const year = new Date().getFullYear()
    const d = new Date(year, 0, 1 + (uke - 1) * 7)
    d.setDate(d.getDate() - (d.getDay() || 7) + 1)
    return d.toLocaleDateString('no-NO', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }
  const startInput = el('input', { name: 'start_week', type: 'number', class: 'felt input', value: school.school_year_start_week, min: 1, max: 53, style: 'width:5rem' })
  const sluttInput = el('input', { name: 'end_week', type: 'number', class: 'felt input', value: school.school_year_end_week, min: 1, max: 53, style: 'width:5rem' })
  const startHint = el('small', { class: 'uke-hint' }, ukeHint(school.school_year_start_week))
  const sluttHint = el('small', { class: 'uke-hint' }, ukeHint(school.school_year_end_week))
  startInput.addEventListener('input', () => { startHint.textContent = ukeHint(parseInt(startInput.value)) })
  sluttInput.addEventListener('input', () => { sluttHint.textContent = ukeHint(parseInt(sluttInput.value)) })
  const ukeRad = el('div', { class: 'uke-rad' })
  const startGrp = el('div', { class: 'uke-grp' })
  startGrp.appendChild(el('label', {}, 'Fra uke')); startGrp.appendChild(startInput); startGrp.appendChild(startHint)
  const sluttGrp = el('div', { class: 'uke-grp' })
  sluttGrp.appendChild(el('label', {}, 'Til uke')); sluttGrp.appendChild(sluttInput); sluttGrp.appendChild(sluttHint)
  ukeRad.appendChild(startGrp); ukeRad.appendChild(sluttGrp)
  form.appendChild(lagFormRad('Skoleår', ukeRad))

  // Logo
  const logoRow = el('div', { class: 'felt' })
  logoRow.appendChild(el('label', {}, 'Logo'))
  const logoUrlInput = el('input', { name: 'logo_url', type: 'url', class: 'felt input', value: school.logo_url || '', placeholder: 'https://...' })
  const logoFileInput = el('input', { type: 'file', accept: 'image/*', onchange: async (ev) => {
    const file = ev.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop()
    const path = `logos/${school.id}.${ext}`
    await sb.storage.from('logos').upload(path, file, { upsert: true })
    const { data: urlData } = sb.storage.from('logos').getPublicUrl(path)
    logoUrlInput.value = urlData.publicUrl
  }})
  logoRow.appendChild(logoUrlInput)
  logoRow.appendChild(logoFileInput)
  form.appendChild(logoRow)

  // Color theme
  const themeRow = el('div', { class: 'felt' })
  themeRow.appendChild(el('label', {}, 'Fargetema'))
  const themes = [
    { value: 'standard', label: 'Standard (grønn)', color: '#2d6a4f' },
    { value: 'lys', label: 'Lys (blå)', color: '#0077b6' },
    { value: 'mork', label: 'Mørk', color: '#74c69d' },
  ]
  const themeGroup = el('div', { class: 'theme-group' })
  for (const t of themes) {
    const radio = el('input', { type: 'radio', name: 'color_theme', value: t.value, id: `theme-${t.value}` })
    if (school.color_theme === t.value) radio.checked = true
    radio.addEventListener('change', () => {
      // Live preview
      document.documentElement.dataset.theme = t.value
    })
    const swatch = el('span', { class: 'theme-swatch', style: `background:${t.color}` })
    const lbl = el('label', { for: `theme-${t.value}` }, swatch, t.label)
    themeGroup.appendChild(radio)
    themeGroup.appendChild(lbl)
  }
  themeRow.appendChild(themeGroup)
  form.appendChild(themeRow)

  const lagreKnapp = el('button', { type: 'submit', class: 'btn btn-p' }, 'Lagre skoleinfo'); form.appendChild(lagreKnapp); overvakSkjema(form, lagreKnapp)
  container.appendChild(form)
}

async function renderSkoleaarTab(container) {
  clearEl(container)
  const school = APP.school
  const aktivt = school.active_school_year || '25/26'

  container.appendChild(el('h3', {}, 'Skoleår'))

  // Vis aktivt skoleår
  const statusBoks = el('div', { class: 'subj-config-box', style: 'margin-bottom:24px' })
  statusBoks.appendChild(el('div', { class: 'tekst-svak', style: 'font-size:.82rem;margin-bottom:2px' }, 'Aktivt skoleår'))
  statusBoks.appendChild(el('div', { style: 'font-size:1.5rem;font-weight:700;letter-spacing:.05em' }, aktivt))
  statusBoks.appendChild(el('div', { class: 'tekst-svak', style: 'font-size:.82rem;margin-top:6px' },
    'Elevene ser kun det aktive skoleåret. Lærere kan bla tilbake til tidligere år. Nye økter stemples automatisk med det aktive skoleåret.'))
  // Vis om planleggingsvinduet er åpent
  const neste = nesteSkolear(aktivt)
  if (neste) {
    const vinduApent = erNesteAarVinduApent()
    statusBoks.appendChild(el('div', {
      class: vinduApent ? 'neste-aar-banner' : '',
      style: vinduApent ? 'margin-top:10px' : 'margin-top:10px;font-size:.82rem;color:var(--tekst-svak)'
    }, vinduApent
      ? `📅 Planleggingsvindu for ${neste} er åpent (fra 17. mai). Lærere kan allerede planlegge neste skoleår.`
      : `📅 Planleggingsvindu for ${neste} åpner 17. mai — lærere kan da planlegge neste skoleår.`
    ))
  }
  container.appendChild(statusBoks)

  // "Nytt skoleår"-knapp som viser redigerbart forslag
  const forslag = nesteSkolear(aktivt)
  const redigerSection = el('div', { style: 'display:none' })

  const nyttBtn = el('button', {
    class: 'btn btn-p',
    title: 'Start et nytt skoleår',
    onclick: () => { redigerSection.style.display = ''; nyttBtn.style.display = 'none' }
  }, `Nytt skoleår →  ${forslag}`)
  container.appendChild(nyttBtn)

  // Redigerbart forslag + bekreft
  const forklarTekst = el('p', { class: 'tekst-svak', style: 'font-size:.82rem;margin:6px 0 10px' },
    'Kontroller skoleåret og trykk «Bekreft» for å aktivere. Elevenes visning endres umiddelbart.')
  redigerSection.appendChild(forklarTekst)

  const inputRad = el('div', { style: 'display:flex;align-items:center;gap:10px;flex-wrap:wrap' })
  const aarInput = el('input', {
    type: 'text',
    class: 'felt input',
    value: forslag,
    maxlength: 5,
    pattern: '\\d{2}/\\d{2}',
    placeholder: '25/26',
    title: 'Format: ÅÅ/ÅÅ, f.eks. 26/27',
    style: 'width:90px;font-size:1.1rem;font-weight:600;text-align:center'
  })

  // Auto-sett andre del når bruker skriver
  aarInput.addEventListener('input', () => {
    const v = aarInput.value.replace(/[^0-9/]/g, '')
    if (/^\d{2}$/.test(v)) {
      const b = (parseInt(v) + 1) % 100
      aarInput.value = `${v}/${String(b).padStart(2, '0')}`
    } else {
      aarInput.value = v
    }
  })

  const bekreftBtn = el('button', {
    class: 'btn btn-p',
    title: 'Aktiver dette skoleåret',
    onclick: async () => {
      const nytt = aarInput.value.trim()
      if (!/^\d{2}\/\d{2}$/.test(nytt)) {
        showToast('Ugyldig format — bruk ÅÅ/ÅÅ, f.eks. 26/27', 'error'); return
      }
      // Valider at andre del er første del + 1
      const [del1, del2] = nytt.split('/').map(Number)
      if ((del1 + 1) % 100 !== del2) {
        showToast(`Ugyldig skoleår: ${nytt} — andre årstall må være første + 1 (f.eks. 26/27)`, 'error'); return
      }
      if (nytt === aktivt) { showToast('Dette er allerede aktivt skoleår', 'info'); return }
      // Advarsel hvis nytt år ikke er forventet neste år
      const forventet = nesteSkolear(aktivt)
      const advarsel = forventet && nytt !== forventet
        ? `\n\n⚠️ Advarsel: Forventet neste år er ${forventet}, du valgte ${nytt}.` : ''
      if (!confirm(`Bytte aktivt skoleår fra ${aktivt} til ${nytt}?${advarsel}\n\nElevenes visning endres umiddelbart. Eksisterende økter beholdes.\n\nTips: Last ned en eksport av ${aktivt} fra eksport-seksjonen nedenfor før du bytter.`)) return
      await medLagreOverlay(async () => {
        const { data: oppdatert, error } = await sb
          .from('schools').update({ active_school_year: nytt }).eq('id', school.id).select().single()
        if (error) throw error
        if (!oppdatert) throw new Error('Ingen rader ble oppdatert – sjekk admin-tilgang i databasen')
        APP.school = oppdatert
      })
      showToast(`Aktivt skoleår endret til ${nytt}`, 'success')
      renderSkoleaarTab(container)
    }
  }, 'Bekreft')

  const avbrytBtn = el('button', {
    class: 'btn btn-s',
    title: 'Avbryt',
    onclick: () => { redigerSection.style.display = 'none'; nyttBtn.style.display = '' }
  }, 'Avbryt')

  inputRad.appendChild(aarInput)
  inputRad.appendChild(bekreftBtn)
  inputRad.appendChild(avbrytBtn)
  redigerSection.appendChild(inputRad)
  container.appendChild(redigerSection)

  // ── Eksport-seksjon ──────────────────────────────────────────
  container.appendChild(el('hr', { style: 'margin:28px 0 20px;border:none;border-top:1px solid var(--kant)' }))
  container.appendChild(el('h4', { style: 'margin-bottom:8px' }, 'Eksporter skoleår'))
  container.appendChild(el('p', { class: 'tekst-svak', style: 'font-size:.83rem;margin-bottom:14px' },
    'Last ned alle økter for et skoleår som sikkerhetskopi eller for videre bruk.'))

  // Hent tilgjengelige skoleår
  const { data: aarRader } = await sb.from('sessions')
    .select('school_year').eq('school_id', school.id).not('school_year', 'is', null)
  const alleAar = [...new Set((aarRader || []).map((r) => r.school_year))].sort().reverse()
  if (!alleAar.length) alleAar.push(aktivt)

  const eksportRad = el('div', { class: 'laerer-top', style: 'margin-bottom:6px' })

  const aarSel = el('select', { class: 'skolear-sel' })
  for (const a of alleAar) {
    aarSel.appendChild(el('option', { value: a }, a + (a === aktivt ? ' (aktivt)' : '')))
  }
  eksportRad.appendChild(aarSel)

  eksportRad.appendChild(el('button', { class: 'btn btn-s', title: 'Last ned som JSON-backup', onclick: async () => {
    await eksporterSkolear(school, aarSel.value, 'json')
  }}, '⬇ JSON'))

  eksportRad.appendChild(el('button', { class: 'btn btn-s', title: 'Last ned som CSV (Excel)', onclick: async () => {
    await eksporterSkolear(school, aarSel.value, 'csv')
  }}, '⬇ CSV'))

  eksportRad.appendChild(el('button', { class: 'btn btn-s', title: 'Skriv ut / lagre som PDF', onclick: async () => {
    await eksporterSkolear(school, aarSel.value, 'print')
  }}, '🖨 PDF/Skriv ut'))

  container.appendChild(eksportRad)
}

// Eksporterer alle sessions for et skoleår.
// format: 'json' | 'csv' | 'print'
async function eksporterSkolear(school, skolear, format) {
  const { data: sessions, error } = await sb.from('sessions')
    .select('*, subjects(name, short_code, color_hex), classes(name), users!teacher_id(full_name), session_divisions(division_id, subject_divisions(name, division_type))')
    .eq('school_id', school.id)
    .eq('school_year', skolear)
    .is('deleted_at', null)
    .order('week_nr')
    .order('day_of_week')

  if (error) { showToast('Eksport feilet: ' + error.message, 'error'); return }
  if (!sessions || !sessions.length) { showToast('Ingen økter funnet for ' + skolear, 'info'); return }

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' })
    lastNed(blob, `ukeplan-${skolear.replace('/', '-')}.json`)

  } else if (format === 'csv') {
    const cols = ['Uke', 'Dag', 'Klasse', 'Fag', 'Kode', 'Parti/gruppe', 'Lærer', 'Aktivitet', 'Møtested', 'Info']
    const rows = sessions.map(s => [
      s.week_nr,
      dagNavn(s.day_of_week),
      s.classes?.name ?? '',
      s.subjects?.name ?? '',
      s.subjects?.short_code ?? '',
      (s.session_divisions || []).map(sd => sd.subject_divisions ? `${sd.subject_divisions.division_type === 'parti' ? 'Parti' : 'Gruppe'}: ${sd.subject_divisions.name}` : '').filter(Boolean).join(', '),
      s.users?.full_name ?? '',
      s.activity ?? '',
      s.meeting_point ?? '',
      s.info ?? '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`))
    const csv = [cols.map(c => `"${c}"`).join(';'), ...rows.map(r => r.join(';'))].join('\r\n')
    // BOM for å sikre riktig norsk tegnsett i Excel
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    lastNed(blob, `ukeplan-${skolear.replace('/', '-')}.csv`)

  } else if (format === 'print') {
    // Bygg en utskriftsvennlig tabell i et nytt vindu
    const datoMap = {}
    const startWeek = school.school_year_start_week || 1
    for (const s of sessions) {
      const year = skoleaarKalenderaar(skolear, s.week_nr, startWeek)
      const dato = isoWeekToDate(year, s.week_nr, s.day_of_week)
      datoMap[`${s.week_nr}-${s.day_of_week}`] = dato.toLocaleDateString('no-NO', { day: '2-digit', month: '2-digit' })
    }

    const rows = sessions.map(s => `
      <tr>
        <td>${s.week_nr}</td>
        <td>${dagNavn(s.day_of_week)} ${datoMap[`${s.week_nr}-${s.day_of_week}`] || ''}</td>
        <td>${s.classes?.name ?? ''}</td>
        <td>${s.subjects?.short_code ?? ''} ${s.subjects?.name ?? ''}</td>
        <td>${s.users?.full_name ?? ''}</td>
        <td>${s.activity ?? ''}</td>
        <td>${s.meeting_point ?? ''}</td>
        <td>${s.info ?? ''}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html lang="no"><head><meta charset="UTF-8">
      <title>Ukeplan ${school.name} – ${skolear}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; }
        h1 { font-size: 16px; margin-bottom: 12px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; vertical-align: top; }
        th { background: #f0f0f0; font-weight: bold; }
        tr:nth-child(even) { background: #fafafa; }
        @media print { body { padding: 0; } }
      </style>
    </head><body>
      <h1>${school.name} – Skoleår ${skolear}</h1>
      <table>
        <thead><tr>
          <th>Uke</th><th>Dag</th><th>Klasse</th><th>Fag</th>
          <th>Lærer</th><th>Aktivitet</th><th>Møtested</th><th>Info</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`

    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close(); w.print() }
  }
}

function lastNed(blob, filnavn) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filnavn
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 10000)
}

async function renderFagTab(container) {
  async function refresh() {
    clearEl(container)
    const [{ data: subjects }, { data: alleDivisjoner }] = await Promise.all([
      sb.from('subjects').select('*').is('deleted_at', null).order('name'),
      sb.from('subject_divisions').select('*').is('class_id', null).is('deleted_at', null).order('sort_order'),
    ])
    const grupperPerFag = {}
    for (const d of alleDivisjoner || []) {
      if (!grupperPerFag[d.subject_id]) grupperPerFag[d.subject_id] = []
      grupperPerFag[d.subject_id].push(d)
    }

    container.appendChild(el('h3', {}, 'Fag'))
    for (const s of subjects || []) {
      const blokk = el('div', { class: 'admin-fag-blokk' })
      const row = el('div', { class: 'admin-rad' })
      const swatch = el('span', { class: 'color-swatch', style: `background:${s.color_hex || '#ccc'}` })
      row.appendChild(swatch)
      row.appendChild(el('span', { class: 'tekst' }, `${s.name} (${s.short_code})`))
      row.appendChild(el('button', { class: 'btn btn-ikon', title: `Rediger faget ${s.name}`, onclick: () => visRedigerFagModal(s, refresh) }, '✏️'))
      row.appendChild(el('button', { class: 'btn btn-ikon btn-f', title: `Slett faget ${s.name}`, onclick: async () => {
        if (!confirm(`Slette faget "${s.name}"? Dette vil påvirke alle eksisterende økter.`)) return
        await medLagreOverlay(() => sb.from('subjects').update({ deleted_at: new Date().toISOString() }).eq('id', s.id))
        refresh()
      }}, '🗑️'))
      blokk.appendChild(row)

      // Grupper (class_id IS NULL) – kun for fag med has_gruppe = true
      if (s.has_gruppe) {
        const grupper = grupperPerFag[s.id] || []
        const gruppeRad = el('div', { class: 'admin-grupper-rad' })
        for (const g of grupper) {
          const gRow = el('div', { class: 'div-row' })
          const gInput = el('input', { type: 'text', class: 'felt input input-sm', value: g.name })
          gRow.appendChild(gInput)
          gRow.appendChild(el('button', { class: 'btn btn-ikon', title: 'Lagre gruppenavn', onclick: async () => {
            await medLagreOverlay(() => sb.from('subject_divisions').update({ name: gInput.value }).eq('id', g.id))
            showToast('Lagret', 'success')
          }}, '💾'))
          gRow.appendChild(el('button', { class: 'btn btn-ikon btn-f', title: `Slett gruppen ${g.name}`, onclick: async () => {
            if (!confirm(`Slette gruppen «${g.name}»?`)) return
            await medLagreOverlay(() => sb.from('subject_divisions')
              .update({ deleted_at: new Date().toISOString() }).eq('id', g.id))
            refresh()
          }}, '🗑️'))
          gruppeRad.appendChild(gRow)
        }
        if (grupper.length < 8) {
          gruppeRad.appendChild(el('button', { class: 'btn btn-sm', title: 'Legg til gruppe', onclick: async () => {
            const navn = prompt(`Navn på ny gruppe for ${s.name}:`)
            if (!navn) return
            await medLagreOverlay(() => sb.from('subject_divisions').insert({
              subject_id: s.id, division_type: 'gruppe', name: navn, sort_order: grupper.length,
            }))
            refresh()
          }}, '+ Legg til gruppe'))
        }
        blokk.appendChild(gruppeRad)
      }

      container.appendChild(blokk)
    }
    container.appendChild(el('button', { class: 'btn btn-p', title: 'Legg til nytt fag', onclick: () => visRedigerFagModal(null, refresh) }, '+ Nytt fag'))
  }
  await refresh()
}

async function visRedigerFagModal(subj, onSave) {
  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, subj ? 'Rediger fag' : 'Nytt fag'))
  if (subj) box.appendChild(el('p', { class: 'warning-text' }, '⚠️ Endring av navn påvirker alle eksisterende visninger.'))

  // Last inn eksisterende inndelinger når vi redigerer
  let eksisterendeDivs = []
  if (subj) {
    const { data: divs } = await sb.from('subject_divisions').select('*')
      .eq('subject_id', subj.id).is('deleted_at', null).order('sort_order')
    eksisterendeDivs = divs || []
  }

  const divNavnContainer = el('div', { class: 'div-list' })

  const form = el('form', { class: 'skjema', onsubmit: async (e) => {
    e.preventDefault()
    const fd = new FormData(form)
    const divType = fd.get('division_type')
    const maks = parseInt(fd.get('max_divisions')) || 8
    const data = {
      name: fd.get('name'),
      short_code: fd.get('short_code'),
      color_hex: fd.get('color_hex'),
      has_parti: divType === 'parti',
      has_gruppe: divType === 'gruppe',
      max_divisions: maks,
    }
    await medLagreOverlay(async () => {
      let subjId = subj?.id
      if (subj) {
        const { error } = await sb.from('subjects').update(data).eq('id', subj.id)
        if (error) throw error
      } else {
        const { data: nytt, error } = await sb.from('subjects')
          .insert({ ...data, school_id: APP.school.id }).select('id').single()
        if (error) throw error
        subjId = nytt.id
      }

      // Oppdater inndelinger
      const navnInputs = divNavnContainer.querySelectorAll('input[type=text]')
      const navnListe = Array.from(navnInputs).map(inp => inp.value.trim())

      if (divType === 'ingen') {
        for (const d of eksisterendeDivs) {
          await sb.from('subject_divisions').update({ deleted_at: new Date().toISOString() }).eq('id', d.id)
        }
      } else {
        for (let i = 0; i < maks; i++) {
          const navn = navnListe[i] || (divType === 'parti' ? `P${i + 1}` : `Gruppe ${i + 1}`)
          if (eksisterendeDivs[i]) {
            await sb.from('subject_divisions').update({ name: navn, division_type: divType }).eq('id', eksisterendeDivs[i].id)
          } else {
            await sb.from('subject_divisions').insert({ subject_id: subjId, division_type: divType, name: navn, sort_order: i + 1 })
          }
        }
        for (let i = maks; i < eksisterendeDivs.length; i++) {
          await sb.from('subject_divisions').update({ deleted_at: new Date().toISOString() }).eq('id', eksisterendeDivs[i].id)
        }
      }
    })
    modal.remove()
    if (onSave) onSave()
  }})

  // Navn
  const navnInput = el('input', { name: 'name', type: 'text', class: 'felt input', value: subj?.name || '', required: 'true',
    oninput: (e) => {
      // Auto-generer kortkode fra de 3 første store bokstavene dersom feltet er tomt
      if (!kortInput.dataset.manuelt) {
        kortInput.value = e.target.value.replace(/[^a-zA-ZæøåÆØÅ]/g, '').slice(0, 3).toUpperCase()
      }
    }
  })
  form.appendChild(lagFormRad('Navn', navnInput))

  // Kortkode – autogenerert, kan overstyres
  const kortInfo = el('span', { style: 'font-size:.78rem;color:var(--tekst-svak);margin-left:6px' },
    'Brukes som etikett på økt-kortene. Genereres automatisk.')
  const kortInput = el('input', { name: 'short_code', type: 'text', class: 'felt input',
    value: subj?.short_code || '', maxlength: '6', style: 'text-transform:uppercase;width:80px',
    oninput: () => { kortInput.dataset.manuelt = '1' }
  })
  if (subj?.short_code) kortInput.dataset.manuelt = '1'
  const kortRad = el('div', { class: 'felt' })
  kortRad.appendChild(el('label', {}, 'Kortkode'))
  const kortWrap = el('div', { class: 'input-med-hint' })
  kortWrap.appendChild(kortInput)
  kortWrap.appendChild(kortInfo)
  kortRad.appendChild(kortWrap)
  form.appendChild(kortRad)

  // Farge – palett med 12 farger + forhåndsvisning
  const FAG_FARGER = ['#e63946','#e07a5f','#f4a261','#f9c74f','#43aa8b','#2d6a4f','#4a90d9','#457b9d','#6a4c93','#b56576','#9b2226','#606c38']
  const { data: eksisterendeFag } = await sb.from('subjects').select('color_hex').eq('school_id', APP.school.id).is('deleted_at', null)
  const bruktefarger = new Set((eksisterendeFag || []).filter(f => f.id !== subj?.id).map(f => f.color_hex).filter(Boolean))
  const autoFarge = FAG_FARGER.find(f => !bruktefarger.has(f)) || FAG_FARGER[0]
  let valgtFarge = subj?.color_hex || autoFarge

  const fargeEtikett = el('span', { class: 'fag-badge', style: `background:${valgtFarge};color:#fff` }, subj?.name || 'Eksempel')
  navnInput.addEventListener('input', () => { fargeEtikett.textContent = navnInput.value || 'Eksempel' })

  const fargeHidden = el('input', { name: 'color_hex', type: 'hidden', value: valgtFarge })

  const palettWrap = el('div', { style: 'display:flex;gap:6px;flex-wrap:wrap;align-items:center' })
  for (const farge of FAG_FARGER) {
    const btn = el('button', { type: 'button', title: `Velg farge ${farge}`, style: `width:28px;height:28px;border-radius:50%;background:${farge};border:3px solid ${farge===valgtFarge?'var(--tekst)':'transparent'};cursor:pointer;flex-shrink:0` })
    btn.addEventListener('click', () => {
      valgtFarge = farge
      fargeHidden.value = farge
      fargeEtikett.style.background = farge
      palettWrap.querySelectorAll('button').forEach(b => b.style.border = '3px solid transparent')
      btn.style.border = '3px solid var(--tekst)'
      form.dispatchEvent(new Event('change'))
    })
    palettWrap.appendChild(btn)
  }
  palettWrap.appendChild(fargeEtikett)
  form.appendChild(fargeHidden)

  const fargeRad = el('div', { class: 'felt' })
  fargeRad.appendChild(el('label', {}, 'Farge'))
  fargeRad.appendChild(palettWrap)
  form.appendChild(fargeRad)

  // Inndeling
  const dtSel = el('select', { name: 'division_type', class: 'felt select' })
  dtSel.appendChild(el('option', { value: 'ingen' }, 'Ingen inndeling'))
  dtSel.appendChild(el('option', { value: 'parti' }, 'Parti (innenfor klassen)'))
  dtSel.appendChild(el('option', { value: 'gruppe' }, 'Gruppe (på tvers av klasser)'))
  if (subj?.has_parti) dtSel.value = 'parti'
  else if (subj?.has_gruppe) dtSel.value = 'gruppe'
  form.appendChild(lagFormRad('Inndeling', dtSel))

  // Maks inndelinger – kun synlig når inndeling er valgt
  const maksInput = el('input', { name: 'max_divisions', type: 'number', class: 'felt input', value: subj?.max_divisions || 8, min: 1, max: 20, style: 'width:70px' })
  const maksRad = el('div', { class: 'felt' })
  maksRad.appendChild(el('label', {}, 'Maks antall inndelinger'))
  maksRad.appendChild(maksInput)
  form.appendChild(maksRad)

  // Navnefelt for inndelinger
  const divNavnRad = el('div', { class: 'felt' })
  divNavnRad.appendChild(el('label', {}, 'Navn på inndelinger'))
  divNavnRad.appendChild(divNavnContainer)
  form.appendChild(divNavnRad)

  function oppdaterDivNavn() {
    const divType = dtSel.value
    const maks = Math.max(1, Math.min(20, parseInt(maksInput.value) || 8))
    const skjul = divType === 'ingen'
    maksRad.style.display = skjul ? 'none' : 'block'
    divNavnRad.style.display = skjul ? 'none' : 'block'
    if (skjul) { clearEl(divNavnContainer); return }
    // Bevar verdier brukeren allerede har skrevet inn
    const gjeldende = Array.from(divNavnContainer.querySelectorAll('input[type=text]')).map(inp => inp.value)
    clearEl(divNavnContainer)
    for (let i = 0; i < maks; i++) {
      const standardNavn = divType === 'parti' ? `P${i + 1}` : `Gruppe ${i + 1}`
      const verdi = gjeldende[i] !== undefined ? gjeldende[i] : (eksisterendeDivs[i]?.name || '')
      const row = el('div', { class: 'div-row' })
      row.appendChild(el('span', { style: 'min-width:72px;font-size:.88rem;color:var(--tekst-svak)' }, standardNavn + ':'))
      row.appendChild(el('input', { type: 'text', class: 'felt input input-sm', value: verdi, placeholder: standardNavn }))
      divNavnContainer.appendChild(row)
    }
  }

  dtSel.addEventListener('change', oppdaterDivNavn)
  maksInput.addEventListener('input', oppdaterDivNavn)
  oppdaterDivNavn()

  const lagreKnapp = el('button', { type: 'submit', class: 'btn btn-p' }, 'Lagre'); form.appendChild(lagreKnapp); overvakSkjema(form, lagreKnapp)
  form.appendChild(el('button', { type: 'button', class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))
  box.appendChild(form)
  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function renderKlasserTab(container) {
  async function refresh() {
    clearEl(container)
    const { data: klasser } = await sb.from('classes').select('*').order('name')
    container.appendChild(el('h3', {}, 'Klasser'))

    for (const k of klasser || []) {
      const row = el('div', { class: 'admin-rad' })
      row.appendChild(el('span', { class: 'tekst' }, k.name))
      const kopierBtn = el('button', { class: 'btn btn-sm', title: 'Kopier elevlenke til utklippstavlen', onclick: async () => {
        const url = `${location.origin}${location.pathname}#/klasse/${encodeURIComponent(k.name)}`
        await navigator.clipboard.writeText(url)
        kopierBtn.textContent = 'Kopiert!'
        setTimeout(() => { kopierBtn.textContent = 'Kopier elevlenke' }, 2000)
      }}, 'Kopier elevlenke')
      row.appendChild(kopierBtn)
      row.appendChild(el('button', { class: 'btn btn-ikon', title: 'Endre navn på klassen', onclick: () => {
        const nyttNavn = prompt('Nytt navn:', k.name)
        if (!nyttNavn) return
        medLagreOverlay(() => sb.from('classes').update({ name: nyttNavn }).eq('id', k.id)).then(refresh)
      }}, '✏️'))
      row.appendChild(el('button', { class: 'btn btn-ikon btn-f', title: 'Slett klassen og all tilknyttet data', onclick: async () => {
        if (!confirm(`Slette klassen "${k.name}"? Dette er alvorlig og kan ikke angres!`)) return
        if (!confirm('Er du helt sikker? Alle tilknyttede data vil bli slettet.')) return
        await medLagreOverlay(() => sb.from('classes').update({ deleted_at: new Date().toISOString() }).eq('id', k.id))
        refresh()
      }}, '🗑️'))
      row.appendChild(el('button', { class: 'btn btn-sm', title: 'Slå denne klassen sammen med en annen', onclick: () => visMergeKlasseModal(k, klasser, refresh) }, 'Slå sammen'))
      container.appendChild(row)
    }

    container.appendChild(el('button', { class: 'btn btn-p', title: 'Opprett ny klasse', onclick: async () => {
      const navn = prompt('Klassenavn:')
      if (!navn) return
      await medLagreOverlay(() => sb.from('classes').insert({ name: navn, school_id: APP.school.id }))
      refresh()
    }}, '+ Ny klasse'))
  }
  await refresh()
}

async function visMergeKlasseModal(klasse, alleKlasser, onSave) {
  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, `Slå sammen klasse: ${klasse.name}`))
  box.appendChild(el('p', { class: 'warning-text' }, '⚠️ Dette er en destruktiv operasjon. Alt fra målklassen flyttes til denne.'))

  const sel = el('select', { class: 'felt select' })
  for (const k of alleKlasser.filter(k => k.id !== klasse.id)) {
    sel.appendChild(el('option', { value: k.id }, k.name))
  }
  box.appendChild(lagFormRad('Slå inn i', sel))

  box.appendChild(el('button', { class: 'btn btn-f', onclick: async () => {
    if (!confirm('Er du sikker? Dette kan ikke angres.')) return
    await medLagreOverlay(async () => {
      // Move all sessions from target class to this class
      await sb.from('sessions').update({ class_id: klasse.id }).eq('class_id', sel.value)
      // Soft delete target
      await sb.from('classes').update({ deleted_at: new Date().toISOString() }).eq('id', sel.value)
    })
    modal.remove()
    if (onSave) onSave()
  }}, 'Slå sammen'))
  box.appendChild(el('button', { class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))

  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function renderBrukereTab(container) {
  async function refresh() {
    clearEl(container)
    const { data: users } = await sb.from('users').select('*, user_classes(classes(*))').eq('school_id', APP.school.id).order('full_name')
    const { data: klasser } = await sb.from('classes').select('*').order('name')

    container.appendChild(el('h3', {}, 'Brukere'))

    for (const u of users || []) {
      const klList = (u.user_classes || []).map(tc => tc.classes?.name).filter(Boolean).join(', ')
      const row = el('div', { class: 'admin-rad' })
      row.appendChild(el('span', { class: 'tekst' }, `${u.full_name} – ${u.role}${u.is_admin ? ' + admin' : ''}`))
      if (klList) row.appendChild(el('span', { class: 'tekst-svak' }, klList))
      row.appendChild(el('button', { class: 'btn btn-ikon', title: `Rediger bruker ${u.full_name}`, onclick: () => visRedigerBrukerModal(u, klasser, refresh) }, '✏️'))
      row.appendChild(el('button', { class: 'btn btn-ikon btn-f', title: `Slett bruker ${u.full_name}`, onclick: () => visSlettBrukerModal(u, refresh) }, '🗑️'))
      container.appendChild(row)
    }

    container.appendChild(el('button', { class: 'btn btn-p', title: 'Legg til ny bruker', onclick: () => visNyBrukerModal(klasser, refresh) }, '+ Ny bruker'))

  }
  await refresh()
}

async function visNyBrukerModal(klasser, onSave) {
  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, 'Ny bruker'))

  const form = el('form', { class: 'skjema', onsubmit: async (e) => {
    e.preventDefault()
    const fd = new FormData(form)
    const erAdmin = form.querySelector('[name=is_admin]').checked
    // Admin er additivt: basisrollen styres av radioknappen, is_admin er et eget flagg
    const rolle = fd.get('role')
    const klassIds = [...form.querySelectorAll('[name=class_id]:checked')].map(c => c.value)
    await medLagreOverlay(async () => {
      // Sjekk maks 3 admins
      if (erAdmin) {
        const { data: admins } = await sb.from('users').select('id').eq('school_id', APP.school.id).eq('is_admin', true).is('deleted_at', null)
        if ((admins?.length || 0) >= 3) throw new Error('Maks 3 administratorer er tillatt per skole')
      }
      // Sjekk maks 3 kontaktlærere per klasse
      if (rolle === 'kontaktlaerer') {
        for (const kid of klassIds) {
          const { data: kl } = await sb.from('user_classes')
            .select('user_id, users!inner(role)')
            .eq('class_id', kid)
            .eq('users.role', 'kontaktlaerer')
          if ((kl?.length || 0) >= 3) {
            const k = klasser.find(k => k.id === kid)
            throw new Error(`Klasse ${k?.name || ''} har allerede 3 kontaktlærere`)
          }
        }
      }
      const { data: { session } } = await sb.auth.getSession()
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: fd.get('email'),
          full_name: fd.get('full_name'),
          role: rolle,
          is_admin: erAdmin,
          class_ids: klassIds,
          redirect_to: window.location.origin + window.location.pathname,
          school_name: APP.school?.name || '',
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Ukjent feil')
    })
    modal.remove()
    if (onSave) onSave()
  }})

  form.appendChild(lagFormRad('E-post', el('input', { name: 'email', type: 'email', class: 'felt input', required: 'true', placeholder: 'laerer@skole.no' })))
  form.appendChild(lagFormRad('Navn', el('input', { name: 'full_name', type: 'text', class: 'felt input', required: 'true' })))

  const rolleWrap = el('div', { class: 'rolle-gruppe' })
  for (const [val, label] of [['laerer','Lærer'],['kontaktlaerer','Kontaktlærer']]) {
    const lbl = el('label', { style: 'display:flex;align-items:center;gap:6px;cursor:pointer' })
    const rb = el('input', { type: 'radio', name: 'role', value: val, required: 'true' })
    if (val === 'laerer') rb.checked = true
    lbl.appendChild(rb); lbl.appendChild(document.createTextNode(label))
    rolleWrap.appendChild(lbl)
  }
  form.appendChild(lagFormRad('Rolle', rolleWrap))

  const adminLbl = el('label', { style: 'display:flex;align-items:center;gap:6px;cursor:pointer;margin-top:4px' })
  const adminCb = el('input', { type: 'checkbox', name: 'is_admin' })
  adminLbl.appendChild(adminCb); adminLbl.appendChild(document.createTextNode('Administrator'))
  form.appendChild(el('div', { class: 'felt' }, adminLbl))

  const klDiv = el('div', { class: 'class-checkboxes' })
  for (const k of klasser || []) {
    const lbl = el('label', { style: 'display:flex;align-items:center;gap:4px;cursor:pointer' })
    const cb = el('input', { type: 'checkbox', name: 'class_id', value: k.id })
    lbl.appendChild(cb)
    lbl.appendChild(document.createTextNode(k.name))
    klDiv.appendChild(lbl)
  }
  form.appendChild(lagFormRad('Klasser', klDiv))

  const lagreKnapp = el('button', { type: 'submit', class: 'btn btn-p' }, 'Lagre'); form.appendChild(lagreKnapp); overvakSkjema(form, lagreKnapp)
  form.appendChild(el('button', { type: 'button', class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))
  box.appendChild(form)
  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function visRedigerBrukerModal(user, klasser, onSave) {
  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, 'Rediger bruker'))

  const { data: tilknyttede } = await sb.from('user_classes').select('class_id').eq('user_id', user.id)
  const tilknyttedeIds = new Set((tilknyttede || []).map(r => r.class_id))

  const form = el('form', { class: 'skjema', onsubmit: async (e) => {
    e.preventDefault()
    const fd = new FormData(form)
    const erAdmin = form.querySelector('[name=is_admin]').checked
    // Admin er additivt: basisrollen styres av radioknappen, is_admin er et eget flagg
    const rolle = fd.get('role')
    const newKlassIds = [...form.querySelectorAll('[name=class_id]:checked')].map(c => c.value)
    await medLagreOverlay(async () => {
      // Sjekk maks 3 admins (unntatt seg selv)
      if (erAdmin && !user.is_admin) {
        const { data: admins } = await sb.from('users').select('id').eq('school_id', APP.school.id).eq('is_admin', true).is('deleted_at', null).neq('id', user.id)
        if ((admins?.length || 0) >= 3) throw new Error('Maks 3 administratorer er tillatt per skole')
      }
      // Sjekk maks 3 kontaktlærere per klasse
      if (rolle === 'kontaktlaerer') {
        for (const kid of newKlassIds) {
          if (tilknyttedeIds.has(kid)) continue
          const { data: kl } = await sb.from('user_classes')
            .select('user_id, users!inner(role)')
            .eq('class_id', kid)
            .eq('users.role', 'kontaktlaerer')
          if ((kl?.length || 0) >= 3) {
            const k = klasser.find(k => k.id === kid)
            throw new Error(`Klasse ${k?.name || ''} har allerede 3 kontaktlærere`)
          }
        }
      }
      await sb.from('users').update({
        full_name: fd.get('full_name'),
        role: rolle,
        is_admin: erAdmin,
      }).eq('id', user.id)
      await sb.from('user_classes').delete().eq('user_id', user.id)
      for (const kid of newKlassIds) {
        await sb.from('user_classes').insert({ user_id: user.id, class_id: kid })
      }
    })
    modal.remove()
    if (onSave) onSave()
  }})

  const nameInput = el('input', { name: 'full_name', type: 'text', class: 'felt input', value: user.full_name })
  const nameWarning = el('small', { class: 'warning-text' }, '⚠️ Navneendring påvirker visning overalt')
  form.appendChild(lagFormRad('Navn', nameInput, nameWarning))

  const rolleWrap2 = el('div', { class: 'rolle-gruppe' })
  for (const [val, label] of [['laerer','Lærer'],['kontaktlaerer','Kontaktlærer']]) {
    const lbl = el('label', { style: 'display:flex;align-items:center;gap:6px;cursor:pointer' })
    const rb = el('input', { type: 'radio', name: 'role', value: val, required: 'true' })
    if (user.role === val) rb.checked = true
    lbl.appendChild(rb); lbl.appendChild(document.createTextNode(label))
    rolleWrap2.appendChild(lbl)
  }
  form.appendChild(lagFormRad('Rolle', rolleWrap2))

  const adminLbl2 = el('label', { style: 'display:flex;align-items:center;gap:6px;cursor:pointer;margin-top:4px' })
  const adminCb2 = el('input', { type: 'checkbox', name: 'is_admin' })
  if (user.is_admin) adminCb2.checked = true
  adminLbl2.appendChild(adminCb2); adminLbl2.appendChild(document.createTextNode('Administrator'))
  form.appendChild(el('div', { class: 'felt' }, adminLbl2))

  const klDiv = el('div', { class: 'class-checkboxes' })
  for (const k of klasser || []) {
    const lbl = el('label')
    const cb = el('input', { type: 'checkbox', name: 'class_id', value: k.id })
    if (tilknyttedeIds.has(k.id)) cb.checked = true
    lbl.appendChild(cb)
    lbl.appendChild(document.createTextNode(k.name))
    klDiv.appendChild(lbl)
  }
  form.appendChild(lagFormRad('Klasser', klDiv))

  const lagreKnapp = el('button', { type: 'submit', class: 'btn btn-p' }, 'Lagre'); form.appendChild(lagreKnapp); overvakSkjema(form, lagreKnapp)
  form.appendChild(el('button', { type: 'button', class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))
  box.appendChild(form)

  // ── Kontoadministrasjon (e-post + passord) ──
  box.appendChild(el('div', { class: 'seksjon-tittel' }, 'Kontoadministrasjon'))

  // E-post
  const epostFeil = el('p', { class: 'feil-tekst skjult' })
  box.appendChild(epostFeil)
  const epostInput = el('input', { type: 'email', class: 'felt input', placeholder: 'Laster e-post…', disabled: 'true' })
  const epostRad = lagFormRad('E-postadresse', epostInput)
  box.appendChild(epostRad)
  // Hent nåværende e-post
  kallAdminUser('get_email', { user_id: user.id })
    .then(r => { epostInput.value = r.email || ''; epostInput.placeholder = 'din@epost.no'; epostInput.removeAttribute('disabled') })
    .catch(() => { epostInput.placeholder = 'kunne ikke hente e-post'; epostInput.removeAttribute('disabled') })
  const endreEpostBtn = el('button', { type: 'button', class: 'btn btn-s', title: 'Endre brukerens e-postadresse', onclick: async () => {
    epostFeil.classList.add('skjult')
    const ny = epostInput.value.trim()
    if (!ny) { epostFeil.textContent = 'Skriv inn en e-postadresse'; epostFeil.classList.remove('skjult'); return }
    if (!confirm(`Endre e-post til ${ny}? Gammel adresse blir varslet.`)) return
    try {
      const r = await medLagreOverlay(() => kallAdminUser('change_email', { user_id: user.id, new_email: ny, redirect_to: window.location.origin + window.location.pathname }))
      showToast(r.notified ? 'E-post endret. Gammel adresse er varslet.' : 'E-post endret. (Varsel kunne ikke sendes – gi beskjed manuelt.)', 'ok')
    } catch (err) { epostFeil.textContent = err.message; epostFeil.classList.remove('skjult') }
  }}, 'Endre e-post')
  box.appendChild(endreEpostBtn)

  // Passord (sammenleggbar)
  const pwSeksjon = el('div', { style: 'margin-top:16px; border:1px solid var(--kant); border-radius:var(--radius); overflow:hidden' })
  const pwToggle = el('button', { type: 'button', class: 'btn btn-s', title: 'Vis eller skjul passord-alternativer', style: 'width:100%; text-align:left; border-radius:0; background:var(--bakgrunn2); border:none; padding:10px 14px; font-weight:600; display:flex; justify-content:space-between; align-items:center' })
  const pwPil = el('span', {}, '▶')
  pwToggle.appendChild(el('span', {}, 'Passord'))
  pwToggle.appendChild(pwPil)
  const pwInnhold = el('div', { style: 'display:none; padding:12px 14px; display:none; gap:8px; flex-wrap:wrap' })
  pwInnhold.style.display = 'none'
  pwToggle.onclick = () => {
    const open = pwInnhold.style.display !== 'none'
    pwInnhold.style.display = open ? 'none' : 'flex'
    pwPil.textContent = open ? '▶' : '▼'
  }
  pwInnhold.appendChild(el('button', { type: 'button', class: 'btn btn-s', title: 'Sett nytt passord direkte (uten e-post)', onclick: () => visAdminSettPassord(user) }, 'Endre nå'))
  pwInnhold.appendChild(el('button', { type: 'button', class: 'btn btn-s', title: 'Send e-post med lenke for å tilbakestille passord', onclick: async () => {
    if (!confirm('Sende resett-e-post til brukeren?')) return
    try {
      await medLagreOverlay(() => kallAdminUser('send_reset', { user_id: user.id, redirect_to: window.location.origin + window.location.pathname }))
      showToast('Resett-e-post sendt', 'ok')
    } catch (err) { showToast(err.message, 'error') }
  }}, 'Send resett-e-post'))
  pwSeksjon.appendChild(pwToggle)
  pwSeksjon.appendChild(pwInnhold)
  box.appendChild(pwSeksjon)

  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

// Admin setter et nytt passord direkte for en bruker (omgår e-postgrense)
function visAdminSettPassord(user) {
  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, `Sett passord – ${user.full_name}`))
  box.appendChild(el('p', { class: 'tekst-svak', style: 'font-size:.85rem;margin:0 0 12px' },
    'Du setter passordet direkte. Gi det til brukeren på en trygg måte, og be dem bytte det selv etterpå.'))
  const feil = el('p', { class: 'feil-tekst skjult' })
  box.appendChild(feil)
  const form = el('form', { class: 'skjema' })
  const pw = el('input', { type: 'text', class: 'felt input', placeholder: 'Nytt passord (minst 8 tegn)', minlength: 8, required: 'true' })
  form.appendChild(pw)
  const bunn = el('div', { class: 'modal-bunn' })
  bunn.appendChild(el('button', { type: 'button', class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))
  bunn.appendChild(el('button', { type: 'submit', class: 'btn btn-p' }, 'Sett passord'))
  form.appendChild(bunn)
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    feil.classList.add('skjult')
    if (pw.value.length < 8) { feil.textContent = 'Passordet må være minst 8 tegn'; feil.classList.remove('skjult'); return }
    try {
      const r = await medLagreOverlay(() => kallAdminUser('set_password', { user_id: user.id, password: pw.value }))
      modal.remove()
      showToast(r.notified ? 'Passord satt. Brukeren er varslet.' : 'Passord satt.', 'ok')
    } catch (err) { feil.textContent = err.message; feil.classList.remove('skjult') }
  })
  box.appendChild(form)
  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function visSlettBrukerModal(user, onSave) {
  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, `Slett bruker: ${user.full_name}`))

  const { data: future } = await sb.from('sessions')
    .select('id')
    .eq('teacher_id', user.id)
    .gte('week_nr', getCurrentISOWeek())

  if (future && future.length) {
    box.appendChild(el('p', {}, `Brukeren har ${future.length} fremtidige økt(er). Hva vil du gjøre?`))

    const { data: others } = await sb.from('users')
      .select('*')
      .eq('school_id', APP.school.id)
      .neq('id', user.id)

    const reassignSel = el('select', { class: 'felt select' })
    reassignSel.appendChild(el('option', { value: '' }, 'Slett øktene'))
    for (const o of others || []) {
      reassignSel.appendChild(el('option', { value: o.id }, `Overfør til ${o.full_name}`))
    }
    box.appendChild(lagFormRad('Fremtidige økter', reassignSel))

    box.appendChild(el('button', { class: 'btn btn-f', title: 'Slett brukeren og overfør eller slett fremtidige økter', onclick: async () => {
      const targetId = reassignSel.value
      await medLagreOverlay(async () => {
        if (targetId) {
          await sb.from('sessions').update({ teacher_id: targetId })
            .eq('teacher_id', user.id).gte('week_nr', getCurrentISOWeek())
        } else {
          await sb.from('sessions').delete()
            .eq('teacher_id', user.id).gte('week_nr', getCurrentISOWeek())
        }
        await sb.from('users').update({ deleted_at: new Date().toISOString() }).eq('id', user.id)
      })
      modal.remove()
      if (onSave) onSave()
    }}, 'Slett bruker'))
  } else {
    box.appendChild(el('p', {}, 'Brukeren har ingen fremtidige økter.'))
    box.appendChild(el('button', { class: 'btn btn-f', title: 'Slett brukeren permanent', onclick: async () => {
      await medLagreOverlay(() => sb.from('users').update({ deleted_at: new Date().toISOString() }).eq('id', user.id))
      modal.remove()
      if (onSave) onSave()
    }}, 'Slett bruker'))
  }

  box.appendChild(el('button', { class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))
  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function renderSkolerute(container) {
  let valgtSkolear = APP.school?.active_school_year

  async function refresh() {
    clearEl(container)
    const wrap = el('div', { class: 'skjema-smal' })
    wrap.appendChild(el('h3', {}, 'Skolerute'))

    // Skoleår-veksler: neste år kun tilgjengelig fra 17. mai
    const aktivtSy = APP.school?.active_school_year
    const nesteSy = nesteSkolear(aktivtSy)
    const vinduApent = erNesteAarVinduApent()

    if (vinduApent && nesteSy) {
      const vekslerRad = el('div', { class: 'skolear-veksler' })
      for (const sy of [aktivtSy, nesteSy]) {
        const erValgt = sy === valgtSkolear
        const knapp = el('button', {
          type: 'button',
          class: `btn ${erValgt ? 'btn-p' : 'btn-s'} skolear-veksler-knapp`,
          onclick: () => { valgtSkolear = sy; refresh() }
        }, sy === aktivtSy ? `${sy} (aktivt)` : `${sy} – planlegging`)
        vekslerRad.appendChild(knapp)
      }
      wrap.appendChild(vekslerRad)
    } else {
      wrap.appendChild(el('p', { class: 'tekst-svak', style: 'font-size:.9rem; margin:0 0 8px' },
        `Skoleår: ${aktivtSy ?? '–'}`))
    }

    const intervall = skoleaarIntervall(valgtSkolear)
    const erNesteSkolear = valgtSkolear !== aktivtSy
    if (erNesteSkolear) {
      wrap.appendChild(el('p', { class: 'planlegging-banner' },
        `Planleggingsmodus — du redigerer neste skoleår (${valgtSkolear}). Endringer er ikke synlige for elever ennå.`))
    } else if (intervall) {
      const startWeek = APP.school?.school_year_start_week || 33
      const endWeek = APP.school?.school_year_end_week || 24
      wrap.appendChild(el('p', { class: 'skolear-banner' },
        `Skoleår ${valgtSkolear} (uke ${startWeek} ${intervall.aar1} – uke ${endWeek} ${intervall.aar2})`))
    }

    const { data: events } = await sb.from('school_calendar').select('*')
      .is('deleted_at', null)
      .gte('start_date', intervall?.fra ?? '1900-01-01')
      .lte('start_date', intervall?.til ?? '2099-12-31')
      .order('start_date')

    // Events list – same admin-rad pattern as rest of admin panel
    for (const e of events || []) {
      const row = el('div', { class: 'admin-rad' })
      const info = el('div', { style: 'flex:1; min-width:0' })
      info.appendChild(el('span', { class: 'tekst', style: 'font-weight:600; margin-right:8px' }, e.title))
      info.appendChild(el('span', { class: 'tekst-svak', style: 'font-size:.85rem; white-space:nowrap' },
        `${ukeTekst(e.start_date, e.end_date)} · ${formatDatoNO(e.start_date)} – ${formatDatoNO(e.end_date)}`))
      row.appendChild(info)
      row.appendChild(el('span', { class: 'div-badge' }, e.type ? kalenderTypeNavn(e.type) : ''))
      row.appendChild(el('button', { class: 'btn btn-ikon btn-f', title: 'Slett denne hendelsen fra skoleruten', onclick: async () => {
        await medLagreOverlay(() => sb.from('school_calendar').delete().eq('id', e.id))
        refresh()
      }}, '🗑️'))
      wrap.appendChild(row)
    }

    wrap.appendChild(el('button', { class: 'btn btn-p', style: 'margin-top:14px', title: 'Legg til ny hendelse i skoleruten', onclick: () => visNySkolerute(refresh, valgtSkolear) }, '+ Legg til'))

    // AI import – hidden by default, tip shown when calendar is empty
    const aiWrap = el('div', { class: 'ai-import-seksjon' })
    if (!(events && events.length)) {
      const tip = el('p', { class: 'ai-tip' },
        '💡 Ingen hendelser ennå. Har du skoleruten som tekst? Lim den inn og la AI legge det inn for deg.')
      aiWrap.appendChild(tip)
    }
    const aiToggleBtn = el('button', { type: 'button', class: 'btn btn-s', title: 'Lim inn skoleruten som tekst og la AI analysere den', onclick: () => {
      aiInnhold.classList.toggle('skjult')
      aiToggleBtn.textContent = aiInnhold.classList.contains('skjult') ? '📋 Importer med AI' : '▲ Skjul AI-import'
    }}, '📋 Importer med AI')
    const aiInnhold = el('div', { class: 'skjult' })
    if (valgtSkolear) {
      aiInnhold.appendChild(el('p', { class: 'tekst-svak', style: 'margin:0 0 6px; font-size:.9rem' },
        `Skoleruten du limer inn tolkes for skoleåret ${valgtSkolear}.`))
    }
    const aiText = el('textarea', { class: 'felt textarea ai-tekstfelt', placeholder: 'Lim inn skoleruten som tekst (f.eks. fra PDF eller e-post)…', rows: 8 })
    aiInnhold.appendChild(aiText)
    aiInnhold.appendChild(el('button', { type: 'button', class: 'btn btn-p', title: 'Send tekst til AI for tolking av fridager og ferier', onclick: async () => {
      if (!aiText.value.trim()) return
      if (!intervall) { showToast('Skoleår mangler – sett det under Skoleår-fanen først', 'error'); return }
      try {
        const { data, error } = await medAIOverlay('AI tolker skoleruten …', () =>
          sb.functions.invoke('ai-parse-skolerute', {
            body: { text: aiText.value, school_id: APP.school.id, school_year: valgtSkolear }
          }))
        if (error) throw new Error(error.message)
        if (data?.error) throw new Error(data.error)
        const evs = data.events || []
        if (!evs.length) { showToast('Ingen fridager funnet – prøv å legge inn teksten mer strukturert', 'info'); return }
        visSkoleruteForhandsvisning(evs, data.warnings || [], () => { aiText.value = ''; refresh() }, valgtSkolear)
      } catch (err) {
        showToast(err.message, 'error')
      }
    }}, 'Analyser med AI'))
    aiWrap.appendChild(aiToggleBtn)
    aiWrap.appendChild(aiInnhold)
    wrap.appendChild(aiWrap)
    container.appendChild(wrap)
  }
  await refresh()
}

function visNySkolerute(onSave, skolear) {
  const modal = el('div', { class: 'modal-bg' })
  const box   = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, 'Legg til hendelse'))
  const syIntervall = skoleaarIntervall(skolear)
  const startWeek = APP.school?.school_year_start_week || 33

  function ukeNrTilDato(weekNr, dagNr) {
    if (!weekNr || !skolear) return null
    const aar = skoleaarKalenderaar(skolear, weekNr, startWeek)
    return isoWeekToDate(aar, weekNr, dagNr).toISOString().slice(0, 10)
  }

  const dagValg = [['1','Man'],['2','Tir'],['3','Ons'],['4','Tor'],['5','Fre']]
  const fraUkeIn  = el('input', { name: 'fra_uke', type: 'number', class: 'felt input', min: 1, max: 53, required: 'true', style: 'width:72px' })
  const fraDagSel = el('select', { name: 'fra_dag', class: 'felt select', style: 'width:auto' })
  const tilUkeIn  = el('input', { name: 'til_uke', type: 'number', class: 'felt input', min: 1, max: 53, required: 'true', style: 'width:72px' })
  const tilDagSel = el('select', { name: 'til_dag', class: 'felt select', style: 'width:auto' })
  for (const [v, t] of dagValg) {
    fraDagSel.appendChild(el('option', { value: v }, t))
    tilDagSel.appendChild(el('option', { value: v, ...(v === '5' ? { selected: 'true' } : {}) }, t))
  }

  const datoHint    = el('p', { class: 'tekst-svak skjult', style: 'margin:2px 0 0; font-size:.9rem' })
  const datoAdvarsel = el('p', { class: 'advarsel-tekst skjult', style: 'margin:4px 0 0; font-size:.9rem' })

  function oppdaterHint() {
    const fraNr  = parseInt(fraUkeIn.value)
    const tilNr  = parseInt(tilUkeIn.value)
    const fraDay = parseInt(fraDagSel.value)
    const tilDay = parseInt(tilDagSel.value)
    if (!fraNr) { datoHint.classList.add('skjult'); datoAdvarsel.classList.add('skjult'); return }
    const startDate = ukeNrTilDato(fraNr, fraDay)
    const endDate   = tilNr ? ukeNrTilDato(tilNr, tilDay) : startDate
    const hintTekst = endDate && endDate !== startDate
      ? `→ ${formatDatoNO(startDate)} – ${formatDatoNO(endDate)}`
      : `→ ${formatDatoNO(startDate)}`
    datoHint.textContent = hintTekst
    datoHint.classList.toggle('skjult', !startDate)
    if (syIntervall && startDate) {
      const utenfor = startDate < syIntervall.fra || startDate > syIntervall.til
      datoAdvarsel.textContent = `NB: Uke ${fraNr} er utenfor skoleåret ${skolear}`
      datoAdvarsel.classList.toggle('skjult', !utenfor)
    }
  }

  // Auto-copy Fra uke → Til uke for single-week events
  let forrigeFraUke = ''
  fraUkeIn.addEventListener('input', () => {
    if (!tilUkeIn.value || tilUkeIn.value === forrigeFraUke) tilUkeIn.value = fraUkeIn.value
    forrigeFraUke = fraUkeIn.value
    oppdaterHint()
  })
  tilUkeIn.addEventListener('input', oppdaterHint)
  fraDagSel.addEventListener('change', oppdaterHint)
  tilDagSel.addEventListener('change', oppdaterHint)

  const form = el('form', { class: 'skjema', onsubmit: async (ev) => {
    ev.preventDefault()
    const fd = new FormData(form)
    const fraNr  = parseInt(fd.get('fra_uke'))
    const tilNr  = parseInt(fd.get('til_uke'))
    const fraDay = parseInt(fd.get('fra_dag'))
    const tilDay = parseInt(fd.get('til_dag'))
    const startDate = ukeNrTilDato(fraNr, fraDay)
    const endDate   = ukeNrTilDato(tilNr, tilDay)
    if (!startDate || !endDate) { showToast('Ugyldig ukenummer', 'error'); return }
    await medLagreOverlay(async () => {
      const { error } = await sb.from('school_calendar').insert({
        school_id: APP.school.id,
        title: fd.get('title'),
        start_date: startDate,
        end_date: endDate,
        type: fd.get('type'),
      })
      if (error) throw error
    })
    modal.remove()
    if (onSave) onSave()
  }})

  form.appendChild(lagFormRad('Tittel',
    el('input', { name: 'title', type: 'text', class: 'felt input', required: 'true', maxlength: 30 })))

  const ukeRad = el('div', { class: 'uke-rad', style: 'gap:16px' })
  const fraGrp = el('div', { class: 'uke-grp' })
  fraGrp.appendChild(el('label', {}, 'Fra uke'))
  const fraInnRad = el('div', { style: 'display:flex; gap:5px; align-items:center' })
  fraInnRad.appendChild(fraUkeIn); fraInnRad.appendChild(fraDagSel)
  fraGrp.appendChild(fraInnRad)
  const tilGrp = el('div', { class: 'uke-grp' })
  tilGrp.appendChild(el('label', {}, 'Til uke'))
  const tilInnRad = el('div', { style: 'display:flex; gap:5px; align-items:center' })
  tilInnRad.appendChild(tilUkeIn); tilInnRad.appendChild(tilDagSel)
  tilGrp.appendChild(tilInnRad)
  ukeRad.appendChild(fraGrp); ukeRad.appendChild(tilGrp)
  form.appendChild(lagFormRad('Uke', ukeRad))
  form.appendChild(datoHint)
  form.appendChild(datoAdvarsel)

  const typeSel = el('select', { name: 'type', class: 'felt select' })
  for (const t of ['ferie', 'helligdag', 'planleggingsdag', 'annet'])
    typeSel.appendChild(el('option', { value: t }, kalenderTypeNavn(t)))
  form.appendChild(lagFormRad('Type', typeSel))

  const rad = el('div', { class: 'modal-bunn' })
  rad.appendChild(el('button', { type: 'button', class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))
  rad.appendChild(el('button', { type: 'submit', class: 'btn btn-p' }, 'Lagre'))
  form.appendChild(rad)
  box.appendChild(form)
  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

// ISO-ukenummer for en dato-periode: «uke 41», eller «uke 51–1» over nyttår.
// Datoer parses som lokale datoer (ikke UTC) så uka ikke tipper feil.
function ukeTekst(fra, til) {
  if (!fra) return ''
  const lokal = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
  const u1 = getISOWeek(lokal(fra))
  const u2 = til ? getISOWeek(lokal(til)) : u1
  return u1 === u2 ? `uke ${u1}` : `uke ${u1}–${u2}`
}

// Sikkerhetsnett: AI-varsler skal være i klarspråk (styrt av prompten),
// men fjern setninger med interne feltnavn hvis modellen likevel tar dem med
function rensVarsel(tekst) {
  return tekst.replace(/(^|[.!?])[^.!?]*\bweek_nr\b[^.!?]*[.!?]?/g, '$1').replace(/\s+/g, ' ').trim()
}

// Forhåndsvisning av AI-tolket skolerute: redigerbare rader som kan
// strykes, og valg mellom å erstatte skoleårets eksisterende skolerute
// (soft-delete) eller legge til. Ingenting lagres før «Lagre».
function visSkoleruteForhandsvisning(events, warnings, onSave, skolear) {
  const sy = skolear || APP.school?.active_school_year
  const intervall = skoleaarIntervall(sy)
  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal modal-xl skolerute-prev-modal' })
  box.appendChild(el('h3', {}, `Forhåndsvisning – skolerute ${sy}`))
  box.appendChild(el('p', { class: 'tekst-svak', style: 'margin:-8px 0 14px; font-size:.9rem' },
    'Kontroller og juster radene før du lagrer. Ingenting lagres før du trykker «Lagre».'))
  const rensedeVarsler = warnings.map(rensVarsel).filter(Boolean)
  if (rensedeVarsler.length) {
    box.appendChild(el('p', { class: 'advarsel-tekst' }, `⚠️ ${rensedeVarsler.join(' | ')}`))
  }

  const rader = []
  const liste = el('div', { class: 'skolerute-prev-liste' })
  liste.appendChild(el('div', { class: 'skolerute-prev-rad skolerute-prev-hode' },
    el('span', {}, 'Tittel'), el('span', {}, 'Fra'), el('span', {}, 'Til'),
    el('span', {}, 'Uke'), el('span', {}, 'Type'), el('span', {}, '')))
  for (const ev of events) {
    const rad = { fjernet: false }
    rad.tittel = el('input', { type: 'text', class: 'felt input', maxlength: 30, value: ev.title })
    rad.fra = el('input', { type: 'date', class: 'felt input', value: ev.start_date, onchange: () => visUke() })
    rad.til = el('input', { type: 'date', class: 'felt input', value: ev.end_date, onchange: () => visUke() })
    rad.uke = el('span', { class: 'skolerute-prev-uke' })
    const visUke = () => { rad.uke.textContent = ukeTekst(rad.fra.value, rad.til.value) }
    visUke()
    rad.type = el('select', { class: 'felt select' })
    for (const t of ['ferie', 'helligdag', 'planleggingsdag', 'annet'])
      rad.type.appendChild(el('option', { value: t, ...(t === ev.type ? { selected: 'true' } : {}) }, kalenderTypeNavn(t)))
    rad.el = el('div', { class: 'skolerute-prev-rad' }, rad.tittel, rad.fra, rad.til, rad.uke, rad.type,
      el('button', { type: 'button', class: 'btn btn-ikon btn-f', title: 'Stryk denne raden',
        onclick: () => { rad.fjernet = true; rad.el.remove() } }, '🗑️'))
    rader.push(rad)
    liste.appendChild(rad.el)
  }
  box.appendChild(liste)

  const erstattRadio = el('input', { type: 'radio', name: 'skolerute-modus', checked: 'true' })
  const leggTilRadio = el('input', { type: 'radio', name: 'skolerute-modus' })
  const modusBoks = el('div', { class: 'skolerute-prev-modus' })
  modusBoks.appendChild(el('label', {}, erstattRadio,
    `Erstatt eksisterende skolerute for skoleåret ${sy}`))
  modusBoks.appendChild(el('label', {}, leggTilRadio, 'Legg til i eksisterende skolerute'))

  const bunn = el('div', { class: 'modal-bunn' })
  bunn.appendChild(el('button', { type: 'button', class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))
  bunn.appendChild(el('button', { type: 'button', class: 'btn btn-p', onclick: async () => {
    const aktive = rader.filter(r => !r.fjernet)
    if (!aktive.length) { showToast('Ingen rader igjen å lagre', 'info'); return }
    for (const r of aktive) {
      if (!r.tittel.value.trim() || !r.fra.value || !r.til.value) {
        showToast('Alle rader må ha tittel, fra- og til-dato', 'error'); return
      }
      if (r.til.value < r.fra.value) {
        showToast(`«${r.tittel.value.trim()}»: til-dato er før fra-dato`, 'error'); return
      }
    }
    try {
      await medLagreOverlay(async () => {
        if (erstattRadio.checked && intervall) {
          const { error } = await sb.from('school_calendar')
            .update({ deleted_at: new Date().toISOString() })
            .eq('school_id', APP.school.id)
            .is('deleted_at', null)
            .gte('start_date', intervall.fra)
            .lte('start_date', intervall.til)
          if (error) throw error
        }
        for (const r of aktive) {
          const { error } = await sb.from('school_calendar').insert({
            school_id: APP.school.id,
            title: r.tittel.value.trim(),
            start_date: r.fra.value,
            end_date: r.til.value,
            type: r.type.value,
          })
          if (error) throw error
        }
      })
      modal.remove()
      if (onSave) onSave()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }}, 'Lagre'))

  // Modus + knapper i fast bunnfelt utenfor scrollelisten — alltid synlig
  const bunnWrap = el('div', { class: 'skolerute-prev-bunn' })
  bunnWrap.appendChild(modusBoks)
  bunnWrap.appendChild(bunn)
  box.appendChild(bunnWrap)

  modal.appendChild(box)
  document.body.appendChild(modal)
}

async function renderFaktaTab(container) {
  async function refresh() {
    clearEl(container)
    const { data: facts } = await sb.from('school_facts').select('*')
      .eq('school_id', APP.school.id).is('deleted_at', null)
      .order('created_at', { ascending: true }).order('id', { ascending: true })
    APP.facts = facts || []

    const wrap = el('div', { class: 'skjema-smal' })
    const antall = facts?.length || 0
    wrap.appendChild(el('h3', {}, `Funfacts (${antall}/100)`))
    wrap.appendChild(el('p', { class: 'tekst-svak', style: 'margin:4px 0 14px; font-size:.9rem' },
      'Vises som pausetekst i lagre-overlaydet for å holde humøret oppe.'))

    // Knapper øverst
    const knappeRad = el('div', { class: 'knapper-rad' })
    knappeRad.appendChild(el('button', { class: 'btn btn-p', title: 'Legg til nytt funfact manuelt', onclick: () => visFunfactModal(null, refresh) }, '+ Legg til'))
    const aiBtn = el('button', { class: 'btn btn-s', title: 'Generer ~40 funfacts automatisk med AI', onclick: async () => {
      if (!confirm('Generer ~40 nye funfacts med AI og legg dem til listen?')) return
      aiBtn.disabled = true; aiBtn.textContent = 'Genererer…'
      try {
        const { data, error } = await medAIOverlay('AI lager nye funfacts …', () =>
          sb.functions.invoke('generate-facts', { body: { school_id: APP.school.id } }))
        if (error) throw new Error(error.message || JSON.stringify(error))
        const ny = data?.facts || []
        if (!ny.length) { showToast('Ingen fakta generert', 'info'); return }

        // Maks 100: soft-delete de eldste (FIFO) for å gi plass til de nye
        const MAKS = 100
        const skalLeggesTil = ny.slice(0, MAKS)
        const overskytende = Math.max(0, (facts?.length || 0) + skalLeggesTil.length - MAKS)

        await medLagreOverlay(async () => {
          if (overskytende > 0) {
            const { data: eldste, error: selErr } = await sb.from('school_facts')
              .select('id')
              .eq('school_id', APP.school.id)
              .is('deleted_at', null)
              .order('created_at', { ascending: true })
              .order('id', { ascending: true })
              .limit(overskytende)
            if (selErr) throw new Error(selErr.message)
            const { error: delErr } = await sb.from('school_facts')
              .update({ deleted_at: new Date().toISOString() })
              .in('id', (eldste || []).map(f => f.id))
            if (delErr) throw new Error(delErr.message)
          }
          const rows = skalLeggesTil.map(txt => ({ school_id: APP.school.id, fact_text: txt }))
          const { error: insErr } = await sb.from('school_facts').insert(rows)
          if (insErr) throw new Error(insErr.message)
        })
        if (overskytende > 0) {
          showToast(`${skalLeggesTil.length} funfacts lagt til. Maks antall er nådd – de ${overskytende} eldste ble erstattet med nye.`, 'info')
        } else {
          showToast(`${skalLeggesTil.length} funfacts lagt til!`, 'ok')
        }
        refresh()
      } catch (err) {
        showToast(err.message, 'error')
      } finally {
        aiBtn.disabled = false; aiBtn.textContent = '✨ Generer med AI'
      }
    }}, '✨ Generer med AI')
    knappeRad.appendChild(aiBtn)

    const fornyBtn = el('button', { class: 'btn btn-s', title: 'Bytt ut de 5 mest viste setningene med 5 nye AI-genererte', onclick: async () => {
      if (!APP.facts.length) { showToast('Ingen funfacts å fornye', 'info'); return }
      if (!confirm('Generer 5 nye funfacts og bytt ut de 5 mest viste? De utgåtte slettes mykt.')) return
      fornyBtn.disabled = true; fornyBtn.textContent = 'Genererer…'
      try {
        await fornyFunfactsRotasjon()
        showToast('5 nye funfacts generert – de 5 mest viste er byttet ut.', 'ok')
        await refresh()
      } catch (err) {
        showToast(err.message || 'Noe gikk galt', 'error')
      } finally {
        fornyBtn.disabled = false; fornyBtn.textContent = '🔄 Generer nye funfacts nå'
      }
    }}, '🔄 Generer nye funfacts nå')
    knappeRad.appendChild(fornyBtn)

    wrap.appendChild(knappeRad)

    // Tom-tilstand
    if (!(facts && facts.length)) {
      wrap.appendChild(el('p', { class: 'ai-tip' },
        'Ingen funfacts ennå. Legg til manuelt eller generer med AI.'))
    }

    // Liste
    for (const f of facts || []) {
      const row = el('div', { class: 'admin-rad' })
      row.appendChild(el('span', { style: 'flex:1; font-size:.92rem' }, f.fact_text))
      row.appendChild(el('button', { class: 'btn btn-ikon', title: 'Rediger funfact', onclick: () => visFunfactModal(f, refresh) }, '✏️'))
      row.appendChild(el('button', { class: 'btn btn-ikon btn-f', title: 'Slett funfact', onclick: async () => {
        if (!confirm('Slette denne funfacten?')) return
        await medLagreOverlay(() => sb.from('school_facts').delete().eq('id', f.id))
        refresh()
      }}, '🗑️'))
      wrap.appendChild(row)
    }
    container.appendChild(wrap)
  }
  await refresh()
}

function visFunfactModal(fact, onSave) {
  const modal = el('div', { class: 'modal-bg' })
  const box   = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, fact ? 'Rediger funfact' : 'Ny funfact'))

  const textarea = el('textarea', {
    class: 'felt textarea',
    maxlength: 150,
    rows: 3,
    style: 'width:100%; resize:vertical',
    placeholder: 'Skriv en kort, morsom setning…',
  })
  if (fact) textarea.value = fact.fact_text
  box.appendChild(textarea)

  const teller = el('div', { style: 'text-align:right; font-size:.8rem; opacity:.6; margin-bottom:12px' },
    `${(fact?.fact_text || '').length}/150`)
  textarea.addEventListener('input', () => { teller.textContent = `${textarea.value.length}/150` })
  box.appendChild(teller)

  const bunn = el('div', { class: 'modal-bunn' })
  bunn.appendChild(el('button', { class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))
  bunn.appendChild(el('button', { class: 'btn btn-p', onclick: async () => {
    const tekst = textarea.value.trim()
    if (!tekst) return
    await medLagreOverlay(async () => {
      if (fact) {
        const { error } = await sb.from('school_facts').update({ fact_text: tekst }).eq('id', fact.id)
        if (error) throw error
      } else {
        const { error } = await sb.from('school_facts').insert({ school_id: APP.school.id, fact_text: tekst })
        if (error) throw error
      }
    })
    modal.remove()
    if (onSave) onSave()
  }}, 'Lagre'))
  box.appendChild(bunn)
  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
  setTimeout(() => textarea.focus(), 50)
}

// ─────────────────────────────────────────
// FORM HELPERS
// ─────────────────────────────────────────

function lagFormRad(label, ...inputs) {
  const row = el('div', { class: 'felt' })
  row.appendChild(el('label', { class: 'felt label' }, label))
  const right = el('div', { class: 'felt' })
  for (const inp of inputs) right.appendChild(inp)
  row.appendChild(right)
  return row
}

// ─────────────────────────────────────────
// STARTUP
// ─────────────────────────────────────────

async function init() {
  // Lukk hamburger-dropdown ved klikk utenfor (én gang ved oppstart)
  document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('hdr-dropdown')
    const hamburger = document.getElementById('hdr-hamburger')
    if (dropdown && !dropdown.classList.contains('skjult') &&
        !dropdown.contains(e.target) && e.target !== hamburger) {
      dropdown.classList.add('skjult')
    }
  })

  // Hold --header-h i synk med headerens faktiske høyde (sticky fanerad)
  window.addEventListener('resize', settHeaderHoyde)

  window.addEventListener('hashchange', router)

  // ─────────────────────────────────────────────────────────────
  // VIKTIG – rekkefølge i init():
  // router() ruter #/laerer og #/admin til #/login når APP.user mangler,
  // og den omdirigeringen kan ikke angres. Derfor MÅ APP.user være satt
  // (eller session-henting timet ut) FØR første kall til router().
  // Endrer du rekkefølgen her: test refresh på #/, #/laerer og #/klasse/X
  // i nettleser – ikke bare node --check.
  // ─────────────────────────────────────────────────────────────

  // Hent sesjon med maks 4s timeout – getSession kan henge ved utløpt token-refresh
  let session = null
  try {
    const { data } = await Promise.race([
      sb.auth.getSession(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('getSession timeout')), 4000))
    ])
    session = data?.session ?? null
  } catch (err) {
    console.warn('Sesjonshenting feilet eller tok for lang tid:', err.message)
  }
  if (session) APP.user = session.user

  // Vis siden – session er nå kjent (eller timet ut)
  oppdaterHeader()
  await router()

  // Last profil og skoledata parallelt, så én router()-kall når begge er klare
  const [profileResult, schoolsResult] = await Promise.allSettled([
    session ? fetchProfile(session.user.id) : Promise.resolve(null),
    sb.from('schools').select('*').limit(1),
  ])

  if (profileResult.status === 'fulfilled' && profileResult.value) {
    APP.profile = profileResult.value
    APP.isAdminActive = APP.profile.is_admin_active || false
  } else if (profileResult.status === 'rejected') {
    console.warn('Kunne ikke hente brukerprofil:', profileResult.reason?.message)
  }

  const schools = schoolsResult.status === 'fulfilled' ? schoolsResult.value?.data : null
  if (schools && schools.length) APP.school = schools[0]

  oppdaterHeader()
  const h = location.hash || '#/'
  if (!h.startsWith('#/login')) await router()

  // Last funfacts i bakgrunnen (ikke blokkerende)
  if (APP.school) {
    const { data: facts } = await sb.from('school_facts').select('*')
      .eq('school_id', APP.school.id).is('deleted_at', null)
      .order('created_at', { ascending: true }).order('id', { ascending: true })
    APP.facts = facts || []
  }
}

// Kjør init med sikkerhetsnett: enhver uventet feil skal IKKE etterlate
// siden hengende på «Laster…» – vis en feilmelding med «Prøv igjen» i stedet.
async function startApp() {
  try {
    await init()
  } catch (err) {
    console.error('Init feilet:', err)
    const m = document.getElementById('app-main')
    if (m && m.querySelector('.laster-start')) {
      m.innerHTML = '<div class="tom-uke" style="padding:40px;text-align:center">' +
        'Noe gikk galt under oppstart.<br><br>' +
        '<button class="btn btn-p" onclick="location.reload()">Prøv igjen</button></div>'
    }
  }
}

document.addEventListener('DOMContentLoaded', startApp)
