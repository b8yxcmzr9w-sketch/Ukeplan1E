const SS_ID = '1NsvE8iI1cT4_K7oMKUNAsHaZiArbSg-OAzRPUJ9FD9I';

// ── Routing ───────────────────────────────────────────────────────────────────

function doGet(e) {
  const p = e.parameter;
  if (p.action === 'ical') {
    return ContentService.createTextOutput(buildIcal(p.klasse || '', p.nptParti || '', p.yffGruppe || ''))
      .setMimeType(ContentService.MimeType.TEXT);
  }
  if (p.action === 'hentSitater') {
    return jsonResponse(hentSitater(SpreadsheetApp.openById(SS_ID)));
  }
  const ar = parseInt(p.ar || new Date().getFullYear());
  const klasse = p.klasse || '';
  const sheet = getSheet('Plan');
  if (!sheet) return jsonResponse({ ok: false, error: 'Plan-fane mangler' });
  const vals = sheet.getDataRange().getValues();
  const ferieSheet = getSheet('Skolerute');

  // Multi-uke request (for liste-visning)
  if (p.fraUke && p.tilUke) {
    const fraUke = parseInt(p.fraUke);
    const tilUke = parseInt(p.tilUke);
    const rows = vals.length < 2 ? [] : vals.slice(1)
      .filter(r => r[0] && parseInt(r[1]) === ar && parseInt(r[2]) >= fraUke && parseInt(r[2]) <= tilUke && (!klasse || r[4] === klasse || r[4] === 'Alle'))
      .map(rowToObj);
    const ferie = ferieSheet ? getFerierForRange(ferieSheet, fraUke, tilUke, ar) : [];
    return jsonResponse({ ok: true, rows, ferie });
  }

  // Single-uke request
  const uke = parseInt(p.uke);
  const rows = vals.length < 2 ? [] : vals.slice(1)
    .filter(r => r[0] && parseInt(r[2]) === uke && parseInt(r[1]) === ar && (!klasse || r[4] === klasse || r[4] === 'Alle'))
    .map(rowToObj);
  const ferie = ferieSheet ? getFerierForUke(ferieSheet, uke, ar) : [];
  return jsonResponse({ ok: true, rows, ferie });
}

function doPost(e) {
  const d = JSON.parse(e.parameter.data);
  const handlers = {
    login:          handleLogin,
    saveMinProfil:  handleSaveMinProfil,
    save:           handleSave,
    delete:         handleDelete,
    parse:          handleParse,
    parseSkolerute: handleParseSkolerute,
    getData:        handleGetData,
    saveKonfig:     handleSaveKonfig,
    getSkolerute:   handleGetSkolerute,
    saveSkolerute:  handleSaveSkolerute,
    getBrukere:     handleGetBrukere,
    saveBruker:     handleSaveBruker,
    deleteBruker:   handleDeleteBruker,
    changePassord:  handleChangePassord,
    genererSitater: handleGenererSitater,
    getBackup:          handleGetBackup,
    slettAlt:           handleSlettAlt,
    saveKlasseKonfig:   handleSaveKlasseKonfig
  };
  const fn = handlers[d.action];
  if (!fn) return jsonResponse({ ok: false, error: 'Ukjent action: ' + d.action });
  return fn(d);
}

// ── Handlers ──────────────────────────────────────────────────────────────────

function handleLogin(d) {
  const rows = getSheet('Brukere').getDataRange().getValues().slice(1);
  const hash = hashPassword(d.passord);
  const user = rows.find(r => r[0] === d.navn && r[1] === hash);
  if (!user) return jsonResponse({ ok: false, error: 'Feil brukernavn eller passord' });
  const erAdmin = String(user[2]).toUpperCase() === 'TRUE';
  const rolle = user[5] ? String(user[5]) : (erAdmin ? 'skoleadmin' : 'laerer');
  return jsonResponse({
    ok: true,
    navn: user[0],
    erAdmin,
    klasser: user[3] || 'Alle',
    maByttePassord: !!(user[4] && String(user[4]).toUpperCase() === 'TRUE'),
    rolle,
    fag: String(user[6] || 'Alle'),
    yffGruppe: String(user[7] || ''),
    token: makeToken(d.navn, user[1])
  });
}

