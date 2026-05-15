var PROD_SHEETS_ID = '10j90z_Xnh6mpUuAOiZ5hM4fKYgw61vVfkS4nOL0q4RA';
var DEV_SHEETS_ID  = '1rrwEFtqrOh11HruFdZ2m-v-zBGCgScYyWVIW4Y-vZ1s';
var SHEETS_ID = PROD_SHEETS_ID;
var TOKEN_LEVETID_MS = 8 * 60 * 60 * 1000;
var MAKS_FORSOK = 5;
var RATE_VINDU_MS = 10 * 60 * 1000;

function doGet(e) {
  if (e && e.parameter && e.parameter.dev) SHEETS_ID = DEV_SHEETS_ID;
  if (e && e.parameter && e.parameter.ical) {
    return lagIcalSvar_(e.parameter);
  }
  return ContentService.createTextOutput('bygg: 2025-05-06-v4 | gemini-2.5-flash')
    .setMimeType(ContentService.MimeType.TEXT);
}

function lagIcalSvar_(params) {
  try {
    var ss = SpreadsheetApp.openById(SHEETS_ID);
    var skoleaar = '2025/2026';
    var innstArk = ss.getSheetByName('Innstillinger');
    if (innstArk) {
      innstArk.getDataRange().getValues().forEach(function(rad) {
        if (String(rad[0]).trim().toLowerCase().startsWith('skolea')) skoleaar = String(rad[1]).trim();
      });
    }

    var laerer = params.laerer || '';
    var fag    = params.fag    || '';
    var parti  = params.parti  || '';
    var gruppe = params.gruppe || '';
    var klasse = params.klasse || '';
    var okter  = [];

    // Bygg kalendernavn på samme format som klienten
    var kalBase = 'Praksisplan_' + klasse;
    var kalNavn;
    if (laerer) {
      kalNavn = kalBase + '_' + laerer + (fag ? '_' + fag : '');
      ['Plan_NPT','Plan_NNA','Plan_YFF','Plan_Fag'].forEach(function(an) {
        var ark = ss.getSheetByName(an);
        if (!ark) return;
        var rader = ark.getDataRange().getValues();
        var erNNA = an === 'Plan_NNA';
        for (var i = 1; i < rader.length; i++) {
          var r = rader[i];
          if (!r[0]) continue;
          var laererkol = erNNA ? String(r[5]||'') : String(r[6]||'');
          if (laererkol.toLowerCase().indexOf(laerer.toLowerCase()) < 0) continue;
          okter.push({
            uke: String(r[0]).trim(), dag: String(r[1]||'').trim().toLowerCase(),
            aktivitet: erNNA ? String(r[2]||'') : String(r[3]||''),
            oppmote:   erNNA ? String(r[3]||'') : String(r[4]||''),
            info:      erNNA ? String(r[4]||'') : String(r[5]||''),
            parti: erNNA ? '' : String(r[2]||''), fag: an.replace('Plan_','')
          });
        }
      });
    } else {
      // Elevfeed: alle fag kombinert
      var suffix = '';
      if (parti) suffix += '_P' + parti.replace(/^p/i, '');
      if (gruppe) suffix += '_' + gruppe;
      kalNavn = kalBase + suffix;

      // NPT
      var nptArk = ss.getSheetByName('Plan_NPT');
      if (nptArk) {
        var rader = nptArk.getDataRange().getValues();
        for (var i = 1; i < rader.length; i++) {
          var r = rader[i];
          if (!r[0] || !r[3]) continue;
          if (parti) {
            var rp = String(r[2]||'').trim().toLowerCase();
            var sp = parti.toLowerCase();
            if (rp !== sp && rp !== 'p'+sp && 'p'+rp !== sp) continue;
          }
          okter.push({ uke: String(r[0]).trim(), dag: String(r[1]||'').trim().toLowerCase(),
            aktivitet: String(r[3]||''), oppmote: String(r[4]||''), info: String(r[5]||''),
            parti: String(r[2]||''), fag: 'NPT' });
        }
      }

      // NNA
      var nnaArk = ss.getSheetByName('Plan_NNA');
      if (nnaArk) {
        var rader = nnaArk.getDataRange().getValues();
        for (var i = 1; i < rader.length; i++) {
          var r = rader[i];
          if (!r[0] || !r[2]) continue;
          okter.push({ uke: String(r[0]).trim(), dag: String(r[1]||'').trim().toLowerCase(),
            aktivitet: String(r[2]||''), oppmote: String(r[3]||''), info: String(r[4]||''),
            parti: '', fag: 'NNA' });
        }
      }

      // YFF
      var yffArk = ss.getSheetByName('Plan_YFF');
      if (yffArk) {
        var rader = yffArk.getDataRange().getValues();
        for (var i = 1; i < rader.length; i++) {
          var r = rader[i];
          if (!r[0] || !r[3]) continue;
          var radGruppe = String(r[2]||'').trim();
          if (gruppe && radGruppe.toLowerCase() !== gruppe.toLowerCase()) continue;
          okter.push({ uke: String(r[0]).trim(), dag: String(r[1]||'').trim().toLowerCase(),
            aktivitet: String(r[3]||''), oppmote: String(r[4]||''), info: String(r[5]||''),
            parti: radGruppe, fag: 'YFF' });
        }
      }

      // Fellesfag
      var ffArk = ss.getSheetByName('Plan_Fag');
      if (ffArk) {
        var rader = ffArk.getDataRange().getValues();
        for (var i = 1; i < rader.length; i++) {
          var r = rader[i];
          if (!r[0] || !r[3]) continue;
          var fagNavn = String(r[2]||'').trim();
          okter.push({ uke: String(r[0]).trim(), dag: String(r[1]||'').trim().toLowerCase(),
            aktivitet: (fagNavn ? fagNavn + ': ' : '') + String(r[3]||''),
            oppmote: String(r[4]||''), info: String(r[5]||''),
            parti: fagNavn, fag: 'Fellesfag' });
        }
      }
    }

    var ics = genererICS_(okter, kalNavn, skoleaar);
    return ContentService.createTextOutput(ics).setMimeType(ContentService.MimeType.TEXT);
  } catch(err) {
    return ContentService.createTextOutput(
      'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Praksisplan//NO\r\nEND:VCALENDAR'
    ).setMimeType(ContentService.MimeType.TEXT);
  }
}

