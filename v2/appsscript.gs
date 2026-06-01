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
    saveKlasseKonfig:   handleSaveKlasseKonfig,
    seedTestData:       handleSeedTestData,
    seedSemesterData:   handleSeedSemesterData,
    migrateToV2:        handleMigrateToV2,
    renameFag:          handleRenameFag
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

// ── Testdata (kjør én gang fra editor for å populere ark med eksempeldata) ───
// OBS: Sletter og erstatter innholdet i Konfig, Brukere og Plan!

function handleRenameFag(d) {
  const bruker = getUserByToken(d.token);
  if (!bruker || bruker.rolle !== 'skoleadmin') return jsonResponse({ ok: false, error: 'Kun skoleadmin' });
  const gammelt = (d.gammelt || '').trim();
  const nytt    = (d.nytt    || '').trim();
  if (!gammelt || !nytt || gammelt === nytt) return jsonResponse({ ok: false, error: 'Ugyldige navn' });

  const ss = SpreadsheetApp.openById(SS_ID);

  // Konfig: oppdater alle rader der nokkel === gammelt og type starter med 'fag'
  const konfig = ss.getSheetByName('Konfig');
  const kRader = konfig.getLastRow() > 1
    ? konfig.getRange(2, 1, konfig.getLastRow() - 1, 3).getValues()
    : [];
  kRader.forEach((r, i) => {
    const type = String(r[0] || '');
    if ((type === 'fag' || type.startsWith('fag_')) && String(r[1]) === gammelt) {
      konfig.getRange(i + 2, 2).setValue(nytt);
    }
  });

  // Brukere: oppdater fag-kolonnen (col 7) – kommaseparert liste
  const brukere = ss.getSheetByName('Brukere');
  const bRader  = brukere.getLastRow() > 1
    ? brukere.getRange(2, 7, brukere.getLastRow() - 1, 1).getValues()
    : [];
  bRader.forEach((r, i) => {
    const fagStr = String(r[0] || '');
    const oppdatert = fagStr.split(',').map(f => f.trim() === gammelt ? nytt : f.trim()).join(',');
    if (oppdatert !== fagStr) brukere.getRange(i + 2, 7).setValue(oppdatert);
  });

  // Plan: oppdater fag-kolonnen (col 6 = index 5)
  const plan   = ss.getSheetByName('Plan');
  const pRader = plan.getLastRow() > 1
    ? plan.getRange(2, 6, plan.getLastRow() - 1, 1).getValues()
    : [];
  pRader.forEach((r, i) => {
    if (String(r[0]) === gammelt) plan.getRange(i + 2, 6).setValue(nytt);
  });

  SpreadsheetApp.flush();
  return jsonResponse({ ok: true });
}

function handleMigrateToV2(d) {
  const bruker = getUserByToken(d.token);
  if (!bruker || bruker.rolle !== 'skoleadmin') return jsonResponse({ ok: false, error: 'Kun skoleadmin' });
  try {
    const rapport = migrateToV2();
    return jsonResponse({ ok: true, melding: rapport });
  } catch(e) {
    return jsonResponse({ ok: false, error: e.message });
  }
}