function handleSave(d) {
  if (!verifyToken(d.token)) return jsonResponse({ ok: false, error: 'Ikke autorisert' });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet('Plan');
    SpreadsheetApp.flush();
    const now = new Date().toISOString();
    if (d.id) {
      const vals = sheet.getDataRange().getValues();
      for (let i = 1; i < vals.length; i++) {
        if (String(vals[i][0]) === String(d.id)) {
          sheet.getRange(i + 1, 1, 1, 14).setValues([[
            d.id, d.ar, d.uke, d.dag, d.klasse, d.fag, d.gruppe,
            d.laerer, d.aktivitet, d.oppmotested, d.info, d.tid || '', now, d.lagretAv || ''
          ]]);
          SpreadsheetApp.flush();
          return jsonResponse({ ok: true });
        }
      }
    }
    const id = String(Date.now());
    sheet.appendRow([id, d.ar, d.uke, d.dag, d.klasse, d.fag, d.gruppe,
      d.laerer, d.aktivitet, d.oppmotested, d.info, d.tid || '', now, d.lagretAv || '']);
    SpreadsheetApp.flush();
    return jsonResponse({ ok: true, id });
  } finally {
    lock.releaseLock();
  }
}

function handleDelete(d) {
  if (!verifyToken(d.token)) return jsonResponse({ ok: false, error: 'Ikke autorisert' });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet('Plan');
    SpreadsheetApp.flush();
    const vals = sheet.getDataRange().getValues();
    for (let i = 1; i < vals.length; i++) {
      if (String(vals[i][0]) === String(d.id)) {
        sheet.deleteRow(i + 1);
        SpreadsheetApp.flush();
        return jsonResponse({ ok: true });
      }
    }
    return jsonResponse({ ok: false, error: 'Rad ikke funnet' });
  } finally {
    lock.releaseLock();
  }
}

function handleParse(d) {
  if (!verifyToken(d.token)) return jsonResponse({ ok: false, error: 'Ikke autorisert' });
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_KEY');
  if (!key) return jsonResponse({ ok: false, error: 'GEMINI_KEY mangler i Script Properties' });
  const konfig = getKonfigObj();
  const fagKonfig = (konfig.fag || []).find(f => f.nokkel === d.fag);
  const defaultDag = fagKonfig ? fagKonfig.verdi : '';
  try {
    const rader = callGemini(key, buildParsePrompt(d.tekst, d.fag, d.klasse, d.gruppe, defaultDag));
    return jsonResponse({ ok: true, rader });
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Gemini-feil: ' + err.message });
  }
}

function handleParseSkolerute(d) {
  if (!verifyToken(d.token) || !d.isAdmin) return jsonResponse({ ok: false, error: 'Kun admin' });
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_KEY');
  if (!key) return jsonResponse({ ok: false, error: 'GEMINI_KEY mangler i Script Properties' });
  try {
    const rader = callGemini(key, buildSkolerutePrompt(d.tekst));
    return jsonResponse({ ok: true, rader });
  } catch (err) {
    return jsonResponse({ ok: false, error: 'Gemini-feil: ' + err.message });
  }
}

function handleGetData(d) {
  const konfig = getKonfigObj();
  const skoleinfo = {};
  (konfig.skole || []).forEach(k => { skoleinfo[k.nokkel] = k.verdi; });
  const klasser = (konfig.klasse || []).map(k => k.nokkel);

  // Build class-specific config
  const klasseKonfig = {};
  klasser.forEach(k => {
    klasseKonfig[k] = {
      fag: (konfig[`fag_${k}`] || []).map(f => ({ navn: f.nokkel, dag: f.verdi })),
      npt: (konfig[`npt_${k}`] || []).map(g => g.nokkel)
    };
  });

  return jsonResponse({
    ok: true,
    skoleinfo,
    fag:        (konfig.fag        || []).map(f => ({ navn: f.nokkel, dag: f.verdi })),
    grupperYFF: (konfig.gruppe_yff || []).map(g => g.nokkel),
    grupperNPT: (konfig.gruppe_npt || []).map(g => g.nokkel),
    klasser,
    klasseKonfig
  });
}

