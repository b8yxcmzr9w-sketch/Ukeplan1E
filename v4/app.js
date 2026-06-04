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
  return getISOWeek(new Date())
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
  return d.toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' })
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

// ─────────────────────────────────────────
// SAVE OVERLAY
// ─────────────────────────────────────────

async function medLagreOverlay(asyncFn) {
  const overlay = el('div', { class: 'save-overlay' })
  const box = el('div', { class: 'save-overlay__box' })
  const spinner = el('div', { class: 'save-overlay__spinner' })

  // Pick random text from facts or funny texts
  const texts = APP.facts.length
    ? [...FUNNY_TEXTS, ...APP.facts.map(f => f.fact_text)]
    : FUNNY_TEXTS
  const msg = texts[Math.floor(Math.random() * texts.length)]

  const msgEl = el('p', { class: 'save-overlay__msg' }, msg)
  box.appendChild(spinner)
  box.appendChild(msgEl)
  overlay.appendChild(box)
  document.body.appendChild(overlay)

  try {
    const result = await asyncFn()
    clearEl(box)
    box.appendChild(el('div', { class: 'save-overlay__check' }, '✓'))
    box.appendChild(el('p', {}, 'Lagret!'))
    await new Promise(r => setTimeout(r, 1500))
    overlay.remove()
    return result
  } catch (err) {
    clearEl(box)
    box.appendChild(el('p', { class: 'save-overlay__error' }, `Feil: ${err.message}`))
    const retryBtn = el('button', { class: 'btn btn-s', onclick: () => overlay.remove() }, 'Lukk')
    box.appendChild(retryBtn)
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
  navigate('#/login')
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

async function toggleAdminModus() {
  const ny = !APP.isAdminActive
  await sb.from('users').update({ is_admin_active: ny }).eq('id', APP.profile.id)
  APP.isAdminActive = ny
  APP.profile.is_admin_active = ny
  oppdaterHeader()
  navigate(ny ? '#/admin' : '#/laerer')
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

  const form = el('form', { class: 'skjema', onsubmit: async (e) => {
    e.preventDefault()
    const email = form.querySelector('[name=email]').value
    const password = form.querySelector('[name=password]').value
    try {
      await medLagreOverlay(() => login(email, password))
      const session = (await sb.auth.getSession()).data.session
      APP.user = session.user
      APP.profile = await fetchProfile(session.user.id)
      APP.isAdminActive = APP.profile.is_admin_active || false
      oppdaterHeader()
      await sjekkVentendeOverforinger()
      if (APP.isAdminActive) navigate('#/admin')
      else navigate('#/laerer')
    } catch (err) {
      showToast('Feil ved innlogging: ' + err.message, 'error')
    }
  }})

  form.appendChild(el('h2', {}, 'Logg inn'))
  form.appendChild(el('label', {}, 'E-post'))
  form.appendChild(el('input', { name: 'email', type: 'email', required: 'true', placeholder: 'din@epost.no' }))
  form.appendChild(el('label', {}, 'Passord'))
  form.appendChild(el('input', { name: 'password', type: 'password', required: 'true' }))
  form.appendChild(el('button', { type: 'submit', class: 'btn btn-p' }, 'Logg inn'))
  main.appendChild(form)
}

function renderPassordModal() {
  const modal = el('div', { class: 'modal' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, 'Bytt passord'))
  const nytt = el('input', { type: 'password', placeholder: 'Nytt passord', class: 'felt input' })
  const bekreft = el('input', { type: 'password', placeholder: 'Bekreft passord', class: 'felt input' })
  box.appendChild(nytt)
  box.appendChild(bekreft)
  box.appendChild(el('button', { class: 'btn btn-p', onclick: async () => {
    if (nytt.value !== bekreft.value) { showToast('Passordene er ikke like', 'error'); return }
    try {
      await medLagreOverlay(() => byttPassord(nytt.value))
      modal.remove()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }}, 'Lagre'))
  box.appendChild(el('button', { class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))
  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

// ─────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────

function oppdaterHeader() {
  // Skolenavn + logo
  const skolenavn = document.getElementById('hdr-skolenavn')
  const logo = document.getElementById('hdr-logo')
  if (skolenavn) skolenavn.textContent = APP.school ? APP.school.name : 'Ukeplan'
  if (logo && APP.school && (APP.school.logo_url || APP.school.logo_file_path)) {
    logo.src = APP.school.logo_file_path
      ? `${SUPABASE_URL}/storage/v1/object/public/logos/${APP.school.logo_file_path}`
      : APP.school.logo_url
    logo.classList.remove('skjult')
  }

  // Tema
  if (APP.school && APP.school.color_theme) {
    document.documentElement.dataset.theme = APP.school.color_theme
  }

  // Knapper
  const loginBtn   = document.getElementById('hdr-login-btn')
  const logoutBtn  = document.getElementById('hdr-logout-btn')
  const laererBtn  = document.getElementById('hdr-laerer-btn')
  const adminBtn   = document.getElementById('hdr-admin-btn')
  const adminToggle= document.getElementById('hdr-admin-toggle')
  const username   = document.getElementById('hdr-username')

  if (APP.user && APP.profile) {
    if (username)    { username.textContent = APP.profile.full_name; username.classList.remove('skjult') }
    if (loginBtn)    loginBtn.classList.add('skjult')
    if (logoutBtn)   logoutBtn.classList.remove('skjult')

    const rolle = APP.profile.role
    if (laererBtn)  laererBtn.classList.toggle('skjult', rolle === 'admin' && APP.isAdminActive)
    if (adminBtn)   adminBtn.classList.toggle('skjult', !APP.isAdminActive)

    if (adminToggle && (rolle === 'admin' || rolle === 'kontaktlaerer')) {
      adminToggle.classList.remove('skjult')
      adminToggle.textContent = APP.isAdminActive ? 'Gå ut av admin-modus' : 'Aktiver admin-modus'
      adminToggle.classList.toggle('admin-aktiv', APP.isAdminActive)
      adminToggle.onclick = toggleAdminModus
    }
  } else {
    if (username)    username.classList.add('skjult')
    if (loginBtn)    loginBtn.classList.remove('skjult')
    if (logoutBtn)   logoutBtn.classList.add('skjult')
    if (laererBtn)   laererBtn.classList.add('skjult')
    if (adminBtn)    adminBtn.classList.add('skjult')
    if (adminToggle) adminToggle.classList.add('skjult')
  }

  // Logout-knapp
  if (logoutBtn) logoutBtn.onclick = logout
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
  renderElevView(klasseNavn)
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
  const modal = el('div', { class: 'modal' })
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
  const main = document.getElementById('app-main')
  clearEl(main)
  APP.currentView = 'elev'

  let klasse = null
  let alleKlasser = []

  const { data: klasser } = await sb.from('classes').select('*').order('name')
  alleKlasser = klasser || []

  if (klasseNavn) {
    klasse = alleKlasser.find(k => k.name === klasseNavn)
  }

  // Wrapper
  const wrap = el('div', { class: 'container' })
  main.appendChild(wrap)

  // Class selector
  const klasseHeader = el('div', { class: 'nav-bar' })
  const selector = el('select', { onchange: (e) => {
    const val = e.target.value
    navigate(val ? `#/klasse/${encodeURIComponent(val)}` : '#/')
  }})
  selector.appendChild(el('option', { value: '' }, '-- Velg klasse --'))
  for (const k of alleKlasser) {
    const opt = el('option', { value: k.name }, k.name)
    if (klasse && k.id === klasse.id) opt.setAttribute('selected', 'true')
    selector.appendChild(opt)
  }
  klasseHeader.appendChild(el('label', { style: 'font-weight:600;margin-right:8px' }, 'Klasse:'))
  klasseHeader.appendChild(selector)
  wrap.appendChild(klasseHeader)

  if (!klasse) {
    wrap.appendChild(el('p', { class: 'tom-uke' }, 'Velg en klasse for å se ukeplanen.'))
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
    const { data: sessions } = await sb.from('sessions')
      .select('*, subjects(name, color_hex, short_code), users(name), subject_divisions(name, type)')
      .eq('class_id', klasse.id)
      .eq('week_nr', weekNr)
      .order('day_of_week')

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

    // Week navigation
    const navRow = el('div', { class: 'nav-bar' })
    const prevBtn = el('button', { class: 'btn btn-s', onclick: () => {
      if (weekNr > schoolStart) { currentWeek = weekNr - 1; renderUke(currentWeek) }
    }}, '← Forrige uke')
    if (weekNr <= schoolStart) prevBtn.setAttribute('disabled', 'true')

    const weekInput = el('input', { type: 'number', class: 'uke-nr-input', value: weekNr,
      min: schoolStart, max: schoolEnd,
      onchange: (e) => {
        const v = parseInt(e.target.value)
        if (v >= schoolStart && v <= schoolEnd) { currentWeek = v; renderUke(currentWeek) }
      }
    })

    const nextBtn = el('button', { class: 'btn btn-s', onclick: () => {
      if (weekNr < schoolEnd) { currentWeek = weekNr + 1; renderUke(currentWeek) }
    }}, 'Neste uke →')
    if (weekNr >= schoolEnd) nextBtn.setAttribute('disabled', 'true')

    navRow.appendChild(prevBtn)
    navRow.appendChild(el('span', { class: 'uke-label' }, `Uke ${weekNr}`))
    navRow.appendChild(weekInput)
    navRow.appendChild(nextBtn)

    const printBtn = el('button', { class: 'btn btn-s', onclick: () => window.print() }, '🖨️ Skriv ut')
    const icalBtn = el('button', { class: 'btn btn-s', onclick: () => visICalModal(klasse) }, '📅 iCal-abonnement')
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
      const dayHeader = el('div', { class: 'dag-tittel' },
        `${dagNavn(dag)} ${formatDatoNO(dateForDay.toISOString().slice(0, 10))}`)
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
    const actionRow = el('div', { class: 'okt-handlinger' })
    if (actions.edit) actionRow.appendChild(el('button', { class: 'btn btn-ikon', onclick: actions.edit }, '✏️'))
    if (actions.copy) actionRow.appendChild(el('button', { class: 'btn btn-ikon', onclick: actions.copy }, '📋'))
    if (actions.del) actionRow.appendChild(el('button', { class: 'btn btn-ikon btn-f', onclick: actions.del }, '🗑️'))
    if (actions.transfer) actionRow.appendChild(el('button', { class: 'btn btn-ikon', onclick: actions.transfer }, '↗️'))
    card.appendChild(actionRow)
  }

  return card
}

function visICalModal(klasse) {
  const baseUrl = `${SUPABASE_URL}/functions/v1/ical`
  const url = klasse
    ? `${baseUrl}?class_id=${klasse.id}`
    : `${baseUrl}?teacher_id=${APP.profile?.id}`
  const modal = el('div', { class: 'modal' })
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

  const isKontakt = APP.profile.role === 'kontaktlaerer' || APP.isAdminActive

  const tabs = ['Min klasse', 'Alle mine økter', 'Søk']
  if (isKontakt) tabs.push('Klasse-admin')

  let activeTab = 0

  const tabBar = el('div', { class: 'fane-bar' })
  const tabContent = el('div', { class: 'fane-innhold' })

  function setTab(idx) {
    activeTab = idx
    tabBar.querySelectorAll('.fane').forEach((b, i) => {
      b.classList.toggle('aktiv', i === idx)
    })
    clearEl(tabContent)
    switch (idx) {
      case 0: renderMinKlasseTab(tabContent); break
      case 1: renderAlleOkterTab(tabContent); break
      case 2: renderSokTab(tabContent); break
      case 3: renderKlasseAdminTab(tabContent); break
    }
  }

  tabs.forEach((t, i) => {
    const btn = el('button', { class: 'fane', onclick: () => setTab(i) }, t)
    tabBar.appendChild(btn)
  })

  main.appendChild(tabBar)
  main.appendChild(tabContent)
  setTab(0)
}

async function renderMinKlasseTab(container) {
  // Class selector
  const { data: mine } = await sb.from('user_classes')
    .select('classes(*)')
    .eq('user_id', APP.profile.id)
  const klasser = (mine || []).map(r => r.classes).filter(Boolean)

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

  const topRow = el('div', { class: 'laerer-top' })
  const klasseSel = el('select', { class: 'felt select', onchange: (e) => {
    aktivKlasse = klasser.find(k => k.id === e.target.value)
    renderUke()
  }})
  for (const k of klasser) {
    const opt = el('option', { value: k.id }, k.name)
    klasseSel.appendChild(opt)
  }
  topRow.appendChild(el('label', {}, 'Klasse: '))
  topRow.appendChild(klasseSel)
  topRow.appendChild(el('button', { class: 'btn btn-p', onclick: () => visNyOktModal(aktivKlasse, currentWeek, renderUke) }, '+ Ny økt'))
  topRow.appendChild(el('button', { class: 'btn btn-s', onclick: () => visAIPasteModal(aktivKlasse, renderUke) }, '🤖 Lim inn med AI'))
  container.appendChild(topRow)

  const weekArea = el('div', { id: 'laerer-week-area' })
  container.appendChild(weekArea)

  let bulkSelected = new Set()

  async function renderUke() {
    clearEl(weekArea)
    bulkSelected.clear()

    const navRow = el('div', { class: 'nav-bar' })
    const prevBtn = el('button', { class: 'btn btn-s', onclick: () => {
      if (currentWeek > schoolStart) { currentWeek--; renderUke() }
    }}, '← Forrige')
    if (currentWeek <= schoolStart) prevBtn.setAttribute('disabled', 'true')

    const nextBtn = el('button', { class: 'btn btn-s', onclick: () => {
      if (currentWeek < schoolEnd) { currentWeek++; renderUke() }
    }}, 'Neste →')
    if (currentWeek >= schoolEnd) nextBtn.setAttribute('disabled', 'true')

    const weekInput = el('input', { type: 'number', class: 'uke-nr-input', value: currentWeek,
      min: schoolStart, max: schoolEnd,
      onchange: (e) => {
        const v = parseInt(e.target.value)
        if (v >= schoolStart && v <= schoolEnd) { currentWeek = v; renderUke() }
      }
    })

    navRow.appendChild(prevBtn)
    navRow.appendChild(el('span', { class: 'uke-label' }, `Uke ${currentWeek}`))
    navRow.appendChild(weekInput)
    navRow.appendChild(nextBtn)
    navRow.appendChild(el('button', { class: 'btn btn-s', onclick: () => window.print() }, '🖨️'))
    navRow.appendChild(el('button', { class: 'btn btn-s', onclick: () => visICalModal(null) }, '📅'))
    weekArea.appendChild(navRow)

    const { data: sessions } = await sb.from('sessions')
      .select('*, subjects(name, color_hex, short_code), users(name), subject_divisions(name, type)')
      .eq('class_id', aktivKlasse.id)
      .eq('week_nr', currentWeek)

    // Bulk edit bar
    const bulkBar = el('div', { class: 'bulk-bar', style: 'display:none' })
    const bulkCount = el('span', {}, '0 valgt')
    bulkBar.appendChild(bulkCount)
    bulkBar.appendChild(el('button', { class: 'btn btn-s', onclick: () => visBulkEditModal([...bulkSelected], renderUke) }, 'Rediger valgte'))
    bulkBar.appendChild(el('button', { class: 'btn btn-f', onclick: async () => {
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
      .select('*, subjects(name, color_hex), users(name), classes(name)')
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

async function visNyOktModal(defaultKlasse, defaultWeek, onSave) {
  const modal = el('div', { class: 'modal' })
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

  form.appendChild(el('button', { type: 'submit', class: 'btn btn-p' }, 'Lagre'))
  form.appendChild(el('button', { type: 'button', class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))

  box.appendChild(form)
  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function visRedigerOktModal(session, onSave) {
  const modal = el('div', { class: 'modal' })
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

  form.appendChild(el('button', { type: 'submit', class: 'btn btn-p' }, 'Lagre'))
  form.appendChild(el('button', { type: 'button', class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))

  box.appendChild(form)
  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function visKopierOktModal(session, onSave) {
  const modal = el('div', { class: 'modal' })
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
  const modal = el('div', { class: 'modal' })
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
  const modal = el('div', { class: 'modal' })
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
  const modal = el('div', { class: 'modal' })
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
      row.appendChild(el('button', { class: 'btn btn-ikon', onclick: () => visRedigerMDEModal(e, renderKlasseAdminInnhold) }, '✏️'))
      row.appendChild(el('button', { class: 'btn btn-ikon btn-f', onclick: async () => {
        if (!confirm('Slette?')) return
        await medLagreOverlay(() => sb.from('multi_day_events').delete().eq('id', e.id))
        renderKlasseAdminInnhold()
      }}, '🗑️'))
      innhold.appendChild(row)
    }
    innhold.appendChild(el('button', { class: 'btn btn-s', onclick: () => visNyMDEModal(aktivKlasse.id, renderKlasseAdminInnhold) }, '+ Nytt arrangement'))

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
        divRow.appendChild(el('button', { class: 'btn btn-ikon', onclick: async () => {
          await medLagreOverlay(() => sb.from('subject_divisions').update({ name: nameInput.value }).eq('id', d.id))
          showToast('Lagret', 'success')
        }}, '💾'))
        divRow.appendChild(el('button', { class: 'btn btn-ikon btn-f', onclick: async () => {
          if (!confirm('Slette?')) return
          await medLagreOverlay(() => sb.from('subject_divisions').delete().eq('id', d.id))
          renderKlasseAdminInnhold()
        }}, '🗑️'))
        divList.appendChild(divRow)
      }
      if ((divs || []).length < 8) {
        divList.appendChild(el('button', { class: 'btn btn-sm', onclick: async () => {
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
    innhold.appendChild(el('button', { class: 'btn btn-s', onclick: () => lastNedSikkerhetskopi(aktivKlasse) }, '⬇️ Last ned sikkerhetskopi'))
    const uploadInput = el('input', { type: 'file', accept: '.json', onchange: (e) => {
      if (e.target.files[0]) lastOppSikkerhetskopi(e.target.files[0], aktivKlasse)
    }})
    innhold.appendChild(el('label', { class: 'btn btn-s' }, '⬆️ Last opp sikkerhetskopi', uploadInput))
  }

  await renderKlasseAdminInnhold()
}

async function visNyMDEModal(classId, onSave) {
  const modal = el('div', { class: 'modal' })
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
  const modal = el('div', { class: 'modal' })
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

  const modal = el('div', { class: 'modal' })
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
        await sb.from('sessions').insert({ ...rest, class_id: klasse.id, version: 1 })
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

  const tabs = ['Skoleinfo', 'Fag', 'Klasser', 'Brukere', 'Skolerute', 'Fakta']
  let activeTab = 0

  const tabBar = el('div', { class: 'fane-bar' })
  const tabContent = el('div', { class: 'fane-innhold' })

  function setTab(idx) {
    activeTab = idx
    tabBar.querySelectorAll('.fane').forEach((b, i) => b.classList.toggle('aktiv', i === idx))
    clearEl(tabContent)
    switch (idx) {
      case 0: renderSkoleInfoTab(tabContent); break
      case 1: renderFagTab(tabContent); break
      case 2: renderKlasserTab(tabContent); break
      case 3: renderBrukereTab(tabContent); break
      case 4: renderSkolerute(tabContent); break
      case 5: renderFaktaTab(tabContent); break
    }
  }

  tabs.forEach((t, i) => {
    const btn = el('button', { class: 'fane', onclick: () => setTab(i) }, t)
    tabBar.appendChild(btn)
  })

  main.appendChild(tabBar)
  main.appendChild(tabContent)
  setTab(0)
}

async function renderSkoleInfoTab(container) {
  const school = APP.school

  const form = el('form', { class: 'skjema', onsubmit: async (e) => {
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
      const { error } = await sb.from('schools').update(updates).eq('id', school.id)
      if (error) throw error
      Object.assign(APP.school, updates)
      document.documentElement.dataset.theme = updates.color_theme
      oppdaterHeader()
    })
  }})

  form.appendChild(lagFormRad('Skolenavn', el('input', { name: 'name', type: 'text', class: 'felt input', value: school.name })))
  form.appendChild(lagFormRad('Skoleårsstart (uke)',
    el('input', { name: 'start_week', type: 'number', class: 'felt input', value: school.school_year_start_week, min: 1, max: 53 })))
  form.appendChild(lagFormRad('Skoleårslutt (uke)',
    el('input', { name: 'end_week', type: 'number', class: 'felt input', value: school.school_year_end_week, min: 1, max: 53 })))

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
    if (school.color_theme === t.value) radio.setAttribute('checked', 'true')
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

  form.appendChild(el('button', { type: 'submit', class: 'btn btn-p' }, 'Lagre skoleinfo'))
  container.appendChild(form)
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
      row.appendChild(el('button', { class: 'btn btn-ikon', onclick: () => visRedigerFagModal(s, refresh) }, '✏️'))
      row.appendChild(el('button', { class: 'btn btn-ikon btn-f', onclick: async () => {
        if (!confirm(`Slette faget "${s.name}"? Dette vil påvirke alle eksisterende økter.`)) return
        await medLagreOverlay(() => sb.from('subjects').update({ deleted_at: new Date().toISOString() }).eq('id', s.id))
        refresh()
      }}, '🗑️'))
      container.appendChild(row)
    }
    container.appendChild(el('button', { class: 'btn btn-p', onclick: () => visRedigerFagModal(null, refresh) }, '+ Nytt fag'))
  }
  await refresh()
}

async function visRedigerFagModal(subj, onSave) {
  const modal = el('div', { class: 'modal' })
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
        const { error } = await sb.from('subjects').insert(data)
        if (error) throw error
      }
    })
    modal.remove()
    if (onSave) onSave()
  }})

  form.appendChild(lagFormRad('Navn', el('input', { name: 'name', type: 'text', class: 'felt input', value: subj?.name || '', required: 'true' })))
  form.appendChild(lagFormRad('Kortkode', el('input', { name: 'short_code', type: 'text', class: 'felt input', value: subj?.short_code || '' })))
  form.appendChild(lagFormRad('Farge', el('input', { name: 'color_hex', type: 'color', class: 'felt input', value: subj?.color_hex || '#4a90d9' })))

  const dtSel = el('select', { name: 'division_type', class: 'felt select' })
  dtSel.appendChild(el('option', { value: 'ingen' }, 'Ingen inndeling'))
  dtSel.appendChild(el('option', { value: 'parti' }, 'Parti'))
  dtSel.appendChild(el('option', { value: 'gruppe' }, 'Gruppe'))
  if (subj?.has_parti) dtSel.value = 'parti'
  else if (subj?.has_gruppe) dtSel.value = 'gruppe'
  form.appendChild(lagFormRad('Inndeling', dtSel))

  form.appendChild(lagFormRad('Maks inndelinger', el('input', { name: 'max_divisions', type: 'number', class: 'felt input', value: subj?.max_divisions || 8, min: 1, max: 8 })))

  form.appendChild(el('button', { type: 'submit', class: 'btn btn-p' }, 'Lagre'))
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
      row.appendChild(el('button', { class: 'btn btn-ikon', onclick: () => {
        const nyttNavn = prompt('Nytt navn:', k.name)
        if (!nyttNavn) return
        medLagreOverlay(() => sb.from('classes').update({ name: nyttNavn }).eq('id', k.id)).then(refresh)
      }}, '✏️'))
      row.appendChild(el('button', { class: 'btn btn-ikon btn-f', onclick: async () => {
        if (!confirm(`Slette klassen "${k.name}"? Dette er alvorlig og kan ikke angres!`)) return
        if (!confirm('Er du helt sikker? Alle tilknyttede data vil bli slettet.')) return
        await medLagreOverlay(() => sb.from('classes').update({ deleted_at: new Date().toISOString() }).eq('id', k.id))
        refresh()
      }}, '🗑️'))
      row.appendChild(el('button', { class: 'btn btn-sm', onclick: () => visMergeKlasseModal(k, klasser, refresh) }, 'Slå sammen'))
      container.appendChild(row)
    }

    container.appendChild(el('button', { class: 'btn btn-p', onclick: async () => {
      const navn = prompt('Klassenavn:')
      if (!navn) return
      await medLagreOverlay(() => sb.from('classes').insert({ name: navn, school_id: APP.school.id }))
      refresh()
    }}, '+ Ny klasse'))
  }
  await refresh()
}

async function visMergeKlasseModal(klasse, alleKlasser, onSave) {
  const modal = el('div', { class: 'modal' })
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
      row.appendChild(el('span', { class: 'tekst' }, `${u.full_name} (${u.id}) – ${u.role}`))
      if (klList) row.appendChild(el('span', { class: 'tekst-svak' }, klList))
      row.appendChild(el('button', { class: 'btn btn-ikon', onclick: () => visRedigerBrukerModal(u, klasser, refresh) }, '✏️'))
      row.appendChild(el('button', { class: 'btn btn-ikon btn-f', onclick: () => visSlettBrukerModal(u, refresh) }, '🗑️'))
      container.appendChild(row)
    }

    container.appendChild(el('button', { class: 'btn btn-p', onclick: () => visNyBrukerModal(klasser, refresh) }, '+ Ny bruker'))

    // Info box
    const info = el('div', { class: 'info-box' })
    info.appendChild(el('strong', {}, 'Merk: '))
    info.appendChild(document.createTextNode('Oppretting av Auth-bruker må gjøres via Supabase Dashboard eller en Edge Function med service_role-nøkkel. Fyll inn brukerinfo her etter at Auth-brukeren er opprettet.'))
    container.appendChild(info)
  }
  await refresh()
}

async function visNyBrukerModal(klasser, onSave) {
  const modal = el('div', { class: 'modal' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, 'Ny bruker'))
  box.appendChild(el('div', { class: 'info-box' }, 'Auth-bruker må opprettes manuelt i Supabase Dashboard først. Fyll inn auth user ID nedenfor.'))

  const form = el('form', { class: 'skjema', onsubmit: async (e) => {
    e.preventDefault()
    const fd = new FormData(form)
    const klassIds = [...form.querySelectorAll('[name=class_id]:checked')].map(c => c.value)
    await medLagreOverlay(async () => {
      const { data: newUser, error } = await sb.from('users').insert({
        id: fd.get('auth_id'),
        full_name: fd.get('full_name'),
        role: fd.get('role'),
        school_id: APP.school.id,
      }).select().single()
      if (error) throw error
      for (const kid of klassIds) {
        await sb.from('user_classes').insert({ user_id: newUser.id, class_id: kid })
      }
    })
    modal.remove()
    if (onSave) onSave()
  }})

  form.appendChild(lagFormRad('Auth UUID', el('input', { name: 'auth_id', type: 'text', class: 'felt input', placeholder: 'UUID fra Supabase Auth', required: 'true' })))
  form.appendChild(lagFormRad('Navn', el('input', { name: 'full_name', type: 'text', class: 'felt input', required: 'true' })))

  const roleSel = el('select', { name: 'role', class: 'felt select' })
  for (const r of ['elev', 'laerer', 'kontaktlaerer', 'admin']) {
    roleSel.appendChild(el('option', { value: r }, r))
  }
  form.appendChild(lagFormRad('Rolle', roleSel))

  const klDiv = el('div', { class: 'class-checkboxes' })
  for (const k of klasser || []) {
    const cb = el('input', { type: 'checkbox', name: 'class_id', value: k.id, id: `nk-${k.id}` })
    klDiv.appendChild(cb)
    klDiv.appendChild(el('label', { for: `nk-${k.id}` }, k.name))
  }
  form.appendChild(lagFormRad('Klasser', klDiv))

  form.appendChild(el('button', { type: 'submit', class: 'btn btn-p' }, 'Lagre'))
  form.appendChild(el('button', { type: 'button', class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))
  box.appendChild(form)
  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function visRedigerBrukerModal(user, klasser, onSave) {
  const modal = el('div', { class: 'modal' })
  const box = el('div', { class: 'modal' })
  box.appendChild(el('h3', {}, 'Rediger bruker'))

  const { data: tilknyttede } = await sb.from('user_classes').select('class_id').eq('user_id', user.id)
  const tilknyttedeIds = new Set((tilknyttede || []).map(r => r.class_id))

  const form = el('form', { class: 'skjema', onsubmit: async (e) => {
    e.preventDefault()
    const fd = new FormData(form)
    const newKlassIds = [...form.querySelectorAll('[name=class_id]:checked')].map(c => c.value)
    await medLagreOverlay(async () => {
      await sb.from('users').update({
        full_name: fd.get('full_name'),
        role: fd.get('role'),
      }).eq('id', user.id)
      // Update classes
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

  const roleSel = el('select', { name: 'role', class: 'felt select' })
  for (const r of ['elev', 'laerer', 'kontaktlaerer', 'admin']) {
    const opt = el('option', { value: r }, r)
    if (r === user.role) opt.setAttribute('selected', 'true')
    roleSel.appendChild(opt)
  }
  form.appendChild(lagFormRad('Rolle', roleSel))

  const klDiv = el('div', { class: 'class-checkboxes' })
  for (const k of klasser || []) {
    const cb = el('input', { type: 'checkbox', name: 'class_id', value: k.id, id: `rk-${k.id}` })
    if (tilknyttedeIds.has(k.id)) cb.setAttribute('checked', 'true')
    klDiv.appendChild(cb)
    klDiv.appendChild(el('label', { for: `rk-${k.id}` }, k.name))
  }
  form.appendChild(lagFormRad('Klasser', klDiv))

  form.appendChild(el('button', { type: 'submit', class: 'btn btn-p' }, 'Lagre'))
  form.appendChild(el('button', { type: 'button', class: 'btn btn-s', onclick: () => modal.remove() }, 'Avbryt'))
  box.appendChild(form)
  modal.appendChild(box)
  document.body.appendChild(modal)
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove() })
}

async function visSlettBrukerModal(user, onSave) {
  const modal = el('div', { class: 'modal' })
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

    box.appendChild(el('button', { class: 'btn btn-f', onclick: async () => {
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
    box.appendChild(el('button', { class: 'btn btn-f', onclick: async () => {
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
    const { data: events } = await sb.from('school_calendar').select('*').order('start_date')
    container.appendChild(el('h3', {}, 'Skolerute'))

    const table = el('table', { class: 'admin-table' })
    const thead = el('thead')
    thead.appendChild(el('tr', {},
      el('th', {}, 'Tittel'), el('th', {}, 'Fra'), el('th', {}, 'Til'), el('th', {}, 'Type'), el('th', {})
    ))
    table.appendChild(thead)
    const tbody = el('tbody')
    for (const e of events || []) {
      const tr = el('tr', {},
        el('td', {}, e.title),
        el('td', {}, formatDatoNO(e.start_date)),
        el('td', {}, formatDatoNO(e.end_date)),
        el('td', {}, e.type || ''),
        el('td', {},
          el('button', { class: 'btn btn-ikon btn-f', onclick: async () => {
            await medLagreOverlay(() => sb.from('school_calendar').delete().eq('id', e.id))
            refresh()
          }}, '🗑️')
        )
      )
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)
    container.appendChild(table)

    // Add form
    container.appendChild(el('h4', {}, 'Legg til'))
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
      refresh()
    }})
    form.appendChild(lagFormRad('Tittel', el('input', { name: 'title', type: 'text', class: 'felt input', required: 'true' })))
    form.appendChild(lagFormRad('Fra', el('input', { name: 'start_date', type: 'date', class: 'felt input', required: 'true' })))
    form.appendChild(lagFormRad('Til', el('input', { name: 'end_date', type: 'date', class: 'felt input', required: 'true' })))
    const typeSel = el('select', { name: 'type', class: 'felt select' })
    for (const t of ['ferie', 'helligdag', 'planleggingsdag', 'annet']) {
      typeSel.appendChild(el('option', { value: t }, t))
    }
    form.appendChild(lagFormRad('Type', typeSel))
    form.appendChild(el('button', { type: 'submit', class: 'btn btn-p' }, 'Legg til'))
    container.appendChild(form)

    // AI import
    container.appendChild(el('h4', {}, 'AI-import'))
    const aiText = el('textarea', { class: 'felt textarea', placeholder: 'Lim inn skolerute som tekst…' })
    container.appendChild(aiText)
    container.appendChild(el('button', { class: 'btn btn-s', onclick: async () => {
      if (!aiText.value.trim()) return
      try {
        const { data, error } = await sb.functions.invoke('ai-parse-skolerute', {
          body: { text: aiText.value, school_id: APP.school.id }
        })
        if (error) throw error
        const events = data.events || []
        if (!events.length) { showToast('Ingen hendelser funnet', 'info'); return }
        if (!confirm(`Importere ${events.length} hendelse(r)?`)) return
        await medLagreOverlay(async () => {
          for (const e of events) {
            await sb.from('school_calendar').insert({ ...e, school_id: APP.school.id })
          }
        })
        refresh()
      } catch (err) {
        showToast(err.message, 'error')
      }
    }}, 'Analyser med AI'))
  }
  await refresh()
}

async function renderFaktaTab(container) {
  async function refresh() {
    clearEl(container)
    const { data: facts } = await sb.from('school_facts').select('*').eq('school_id', APP.school.id)
    APP.facts = facts || []

    container.appendChild(el('h3', {}, 'Skolefakta (vises i lagre-overlay)'))
    for (const f of facts || []) {
      const row = el('div', { class: 'admin-rad' })
      row.appendChild(el('span', { class: 'tekst' }, truncate(f.fact_text, 80)))
      row.appendChild(el('button', { class: 'btn btn-ikon', onclick: () => {
        const ny = prompt('Rediger fakta:', f.fact_text)
        if (!ny) return
        medLagreOverlay(() => sb.from('school_facts').update({ fact_text: ny }).eq('id', f.id)).then(refresh)
      }}, '✏️'))
      row.appendChild(el('button', { class: 'btn btn-ikon btn-f', onclick: async () => {
        await medLagreOverlay(() => sb.from('school_facts').delete().eq('id', f.id))
        refresh()
      }}, '🗑️'))
      container.appendChild(row)
    }

    const addInput = el('input', { type: 'text', class: 'felt input', placeholder: 'Nytt fakta…' })
    container.appendChild(el('div', { class: 'admin-rad' },
      addInput,
      el('button', { class: 'btn btn-p', onclick: async () => {
        if (!addInput.value.trim()) return
        await medLagreOverlay(() => sb.from('school_facts').insert({
          school_id: APP.school.id, fact_text: addInput.value.trim()
        }))
        refresh()
      }}, '+ Legg til')
    ))
  }
  await refresh()
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
  // Load school config
  const { data: schools } = await sb.from('schools').select('*').limit(1)
  if (schools && schools.length) {
    APP.school = schools[0]
    document.documentElement.dataset.theme = APP.school.color_theme || 'standard'
    if (APP.school.logo_url) {
      const logo = document.getElementById('hdr-logo')
      if (logo) logo.src = APP.school.logo_url
    }
  }

  // Load school facts for overlay
  if (APP.school) {
    const { data: facts } = await sb.from('school_facts').select('*').eq('school_id', APP.school.id)
    APP.facts = facts || []
  }

  // Restore session
  const { data: { session } } = await sb.auth.getSession()
  if (session) {
    APP.user = session.user
    try {
      APP.profile = await fetchProfile(session.user.id)
      APP.isAdminActive = APP.profile.is_admin_active || false
    } catch (err) {
      console.warn('Kunne ikke hente brukerprofil:', err.message)
    }
  }

  oppdaterHeader()

  // Listen for auth changes
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      APP.user = null
      APP.profile = null
      APP.isAdminActive = false
      oppdaterHeader()
    } else if (event === 'SIGNED_IN' && session) {
      APP.user = session.user
      if (!APP.profile) {
        try { APP.profile = await fetchProfile(session.user.id) } catch {}
      }
      APP.isAdminActive = APP.profile?.is_admin_active || false
      oppdaterHeader()
    }
  })

  // Route
  window.addEventListener('hashchange', router)
  await router()
}

document.addEventListener('DOMContentLoaded', init)