function ukeStartDatoIcal_(ukenummer, skoleaar) {
  var uk = parseInt(ukenummer);
  if (isNaN(uk)) return null;
  var aar;
  if (skoleaar && skoleaar.includes('/')) {
    var d = skoleaar.split('/');
    aar = uk >= 30 ? parseInt(d[0]) : parseInt(d[1]);
  } else {
    var now = new Date();
    aar = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    if (uk < 30) aar++;
  }
  var jan4 = new Date(aar, 0, 4);
  var dow = jan4.getDay() || 7;
  var man = new Date(jan4);
  man.setDate(jan4.getDate() - dow + 1 + (uk - 1) * 7);
  return man;
}

function genererICS_(okter, kalNavn, skoleaar) {
  var DAG_OFFSET = { mandag: 0, tirsdag: 1, onsdag: 2, torsdag: 3, fredag: 4 };
  var SPESIAL = ['ferie','fri','avspasering','undervisningsfri','planlegging','planleggingsdag','høytid','skoletur'];

  function datStr(d) {
    return '' + d.getFullYear() +
      String(d.getMonth()+1).padStart(2,'0') +
      String(d.getDate()).padStart(2,'0');
  }
  function esc(s) {
    return (s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
  }
  function fold(line) {
    if (line.length <= 75) return line;
    var out = '', i = 0;
    while (i < line.length) {
      if (i === 0) { out += line.slice(0,75); i = 75; }
      else { out += '\r\n ' + line.slice(i, i+74); i += 74; }
    }
    return out;
  }

  var lines = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Praksisplan//NO',
    'CALSCALE:GREGORIAN','METHOD:PUBLISH',
    'X-WR-CALNAME:' + kalNavn,
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H','X-PUBLISHED-TTL:PT1H'
  ];

  okter.forEach(function(okt, idx) {
    if (!okt.aktivitet || SPESIAL.indexOf(okt.dag) >= 0) return;
    var dagOff = DAG_OFFSET[okt.dag];
    if (dagOff === undefined) return;
    var monday = ukeStartDatoIcal_(okt.uke, skoleaar);
    if (!monday) return;
    var dato = new Date(monday); dato.setDate(monday.getDate() + dagOff);
    var neste = new Date(dato); neste.setDate(dato.getDate() + 1);
    var uid = 'pp-' + okt.fag + '-u' + okt.uke + '-' + okt.dag + '-' + (okt.parti||'x') + '-' + idx + '@praksisplan';
    var desc = [];
    if (okt.oppmote) desc.push('Oppmøte: ' + okt.oppmote);
    if (okt.info) desc.push(okt.info);
    lines.push('BEGIN:VEVENT');
    lines.push(fold('UID:' + uid));
    lines.push('DTSTART;VALUE=DATE:' + datStr(dato));
    lines.push('DTEND;VALUE=DATE:' + datStr(neste));
    lines.push(fold('SUMMARY:' + esc(okt.aktivitet)));
    if (desc.length) lines.push(fold('DESCRIPTION:' + esc(desc.join('\n'))));
    if (okt.oppmote) lines.push(fold('LOCATION:' + esc(okt.oppmote)));
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function doPost(e) {
  try {
    if (e && e.parameter && e.parameter.dev) SHEETS_ID = DEV_SHEETS_ID;
    var body = JSON.parse(e.postData.contents);
    if (body.action === 'hentArk')          return lagSvar(hentArkAction(body.arknavn));
    if (body.action === 'hentAlle')         return lagSvar(hentAlleAction());
    if (body.action === 'skrivArk')         return lagSvar(skrivArkAction(body.arknavn, body.rader, body.token));
    if (body.action === 'autentiser')       return lagSvar(autentiserAction(body.navn, body.passord));
    if (body.action === 'loggUt')           return lagSvar(loggUtAction(body.token));
    if (body.action === 'byttPassord')      return lagSvar(byttPassordAction(body.malLaerer, body.gammelt, body.nytt, body.token));
    if (body.action === 'oppdaterTilstede') return lagSvar(oppdaterTilstedeAction(body.token, body.navn, body.fag, body.venter));
    if (body.action === 'hentTilstede')     return lagSvar(hentTilstedeAction(body.token));
    if (body.action === 'fjernTilstede')    return lagSvar(fjernTilstedeAction(body.token));
    if (body.action === 'hentVersjon')      return lagSvar({ ok: true, versjon: hentVersjon_() });
    if (body.action === 'tolkMedAI')        return lagSvar(tolkMedAIAction_(body.token, body.tekst || '', body.fag || 'NPT', body.laerer || '', body.laerere || [], body.dagsDato || '', body.konfigDager || []));
    if (body.action === 'tolkSkolerute')    return lagSvar(tolkSkoleruteAction_(body.token, body.tekst || '', body.skoleaar || ''));
    if (body.action === 'appendSøppeldunk') return lagSvar(appendSøppeldunkAction_(body.token, body.rader || []));
    if (body.action === 'tømSøppeldunk')    return lagSvar(tømSøppeldunkAction_(body.token));
    if (body.action === 'slettSøppelRad')   return lagSvar(slettSøppelRadAction_(body.token, body.radData || []));
    if (body.action === 'ping')             return lagSvar({ ok: true, bygg: '2025-05-06-v4' });
    return lagSvar({ ok: false, feil: 'Ukjent handling' });
  } catch (err) {
    return lagSvar({ ok: false, feil: err.message });
  }
}

function lagSvar(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===== ARK-OPERASJONER =====

function hentArkAction(arknavn) {
  var ss = SpreadsheetApp.openById(SHEETS_ID);
  var ark = ss.getSheetByName(arknavn);
  if (!ark) return { ok: false, feil: 'Ark ikke funnet: ' + arknavn };
  return { ok: true, verdier: ark.getDataRange().getValues() };
}

function hentAlleAction() {
  var ss = SpreadsheetApp.openById(SHEETS_ID);
  var ark_navn = ['Innstillinger','Lærere','Fag','Skolerute','Plan_NPT','Plan_NNA','Plan_YFF','Plan_Fag'];
  var data = {};
  ark_navn.forEach(function(navn) {
    var ark = ss.getSheetByName(navn);
    data[navn] = ark ? ark.getDataRange().getValues() : [];
  });
  return { ok: true, data: data };
}

function skrivArkAction(arknavn, rader, token) {
  var session = validerToken(token);
  if (!session) return { ok: false, feil: 'Ikke innlogget eller sesjonen er utløpt', utloept: true };
  var ss = SpreadsheetApp.openById(SHEETS_ID);
  var ark = ss.getSheetByName(arknavn);
  if (arknavn === 'Lærere' && ark) {
    var eksisterende = ark.getDataRange().getValues();
    var pwMap = {};
    eksisterende.slice(1).forEach(function(rad) { if (rad[0]) pwMap[String(rad[0])] = rad[1]; });
    rader = rader.map(function(rad, i) {
      if (i === 0) return rad;
      return [rad[0], pwMap[String(rad[0])] || rad[1] || '', rad[2], rad[3], rad[4]];
    });
  }
  if (!ark) ark = ss.insertSheet(arknavn);
  ark.clearContents();
  if (rader && rader.length) ark.getRange(1, 1, rader.length, rader[0].length).setValues(rader);
  inkrementerVersjon_(ss);
  return { ok: true };
}

// ===== AUTENTISERING =====

function autentiserAction(navn, passord) {
  if (!navn || !passord) return { ok: false, feil: 'Mangler navn eller passord' };
  var props = PropertiesService.getScriptProperties();
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var rateKey = 'rate_' + navn;
    var rateRaw = props.getProperty(rateKey);
    var rate = rateRaw ? JSON.parse(rateRaw) : { forsok: 0, forste: Date.now() };
    if (Date.now() - rate.forste > RATE_VINDU_MS) rate = { forsok: 0, forste: Date.now() };
    if (rate.forsok >= MAKS_FORSOK) return { ok: false, feil: 'For mange forsøk – vent 10 minutter' };
    var ss = SpreadsheetApp.openById(SHEETS_ID);
    var ark = ss.getSheetByName('Lærere');
    if (!ark) return { ok: false, feil: 'Ingen lærerliste funnet' };
    var rader = ark.getDataRange().getValues();
    var bruker = null;
    for (var i = 1; i < rader.length; i++) {
      if (String(rader[i][0]).trim().toLowerCase() === navn.trim().toLowerCase()) {
        bruker = {
          navn: String(rader[i][0]),
          lagretPw: String(rader[i][1] || ''),
          farge: String(rader[i][2] || '#888'),
          admin: String(rader[i][3]).toUpperCase() === 'TRUE',
          fag: String(rader[i][4] || '').split(',').map(function(x){return x.trim();}).filter(Boolean)
        };
        break;
      }
    }
    if (!bruker) {
      rate.forsok++; props.setProperty(rateKey, JSON.stringify(rate));
      return { ok: false, feil: 'Feil navn eller passord' };
    }
    var ok = false;
    if (bruker.lagretPw.includes(':')) {
      var deler = bruker.lagretPw.split(':');
      var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, passord + deler[1]);
      var sjekk = bytes.map(function(b){return (b < 0 ? b + 256 : b).toString(16).padStart(2,'0');}).join('');
      ok = (sjekk === deler[0]);
    } else {
      ok = (bruker.lagretPw === passord);
    }
    if (!ok) {
      rate.forsok++; props.setProperty(rateKey, JSON.stringify(rate));
      return { ok: false, feil: 'Feil navn eller passord' };
    }
    props.deleteProperty(rateKey);
    var token = Utilities.getUuid();
    props.setProperty('tok_' + token, JSON.stringify({
      navn: bruker.navn, admin: bruker.admin, farge: bruker.farge,
      fag: bruker.fag, tid: Date.now()
    }));
    return { ok: true, token: token, navn: bruker.navn, admin: bruker.admin, farge: bruker.farge, fag: bruker.fag };
  } finally { lock.releaseLock(); }
}

function validerToken(token) {
  if (!token) return null;
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty('tok_' + token);
  if (!raw) return null;
  var session = JSON.parse(raw);
  if (Date.now() - session.tid > TOKEN_LEVETID_MS) {
    props.deleteProperty('tok_' + token); return null;
  }
  return session;
}

function loggUtAction(token) {
  if (token) PropertiesService.getScriptProperties().deleteProperty('tok_' + token);
  return { ok: true };
}

function byttPassordAction(malLaerer, gammelt, nytt, token) {
  var session = validerToken(token);
  if (!session) return { ok: false, feil: 'Ikke innlogget eller sesjonen er utløpt', utloept: true };
  var erAdm = session.admin === true || session.admin === 'true' || session.admin === 'TRUE';
  if (!erAdm && session.navn !== malLaerer) return { ok: false, feil: 'Ingen tilgang' };
  if (!nytt || nytt.length < 4) return { ok: false, feil: 'For kort passord (minst 4 tegn)' };
  var ss = SpreadsheetApp.openById(SHEETS_ID);
  var ark = ss.getSheetByName('Lærere');
  if (!ark) return { ok: false, feil: 'Ark ikke funnet' };
  var rader = ark.getDataRange().getValues();
  for (var i = 1; i < rader.length; i++) {
    if (String(rader[i][0] || '').trim() !== malLaerer.trim()) continue;
    var lagretPw = String(rader[i][1] || '');
    if (!erAdm) {
      var ok = false;
      if (lagretPw.includes(':')) {
        var deler = lagretPw.split(':');
        var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, gammelt + deler[1]);
        var sjekk = bytes.map(function(b){return (b < 0 ? b + 256 : b).toString(16).padStart(2,'0');}).join('');
        ok = (sjekk === deler[0]);
      } else { ok = (lagretPw === gammelt); }
      if (!ok) return { ok: false, feil: 'Feil nåværende passord' };
    }
    var salt = Utilities.getUuid();
    var nyBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, nytt + salt);
    var nyHash = nyBytes.map(function(b){return (b < 0 ? b + 256 : b).toString(16).padStart(2,'0');}).join('');
    ark.getRange(i + 1, 2).setValue(nyHash + ':' + salt);
    return { ok: true };
  }
  return { ok: false, feil: 'Bruker ikke funnet' };
}