function handleSaveKonfig(d) {
  const caller = getUserByToken(d.token);
  if (!caller || caller.rolle !== 'skoleadmin') return jsonResponse({ ok: false, error: 'Kun skoleadmin' });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet('Konfig');
    SpreadsheetApp.flush();
    const last = sheet.getLastRow();
    if (last > 1) sheet.getRange(2, 1, last - 1, 3).clearContent();
    d.rader.forEach(r => sheet.appendRow([r.type, r.nokkel, r.verdi || '']));
    SpreadsheetApp.flush();
    return jsonResponse({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function handleGetSkolerute(d) {
  if (!verifyToken(d.token)) return jsonResponse({ ok: false, error: 'Ikke autorisert' });
  const sheet = getSheet('Skolerute');
  if (!sheet) return jsonResponse({ ok: true, rader: [] });
  const rader = sheet.getDataRange().getValues().slice(1)
    .filter(r => r[0] || r[2])
    .map(r => ({
      fraDato: r[0] instanceof Date ? Utilities.formatDate(r[0], 'Europe/Oslo', 'yyyy-MM-dd') : (r[0] ? String(r[0]) : ''),
      tilDato: r[1] instanceof Date ? Utilities.formatDate(r[1], 'Europe/Oslo', 'yyyy-MM-dd') : (r[1] ? String(r[1]) : ''),
      navn:    r[2] instanceof Date ? Utilities.formatDate(r[2], 'Europe/Oslo', 'dd.MM.yyyy') : String(r[2] || ''),
      type:    String(r[3] || 'Ferie')
    }));
  return jsonResponse({ ok: true, rader });
}

function handleSaveSkolerute(d) {
  const caller = getUserByToken(d.token);
  if (!caller || caller.rolle !== 'skoleadmin') return jsonResponse({ ok: false, error: 'Kun skoleadmin' });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet('Skolerute');
    SpreadsheetApp.flush();
    const last = sheet.getLastRow();
    if (last > 1) sheet.deleteRows(2, last - 1);
    if (d.rader.length > 0) {
      const data = d.rader.map(r => [r.fraDato || '', r.tilDato || '', String(r.navn || ''), String(r.type || 'Ferie')]);
      sheet.getRange(2, 1, data.length, 4).setValues(data);
      sheet.getRange(2, 3, data.length, 1).setNumberFormat('@');
    }
    SpreadsheetApp.flush();
    return jsonResponse({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function handleGetBrukere(d) {
  if (!verifyToken(d.token)) return jsonResponse({ ok: false, error: 'Ikke autorisert' });
  const rows = getSheet('Brukere').getDataRange().getValues().slice(1);
  return jsonResponse({
    ok: true,
    brukere: rows.map(r => {
      const erAdmin = String(r[2]).toUpperCase() === 'TRUE';
      const rolle = r[5] ? String(r[5]) : (erAdmin ? 'skoleadmin' : 'laerer');
      return { navn: r[0], erAdmin, klasser: r[3] || 'Alle', rolle, fag: String(r[6] || 'Alle') };
    })
  });
}

function handleSaveBruker(d) {
  const caller = getUserByToken(d.token);
  if (!caller || caller.rolle !== 'skoleadmin')
    return jsonResponse({ ok: false, error: 'Kun skoleadmin kan endre brukere' });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet('Brukere');
    SpreadsheetApp.flush();
    const rows = sheet.getDataRange().getValues();
    const sokNavn = d.bruker.origNavn || d.bruker.navn;
    const maByttePassord = d.bruker.maByttePassord === true;
    const rolle = d.bruker.rolle || 'laerer';
    const erAdmin = rolle === 'skoleadmin' || d.bruker.erAdmin === true;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === sokNavn) {
        const hash = d.bruker.passord ? hashPassword(d.bruker.passord) : rows[i][1];
        const beholdFlag = d.bruker.maByttePassord === undefined ? rows[i][4] : maByttePassord;
        sheet.getRange(i + 1, 1, 1, 7).setValues([[
          d.bruker.navn, hash, erAdmin, d.bruker.klasser, beholdFlag || '', rolle, d.bruker.fag || 'Alle'
        ]]);
        SpreadsheetApp.flush();
        return jsonResponse({ ok: true });
      }
    }
    if (!d.bruker.passord) return jsonResponse({ ok: false, error: 'Passord påkrevd for ny bruker' });
    sheet.appendRow([d.bruker.navn, hashPassword(d.bruker.passord), erAdmin, d.bruker.klasser, maByttePassord, rolle, d.bruker.fag || 'Alle']);
    SpreadsheetApp.flush();
    return jsonResponse({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function handleDeleteBruker(d) {
  const caller = getUserByToken(d.token);
  if (!caller || caller.rolle !== 'skoleadmin')
    return jsonResponse({ ok: false, error: 'Kun skoleadmin kan slette brukere' });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet('Brukere');
    SpreadsheetApp.flush();
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === d.navn) {
        sheet.deleteRow(i + 1);
        SpreadsheetApp.flush();
        return jsonResponse({ ok: true });
      }
    }
    return jsonResponse({ ok: false, error: 'Bruker ikke funnet' });
  } finally {
    lock.releaseLock();
  }
}

function handleGetBackup(d) {
  const caller = getUserByToken(d.token);
  if (!caller || caller.rolle !== 'skoleadmin')
    return jsonResponse({ ok: false, error: 'Kun skoleadmin' });
  const plan      = getSheet('Plan');
  const skolerute = getSheet('Skolerute');
  const planData      = plan      ? plan.getDataRange().getValues()      : [];
  const skoleruteData = skolerute ? skolerute.getDataRange().getValues() : [];
  return jsonResponse({ ok: true, plan: planData, skolerute: skoleruteData, eksportert: new Date().toISOString() });
}

function handleSlettAlt(d) {
  const caller = getUserByToken(d.token);
  if (!caller || caller.rolle !== 'skoleadmin')
    return jsonResponse({ ok: false, error: 'Kun skoleadmin' });
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    if (d.slettPlan) {
      const plan = getSheet('Plan');
      if (plan && plan.getLastRow() > 1) plan.deleteRows(2, plan.getLastRow() - 1);
    }
    if (d.slettSkolerute) {
      const sr = getSheet('Skolerute');
      if (sr && sr.getLastRow() > 1) sr.deleteRows(2, sr.getLastRow() - 1);
    }
    SpreadsheetApp.flush();
    return jsonResponse({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function handleSaveKlasseKonfig(d) {
  const caller = getUserByToken(d.token);
  if (!caller || (caller.rolle !== 'skoleadmin' && caller.rolle !== 'kontaktlaerer'))
    return jsonResponse({ ok: false, error: 'Kun kontaktlærer eller skoleadmin' });
  const klasse = d.klasse;
  if (!klasse) return jsonResponse({ ok: false, error: 'Klasse mangler' });
  if (caller.rolle === 'kontaktlaerer') {
    const tillatte = caller.klasser === 'Alle' ? null : caller.klasser.split(',').map(k => k.trim());
    if (tillatte && !tillatte.includes(klasse))
      return jsonResponse({ ok: false, error: 'Ikke tilgang til denne klassen' });
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet('Konfig');
    SpreadsheetApp.flush();
    const vals = sheet.getDataRange().getValues();
    const slett = [`fag_${klasse}`, `npt_${klasse}`];
    for (let i = vals.length - 1; i >= 1; i--) {
      if (slett.includes(String(vals[i][0]))) sheet.deleteRow(i + 1);
    }
    SpreadsheetApp.flush();
    d.rader.forEach(r => sheet.appendRow([r.type, r.nokkel, r.verdi || '']));
    SpreadsheetApp.flush();
    return jsonResponse({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function handleSaveMinProfil(d) {
  const caller = getUserByToken(d.token);
  if (!caller) return jsonResponse({ ok: false, error: 'Ikke autorisert' });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet('Brukere');
    SpreadsheetApp.flush();
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === caller.navn) {
        sheet.getRange(i + 1, 4).setValue(d.klasser || 'Alle');
        sheet.getRange(i + 1, 7).setValue(d.fag || 'Alle');
        sheet.getRange(i + 1, 8).setValue(d.yffGruppe || '');
        SpreadsheetApp.flush();
        return jsonResponse({ ok: true });
      }
    }
    return jsonResponse({ ok: false, error: 'Bruker ikke funnet' });
  } finally {
    lock.releaseLock();
  }
}

function handleChangePassord(d) {
  if (!verifyToken(d.token)) return jsonResponse({ ok: false, error: 'Ikke autorisert' });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const navn = d.token.split(':')[0];
    const sheet = getSheet('Brukere');
    SpreadsheetApp.flush();
    const rows = sheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === navn) {
        if (rows[i][1] !== hashPassword(d.gammeltPassord))
          return jsonResponse({ ok: false, error: 'Feil nåværende passord' });
        sheet.getRange(i + 1, 2).setValue(hashPassword(d.nyttPassord));
        sheet.getRange(i + 1, 5).setValue(''); // fjern maByttePassord-flagg
        SpreadsheetApp.flush();
        return jsonResponse({ ok: true });
      }
    }
    return jsonResponse({ ok: false, error: 'Bruker ikke funnet' });
  } finally {
    lock.releaseLock();
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

function hashPassword(p) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, p);
  return bytes.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function makeToken(navn, passordHash) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, navn + passordHash);
  return navn + ':' + bytes.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function getUserByToken(token) {
  if (!token) return null;
  const idx = token.indexOf(':');
  if (idx < 1) return null;
  const navn = token.slice(0, idx);
  const sheet = getSheet('Brukere');
  if (!sheet) return null;
  const rows = sheet.getDataRange().getValues().slice(1);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === navn && token === makeToken(navn, rows[i][1])) {
      const erAdmin = String(rows[i][2]).toUpperCase() === 'TRUE';
      const rolle = rows[i][5] ? String(rows[i][5]) : (erAdmin ? 'skoleadmin' : 'laerer');
      return { navn: rows[i][0], erAdmin, klasser: rows[i][3] || 'Alle', rolle, fag: String(rows[i][6] || 'Alle'), yffGruppe: String(rows[i][7] || '') };
    }
  }
  return null;
}

function verifyToken(token) {
  return !!getUserByToken(token);
}

// ── AI-prompter ───────────────────────────────────────────────────────────────

function buildParsePrompt(tekst, fag, klasse, gruppe, defaultDag) {
  return `Du tolker ukeplaner fra norske naturbruksskoler.
Faget er "${fag}", klassen er "${klasse}"${gruppe ? ', gruppen er "' + gruppe + '"' : ''}.

Les teksten og returner et JSON-array. Én rad per økt med disse feltene:
- uke (tall, påkrevd)
- dag (norsk ukedag. ${defaultDag ? 'Faget har faste dager: ' + defaultDag + '. Bruk den som passer best med konteksten.' : 'Utled fra teksten.'} Aldri tom)
- gruppe ("P1"–"P6" for NPT, gruppenavn for YFF, eller "Alle". Bruk "${gruppe || 'Alle'}" hvis bare én gruppe)
- laerer (fornavn. Bruk "?" hvis ikke nevnt)
- aktivitet (hva de skal gjøre, kort og konkret. Påkrevd)
- oppmotested (oppmøtested, tom streng hvis ikke nevnt)
- info (klesråd, utstyr, forbehold – tom streng hvis ikke nevnt)
- tid (klokkeslett som "08:00", tom streng hvis ikke nevnt)

Regler:
- Ferieuke ("HØSTFERIE" osv.): én rad med aktivitet = ferienavn, dag = "Alle", gruppe = "Alle", resten tomt
- Tomme rader uten aktivitet: utelat
- Returner KUN gyldig JSON-array, ingen annen tekst

Tekst:
${tekst}`;
}

function buildSkolerutePrompt(tekst) {
  return `Du tolker en norsk skolerute. Returner et JSON-array der hvert element er én periode:
- fraDato (ISO-dato "YYYY-MM-DD")
- tilDato (ISO-dato "YYYY-MM-DD")
- navn (f.eks. "Høstferie", "Juleferie", "Planleggingsdag")
- type: bruk én av disse tre:
  • "Høytid" – religiøse eller nasjonale høytidsdager (jul/juleferie, påske/påskeferie, Kristi Himmelfartsdag, pinse/2. pinsedag, 1. mai, 17. mai)
  • "Ferie" – ordinære skoleferier uten religiøs/nasjonal betydning (høstferie, vinterferie, sommerferie, planleggingsdag-fri-dag)
  • "Planleggingsdag" – planleggingsdager der skolen er stengt for elever

VIKTIG: Bruk KUN datoer som eksplisitt er nevnt i teksten. Ikke legg til høytider, fridager eller merkedager som ikke er nevnt — selv om du vet at de finnes.

Spesialregler:
- "Første skoledag" dato X (i august): lag én rad fraDato = tilDato = dagen FØR X, navn = "Sommerferie slutter", type = "Ferie"
- "Siste skoledag" dato Y (i juni): lag én rad: fraDato = dagen ETTER Y, tilDato = dagen før neste "Første skoledag" i august (hvis nevnt i teksten, ellers sett tilDato = siste dag i juli samme år), navn = "Sommerferie", type = "Ferie"
- Returner KUN gyldig JSON-array

Tekst:
${tekst}`;
}

// ── Sitater ───────────────────────────────────────────────────────────────────

function hentSitater(ss) {
  const sheet = ss.getSheetByName('Sitater');
  if (!sheet) return { ok: true, sitater: [] };
  return {
    ok: true,
    sitater: sheet.getDataRange().getValues().slice(1)
      .filter(r => r[0])
      .map(r => ({ sitat: String(r[0]), kilde: String(r[1] || 'Ukjent') }))
  };
}

function handleGenererSitater(d) {
  if (!verifyToken(d.token)) return jsonResponse({ ok: false, error: 'Ikke autorisert' });
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_KEY');
  if (!key) return jsonResponse({ ok: false, error: 'GEMINI_KEY mangler i Script Properties' });
  try {
    const sitater = callGemini(key, buildSitatPrompt());
    if (!Array.isArray(sitater)) throw new Error('Gemini returnerte ikke en array');
    const ss = SpreadsheetApp.openById(SS_ID);
    let sheet = ss.getSheetByName('Sitater');
    if (!sheet) sheet = ss.insertSheet('Sitater');
    sheet.clearContents();
    sheet.appendRow(['Sitat', 'Kilde']);
    sitater.forEach(s => sheet.appendRow([String(s.sitat || ''), String(s.kilde || 'Ukjent')]));
    return jsonResponse({ ok: true, sitater });
  } catch(err) {
    return jsonResponse({ ok: false, error: 'Gemini-feil: ' + err.message });
  }
}

function buildSitatPrompt() {
  return `Du er en samler av gode sitater til en norsk videregående skole med naturbruksprofil.

Generer nøyaktig 30 sitater fordelt slik:
- 8 om livsglede og optimisme
- 7 om fellesskap og samarbeid
- 6 om natur, dyr og livet på gården
- 5 om dagen i dag / øyeblikket
- 4 morsomme pappavitser eller lette one-liners

Bruk kjente, ekte sitater der det finnes. Oversett til norsk om nødvendig.
Alle sitater skal være anstendige og passe for ungdom 16–19 år.
Pappavitsene skal faktisk være morsomme.

Returner KUN en JSON-array, ingen annen tekst:
[{"sitat": "Teksten her.", "kilde": "Navn eller Ukjent"}]`;
}

// ── Gemini ────────────────────────────────────────────────────────────────────

function callGemini(key, prompt) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + key;
  let lastError = '';
  for (let i = 0; i < 3; i++) {
    if (i > 0) Utilities.sleep(3000);
    const resp = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      muteHttpExceptions: true,
      payload: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const raw = resp.getContentText();
    const result = JSON.parse(raw);
    const code = resp.getResponseCode();
    if (code === 503 || code === 429 || (result.error && (result.error.code === 503 || result.error.code === 429))) {
      lastError = result.error ? result.error.message.slice(0, 120) : 'Overbelastet (' + code + ')';
      continue;
    }
    if (result.error) throw new Error(result.error.message || raw);
    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content)
      throw new Error('Tomt svar fra Gemini: ' + raw.slice(0, 120));
    const text = result.candidates[0].content.parts
      .filter(p => !p.thought && p.text)
      .map(p => p.text)
      .join('\n').trim();
    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    return JSON.parse(clean);
  }
  throw new Error(lastError || 'Gemini svarte ikke etter 3 forsøk');
}

// ── iCal ──────────────────────────────────────────────────────────────────────

function buildIcal(klasse, nptParti, yffGruppe) {
  const sheet = getSheet('Plan');
  if (!sheet) return 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR';
  const vals = sheet.getDataRange().getValues().slice(1);
  const dagOffset = { Mandag: 0, Tirsdag: 1, Onsdag: 2, Torsdag: 3, Fredag: 4 };
  let events = '';
  vals.forEach(r => {
    if (!r[0]) return;
    if (klasse && r[4] !== klasse && r[4] !== 'Alle') return;
    if (r[5] === 'NPT' && nptParti  && r[6] !== nptParti  && r[6] !== 'Alle') return;
    if (r[5] === 'YFF' && yffGruppe && r[6] !== yffGruppe && r[6] !== 'Alle') return;
    if (!r[8]) return;
    const uke = parseInt(r[2]);
    const ar = parseInt(r[1]);
    const offset = dagOffset[r[3]] !== undefined ? dagOffset[r[3]] : 0;
    const jan4 = new Date(ar, 0, 4);
    const monday = new Date(jan4);
    monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (uke - 1) * 7);
    const d = new Date(monday);
    d.setDate(monday.getDate() + offset);
    const ds = d.toISOString().slice(0, 10).replace(/-/g, '');
    const summary = [r[5], r[8]].filter(Boolean).join(': ');
    const desc = [r[7] ? 'Lærer: ' + r[7] : '', r[10]].filter(Boolean).join('\\n');
    events += `BEGIN:VEVENT\nUID:${r[0]}@ukeplan\nDTSTART;VALUE=DATE:${ds}\nDTEND;VALUE=DATE:${ds}\nSUMMARY:${summary}\nLOCATION:${r[9] || ''}\nDESCRIPTION:${desc}\nEND:VEVENT\n`;
  });
  const navn = [klasse, nptParti, yffGruppe].filter(Boolean).join(' – ');
  return `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Ukeplan//NO\nX-WR-CALNAME:Ukeplan ${navn}\nCALSCALE:GREGORIAN\n${events}END:VCALENDAR`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSheet(name) {
  return SpreadsheetApp.openById(SS_ID).getSheetByName(name);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function rowToObj(r) {
  return { id: r[0], ar: r[1], uke: r[2], dag: r[3], klasse: r[4], fag: r[5], gruppe: r[6], laerer: r[7], aktivitet: r[8], oppmotested: r[9], info: r[10], tid: r[11], sistEndret: r[12], lagretAv: r[13] || '' };
}

function getKonfigObj() {
  const sheet = getSheet('Konfig');
  if (!sheet) return {};
  const obj = {};
  sheet.getDataRange().getValues().slice(1).forEach(r => {
    if (!r[0]) return;
    if (!obj[r[0]]) obj[r[0]] = [];
    obj[r[0]].push({ nokkel: r[1], verdi: r[2] });
  });
  return obj;
}

function getFerierForRange(sheet, fraUke, tilUke, ar) {
  const jan4 = new Date(ar, 0, 4);
  const mandag = new Date(jan4);
  mandag.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (fraUke - 1) * 7);
  const sondag = new Date(jan4);
  sondag.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (tilUke - 1) * 7 + 6);
  return sheet.getDataRange().getValues().slice(1)
    .filter(r => r[0] && new Date(r[0]) <= sondag && new Date(r[1]) >= mandag)
    .map(r => ({
      fraDato: r[0] instanceof Date ? Utilities.formatDate(r[0], 'Europe/Oslo', 'yyyy-MM-dd') : String(r[0] || ''),
      tilDato: r[1] instanceof Date ? Utilities.formatDate(r[1], 'Europe/Oslo', 'yyyy-MM-dd') : String(r[1] || ''),
      navn:    String(r[2] || ''),
      type:    String(r[3] || 'Ferie')
    }));
}