function migrateToV2() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const logg = [];

  // ── 1. Finn unike klasser frå Plan-arket ──────────────────────────────────
  const planSheet = ss.getSheetByName('Plan');
  const planRader = planSheet.getLastRow() > 1
    ? planSheet.getRange(2, 1, planSheet.getLastRow() - 1, 14).getValues()
    : [];
  const klasserFraPlan = [...new Set(
    planRader.map(r => String(r[4] || '').trim()).filter(k => k && k !== 'Alle')
  )].sort();
  logg.push('Klasser funnet i Plan: ' + (klasserFraPlan.join(', ') || '(ingen)'));

  // ── 2. Les eksisterende Konfig ────────────────────────────────────────────
  const konfSheet = ss.getSheetByName('Konfig');
  const konfRader = konfSheet.getLastRow() > 1
    ? konfSheet.getRange(2, 1, konfSheet.getLastRow() - 1, 3).getValues()
    : [];

  const eksisterendeTyper = {};
  konfRader.forEach(r => {
    const type = String(r[0] || '').trim();
    if (!type) return;
    if (!eksisterendeTyper[type]) eksisterendeTyper[type] = [];
    eksisterendeTyper[type].push({ nokkel: String(r[1] || ''), verdi: String(r[2] || '') });
  });

  const nyeRader = [];

  // ── 3. Legg til manglende klasse-oppføringer ──────────────────────────────
  const eksisterendeKlasser = new Set((eksisterendeTyper['klasse'] || []).map(r => r.nokkel));
  klasserFraPlan.forEach(k => {
    if (!eksisterendeKlasser.has(k)) {
      nyeRader.push(['klasse', k, '']);
      logg.push('La til klasse: ' + k);
    }
  });

  // ── 4. Migrer globale fag → fag_<klasse> for klasser som mangler det ──────
  const globalFag = eksisterendeTyper['fag'] || [];
  klasserFraPlan.forEach(k => {
    const harFagKlasse = eksisterendeTyper['fag_' + k] && eksisterendeTyper['fag_' + k].length > 0;
    if (!harFagKlasse && globalFag.length > 0) {
      globalFag.forEach(f => {
        nyeRader.push(['fag_' + k, f.nokkel, f.verdi]); // behold dag fra global
      });
      logg.push('Kopierte ' + globalFag.length + ' fag til fag_' + k);
    }
  });

  // ── 5. Oppdater globale fag: fjern dag (verdi → '') ───────────────────────
  let oppdatertFag = false;
  konfRader.forEach((r, i) => {
    if (String(r[0]).trim() === 'fag' && String(r[2] || '').trim() !== '') {
      konfSheet.getRange(i + 2, 3).setValue('');
      oppdatertFag = true;
    }
  });
  if (oppdatertFag) logg.push('Fjernet dager fra globale fag-oppføringer');

  // Skriv nye rader
  if (nyeRader.length > 0) {
    nyeRader.forEach(r => konfSheet.appendRow(r));
    logg.push('Totalt ' + nyeRader.length + ' nye konfig-rader lagt til');
  } else {
    logg.push('Ingen nye konfig-rader nødvendig');
  }

  // ── 6. Brukere: sikre 8 kolonner (legg til tom YffGruppe hvis mangler) ───
  const brukerSheet = ss.getSheetByName('Brukere');
  const brukerRader = brukerSheet.getLastRow() > 1
    ? brukerSheet.getRange(2, 1, brukerSheet.getLastRow() - 1, 8).getValues()
    : [];
  let brukerFix = 0;
  brukerRader.forEach((r, i) => {
    // Kol 6 (index 5) = Rolle – sett til 'laerer' hvis tom
    if (!String(r[5] || '').trim()) {
      brukerSheet.getRange(i + 2, 6).setValue(r[2] ? 'skoleadmin' : 'laerer');
      brukerFix++;
    }
    // Kol 7 (index 6) = Fag – sett til 'Alle' hvis tom
    if (!String(r[6] || '').trim()) {
      brukerSheet.getRange(i + 2, 7).setValue('Alle');
    }
    // Kol 8 (index 7) = YffGruppe – blank er OK
  });
  if (brukerFix > 0) logg.push('Oppdaterte rolle-felt for ' + brukerFix + ' brukere');

  SpreadsheetApp.flush();
  return logg.join(' | ');
}

function handleSeedTestData(d) {
  const bruker = getUserByToken(d.token);
  if (!bruker || bruker.rolle !== 'skoleadmin') return jsonResponse({ ok: false, error: 'Kun skoleadmin' });
  try {
    seedTestData();
    return jsonResponse({ ok: true, melding: 'Testdata lagt inn – laster siden på nytt…' });
  } catch(e) {
    return jsonResponse({ ok: false, error: e.message });
  }
}