function migrerPassordTilHash() {
  var ss = SpreadsheetApp.openById(SHEETS_ID);
  var ark = ss.getSheetByName('Lærere');
  if (!ark) { Logger.log('Ark ikke funnet'); return; }
  var rader = ark.getDataRange().getValues();
  for (var i = 1; i < rader.length; i++) {
    var pw = String(rader[i][1] || '');
    if (!pw || pw.includes(':')) continue;
    var salt = Utilities.getUuid();
    var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pw + salt);
    var hash = bytes.map(function(b){return (b < 0 ? b + 256 : b).toString(16).padStart(2,'0');}).join('');
    ark.getRange(i + 1, 2).setValue(hash + ':' + salt);
    Logger.log('Migrert: ' + rader[i][0]);
  }
  Logger.log('Ferdig.');
}

// ===== TILSTEDEVÆRELSE OG VERSJONSKONTROLL =====

function hentEllerLagTilstedeArk_(ss) {
  var ark = ss.getSheetByName('Tilstede');
  if (!ark) {
    ark = ss.insertSheet('Tilstede');
    ark.getRange(1,1,1,5).setValues([['Navn','Token','Fag','SistAktiv','Venter']]);
  }
  return ark;
}

function ryddGamleSesjonar_(ark) {
  var now = new Date();
  var rader = ark.getDataRange().getValues();
  for (var i = rader.length - 1; i >= 1; i--) {
    var t = rader[i][3];
    if (!t || (now - new Date(t)) > 10 * 60 * 1000) ark.deleteRow(i + 1);
  }
}