function getFerierForUke(sheet, uke, ar) {
  const jan4 = new Date(ar, 0, 4);
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (uke - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sheet.getDataRange().getValues().slice(1)
    .filter(r => r[0] && new Date(r[0]) <= sunday && new Date(r[1] || r[0]) >= monday)
    .map(r => ({
      fraDato: r[0] instanceof Date ? Utilities.formatDate(r[0], 'Europe/Oslo', 'yyyy-MM-dd') : String(r[0] || ''),
      tilDato: (r[1] || r[0]) instanceof Date ? Utilities.formatDate(r[1] || r[0], 'Europe/Oslo', 'yyyy-MM-dd') : String(r[1] || r[0] || ''),
      navn:    String(r[2] || ''),
      type:    String(r[3] || 'Ferie')
    }));
}

// ── Autorisasjon (kjør én gang fra editor for å godkjenne UrlFetchApp) ───────

function godkjennTillatelser() {
  UrlFetchApp.fetch('https://www.google.com');
  Logger.log('UrlFetchApp er nå autorisert');
}

function listModels() {
  const key = PropertiesService.getScriptProperties().getProperty('GEMINI_KEY');
  const resp = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1/models?key=' + key, { muteHttpExceptions: true });
  const data = JSON.parse(resp.getContentText());
  (data.models || []).forEach(m => Logger.log(m.name + ' — ' + (m.supportedGenerationMethods || []).join(', ')));
}

// ── Oppsett (kjør én gang fra editor) ────────────────────────────────────────

function setupSheets() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const faner = [
    { navn: 'Plan',      headers: ['ID','År','Uke','Dag','Klasse','Fag','Gruppe','Lærer','Aktivitet','Oppmøtested','Info','Tid','SistEndret','LagretAv'] },
    { navn: 'Brukere',   headers: ['Navn','PassordHash','ErAdmin','Klasser','MaByttePassord','Rolle','Fag','YffGruppe'] },
    { navn: 'Konfig',    headers: ['Type','Nøkkel','Verdi'] },
    { navn: 'Skolerute', headers: ['FraDato','TilDato','Navn','Type'] }
  ];
  faner.forEach(f => {
    let sheet = ss.getSheetByName(f.navn);
    if (!sheet) sheet = ss.insertSheet(f.navn);
    sheet.getRange(1, 1, 1, f.headers.length).setValues([f.headers]);
    sheet.getRange(1, 1, 1, f.headers.length).setFontWeight('bold');
  });

  // Standard konfig-innhold
  const konfig = ss.getSheetByName('Konfig');
  const startRad = konfig.getLastRow() + 1;
  const standardKonfig = [
    ['fag','NNA','Mandag'],
    ['fag','NPT','Onsdag'],
    ['fag','YFF','Tirsdag'],
    ['fag','Matte',''],
    ['fag','Naturfag',''],
    ['fag','Engelsk',''],
    ['fag','Gym',''],
    ['gruppe_yff','Friluftsliv',''],
    ['gruppe_yff','Produksjonsdyr gartneri og grønnsaker',''],
    ['gruppe_yff','Hest',''],
    ['gruppe_yff','Gardsdrift og landbruksmaskiner',''],
    ['gruppe_yff','Sports- familie- og produksjonsdyr',''],
    ['gruppe_yff','Landbruk',''],
    ['gruppe_yff','Anleggsgartner',''],
    ['gruppe_yff','Hund',''],
    ['gruppe_npt','P1',''],
    ['gruppe_npt','P2',''],
    ['gruppe_npt','P3',''],
    ['gruppe_npt','P4',''],
    ['gruppe_npt','P5',''],
    ['gruppe_npt','P6',''],
    ['skole','skole_navn','Ukeplan'],
    ['skole','skole_adresse',''],
    ['skole','skole_logo','']
  ];
  konfig.getRange(startRad, 1, standardKonfig.length, 3).setValues(standardKonfig);

  Logger.log('Oppsett fullført!');
}
