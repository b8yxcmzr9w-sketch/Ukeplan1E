// Ukeplan v4 - Norwegian School Weekly Planner
// Single-file vanilla JS app using Supabase JS v2

const SUPABASE_URL = 'https://zstjfatkeqbbekqgbsgb.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_c-knXQEaZswHBZ4_TPgnWw_Tg6OA04J'

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
  klasseVelger: null,    // { klasser, aktivKlasse, onChange } – satt av renderMinKlasseTab
}

// Registreres umiddelbart (ikke i init) slik at PASSWORD_RECOVERY/invitasjon
// fra recovery-lenken i URL-en ikke går tapt før init() rekker å kjøre.
let _recoveryHandtert = false
sb.auth.onAuthStateChange(async (event, session) => {
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
})

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

function dagNavn(n) {
  return ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag'][n - 1]
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
  navigate(ny ? '#/admin' : '#/laerer')
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
      const erAdmin = APP.profile.role === 'admin' || APP.isAdminActive
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

function oppdaterHeader() {
  // Skolenavn + logo
  const skolenavn = document.getElementById('hdr-skolenavn')
  const logo = document.getElementById('hdr-logo')
  if (skolenavn) skolenavn.textContent = APP.school ? APP.school.name : 'Ukeplan1e'

  // Valgt klasse i header – select (lærervisning) eller statisk tekst (elevvisning)
  const klasseEl = document.getElementById('hdr-klasse')
  if (klasseEl) {
    clearEl(klasseEl)
    if (APP.klasseVelger && APP.klasseVelger.klasser.length > 0) {
      klasseEl.classList.remove('skjult')
      if (APP.klasseVelger.klasser.length === 1) {
        klasseEl.textContent = APP.klasseVelger.aktivKlasse?.name || ''
      } else {
        const sel = document.createElement('select')
        sel.className = 'hdr-klasse-sel'
        sel.title = 'Velg klasse'
        for (const k of APP.klasseVelger.klasser) {
          const opt = document.createElement('option')
          opt.value = k.id
          opt.textContent = k.name
          if (APP.klasseVelger.aktivKlasse?.id === k.id) opt.selected = true
          sel.appendChild(opt)
        }
        sel.addEventListener('change', (e) => {
          const k = APP.klasseVelger.klasser.find(k => k.id === e.target.value)
          if (k) { APP.klasseVelger.aktivKlasse = k; APP.klasseVelger.onChange(k) }
        })
        klasseEl.appendChild(sel)
      }
    } else if (APP.currentKlasse) {
      klasseEl.textContent = APP.currentKlasse
      klasseEl.classList.remove('skjult')
    } else {
      klasseEl.classList.add('skjult')
    }
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

  // PC-knapper
  const loginBtn   = document.getElementById('hdr-login-btn')
  const logoutBtn  = document.getElementById('hdr-logout-btn')
  const laererBtn  = document.getElementById('hdr-laerer-btn')
  const adminToggle= document.getElementById('hdr-admin-toggle')
  const username   = document.getElementById('hdr-username')

  // Hamburger-elementer
  const hamburger   = document.getElementById('hdr-hamburger')
  const dropdown    = document.getElementById('hdr-dropdown')
  const ddNavn      = document.getElementById('hdr-dropdown-navn')
  const ddAdmin     = document.getElementById('hdr-dd-admin')
  const ddLaerer    = document.getElementById('hdr-dd-laerer')
  const ddLogout    = document.getElementById('hdr-dd-logout')
  const ddLogin     = document.getElementById('hdr-dd-login')

  if (APP.user && APP.profile) {
    const rolle = APP.profile.role
    const visAdmin = APP.profile.is_admin_active !== undefined && (rolle === 'admin' || APP.profile.is_admin_active)
    const skjulLaerer = rolle === 'admin' && APP.isAdminActive

    // PC
    if (username)    { username.textContent = APP.profile.full_name; username.classList.remove('skjult') }
    if (loginBtn)    loginBtn.classList.add('skjult')
    if (logoutBtn)   { logoutBtn.classList.remove('skjult'); logoutBtn.onclick = logout; logoutBtn.title = 'Logg ut av Ukeplan1e' }
    if (laererBtn)   { laererBtn.classList.toggle('skjult', skjulLaerer); laererBtn.onclick = () => navigate('#/laerer'); laererBtn.title = 'Gå til lærervisning' }
    if (adminToggle && visAdmin) {
      adminToggle.classList.remove('skjult')
      adminToggle.textContent = 'Admin'
      adminToggle.classList.toggle('admin-aktiv', APP.isAdminActive)
      adminToggle.onclick = toggleAdminModus
      adminToggle.title = APP.isAdminActive ? 'Bytt til lærervisning' : 'Bytt til adminvisning'
    } else if (adminToggle) adminToggle.classList.add('skjult')

    // Hamburger
    if (hamburger) { hamburger.classList.remove('skjult'); hamburger.title = 'Åpne meny' }
    if (ddNavn)   { ddNavn.textContent = APP.profile.full_name; ddNavn.classList.remove('skjult') }
    if (ddLogin)  ddLogin.classList.add('skjult')
    if (ddLogout) { ddLogout.classList.remove('skjult'); ddLogout.onclick = () => { dropdown?.classList.add('skjult'); logout() } }
    if (ddLaerer) { ddLaerer.classList.toggle('skjult', skjulLaerer); ddLaerer.onclick = () => { dropdown?.classList.add('skjult'); navigate('#/laerer') } }
    if (ddAdmin && visAdmin) {
      ddAdmin.classList.remove('skjult')
      ddAdmin.classList.toggle('admin-aktiv', APP.isAdminActive)
      ddAdmin.onclick = () => { dropdown?.classList.add('skjult'); toggleAdminModus() }
    } else if (ddAdmin) ddAdmin.classList.add('skjult')
  } else {
    if (username)    username.classList.add('skjult')
    if (loginBtn)    { loginBtn.classList.remove('skjult'); loginBtn.onclick = () => navigate('#/login'); loginBtn.title = 'Logg inn' }
    if (logoutBtn)   logoutBtn.classList.add('skjult')
    if (laererBtn)   laererBtn.classList.add('skjult')
    if (adminToggle) adminToggle.classList.add('skjult')

    if (hamburger) { hamburger.classList.remove('skjult'); hamburger.title = 'Åpne meny' }
    if (ddNavn)   ddNavn.classList.add('skjult')
    if (ddAdmin)  ddAdmin.classList.add('skjult')
    if (ddLaerer) ddLaerer.classList.add('skjult')
    if (ddLogout) ddLogout.classList.add('skjult')
    if (ddLogin)  { ddLogin.classList.remove('skjult'); ddLogin.onclick = () => { dropdown?.classList.add('skjult'); navigate('#/login') } }
  }

  // Hamburger toggle
  if (hamburger && dropdown) {
    hamburger.onclick = (e) => { e.stopPropagation(); dropdown.classList.toggle('skjult') }
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
    if (!APP.isAdminActive && APP.profile?.role !== 'admin') { navigate('#/laerer'); return }
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
  const { data: current, error } = await sb.from('sessions').select('version').eq('id', id).single()
  if (error) throw error
  if (current.version !== expectedVersion) {
    showConflictWarning()
    return false
  }
  const { error: updateError } = await sb.from('sessions')
    .update({ ...data, version: expectedVersion + 1 })
    .eq('id', id)
  if (updateError) throw updateError
  return true
}

function showConflictWarning() {
  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, 'Konflikt!'))
  box.appendChild(el('p', {}, 'Noen andre har endret denne økten. Last siden på nytt for å se siste versjon.'))
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

  // Filter state
  let aktivFilter = null

  async function renderUke(weekNr) {
    const weekContainer = document.getElementById('week-container')
    if (weekContainer) clearEl(weekContainer)
    const wc = weekContainer || el('div', { id: 'week-container' })
    if (!weekContainer) main.appendChild(wc)

    // Fetch sessions
    const { data: sessions, error: sessionsError } = await sb.from('sessions')
      .select('*, subjects(name, color_hex, short_code), users!teacher_id(full_name), subject_divisions(name, division_type)')
      .eq('class_id', klasse.id)
      .eq('week_nr', weekNr)
      .order('day_of_week')
    if (sessionsError) {
      console.error('Feil ved henting av økter:', sessionsError)
      showToast(`Kunne ikke hente ukeplanen: ${sessionsError.message}`, 'error')
    }

    // Fetch calendar events for the week
    const weekStartDate = isoWeekToDate(new Date().getFullYear(), weekNr, 1)
    const weekEndDate = isoWeekToDate(new Date().getFullYear(), weekNr, 5)
    const wStart = weekStartDate.toISOString().slice(0, 10)
    const wEnd = weekEndDate.toISOString().slice(0, 10)

    const { data: calEvents } = await sb.from('school_calendar')
      .select('*')
      .lte('start_date', wEnd)
      .gte('end_date', wStart)

    const { data: multiDayEvents } = await sb.from('multi_day_events')
      .select('*')
      .eq('class_id', klasse.id)
      .lte('start_date', wEnd)
      .gte('end_date', wStart)

    // Utskrift-hode (vises kun ved print)
    const utskriftHode = document.getElementById('utskrift-hode')
    if (utskriftHode) {
      utskriftHode.textContent = `${APP.school?.name || 'Ukeplan1e'} – ${klasse.name} – Uke ${weekNr}`
    }

    // Week navigation
    const navRow = el('div', { class: 'nav-bar' })
    const prevBtn = el('button', { class: 'btn btn-s', title: 'Gå til forrige uke', onclick: () => {
      if (weekNr > schoolStart) { currentWeek = weekNr - 1; renderUke(currentWeek) }
    }}, '← Forrige uke')
    if (weekNr <= schoolStart) prevBtn.setAttribute('disabled', 'true')

    const weekInput = el('input', { type: 'number', class: 'uke-nr-input', value: weekNr,
      title: 'Skriv inn ukenummer og trykk Enter',
      min: schoolStart, max: schoolEnd,
      onchange: (e) => {
        const v = parseInt(e.target.value)
        if (v >= schoolStart && v <= schoolEnd) { currentWeek = v; renderUke(currentWeek) }
      }
    })

    const nextBtn = el('button', { class: 'btn btn-s', title: 'Gå til neste uke', onclick: () => {
      if (weekNr < schoolEnd) { currentWeek = weekNr + 1; renderUke(currentWeek) }
    }}, 'Neste uke →')
    if (weekNr >= schoolEnd) nextBtn.setAttribute('disabled', 'true')

    const naaWeek = Math.min(Math.max(getCurrentISOWeek(), schoolStart), schoolEnd)
    const naaBtn = el('button', { class: 'btn btn-s', title: 'Gå til gjeldende uke', onclick: () => {
      currentWeek = naaWeek; renderUke(currentWeek)
    }}, 'Nå')
    if (weekNr === naaWeek) naaBtn.setAttribute('disabled', 'true')

    navRow.appendChild(prevBtn)
    navRow.appendChild(weekInput)
    navRow.appendChild(nextBtn)
    navRow.appendChild(naaBtn)

    const printBtn = el('button', { class: 'btn btn-s', title: 'Skriv ut ukeplanen', onclick: () => window.print() }, '🖨️ Skriv ut')
    const icalBtn = el('button', { class: 'btn btn-s', title: 'Abonner på kalender (iCal)', onclick: () => visICalModal(klasse) }, '📅 iCal-abonnement')
    navRow.appendChild(printBtn)
    navRow.appendChild(icalBtn)
    wc.appendChild(navRow)

    // Holiday banners
    if (calEvents) {
      for (const evt of calEvents) {
        const banner = el('div', { class: 'ferie-banner' },
          `${evt.title} (${formatDatoNO(evt.start_date)} – ${formatDatoNO(evt.end_date)})`)
        wc.appendChild(banner)
      }
    }

    // Multi-day event banners
    if (multiDayEvents) {
      for (const mde of multiDayEvents) {
        const banner = el('div', { class: 'fdag-banner' },
          `${mde.title}: ${truncate(mde.description || '', 80)} (${formatDatoNO(mde.start_date)} – ${formatDatoNO(mde.end_date)})`)
        wc.appendChild(banner)
      }
    }

    // Filter bar
    const { data: divisions } = await sb.from('subject_divisions')
      .select('*, subjects!inner(class_id)')
      .eq('subjects.class_id', klasse.id)

    if (divisions && divisions.length > 0) {
      const filterBar = el('div', { class: 'filter-bar' })
      filterBar.appendChild(el('label', {}, 'Filtrer: '))
      const filterSel = el('select', { class: 'felt select', onchange: (e) => {
        aktivFilter = e.target.value || null
        renderUke(weekNr)
      }})
      filterSel.appendChild(el('option', { value: '' }, 'Alle'))
      for (const d of divisions) {
        const opt = el('option', { value: d.id }, `${d.division_type === 'parti' ? 'Parti' : 'Gruppe'}: ${d.name}`)
        if (aktivFilter === d.id) opt.setAttribute('selected', 'true')
        filterSel.appendChild(opt)
      }
      filterBar.appendChild(filterSel)
      wc.appendChild(filterBar)
    }

    // Week grid
    const grid = el('div', { class: 'uke-grid' })
    for (let dag = 1; dag <= 5; dag++) {
      const dayCol = el('div', { class: 'dag-kol' })
      const dateForDay = isoWeekToDate(new Date().getFullYear(), weekNr, dag)
      const dayHeader = el('div', { class: 'dag-tittel' })
      dayHeader.appendChild(document.createTextNode(dagNavn(dag)))
      dayHeader.appendChild(el('span', { class: 'dag-dato' }, ` ${formatDatoNO(dateForDay.toISOString().slice(0, 10))}`))
      dayCol.appendChild(dayHeader)

      let daySessions = (sessions || []).filter(s => s.day_of_week === dag)
      // Apply filter
      if (aktivFilter) {
        daySessions = daySessions.filter(s => s.division_id === aktivFilter)
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

function renderSessionCard(s, showActions, actions = {}) {
  const color = s.subjects?.color_hex || '#4a90d9'
  const card = el('div', { class: 'okt-kort', style: `border-left: 4px solid ${color}` })

  const subjectName = s.subjects?.name || 'Ukjent fag'
  card.appendChild(el('div', { class: 'fag-badge' }, subjectName))

  if (s.activity) card.appendChild(el('div', { class: 'aktivitet' }, truncate(s.activity)))
  if (s.meeting_point) card.appendChild(el('div', { class: 'session-card__meeting' }, `📍 ${s.meeting_point}`))
  if (s.info) card.appendChild(el('div', { class: 'session-card__info' }, truncate(s.info)))
  if (s.users) card.appendChild(el('div', { class: 'session-card__teacher' }, s.users.full_name))
  if (s.subject_divisions) {
    card.appendChild(el('div', { class: 'div-badge' }, s.subject_divisions.name))
  }

  if (showActions) {
    const skjulHandlinger = localStorage.getItem('ukeplan_skjul_handlinger') === '1'
    const actionRow = el('div', { class: 'okt-handlinger' + (skjulHandlinger ? ' skjult' : '') })
    if (actions.edit) actionRow.appendChild(el('button', { class: 'btn btn-ikon', title: 'Rediger økt', onclick: actions.edit }, '✏️'))
    if (actions.copy) actionRow.appendChild(el('button', { class: 'btn btn-ikon', title: 'Kopier økt', onclick: actions.copy }, '📋'))
    if (actions.del) actionRow.appendChild(el('button', { class: 'btn btn-ikon btn-f', title: 'Slett økt', onclick: actions.del }, '🗑️'))
    if (actions.transfer) actionRow.appendChild(el('button', { class: 'btn btn-ikon', title: 'Overfør til annen klasse', onclick: actions.transfer }, '↗️'))
    card.appendChild(actionRow)
    if (skjulHandlinger) {
      card.addEventListener('contextmenu', (e) => {
        e.preventDefault()
        actionRow.classList.toggle('skjult')
      })
    }
  }

  return card
}

function visICalModal(klasse) {
  const baseUrl = `${SUPABASE_URL}/functions/v1/ical`
  const url = klasse
    ? `${baseUrl}?class_id=${klasse.id}`
    : `${baseUrl}?teacher_id=${APP.profile?.id}`
  const modal = el('div', { class: 'modal-bg' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, 'iCal-abonnement'))
  box.appendChild(el('p', {}, 'Kopier lenken under og legg den til i Google Kalender, Apple Kalender eller Outlook:'))
  const input = el('input', { class: 'felt input', value: url, readonly: 'true' })
  box.appendChild(input)
  box.appendChild(el('button', { class: 'btn btn-p', onclick: () => {
    navigator.clipboard.writeText(url)
    showToast('Kopiert!', 'success')
  }}, 'Kopier lenke'))
  box.appendChild(el('details', {},
    el('summary', {}, 'Instruksjoner'),
    el('ul', {},
      el('li', {}, 'Google Kalender: Gå til "Andre kalendere" → "Fra URL"'),
      el('li', {}, 'Apple Kalender: Fil → Nytt kalenderabonnement'),
      el('li', {}, 'Outlook: Legg til kalender → Fra internett')
    )
  ))
  box.appendChild(el('button', { class: 'btn btn-s', onclick: () => modal.remove() }, 'Lukk'))
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
  oppdaterHeader()

  const isKontakt = APP.profile.role === 'kontaktlaerer' || APP.isAdminActive

  const tabs = ['Min klasse', 'Alle mine økter', 'Søk']
  const tabSlugs = ['klasse', 'alle', 'sok']
  if (isKontakt) { tabs.push('Klasse-admin'); tabSlugs.push('klasse-admin') }
  tabs.push('Innstillinger'); tabSlugs.push('innstillinger')

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
    if (slug === 'klasse') renderMinKlasseTab(tabContent)
    else if (slug === 'alle') renderAlleOkterTab(tabContent)
    else if (slug === 'sok') renderSokTab(tabContent)
    else if (slug === 'klasse-admin') renderKlasseAdminTab(tabContent)
    else if (slug === 'innstillinger') renderInnstillingerTab(tabContent)
  }

  tabs.forEach((t, i) => {
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
  wrap.appendChild(el('h3', {}, 'Innstillinger'))

  // Kontoinfo
  const { data: { user } } = await sb.auth.getUser()
  const naavaerendeEpost = user?.email || ''

  const info = el('div', { class: 'subj-config-box', style: 'margin-bottom:18px' })
  info.appendChild(el('div', { style: 'font-weight:600;margin-bottom:2px' }, APP.profile?.full_name || ''))
  info.appendChild(el('div', { class: 'tekst-svak', style: 'font-size:.88rem' }, naavaerendeEpost))
  const rolleNavn = { laerer: 'Lærer', kontaktlaerer: 'Kontaktlærer', admin: 'Administrator' }
  info.appendChild(el('div', { class: 'tekst-svak', style: 'font-size:.82rem;margin-top:4px' }, rolleNavn[APP.profile?.role] || APP.profile?.role || ''))
  wrap.appendChild(info)

  // Visningsvalg
  wrap.appendChild(el('div', { class: 'seksjon-tittel', style: 'margin-top:18px' }, 'Visning'))
  const skjulHandlingerLabel = el('label', { class: 'toggle-rad', style: 'display:flex;align-items:center;gap:10px;cursor:pointer' })
  const skjulHandlingerCb = el('input', { type: 'checkbox' })
  skjulHandlingerCb.checked = localStorage.getItem('ukeplan_skjul_handlinger') === '1'
  skjulHandlingerCb.addEventListener('change', () => {
    localStorage.setItem('ukeplan_skjul_handlinger', skjulHandlingerCb.checked ? '1' : '0')
  })
  skjulHandlingerLabel.appendChild(skjulHandlingerCb)
  skjulHandlingerLabel.appendChild(document.createTextNode('Skjul handlingsknapper (✏️ 📋 🗑️ ↗️) på økt-kort – høyreklikk på økt for å vise dem'))
  wrap.appendChild(skjulHandlingerLabel)

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

async function renderMinKlasseTab(container) {
  // Hent klasser: admin ser alle, andre kun sine tilknyttede klasser
  let klasser
  if (APP.isAdminActive) {
    const { data } = await sb.from('classes').select('*').eq('school_id', APP.school.id).order('name')
    klasser = data || []
  } else {
    const { data: mine } = await sb.from('user_classes')
      .select('classes(*)')
      .eq('user_id', APP.profile.id)
    klasser = (mine || []).map(r => r.classes).filter(Boolean)
  }

  if (!klasser.length) {
    container.appendChild(el('p', {}, 'Du er ikke tilknyttet noen klasser.'))
    return
  }

  let aktivKlasse = klasser[0]
  const schoolStart = APP.school?.school_year_start_week || 1
  const schoolEnd = APP.school?.school_year_end_week || 52
  let currentWeek = getCurrentISOWeek()
  if (currentWeek < schoolStart) currentWeek = schoolStart
  if (currentWeek > schoolEnd) currentWeek = schoolEnd

  // Klassevelger i header
  APP.klasseVelger = { klasser, aktivKlasse, onChange: (k) => { aktivKlasse = k; APP.klasseVelger.aktivKlasse = k; renderUke() } }
  oppdaterHeader()

  const topRow = el('div', { class: 'laerer-top' })
  topRow.appendChild(el('button', { class: 'btn btn-p', title: 'Legg til en ny økt denne uken', onclick: () => visNyOktModal(aktivKlasse, currentWeek, renderUke) }, '+ Ny økt'))
  topRow.appendChild(el('button', { class: 'btn btn-s', title: 'Lim inn ukeplan som tekst og la AI tolke den', onclick: () => visAIPasteModal(aktivKlasse, renderUke) }, '🤖 Lim inn med AI'))
  topRow.appendChild(el('button', { class: 'btn btn-s', title: 'Kopier lenke til elevvisning', onclick: () => visElevLenkeModal(aktivKlasse) }, '🔗 Del elevlenke'))
  container.appendChild(topRow)

  const weekArea = el('div', { id: 'laerer-week-area' })
  container.appendChild(weekArea)

  let bulkSelected = new Set()

  async function renderUke() {
    clearEl(weekArea)
    bulkSelected.clear()

    // Utskrift-hode (vises kun ved print)
    const utskriftHode = document.getElementById('utskrift-hode')
    if (utskriftHode) {
      utskriftHode.textContent = `${APP.school?.name || 'Ukeplan1e'} – ${aktivKlasse.name} – Uke ${currentWeek}`
    }

    const navRow = el('div', { class: 'nav-bar' })
    const prevBtn = el('button', { class: 'btn btn-s', title: 'Gå til forrige uke', onclick: () => {
      if (currentWeek > schoolStart) { currentWeek--; renderUke() }
    }}, '← Forrige')
    if (currentWeek <= schoolStart) prevBtn.setAttribute('disabled', 'true')

    const nextBtn = el('button', { class: 'btn btn-s', title: 'Gå til neste uke', onclick: () => {
      if (currentWeek < schoolEnd) { currentWeek++; renderUke() }
    }}, 'Neste →')
    if (currentWeek >= schoolEnd) nextBtn.setAttribute('disabled', 'true')

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
    navRow.appendChild(weekInput)
    navRow.appendChild(nextBtn)
    navRow.appendChild(naaBtn)
    navRow.appendChild(el('button', { class: 'btn btn-s', title: 'Skriv ut ukeplanen', onclick: () => window.print() }, '🖨️'))
    navRow.appendChild(el('button', { class: 'btn btn-s', title: 'Abonner på kalender (iCal)', onclick: () => visICalModal(null) }, '📅'))
    weekArea.appendChild(navRow)

    const { data: sessions, error: sessionsError } = await sb.from('sessions')
      .select('*, subjects(name, color_hex, short_code), users!teacher_id(full_name), subject_divisions(name, division_type)')
      .eq('class_id', aktivKlasse.id)
      .eq('week_nr', currentWeek)
    if (sessionsError) {
      console.error('Feil ved henting av økter:', sessionsError)
      showToast(`Kunne ikke hente ukeplanen: ${sessionsError.message}`, 'error')
    }

    // Bulk edit bar
    const bulkBar = el('div', { class: 'bulk-bar', style: 'display:none' })
    const bulkCount = el('span', {}, '0 valgt')
    bulkBar.appendChild(bulkCount)
    bulkBar.appendChild(el('button', { class: 'btn btn-s', title: 'Rediger alle valgte økter samtidig', onclick: () => visBulkEditModal([...bulkSelected], renderUke) }, 'Rediger valgte'))
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
      dayCol.appendChild(el('div', { class: 'dag-tittel' }, dagNavn(dag)))

      let daySessions = (sessions || []).filter(s => s.day_of_week === dag)
      daySessions.sort((a, b) => (a.subjects?.name || '').localeCompare(b.subjects?.name || '', 'nb'))

      for (const s of daySessions) {
        const isMine = s.teacher_id === APP.profile.id
        const isKontakt = APP.profile.role === 'kontaktlaerer' || APP.isAdminActive

        const wrapper = el('div', { class: 'session-wrapper' })

        if (isMine || isKontakt) {
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
          edit: (isMine || isKontakt) ? () => visRedigerOktModal(s, renderUke) : null,
          copy: () => visKopierOktModal(s, renderUke),
          del: (isMine || isKontakt) ? () => slettOkt(s.id, renderUke) : null,
          transfer: isMine ? () => visOverforModal(s, renderUke) : null,
        })
        wrapper.appendChild(card)
        dayCol.appendChild(wrapper)
      }

      grid.appendChild(dayCol)
    }
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
  const { data: sessions } = await sb.from('sessions')
    .select('*, subjects(name, color_hex, short_code), classes(name), subject_divisions(name)')
    .eq('teacher_id', APP.profile.id)
    .order('week_nr')
    .order('day_of_week')

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
  const searchInput = el('input', { type: 'search', class: 'felt input', placeholder: 'Søk i aktivitet, sted, info, fag, lærer…' })
  const results = el('div', { class: 'search-results' })

  async function doSearch() {
    const q = searchInput.value.trim()
    clearEl(results)
    if (!q) return

    const { data } = await sb.from('sessions')
      .select('*, subjects(name, color_hex), users!teacher_id(full_name), classes(name)')
      .or(`activity.ilike.%${q}%,meeting_point.ilike.%${q}%,info.ilike.%${q}%`)
      .eq('teacher_id', APP.profile.id)

    // Also search by subject name and teacher name with a join – approximate via client side
    if (!data || !data.length) {
      results.appendChild(el('p', {}, 'Ingen resultater.'))
      return
    }

    for (const s of data) {
      const card = renderSessionCard(s, true, {
        edit: () => visRedigerOktModal(s, doSearch),
        copy: () => visKopierOktModal(s, doSearch),
        del: () => slettOkt(s.id, doSearch),
      })
      const klasseLabel = el('span', { class: 'session-card__class' }, `${s.classes?.name} – Uke ${s.week_nr} ${dagNavn(s.day_of_week)}`)
      card.prepend(klasseLabel)
      results.appendChild(card)
    }
  }

  searchInput.addEventListener('input', doSearch)
  container.appendChild(searchInput)
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

async function visNyOktModal(defaultKlasse, defaultWeek, onSave) {
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

    await medLagreOverlay(async () => {
      const { error } = await sb.from('sessions').insert({
        class_id: klassId,
        subject_id: subjId,
        division_id: fd.get('division_id') || null,
        week_nr: weekNr,
        day_of_week: dagOfWeek,
        teacher_id: fd.get('teacher_id'),
        activity: fd.get('activity') || '',
        meeting_point: fd.get('meeting_point') || '',
        info: fd.get('info') || '',
        school_year: APP.school?.active_school_year,
        version: 1,
      })
      if (error) throw error
    })
    modal.remove()
    if (onSave) onSave()
  }})

  // Class
  const klasseSel = el('select', { name: 'class_id', class: 'felt select', required: 'true', onchange: async (e) => {
    await oppdaterFagSel(e.target.value)
  }})
  for (const k of klasser || []) {
    const opt = el('option', { value: k.id }, k.name)
    if (defaultKlasse && k.id === defaultKlasse.id) opt.setAttribute('selected', 'true')
    klasseSel.appendChild(opt)
  }
  form.appendChild(lagFormRad('Klasse', klasseSel))

  // Subject
  const fagSel = el('select', { name: 'subject_id', class: 'felt select', required: 'true', onchange: async (e) => {
    await oppdaterDivisionSel(e.target.value)
  }})
  form.appendChild(lagFormRad('Fag', fagSel))

  // Division
  const divSel = el('select', { name: 'division_id', class: 'felt select' })
  divSel.appendChild(el('option', { value: '' }, '(ingen)'))
  form.appendChild(lagFormRad('Parti/gruppe', divSel))

  async function oppdaterFagSel(classId) {
    clearEl(fagSel)
    const { data: subj } = await sb.from('subjects').select('*').eq('school_id', APP.school.id).order('name')
    for (const s of subj || []) {
      fagSel.appendChild(el('option', { value: s.id }, s.name))
    }
    if (fagSel.options.length) await oppdaterDivisionSel(fagSel.value)
  }

  async function oppdaterDivisionSel(subjectId) {
    clearEl(divSel)
    divSel.appendChild(el('option', { value: '' }, '(ingen)'))
    const { data: divs } = await sb.from('subject_divisions').select('*').eq('subject_id', subjectId)
    for (const d of divs || []) {
      divSel.appendChild(el('option', { value: d.id }, `${d.division_type === 'parti' ? 'Parti' : 'Gruppe'}: ${d.name}`))
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

  const { data: subjects } = await sb.from('subjects').select('*')
    .eq('school_id', APP.school.id).order('name')
  const { data: divisions } = await sb.from('subject_divisions').select('*')
    .eq('subject_id', session.subject_id)
  const { data: teachers } = await sb.from('users').select('*').eq('school_id', APP.school.id)

  const form = el('form', { class: 'skjema', onsubmit: async (e) => {
    e.preventDefault()
    const fd = new FormData(form)
    const data = {
      subject_id: fd.get('subject_id'),
      division_id: fd.get('division_id') || null,
      week_nr: parseInt(fd.get('week_nr')),
      day_of_week: parseInt(fd.get('day_of_week')),
      teacher_id: fd.get('teacher_id'),
      activity: fd.get('activity') || null,
      meeting_point: fd.get('meeting_point') || null,
      info: fd.get('info') || null,
    }
    await medLagreOverlay(async () => {
      const ok = await lagreOkt(session.id, data, session.version)
      if (!ok) throw new Error('Konfliktvarsling – prøv igjen')
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

  const divSel = el('select', { name: 'division_id', class: 'felt select' })
  divSel.appendChild(el('option', { value: '' }, '(ingen)'))
  for (const d of divisions || []) {
    const opt = el('option', { value: d.id }, d.name)
    if (d.id === session.division_id) opt.setAttribute('selected', 'true')
    divSel.appendChild(opt)
  }
  form.appendChild(lagFormRad('Parti/gruppe', divSel))

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
  box.appendChild(el('p', {}, 'Velg uke og dag for kopien:'))

  const weekInput = el('input', { type: 'number', class: 'felt input', value: session.week_nr, min: 1, max: 53, placeholder: 'Uke' })
  const dagSel = el('select', { class: 'felt select' })
  for (let i = 1; i <= 5; i++) {
    const opt = el('option', { value: i }, dagNavn(i))
    if (i === session.day_of_week) opt.setAttribute('selected', 'true')
    dagSel.appendChild(opt)
  }

  box.appendChild(lagFormRad('Uke', weekInput))
  box.appendChild(lagFormRad('Dag', dagSel))

  box.appendChild(el('button', { class: 'btn btn-p', onclick: async () => {
    await medLagreOverlay(async () => {
      const { error } = await sb.from('sessions').insert({
        class_id: session.class_id,
        subject_id: session.subject_id,
        division_id: session.division_id,
        week_nr: parseInt(weekInput.value),
        day_of_week: parseInt(dagSel.value),
        teacher_id: APP.profile.id,
        activity: session.activity,
        meeting_point: session.meeting_point,
        info: session.info,
        school_year: APP.school?.active_school_year,
        version: 1,
      })
      if (error) throw error
    })
    modal.remove()
    if (onSave) onSave()
  }}, 'Kopier'))
  box.appendChild(el('button', { class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))

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
      await sb.from('sessions').update({ teacher_id: targetId }).eq('id', session.id)
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
    preview.appendChild(el('p', {}, 'Analyserer…'))

    try {
      const { data, error } = await sb.functions.invoke('ai-parse-sessions', {
        body: { text: textarea.value, class_id: defaultKlasse?.id, school_id: APP.school.id }
      })
      if (error) throw error

      clearEl(preview)
      const parsed = data.sessions || []
      if (!parsed.length) { preview.appendChild(el('p', {}, 'Ingen økter funnet.')); return }

      const table = el('table', { class: 'preview-table' })
      const thead = el('thead')
      thead.appendChild(el('tr', {},
        el('th', {}, ''),
        el('th', {}, 'Fag'),
        el('th', {}, 'Uke'),
        el('th', {}, 'Dag'),
        el('th', {}, 'Aktivitet'),
        el('th', {}, 'Konfidensgrad'),
        el('th', {}, 'Advarsel'),
      ))
      table.appendChild(thead)
      const tbody = el('tbody')

      const selected = new Set(parsed.map((_, i) => i))

      for (let i = 0; i < parsed.length; i++) {
        const s = parsed[i]
        const tr = el('tr', {})
        const cb = el('input', { type: 'checkbox', checked: 'true' })
        cb.checked = true
        cb.addEventListener('change', () => {
          if (cb.checked) selected.add(i)
          else selected.delete(i)
        })
        tr.appendChild(el('td', {}, cb))
        tr.appendChild(el('td', {}, s.subject_name || ''))
        tr.appendChild(el('td', {}, String(s.week_nr || '')))
        tr.appendChild(el('td', {}, dagNavn(s.day_of_week) || ''))
        tr.appendChild(el('td', {}, s.activity || ''))
        const conf = s.confidence || 0
        const confEl = el('td', { class: conf > 0.7 ? 'conf--high' : conf > 0.4 ? 'conf--medium' : 'conf--low' },
          `${Math.round(conf * 100)}%`)
        tr.appendChild(confEl)
        tr.appendChild(el('td', {}, s.warning || ''))
        tbody.appendChild(tr)
      }
      table.appendChild(tbody)
      preview.appendChild(table)

      preview.appendChild(el('button', { class: 'btn btn-p', onclick: async () => {
        const toImport = parsed.filter((_, i) => selected.has(i))
        await medLagreOverlay(async () => {
          for (const s of toImport) {
            await sb.from('sessions').insert({
              class_id: defaultKlasse?.id,
              subject_id: s.subject_id,
              division_id: s.division_id || null,
              week_nr: s.week_nr,
              day_of_week: s.day_of_week,
              teacher_id: APP.profile.id,
              activity: s.activity || '',
              meeting_point: s.meeting_point || '',
              info: s.info || '',
              school_year: APP.school?.active_school_year,
              version: 1,
            })
          }
        })
        modal.remove()
        if (onSave) onSave()
      }}, 'Importer valgte'))
    } catch (err) {
      clearEl(preview)
      preview.appendChild(el('p', { class: 'error' }, `Feil: ${err.message}`))
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
      row.appendChild(el('span', {}, `${e.title} (${formatDatoNO(e.start_date)} – ${formatDatoNO(e.end_date)})`))
      row.appendChild(el('button', { class: 'btn btn-ikon', title: 'Rediger arrangement', onclick: () => visRedigerMDEModal(e, renderKlasseAdminInnhold) }, '✏️'))
      row.appendChild(el('button', { class: 'btn btn-ikon btn-f', title: 'Slett arrangement', onclick: async () => {
        if (!confirm('Slette?')) return
        await medLagreOverlay(() => sb.from('multi_day_events').delete().eq('id', e.id))
        renderKlasseAdminInnhold()
      }}, '🗑️'))
      innhold.appendChild(row)
    }
    innhold.appendChild(el('button', { class: 'btn btn-s', title: 'Legg til flerdagsarrangement', onclick: () => visNyMDEModal(aktivKlasse.id, renderKlasseAdminInnhold) }, '+ Nytt arrangement'))

    // Subject config
    innhold.appendChild(el('h3', {}, 'Faginnstillinger'))
    const { data: subjects } = await sb.from('subjects').select('*').eq('class_id', aktivKlasse.id).order('name')

    for (const subj of subjects || []) {
      const subjBox = el('div', { class: 'subj-config-box' })
      subjBox.appendChild(el('strong', {}, subj.name))

      // Preferred days
      const daysRow = el('div', { class: 'days-row' })
      const prefDays = subj.preferred_days || []
      for (let d = 1; d <= 5; d++) {
        const cb = el('input', { type: 'checkbox', id: `pd-${subj.id}-${d}` })
        cb.checked = prefDays.includes(d)
        cb.addEventListener('change', async () => {
          const current = subj.preferred_days || []
          const updated = cb.checked
            ? [...current, d].sort()
            : current.filter(x => x !== d)
          await sb.from('class_subject_config').upsert({ class_id: APP.currentClass, subject_id: subj.id, preferred_days: updated })
        })
        daysRow.appendChild(cb)
        daysRow.appendChild(el('label', { for: `pd-${subj.id}-${d}` }, dagNavn(d).slice(0, 2)))
      }
      subjBox.appendChild(el('label', {}, 'Foretrukne dager: '))
      subjBox.appendChild(daysRow)

      // Divisions
      const { data: divs } = await sb.from('subject_divisions').select('*').eq('subject_id', subj.id)
      const divList = el('div', { class: 'div-list' })
      for (const d of divs || []) {
        const divRow = el('div', { class: 'div-row' })
        const nameInput = el('input', { type: 'text', class: 'felt input input-sm', value: d.name })
        divRow.appendChild(nameInput)
        divRow.appendChild(el('button', { class: 'btn btn-ikon', title: 'Lagre navn på inndeling', onclick: async () => {
          await medLagreOverlay(() => sb.from('subject_divisions').update({ name: nameInput.value }).eq('id', d.id))
          showToast('Lagret', 'success')
        }}, '💾'))
        divRow.appendChild(el('button', { class: 'btn btn-ikon btn-f', title: 'Slett inndeling', onclick: async () => {
          if (!confirm('Slette?')) return
          await medLagreOverlay(() => sb.from('subject_divisions').delete().eq('id', d.id))
          renderKlasseAdminInnhold()
        }}, '🗑️'))
        divList.appendChild(divRow)
      }
      if ((divs || []).length < 8) {
        divList.appendChild(el('button', { class: 'btn btn-sm', title: 'Legg til parti eller gruppe', onclick: async () => {
          const type = prompt('Type (parti/gruppe):') || 'gruppe'
          const navn = prompt('Navn:')
          if (!navn) return
          await medLagreOverlay(() => sb.from('subject_divisions').insert({
            subject_id: subj.id, name: navn, type
          }))
          renderKlasseAdminInnhold()
        }}, '+ Legg til inndeling'))
      }
      subjBox.appendChild(divList)
      innhold.appendChild(subjBox)
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

  box.appendChild(lagFormRad('Tittel', titleInput))
  box.appendChild(lagFormRad('Beskrivelse', descInput))
  box.appendChild(lagFormRad('Fra', startInput))
  box.appendChild(lagFormRad('Til', endInput))

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

  box.appendChild(lagFormRad('Tittel', titleInput))
  box.appendChild(lagFormRad('Beskrivelse', descInput))
  box.appendChild(lagFormRad('Fra', startInput))
  box.appendChild(lagFormRad('Til', endInput))

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
        const { id, ...rest } = s
        await sb.from('sessions').insert({ ...rest, class_id: klasse.id, school_year: APP.school?.active_school_year, version: 1 })
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

  // Neste skoleår: øk første årstall med 1
  function nesteSkolear(sy) {
    if (!sy || !/^\d{2}\/\d{2}$/.test(sy)) return ''
    const a = (parseInt(sy.split('/')[0]) + 1) % 100
    const b = (a + 1) % 100
    return `${String(a).padStart(2, '0')}/${String(b).padStart(2, '0')}`
  }

  container.appendChild(el('h3', {}, 'Skoleår'))

  // Vis aktivt skoleår
  const statusBoks = el('div', { class: 'subj-config-box', style: 'margin-bottom:24px' })
  statusBoks.appendChild(el('div', { class: 'tekst-svak', style: 'font-size:.82rem;margin-bottom:2px' }, 'Aktivt skoleår'))
  statusBoks.appendChild(el('div', { style: 'font-size:1.5rem;font-weight:700;letter-spacing:.05em' }, aktivt))
  statusBoks.appendChild(el('div', { class: 'tekst-svak', style: 'font-size:.82rem;margin-top:6px' },
    'Elevene ser kun det aktive skoleåret. Lærere kan bla tilbake til tidligere år. Nye økter stemples automatisk med det aktive skoleåret.'))
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
      if (nytt === aktivt) { showToast('Dette er allerede aktivt skoleår', 'info'); return }
      if (!confirm(`Bytte aktivt skoleår fra ${aktivt} til ${nytt}?\n\nElevenes visning endres umiddelbart. Eksisterende økter beholdes.`)) return
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
}

async function renderFagTab(container) {
  async function refresh() {
    clearEl(container)
    const { data: subjects } = await sb.from('subjects').select('*').order('name')

    container.appendChild(el('h3', {}, 'Fag'))
    for (const s of subjects || []) {
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
      container.appendChild(row)
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

  const form = el('form', { class: 'skjema', onsubmit: async (e) => {
    e.preventDefault()
    const fd = new FormData(form)
    const data = {
      name: fd.get('name'),
      short_code: fd.get('short_code'),
      color_hex: fd.get('color_hex'),
      has_parti: fd.get('division_type') === 'parti',
      has_gruppe: fd.get('division_type') === 'gruppe',
      max_divisions: parseInt(fd.get('max_divisions')) || 8,
    }
    await medLagreOverlay(async () => {
      if (subj) {
        const { error } = await sb.from('subjects').update(data).eq('id', subj.id)
        if (error) throw error
      } else {
        const { error } = await sb.from('subjects').insert({ ...data, school_id: APP.school.id })
        if (error) throw error
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
  maksRad.style.display = (dtSel.value === 'ingen') ? 'none' : 'block'
  dtSel.addEventListener('change', () => {
    maksRad.style.display = (dtSel.value === 'ingen') ? 'none' : 'block'
  })
  form.appendChild(maksRad)

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
      row.appendChild(el('span', { class: 'tekst' }, `${u.full_name} – ${u.role}`))
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
    const rolle = fd.get('role')
    const erAdmin = form.querySelector('[name=is_admin]').checked
    const klassIds = [...form.querySelectorAll('[name=class_id]:checked')].map(c => c.value)
    await medLagreOverlay(async () => {
      // Sjekk maks 2 admins
      if (erAdmin) {
        const { data: admins } = await sb.from('users').select('id').eq('school_id', APP.school.id).eq('role', 'admin').is('deleted_at', null)
        if ((admins?.length || 0) >= 2) throw new Error('Maks 2 administratorer er tillatt per skole')
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
    const rolle = fd.get('role')
    const erAdmin = form.querySelector('[name=is_admin]').checked
    const newKlassIds = [...form.querySelectorAll('[name=class_id]:checked')].map(c => c.value)
    await medLagreOverlay(async () => {
      // Sjekk maks 2 admins (unntatt seg selv)
      if (erAdmin && !user.is_admin_active) {
        const { data: admins } = await sb.from('users').select('id').eq('school_id', APP.school.id).eq('is_admin_active', true).is('deleted_at', null).neq('id', user.id)
        if ((admins?.length || 0) >= 2) throw new Error('Maks 2 administratorer er tillatt per skole')
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
        is_admin_active: erAdmin,
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
    if ((user.role === val) || (user.role === 'admin' && val === 'laerer')) rb.checked = true
    lbl.appendChild(rb); lbl.appendChild(document.createTextNode(label))
    rolleWrap2.appendChild(lbl)
  }
  form.appendChild(lagFormRad('Rolle', rolleWrap2))

  const adminLbl2 = el('label', { style: 'display:flex;align-items:center;gap:6px;cursor:pointer;margin-top:4px' })
  const adminCb2 = el('input', { type: 'checkbox', name: 'is_admin' })
  if (user.is_admin_active) adminCb2.checked = true
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
  async function refresh() {
    clearEl(container)
    const wrap = el('div', { class: 'skjema-smal' })
    const { data: events } = await sb.from('school_calendar').select('*').order('start_date')
    wrap.appendChild(el('h3', {}, 'Skolerute'))

    // Events list – same admin-rad pattern as rest of admin panel
    for (const e of events || []) {
      const row = el('div', { class: 'admin-rad' })
      const info = el('div', { style: 'flex:1; min-width:0' })
      info.appendChild(el('span', { class: 'tekst', style: 'font-weight:600; margin-right:8px' }, e.title))
      info.appendChild(el('span', { class: 'tekst-svak', style: 'font-size:.85rem; white-space:nowrap' },
        `${formatDatoNO(e.start_date)} – ${formatDatoNO(e.end_date)}`))
      row.appendChild(info)
      row.appendChild(el('span', { class: 'div-badge' }, e.type || ''))
      row.appendChild(el('button', { class: 'btn btn-ikon btn-f', title: 'Slett denne hendelsen fra skoleruten', onclick: async () => {
        await medLagreOverlay(() => sb.from('school_calendar').delete().eq('id', e.id))
        refresh()
      }}, '🗑️'))
      wrap.appendChild(row)
    }

    wrap.appendChild(el('button', { class: 'btn btn-p', style: 'margin-top:14px', title: 'Legg til ny hendelse i skoleruten', onclick: () => visNySkolerute(refresh) }, '+ Legg til'))

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
    const aiText = el('textarea', { class: 'felt textarea ai-tekstfelt', placeholder: 'Lim inn skoleruten som tekst (f.eks. fra PDF eller e-post)…', rows: 8 })
    aiInnhold.appendChild(aiText)
    aiInnhold.appendChild(el('button', { type: 'button', class: 'btn btn-p', title: 'Send tekst til AI for tolking av datoer og hendelser', onclick: async () => {
      if (!aiText.value.trim()) return
      try {
        const { data, error } = await sb.functions.invoke('ai-parse-skolerute', {
          body: { text: aiText.value, school_id: APP.school.id }
        })
        if (error) throw error
        const evs = data.events || []
        const warnings = data.warnings || []
        if (!evs.length) { showToast('Ingen hendelser funnet – prøv å legge inn teksten mer strukturert', 'info'); return }
        let msg = `Importere ${evs.length} hendelse(r)?`
        if (warnings.length) msg += `\n\nAdvarsler:\n${warnings.join('\n')}`
        if (!confirm(msg)) return
        await medLagreOverlay(async () => {
          for (const e of evs) {
            await sb.from('school_calendar').insert({ ...e, school_id: APP.school.id })
          }
        })
        refresh()
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

function visNySkolerute(onSave) {
  const modal = el('div', { class: 'modal-bg' })
  const box   = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, 'Legg til hendelse'))

  const form = el('form', { class: 'skjema', onsubmit: async (ev) => {
    ev.preventDefault()
    const fd = new FormData(form)
    await medLagreOverlay(async () => {
      const { error } = await sb.from('school_calendar').insert({
        school_id: APP.school.id,
        title: fd.get('title'),
        start_date: fd.get('start_date'),
        end_date: fd.get('end_date'),
        type: fd.get('type'),
      })
      if (error) throw error
    })
    modal.remove()
    if (onSave) onSave()
  }})

  form.appendChild(lagFormRad('Tittel',
    el('input', { name: 'title', type: 'text', class: 'felt input', required: 'true', maxlength: 30 })))

  const fraIn = el('input', { name: 'start_date', type: 'date', class: 'felt input', required: 'true' })
  const tilIn = el('input', { name: 'end_date',   type: 'date', class: 'felt input', required: 'true' })
  const datoRad = el('div', { class: 'uke-rad' })
  const fraGrp  = el('div', { class: 'uke-grp dato-grp' })
  fraGrp.appendChild(el('label', {}, 'Fra')); fraGrp.appendChild(fraIn)
  const tilGrp  = el('div', { class: 'uke-grp dato-grp' })
  tilGrp.appendChild(el('label', {}, 'Til')); tilGrp.appendChild(tilIn)
  datoRad.appendChild(fraGrp); datoRad.appendChild(tilGrp)
  form.appendChild(lagFormRad('Dato', datoRad))

  const typeSel = el('select', { name: 'type', class: 'felt select' })
  for (const t of ['ferie', 'helligdag', 'planleggingsdag', 'annet'])
    typeSel.appendChild(el('option', { value: t }, t))
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

async function renderFaktaTab(container) {
  async function refresh() {
    clearEl(container)
    const { data: facts } = await sb.from('school_facts').select('*').eq('school_id', APP.school.id)
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
        const { data, error } = await sb.functions.invoke('generate-facts', { body: { school_id: APP.school.id } })
        if (error) throw new Error(error.message || JSON.stringify(error))
        const ny = data?.facts || []
        if (!ny.length) { showToast('Ingen fakta generert', 'info'); return }

        // Respect 100-fact limit
        const ledigePlasser = Math.max(0, 100 - (facts?.length || 0))
        if (ledigePlasser === 0) { showToast('Listen er full (maks 100 funfacts). Slett noen først.', 'info'); return }
        const skalLeggesTil = ny.slice(0, ledigePlasser)

        await medLagreOverlay(async () => {
          const rows = skalLeggesTil.map(txt => ({ school_id: APP.school.id, fact_text: txt }))
          const { error: insErr } = await sb.from('school_facts').insert(rows)
          if (insErr) throw new Error(insErr.message)
        })
        showToast(`${skalLeggesTil.length} funfacts lagt til!`, 'ok')
        refresh()
      } catch (err) {
        showToast(err.message, 'error')
      } finally {
        aiBtn.disabled = false; aiBtn.textContent = '✨ Generer med AI'
      }
    }}, '✨ Generer med AI')
    knappeRad.appendChild(aiBtn)
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

  // Last profil og skoledata i bakgrunnen
  if (session) {
    try {
      APP.profile = await fetchProfile(session.user.id)
      APP.isAdminActive = APP.profile.is_admin_active || false
      oppdaterHeader()
      // Re-render hvis vi er på en side som trenger profil
      const h = location.hash || '#/'
      if (h === '#/' || h === '#' || h.startsWith('#/laerer') || h.startsWith('#/admin')) {
        await router()
      }
    } catch (err) {
      console.warn('Kunne ikke hente brukerprofil:', err.message)
    }
  }

  // Last skoledata i bakgrunnen
  const { data: schools } = await sb.from('schools').select('*').limit(1)
  if (schools && schools.length) {
    APP.school = schools[0]
    oppdaterHeader()
    const h = location.hash
    if (!h || h === '#/' || h === '#') {
      await router()
    }
  }

  // Load school facts for overlay (background)
  if (APP.school) {
    const { data: facts } = await sb.from('school_facts').select('*').eq('school_id', APP.school.id)
    APP.facts = facts || []
  }
}

document.addEventListener('DOMContentLoaded', init)