function oppdaterTilstedeAction(token, navn, fag, venter) {
  var session = validerToken(token);
  if (!session) return { ok: false, feil: 'Ikke innlogget', utloept: true };
  var ss = SpreadsheetApp.openById(SHEETS_ID);
  var ark = hentEllerLagTilstedeArk_(ss);
  ryddGamleSesjonar_(ark);
  var rader = ark.getDataRange().getValues();
  var rad = -1;
  for (var i = 1; i < rader.length; i++) {
    if (rader[i][1] === token) { rad = i + 1; break; }
  }
  var now = new Date().toISOString();
  var row = [navn || session.navn, token, fag || '', now, venter || false];
  if (rad > 0) ark.getRange(rad,1,1,5).setValues([row]);
  else ark.appendRow(row);
  return hentTilstedeAction(token, ss);
}

function hentTilstedeAction(token, ss) {
  if (!ss) ss = SpreadsheetApp.openById(SHEETS_ID);
  var ark = hentEllerLagTilstedeArk_(ss);
  ryddGamleSesjonar_(ark);
  var rader = ark.getDataRange().getValues();
  var aktive = [];
  for (var i = 1; i < rader.length; i++) {
    if (!rader[i][1]) continue;
    aktive.push({
      navn: rader[i][0],
      fag: rader[i][2],
      sistAktiv: rader[i][3],
      venter: rader[i][4],
      erDeg: rader[i][1] === (token || '')
    });
  }
  return { ok: true, aktive: aktive };
}