function seedTestData() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const ts = Utilities.formatDate(new Date(), 'Europe/Oslo', 'yyyy-MM-dd HH:mm');
  const logg = [];

  // ── Konfig: legg til kun det som mangler ─────────────────────────────────
  const konfig = ss.getSheetByName('Konfig');
  const eksKonfig = konfig.getLastRow() > 1
    ? konfig.getRange(2, 1, konfig.getLastRow() - 1, 3).getValues() : [];
  const harKonfig = (type, nokkel) =>
    eksKonfig.some(r => String(r[0]) === type && String(r[1]) === nokkel);

  const konfigData = [
    ['klasse', '1D', ''], ['klasse', '1R', ''],
    ['fag', 'Produksjon', ''], ['fag', 'YFF', ''], ['fag', 'Engelsk', ''],
    ['fag', 'Matte', ''], ['fag', 'Naturfag', ''], ['fag', 'Gym', ''], ['fag', 'Aktivitet', ''],
    ['gruppe_yff', 'Hund', ''], ['gruppe_yff', 'Storfe', ''], ['gruppe_yff', 'Gris', ''],
    ['fag_1D', 'Produksjon', 'Mandag'], ['fag_1D', 'YFF', 'Onsdag'],
    ['fag_1D', 'Engelsk', 'Tirsdag'], ['fag_1D', 'Matte', 'Tirsdag'],
    ['fag_1D', 'Naturfag', 'Onsdag'], ['fag_1D', 'Gym', 'Mandag'],
    ['fag_1R', 'Produksjon', 'Mandag'], ['fag_1R', 'Engelsk', 'Tirsdag'],
    ['fag_1R', 'Matte', 'Mandag'], ['fag_1R', 'Gym', 'Tirsdag'], ['fag_1R', 'Aktivitet', 'Onsdag'],
  ];
  let nyeKonfig = 0;
  konfigData.forEach(r => {
    if (!harKonfig(r[0], r[1])) { konfig.appendRow(r); nyeKonfig++; }
  });
  logg.push('Konfig: ' + nyeKonfig + ' nye rader');

  // ── Brukere: legg til kun brukere som ikke finnes ─────────────────────────
  const brukere = ss.getSheetByName('Brukere');
  const eksNavn = brukere.getLastRow() > 1
    ? brukere.getRange(2, 1, brukere.getLastRow() - 1, 1).getValues().map(r => String(r[0])) : [];
  const pass = hashPassword('test123');
  const brukerData = [
    ['Anne Cathrine', pass, false, '1D',    false, 'laerer', 'Produksjon,YFF', 'Hund'],
    ['Kevin',         pass, false, '1D,1R', false, 'laerer', 'Engelsk',        ''],
    ['Willy',         pass, false, '1D,1R', false, 'laerer', 'Matte,Naturfag', ''],
    ['Kristoffer',    pass, false, '1D,1R', false, 'laerer', 'Gym,Aktivitet',  ''],
    ['Martin',        pass, false, '1R',    false, 'laerer', 'Engelsk',        ''],
    ['Olav',          pass, false, '1R',    false, 'laerer', 'Produksjon',     ''],
  ];
  let nyeBrukere = 0;
  brukerData.forEach(r => {
    if (!eksNavn.includes(r[0])) { brukere.appendRow(r); nyeBrukere++; }
  });
  logg.push('Brukere: ' + nyeBrukere + ' nye');

  // ── Plan: legg til eksempeløkter for 1D og 1R (uke 23) ───────────────────
  const plan = ss.getSheetByName('Plan');
  let n = 0;
  const nid = () => 'seed_' + Date.now() + '_' + (++n);
  const ar = 2026, uke = 23;
  const planData = [
    [nid(), ar, uke, 'Mandag',  '1D', 'Produksjon', '',     'Anne Cathrine', 'Stell og fôring av storfe',    'Fjøs',           '',                 '',     ts, 'Seed'],
    [nid(), ar, uke, 'Mandag',  '1D', 'Gym',        '',     'Kristoffer',    'Friidrett – løping',           'Idrettshall',    '',                 '',     ts, 'Seed'],
    [nid(), ar, uke, 'Tirsdag', '1D', 'Engelsk',    '',     'Kevin',         'Muntlig presentasjon',         'Klasserom',      '',                 '',     ts, 'Seed'],
    [nid(), ar, uke, 'Tirsdag', '1D', 'Matte',      '',     'Willy',         'Algebra – ligninger',          'Klasserom',      '',                 '',     ts, 'Seed'],
    [nid(), ar, uke, 'Onsdag',  '1D', 'YFF',        'Hund', 'Anne Cathrine', 'Lydighetsøvelser',             'Hundegård',      'Ta med godbit',    '',     ts, 'Seed'],
    [nid(), ar, uke, 'Onsdag',  '1D', 'Naturfag',   '',     'Willy',         'Plantelære – fotosyntese',     'Klasserom',      '',                 '',     ts, 'Seed'],
    [nid(), ar, uke, 'Torsdag', '1D', 'Produksjon', '',     'Anne Cathrine', 'Melking og stell',             'Fjøs',           '',                 '08:00',ts, 'Seed'],
    [nid(), ar, uke, 'Fredag',  '1D', 'Matte',      '',     'Willy',         'Geometri – areal og volum',   'Klasserom',      '',                 '',     ts, 'Seed'],
    [nid(), ar, uke, 'Fredag',  '1D', 'Engelsk',    '',     'Kevin',         'Skriftlig innlevering',        'Klasserom',      'Leveres digitalt', '',     ts, 'Seed'],
    [nid(), ar, uke, 'Mandag',  '1R', 'Produksjon', '',     'Olav',          'Intro til maskinpark',         'Verksted',       '',                 '',     ts, 'Seed'],
    [nid(), ar, uke, 'Mandag',  '1R', 'Matte',      '',     'Willy',         'Statistikk',                   'Klasserom',      '',                 '',     ts, 'Seed'],
    [nid(), ar, uke, 'Tirsdag', '1R', 'Engelsk',    '',     'Kevin',         'Lesing og tekstforståelse',    'Klasserom',      '',                 '',     ts, 'Seed'],
    [nid(), ar, uke, 'Tirsdag', '1R', 'Gym',        '',     'Kristoffer',    'Friidrett – kast og hopp',     'Idrettshall',    '',                 '',     ts, 'Seed'],
    [nid(), ar, uke, 'Onsdag',  '1R', 'Aktivitet',  '',     'Kristoffer',    'Friluftsdag – kyststi',        'Møt ved bussen', 'Ta med niste',     '09:00',ts, 'Seed'],
    [nid(), ar, uke, 'Torsdag', '1R', 'Engelsk',    '',     'Martin',        'Grammatikk og setningsbygging','Klasserom',      '',                 '',     ts, 'Seed'],
    [nid(), ar, uke, 'Fredag',  '1R', 'Produksjon', '',     'Olav',          'Traktorvedlikehold',           'Verksted',       'Arbeidsklær',      '',     ts, 'Seed'],
    [nid(), ar, uke, 'Fredag',  '1R', 'Matte',      '',     'Willy',         'Prøve – statistikk',           'Klasserom',      'Hjelpemidler: kalkulator', '', ts, 'Seed'],
  ];
  planData.forEach(r => plan.appendRow(r));
  logg.push('Plan: ' + planData.length + ' nye økter for 1D og 1R (uke 23)');

  SpreadsheetApp.flush();
  Logger.log('✅ ' + logg.join(' | '));
  Logger.log('Passord for alle testlærere: test123');
}