function fjernTilstedeAction(token) {
  if (!token) return { ok: false };
  var ss = SpreadsheetApp.openById(SHEETS_ID);
  var ark = hentEllerLagTilstedeArk_(ss);
  var rader = ark.getDataRange().getValues();
  for (var i = rader.length - 1; i >= 1; i--) {
    if (rader[i][1] === token) { ark.deleteRow(i + 1); break; }
  }
  return { ok: true };
}

function hentVersjon_(ss) {
  if (!ss) ss = SpreadsheetApp.openById(SHEETS_ID);
  var ark = ss.getSheetByName('Innstillinger');
  if (!ark) return 0;
  var rader = ark.getDataRange().getValues();
  for (var i = 0; i < rader.length; i++) {
    if (String(rader[i][0]).trim().toLowerCase() === 'versjon')
      return parseInt(rader[i][1]) || 0;
  }
  return 0;
}

function inkrementerVersjon_(ss) {
  if (!ss) ss = SpreadsheetApp.openById(SHEETS_ID);
  var ark = ss.getSheetByName('Innstillinger');
  if (!ark) return;
  var rader = ark.getDataRange().getValues();
  for (var i = 0; i < rader.length; i++) {
    if (String(rader[i][0]).trim().toLowerCase() === 'versjon') {
      ark.getRange(i+1,2).setValue((parseInt(rader[i][1])||0) + 1);
      return;
    }
  }
  ark.appendRow(['versjon', 1]);
}

// ===== GEMINI AI =====

function kallGemini_(prompt) {
  var KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_KEY');
  if (!KEY) throw new Error('GEMINI_KEY mangler i Script Properties');
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + KEY;
  var payload = JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] });
  var sisteFeil = '';
  for (var forsok = 0; forsok < 3; forsok++) {
    if (forsok > 0) Utilities.sleep(3000);
    var res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      muteHttpExceptions: true,
      payload: payload
    });
    var raw = res.getContentText();
    var json = JSON.parse(raw);
    var kode = res.getResponseCode();
    if (kode === 503 || kode === 429 ||
        (json.error && (json.error.code === 503 || json.error.code === 429))) {
      sisteFeil = json.error ? json.error.message.slice(0, 100) : 'Overbelastet (' + kode + ')';
      continue;
    }
    if (!json.candidates || !json.candidates[0] || !json.candidates[0].content) {
      sisteFeil = json.error ? json.error.message.slice(0, 100) : raw.slice(0, 100);
      break;
    }
    var parts = json.candidates[0].content.parts || [];
    var tekst = parts
      .filter(function(p) { return !p.thought && p.text; })
      .map(function(p) { return p.text; })
      .join('\n').trim();
    if (tekst) return tekst;
    sisteFeil = 'Tomt svar';
    break;
  }
  throw new Error('Gemini-feil: ' + sisteFeil);
}

function tolkMedAIAction_(token, tekst, fag, laerer, laerere, dagsDato, konfigDager) {
  var session = validerToken(token);
  if (!session) return { ok: false, feil: 'Ikke innlogget', utloept: true };
  if (!tekst) return { ok: false, feil: 'Ingen tekst' };
  var standardLaerer = laerer || session.navn || '';
  var laererListe = (laerere && laerere.length) ? laerere : (standardLaerer ? [standardLaerer] : []);
  var dagListe = (konfigDager && konfigDager.length) ? konfigDager : [];
  try {
    var kolFmt = {
      'NNA':       'uke;dag;aktivitet;oppmøte;info;lærer\nEks: 32;mandag;Stell av sauer;Klasse A;;Ola',
      'YFF':       'uke;dag;gruppe;aktivitet;oppmøte;info;lærer\nEks: 32;mandag;Gruppe1;Traktoropplæring;Klasse A;;Ola',
      'Fellesfag': 'uke;dag;fag;aktivitet;oppmøte;info;lærer\nEks: 32;tirsdag;Biologi;Celledeling;Klasse A;;Kari'
    };
    var fmt = kolFmt[fag] || 'uke;dag;parti;aktivitet;oppmøte;info;lærer\nEks: 32;mandag;A;Stell av dyr;Klasse A;;Ola';
    var dagInstr = '';
    if (dagListe.length === 1) {
      dagInstr = 'Konfigurert dag for dette faget: ' + dagListe[0] + '. Hvis dag ikke er eksplisitt nevnt i teksten, bruk «' + dagListe[0] + '».\n';
    } else if (dagListe.length > 1) {
      dagInstr = 'Konfigurerte dager for dette faget: ' + dagListe.join(', ') + '. Hvis dag ikke er eksplisitt nevnt i teksten, velg den mest passende av disse dagene basert på kontekst. La dag-feltet stå tomt kun hvis det er helt umulig å avgjøre.\n';
    }
    var prompt =
      'Du er assistent for en norsk naturbruksskole. Konverter følgende tekst til strukturerte undervisningsøkter.\n\n' +
      'Format (semikolonseparert, én økt per linje):\n' + fmt + '\n\n' +
      'FELTFORKLARING:\n' +
      '- Aktivitet: HVA som skal gjøres (f.eks. "eksperiment", "stell av dyr", "teoritime")\n' +
      '- Oppmøte: HVOR elevene skal møte/være – rom, bygg, sted eller område (kan skrives med liten bokstav). Eksempler: "labben", "grishuset", "auditoriet", "fjøset kl 08:00", "Bedriften kl 08:30"\n' +
      '  VIKTIG: Hvis et stedsnavn eller lokale er nevnt etter aktivitetsbeskrivelsen, plasser det i Oppmøte – ikke i Aktivitet.\n' +
      '  Eksempel: "eksperiment labben" → aktivitet: eksperiment, oppmøte: labben\n' +
      '  Eksempel: "synge i kor auditoriet" → aktivitet: synge i kor, oppmøte: auditoriet\n' +
      '  Eksempel: "stell grishuset" → aktivitet: stell, oppmøte: grishuset\n' +
      '- Info: Tilleggsinformasjon, utstyr, beskjeder (f.eks. "Ta med godt humør", "Husk støvler")\n' +
      '- Lærer: Ansvarlig lærer\n\n' +
      'Dager (lowercase): mandag tirsdag onsdag torsdag fredag\n' +
      dagInstr +
      (dagsDato ? 'Dagens dato: ' + dagsDato + '\n' : '') +
      'Ukenummer: ISO 8601 norske uker. Hvis teksten inneholder relative datoer som «neste tirsdag», «på fredag», «neste uke», «om to uker», skal du beregne korrekt ISO-ukenummer basert på dagens dato.\n' +
      (laererListe.length ? 'Gyldige lærernavn: ' + laererListe.join(', ') + '\n' : '') +
      'Lærer: Hvis et navn fra listen er nevnt i teksten, bruk det nøyaktig. ' +
      'Hvis ingen lærer er nevnt, bruk «' + standardLaerer + '».\n' +
      'La felter stå tomme hvis informasjon mangler – ikke utelat raden.\n\n' +
      'Tekst:\n' + tekst + '\n\n' +
      'Svar KUN med de konverterte linjene, ingen forklaring.';
    var raw = kallGemini_(prompt);
    var linjer = raw.split('\n').map(function(l){ return l.trim(); }).filter(function(l){ return l && !/^[#\-=]/.test(l); });
    var rader = linjer.map(function(l) {
      var d = l.split(';').map(function(x){ return x.trim(); });
      if (fag === 'NNA') return { uke: d[0], dag: d[1], aktivitet: d[2], oppmote: d[3], info: d[4], laerer: d[5] };
      return { uke: d[0], dag: d[1], parti: d[2], gruppe: d[2], aktivitet: d[3], oppmote: d[4], info: d[5], laerer: d[6] };
    }).filter(function(r){ return r.uke || r.aktivitet; });
    return { ok: true, rader: rader };
  } catch(e) { return { ok: false, feil: e.message }; }
}

function tolkSkoleruteAction_(token, tekst, skoleaar) {
  var session = validerToken(token);
  if (!session) return { ok: false, feil: 'Ikke innlogget', utloept: true };
  if (!tekst) return { ok: false, feil: 'Ingen tekst' };
  var aarInfo = skoleaar || '2025/2026';
  var aarDeler = aarInfo.split('/');
  var aar1 = aarDeler[0] || '2025';
  var aar2 = aarDeler[1] || '2026';
  try {
    var prompt =
      'Du er assistent for en norsk naturbruksskole. Konverter følgende skolerute til strukturert format for skoleåret ' + aarInfo + '.\n\n' +
      'FORMAT (semikolonseparert, én rad per linje):\nuke;dag;type;beskrivelse\n\n' +
      'Gyldige typer (bruk nøyaktig):\n' +
      '- ferie          → ferieuke eller flerdag-ferie (hel uke = tomt dag-felt)\n' +
      '- fridag         → enkeltdag fri for elever (planleggingsdag, klemdag, o.l.)\n' +
      '- høytidsdag     → norsk rød dag (17. mai, 1. mai, Kristi himmelfartsdag, 2. pinsedag, 1. nyttårsdag, osv.)\n' +
      '- planleggingsdag → planleggingsdag (fridag for elever, ikke for lærere)\n' +
      '- eksamen        → eksamensperiode\n' +
      '- annet          → øvrig merknad\n\n' +
      'UKE-FELT: Bruk norsk ISO 8601-ukenummer (heltall). ' +
      'Uker 30–52 tilhører ' + aar1 + ', uker 1–29 tilhører ' + aar2 + '.\n' +
      'For enkeltdager med kjent dato, bruk datoformat DD.MM (f.eks. 17.05 eller 01.05).\n\n' +
      'DAG-FELT: tomt = hel uke/gjelder alle dager. Ellers: mandag tirsdag onsdag torsdag fredag.\n\n' +
      'VIKTIG – utled ALT som impliseres av teksten:\n' +
      '1. JULEFERIE: Hvis "siste skoledag før jul" og/eller "første skoledag etter jul" er oppgitt:\n' +
      '   - Beregn hvilke ISO-uker som er helt fri mellom disse datoene\n' +
      '   - Inkluder én rad per ferieuke med type "ferie" og beskrivelse "Juleferie"\n' +
      '   - Eksempel: siste skoledag fredag 19. des ' + aar1 + ' og første skoledag mandag 5. jan ' + aar2 + '\n' +
      '     → uke 52 (' + aar1 + ');;ferie;Juleferie  og  1 (' + aar2 + ');;ferie;Juleferie\n' +
      '2. "Siste skoledag før jul" og "Første skoledag etter jul/påske" skal IKKE inkluderes som egne rader – de brukes kun til å beregne ferieukene.\n' +
      '3. PLANLEGGINGSDAGER: Fridag for elever – bruk type "planleggingsdag"\n' +
      '4. KLEMDAG/FRIDAG etter høytidsdag: bruk type "fridag"\n' +
      '5. Norske faste høytidsdager du alltid skal inkludere hvis de faller på en ukedag:\n' +
      '   1. mai (' + aar2 + '), 17. mai (' + aar2 + '), Kristi himmelfartsdag (39 dager etter påskedag), ' +
      '   2. pinsedag (50 dager etter påskedag)\n\n' +
      'EKSEMPEL på output:\n' +
      '41;;ferie;Høstferie\n' +
      '52;;ferie;Juleferie\n' +
      '1;;ferie;Juleferie\n' +
      '9;;ferie;Vinterferie\n' +
      '14;;ferie;Påskeferie\n' +
      '01.05;torsdag;høytidsdag;1. mai\n' +
      '17.05;lørdag;høytidsdag;17. mai\n\n' +
      'Tekst:\n' + tekst + '\n\n' +
      'Svar KUN med de konverterte linjene, ingen forklaring.';
    var raw = kallGemini_(prompt);
    var gyldige = ['ferie','fridag','høytidsdag','eksamen','annet'];
    var linjer = raw.split('\n').map(function(l){ return l.trim(); }).filter(function(l){ return l && !/^[#\-=]/.test(l); });
    var rader = linjer.map(function(l) {
      var d = l.split(';').map(function(x){ return x.trim(); });
      var type = d[2] || 'ferie';
      if (gyldige.indexOf(type) < 0) type = 'annet';
      return { uke: d[0], dag: d[1] || '', type: type, beskrivelse: d[3] || '' };
    }).filter(function(r){ return r.uke; });
    return { ok: true, rader: rader };
  } catch(e) { return { ok: false, feil: e.message }; }
}

// ===== SØPPELDUNK =====

function appendSøppeldunkAction_(token, rader) {
  var session = validerToken(token);
  if (!session) return { ok: false, feil: 'Ikke innlogget eller sesjonen er utløpt', utloept: true };
  if (!rader || !rader.length) return { ok: true };
  var ss = SpreadsheetApp.openById(SHEETS_ID);
  var ark = ss.getSheetByName('Søppeldunk');
  if (!ark) {
    ark = ss.insertSheet('Søppeldunk');
    ark.getRange(1,1,1,10).setValues([['Tidspunkt','Slettet av','Fag','Uke','Dag','Parti','Aktivitet','Oppmøte','Info','Lærer']]);
  }
  var sistRad = ark.getLastRow();
  ark.getRange(sistRad + 1, 1, rader.length, rader[0].length).setValues(rader);
  return { ok: true };
}

function tømSøppeldunkAction_(token) {
  var session = validerToken(token);
  if (!session) return { ok: false, feil: 'Ikke innlogget eller sesjonen er utløpt', utloept: true };
  if (!session.admin) return { ok: false, feil: 'Kun admin kan tømme søppeldunken' };
  var ss = SpreadsheetApp.openById(SHEETS_ID);
  var ark = ss.getSheetByName('Søppeldunk');
  if (!ark) return { ok: true };
  var rader = ark.getDataRange().getValues();
  if (rader.length <= 1) return { ok: true };
  ark.deleteRows(2, rader.length - 1);
  return { ok: true };
}

function slettSøppelRadAction_(token, radData) {
  var session = validerToken(token);
  if (!session) return { ok: false, feil: 'Ikke innlogget eller sesjonen er utløpt', utloept: true };
  if (!session.admin) return { ok: false, feil: 'Kun admin kan slette fra søppeldunken' };
  if (!radData || !radData[0]) return { ok: true };
  var ss = SpreadsheetApp.openById(SHEETS_ID);
  var ark = ss.getSheetByName('Søppeldunk');
  if (!ark) return { ok: true };
  var rader = ark.getDataRange().getValues();
  var tidSøk = String(radData[0]);
  var avSøk  = String(radData[1] || '');
  for (var i = 1; i < rader.length; i++) {
    if (String(rader[i][0]) === tidSøk && String(rader[i][1]) === avSøk) {
      ark.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: true }; // Ikke funnet – allerede borte
}

function kopierProdTilDev() {
  var ARK_SOM_KOPIERES = ['Innstillinger','Lærere','Fag','Skolerute','Plan_NPT','Plan_NNA','Plan_YFF','Plan_Fag'];
  var prod = SpreadsheetApp.openById(PROD_SHEETS_ID);
  var dev  = SpreadsheetApp.openById(DEV_SHEETS_ID);
  ARK_SOM_KOPIERES.forEach(function(navn) {
    var kilde = prod.getSheetByName(navn);
    if (!kilde) { Logger.log('Hopper over (finnes ikke i prod): ' + navn); return; }
    var maal = dev.getSheetByName(navn);
    if (!maal) maal = dev.insertSheet(navn);
    maal.clearContents();
    var data = kilde.getDataRange().getValues();
    if (data.length) maal.getRange(1, 1, data.length, data[0].length).setValues(data);
    Logger.log('Kopiert: ' + navn + ' (' + data.length + ' rader)');
  });
  Logger.log('Ferdig – alle ark kopiert fra prod til dev.');
}

function sjekkYffGrupper() {
  var ss = SpreadsheetApp.openById(PROD_SHEETS_ID);

  // Hent konfigurerte grupper fra Fag-arket
  var fagArk = ss.getSheetByName('Fag');
  var konfGrupper = [];
  if (fagArk) {
    fagArk.getDataRange().getValues().forEach(function(rad) {
      if (String(rad[0]).trim() === 'YFF') {
        konfGrupper = String(rad[2]).split(',').map(function(g) { return g.trim(); }).filter(Boolean);
      }
    });
  }
  Logger.log('Konfigurerte YFF-grupper: ' + konfGrupper.join(', '));

  // Sjekk Plan_YFF
  var yffArk = ss.getSheetByName('Plan_YFF');
  if (!yffArk) { Logger.log('Plan_YFF ikke funnet'); return; }
  var rader = yffArk.getDataRange().getValues();
  Logger.log('Antall rader i Plan_YFF (inkl. header): ' + rader.length);

  var grupperIData = {};
  var mismatch = [];
  for (var i = 1; i < rader.length; i++) {
    var r = rader[i];
    if (!r[0]) continue;
    var grp = String(r[2]).trim();
    grupperIData[grp] = (grupperIData[grp] || 0) + 1;
    if (grp && konfGrupper.indexOf(grp) < 0) {
      mismatch.push('Rad ' + (i+1) + ': uke=' + r[0] + ', dag=' + r[1] + ', gruppe="' + grp + '", aktivitet=' + r[3]);
    }
  }

  Logger.log('Grupper i data: ' + Object.keys(grupperIData).map(function(k) { return k + ' (' + grupperIData[k] + ' rader)'; }).join(', '));

  if (mismatch.length) {
    Logger.log('⚠️ ' + mismatch.length + ' rader med gruppenavn som ikke matcher konfigurasjonen:');
    mismatch.forEach(function(m) { Logger.log('  ' + m); });
  } else {
    Logger.log('✅ Alle rader har gruppenavn som matcher konfigurasjonen.');
  }
}

function testGemini() {
  var KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_KEY');
  if (!KEY) throw new Error('GEMINI_KEY mangler i Script Properties');
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + KEY;
  var res = UrlFetchApp.fetch(url, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    payload: JSON.stringify({ contents: [{ parts: [{ text: 'Svar med ett ord: hva er 2+2?' }] }] })
  });
  Logger.log('HTTP ' + res.getResponseCode());
  var txt = res.getContentText();
  Logger.log('RAW (500): ' + txt.slice(0, 500));
  try {
    var json = JSON.parse(txt);
    var parts = json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts;
    Logger.log('Parts: ' + JSON.stringify(parts));
    Logger.log('finishReason: ' + (json.candidates && json.candidates[0] && json.candidates[0].finishReason));
  } catch(e) { Logger.log('Parse-feil: ' + e.message); }
}