function handleSeedSemesterData(d) {
  const bruker = getUserByToken(d.token);
  if (!bruker || bruker.rolle !== 'skoleadmin') return jsonResponse({ ok: false, error: 'Kun skoleadmin' });
  try {
    const antall = seedSemesterData();
    return jsonResponse({ ok: true, melding: antall + ' nye planrader lagt inn for april–juni 2026' });
  } catch(e) {
    return jsonResponse({ ok: false, error: e.message });
  }
}

function seedSemesterData() {
  const ss = SpreadsheetApp.openById(SS_ID);
  const ts = Utilities.formatDate(new Date(), 'Europe/Oslo', 'yyyy-MM-dd HH:mm');

  // Norske fridager 2026
  const fridager = {
    '2026-04-02': true, // Skjærtorsdag
    '2026-04-03': true, // Langfredag
    '2026-04-06': true, // 2. påskedag
    '2026-05-01': true, // Arbeidernes dag
    '2026-05-14': true, // Kristi himmelfartsdag
    '2026-05-25': true, // 2. pinsedag
  };

  function mondayOfWeek(ar, uke) {
    var jan4 = new Date(ar, 0, 4);
    var dow = jan4.getDay() || 7;
    return new Date(jan4.getTime() - (dow - 1) * 86400000 + (uke - 1) * 7 * 86400000);
  }

  function dateStr(d) {
    return Utilities.formatDate(d, 'Europe/Oslo', 'yyyy-MM-dd');
  }

  function erFridag(ar, uke, dagNr) {
    var mon = mondayOfWeek(ar, uke);
    var dag = new Date(mon.getTime() + (dagNr - 1) * 86400000);
    return fridager[dateStr(dag)] === true;
  }

  // Aktivitetslister per emne (roterer uke for uke)
  var ACT = {
    Produksjon_fjos: [
      'Stell og fôring av storfe', 'Melking – morgenrunde', 'Kalvestell og observasjon',
      'Rydding og renhold av fjøs', 'Fôrplanlegging', 'Dyrehelse – tegn på sykdom',
      'Innhøsting og ensilering', 'Gjødselkjøring', 'Vedlikehold av utstyr',
      'Journalføring – driftsregistrering', 'Grovfôranalyse', 'Besøk fra veterinær'
    ],
    Produksjon_verksted: [
      'Intro til maskinpark', 'Traktorvedlikehold – ettersyn', 'Jordarbeiding med traktor',
      'Planlegging av vekstskifte', 'Såing og planting', 'Plantevernmidler – sikker bruk',
      'Høsting med redskaper', 'Maskinreparasjon – grunnleggende', 'HMS i verksted',
      'Kalkulasjon og økonomi', 'Innmarks-dreneringsplan', 'Besøk på nærliggende gård'
    ],
    YFF_Hund: [
      'Lydighetsøvelser – grunnkommandoer', 'Sosialisering – hunder og mennesker',
      'Sporarbeid – intro', 'Agility – grunnkurs', 'Hundestell og grooming',
      'Ernæring og fôring', 'Helsekontroll – parasitter og vaksinasjon',
      'Avlsforståelse – raser og egenskaper', 'Juridiske rammer – hundeloven',
      'Rappelleringsøvelser', 'Marksøk – intro', 'Ekskursjon – hundeutstilling'
    ],
    Engelsk: [
      'Muntlig presentasjon', 'Lesing og tekstforståelse', 'Skriftlig innlevering',
      'Grammatikk – verb og tider', 'Ordforråd – fagord naturbruk', 'Lytte og svare – podkast',
      'Prosjektarbeid – naturbruk globalt', 'Film og analyse', 'Diskusjon og debatt',
      'Engelskspråklig faglitteratur', 'Gruppearbeid – rollespill', 'Prøve – lesforståelse'
    ],
    Matte: [
      'Algebra – ligninger', 'Geometri – areal og volum', 'Statistikk og sannsynlighet',
      'Prosentregning', 'Funksjoner og grafer', 'Økonomimatematikk',
      'Målestokk og kart', 'Prøve – algebra', 'Trigonometri – intro',
      'Brøk og desimaltall', 'Rekneoppgåver frå naturbruk', 'Prøve – geometri'
    ],
    Naturfag: [
      'Plantelære – fotosyntese', 'Jordkjemi og pH-verdier', 'Pollinering og insekter',
      'Klimaendringer og landbruk', 'Genmodifisering – etikk', 'Dyrenes fysiologi',
      'Vannkvalitet og natur', 'Plantesjukdommer', 'Bioteknologi i landbruket',
      'Sporingseksperiment', 'Næringskjeder og økosystem', 'Prøve – plantelære'
    ],
    Gym: [
      'Friidrett – løping', 'Friidrett – kast og hopp', 'Volleyball',
      'Fotball', 'Svømming', 'Dans og rytmikk',
      'Orientering', 'Klatring – intro', 'Basketball',
      'Friluftsliv – turgåing', 'Styrketrening – grunnleggende', 'Avslutning og evaluering'
    ],
    Aktivitet: [
      'Friluftsdag – kyststi', 'Kajakkpadling – intro', 'Klatring – buldring',
      'Sykkeltur i naturen', 'Fiske og friluftsmat', 'Natur-orientering',
      'Snøskotur', 'Friluftsliv – overnatting ute', 'Bål og matlaging ute',
      'Natursti – planteidentifikasjon', 'Teambuilding-øvelser', 'Friluftsliv – evaluering'
    ]
  };

  // Schema: dag 1=Mandag … 5=Fredag
  var DAGNAVN = ['', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag'];

  var schema = {
    '1D': [
      {dag:1, fag:'Produksjon', gr:'',     laerer:'Anne Cathrine', sted:'Fjøs',        ak:'Produksjon_fjos',    tid:'08:00'},
      {dag:1, fag:'Gym',        gr:'',     laerer:'Kristoffer',    sted:'Idrettshall', ak:'Gym',                tid:''},
      {dag:2, fag:'Engelsk',    gr:'',     laerer:'Kevin',         sted:'Klasserom',   ak:'Engelsk',            tid:''},
      {dag:2, fag:'Matte',      gr:'',     laerer:'Willy',         sted:'Klasserom',   ak:'Matte',              tid:''},
      {dag:3, fag:'YFF',        gr:'Hund', laerer:'Anne Cathrine', sted:'Hundegård',   ak:'YFF_Hund',           tid:''},
      {dag:3, fag:'Naturfag',   gr:'',     laerer:'Willy',         sted:'Klasserom',   ak:'Naturfag',           tid:''},
      {dag:4, fag:'Produksjon', gr:'',     laerer:'Anne Cathrine', sted:'Fjøs',        ak:'Produksjon_fjos',    tid:'08:00'},
      {dag:5, fag:'Engelsk',    gr:'',     laerer:'Kevin',         sted:'Klasserom',   ak:'Engelsk',            tid:''},
      {dag:5, fag:'Matte',      gr:'',     laerer:'Willy',         sted:'Klasserom',   ak:'Matte',              tid:''},
    ],
    '1R': [
      {dag:1, fag:'Produksjon', gr:'',     laerer:'Olav',          sted:'Verksted',    ak:'Produksjon_verksted',tid:''},
      {dag:1, fag:'Matte',      gr:'',     laerer:'Willy',         sted:'Klasserom',   ak:'Matte',              tid:''},
      {dag:2, fag:'Engelsk',    gr:'',     laerer:'Kevin',         sted:'Klasserom',   ak:'Engelsk',            tid:''},
      {dag:2, fag:'Gym',        gr:'',     laerer:'Kristoffer',    sted:'Idrettshall', ak:'Gym',                tid:''},
      {dag:3, fag:'Aktivitet',  gr:'',     laerer:'Kristoffer',    sted:'Møtested',    ak:'Aktivitet',          tid:'09:00'},
      {dag:4, fag:'Engelsk',    gr:'',     laerer:'Martin',        sted:'Klasserom',   ak:'Engelsk',            tid:''},
      {dag:5, fag:'Produksjon', gr:'',     laerer:'Olav',          sted:'Verksted',    ak:'Produksjon_verksted',tid:''},
      {dag:5, fag:'Matte',      gr:'',     laerer:'Willy',         sted:'Klasserom',   ak:'Matte',              tid:''},
    ],
    '1E': [
      {dag:1, fag:'Produksjon', gr:'',     laerer:'Anne Cathrine', sted:'Fjøs',        ak:'Produksjon_fjos',    tid:'08:00'},
      {dag:1, fag:'Gym',        gr:'',     laerer:'Kristoffer',    sted:'Idrettshall', ak:'Gym',                tid:''},
      {dag:2, fag:'Engelsk',    gr:'',     laerer:'Kevin',         sted:'Klasserom',   ak:'Engelsk',            tid:''},
      {dag:2, fag:'Matte',      gr:'',     laerer:'Willy',         sted:'Klasserom',   ak:'Matte',              tid:''},
      {dag:3, fag:'YFF',        gr:'Hund', laerer:'Anne Cathrine', sted:'Hundegård',   ak:'YFF_Hund',           tid:''},
      {dag:3, fag:'Naturfag',   gr:'',     laerer:'Willy',         sted:'Klasserom',   ak:'Naturfag',           tid:''},
      {dag:4, fag:'Produksjon', gr:'',     laerer:'Anne Cathrine', sted:'Fjøs',        ak:'Produksjon_fjos',    tid:'08:00'},
      {dag:5, fag:'Naturfag',   gr:'',     laerer:'Willy',         sted:'Klasserom',   ak:'Naturfag',           tid:''},
      {dag:5, fag:'Engelsk',    gr:'',     laerer:'Kevin',         sted:'Klasserom',   ak:'Engelsk',            tid:''},
    ],
  };

  // Sørg for at fag_1E finnes i Konfig
  var konfig = ss.getSheetByName('Konfig');
  var eksKonfig = konfig.getLastRow() > 1
    ? konfig.getRange(2, 1, konfig.getLastRow() - 1, 3).getValues() : [];
  var harKonfig = function(type, nokkel) {
    return eksKonfig.some(function(r) { return String(r[0]) === type && String(r[1]) === nokkel; });
  };
  var fag1E = [
    ['fag_1E', 'Produksjon', 'Mandag'], ['fag_1E', 'YFF', 'Onsdag'],
    ['fag_1E', 'Engelsk', 'Tirsdag'],  ['fag_1E', 'Matte', 'Tirsdag'],
    ['fag_1E', 'Naturfag', 'Onsdag'],  ['fag_1E', 'Gym', 'Mandag'],
  ];
  fag1E.forEach(function(r) { if (!harKonfig(r[0], r[1])) konfig.appendRow(r); });

  // Legg inn planrader uke 14–25
  var plan = ss.getSheetByName('Plan');
  var counter = {};
  var n = 0;
  var nid = function() { return 'sem_' + Date.now() + '_' + (++n); };
  var AR = 2026;
  var UKER = [14,15,16,17,18,19,20,21,22,23,24,25];
  var rader = [];

  UKER.forEach(function(uke) {
    Object.keys(schema).forEach(function(klasse) {
      schema[klasse].forEach(function(s) {
        if (erFridag(AR, uke, s.dag)) return;
        var ak = s.ak;
        counter[ak] = (counter[ak] || 0);
        var aktivitet = ACT[ak][counter[ak] % ACT[ak].length];
        counter[ak]++;
        // [ID, År, Uke, Dag, Klasse, Fag, Gruppe, Lærer, Aktivitet, Oppmøtested, Info, Tid, SistEndret, LagretAv]
        rader.push([nid(), AR, uke, DAGNAVN[s.dag], klasse, s.fag, s.gr, s.laerer, aktivitet, s.sted, '', s.tid, ts, 'SeedSemester']);
      });
    });
  });

  rader.forEach(function(r) { plan.appendRow(r); });
  SpreadsheetApp.flush();
  Logger.log('✅ SeedSemester: ' + rader.length + ' rader lagt inn');
  return rader.length;
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
