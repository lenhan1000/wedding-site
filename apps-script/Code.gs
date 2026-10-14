/**
 * RSVP backend for the wedding site. Bound to the spreadsheet (Extensions > Apps Script).
 *
 * The page (index.html) owns the invitation tiers: it maps the ?c= code to plus-one
 * allowance and ceremony access, and posts the result. This script trusts what the page
 * sends (we trust our guests), but caps plus-one names at MAX_PLUS and enforces the deadline.
 *
 * Sheet: "RSVPs" is created automatically on the first submission, one row per email
 * (resubmitting with the same email edits that row):
 *   Email | Updated | Code | Tier | Ceremony | Attending | Name | Plus-ones | Note
 * If an old "RSVPs" tab from the earlier form exists, clear it (or delete it) first.
 *
 * Deploy: Deploy > Manage deployments > edit > New version (Execute as: Me, Access: Anyone).
 */

var DEADLINE = new Date("2026-11-15T23:59:59+07:00"); // end of 15 Nov, Saigon time
var SITE_URL = "https://REPLACE-ME.github.io/wedding-site/"; // used in the confirmation email link
var MAX_PLUS = 4;

var RSVP_HEADERS = ["Email", "Updated", "Code", "Tier", "Ceremony", "Attending", "Name", "Plus-ones", "Note"];

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function rsvpSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName("RSVPs") || ss.insertSheet("RSVPs");
  if (sh.getLastRow() === 0) sh.appendRow(RSVP_HEADERS);
  return sh;
}

function normEmail_(s) { return String(s || "").trim().toLowerCase(); }

// Returns {rowIndex, values} for this email's existing RSVP row, or null.
function findRsvp_(sh, email) {
  email = normEmail_(email);
  if (!email || sh.getLastRow() < 2) return null;
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, RSVP_HEADERS.length).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (normEmail_(rows[i][0]) === email) return { rowIndex: i + 2, values: rows[i] };
  }
  return null;
}

// GET [?e=EMAIL] -> whether RSVPs are closed, plus the saved reply for that email (edit links).
function doGet(e) {
  try {
    var p = (e && e.parameter) || {};
    var resp = null;
    var existing = findRsvp_(rsvpSheet_(), p.e);
    if (existing) {
      var v = existing.values;
      resp = {
        email: v[0], attending: v[5], name: v[6],
        plus: String(v[7]) ? String(v[7]).split("\n") : [], note: v[8]
      };
    }
    return json_({ ok: true, closed: new Date() > DEADLINE, response: resp });
  } catch (err) {
    return json_({ ok: false, error: "server_error" });
  }
}

function clean_(s, max) { return String(s == null ? "" : s).replace(/[\r\u0000]/g, "").trim().slice(0, max); }

// POST text/plain JSON {code, tier, ceremony, attending, guest1, plus1.., email, note, lang}
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var data = JSON.parse(e.postData.contents);

    if (new Date() > DEADLINE) return json_({ ok: false, error: "closed" });

    var email = clean_(data.email, 200);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json_({ ok: false, error: "bad_email" });
    var name = clean_(data.guest1, 200);
    if (!name) return json_({ ok: false, error: "bad_name" });

    var attending = data.attending === "no" ? "No" : "Yes";
    var ceremony = data.ceremony === true || data.ceremony === "true";
    var plus = [];
    if (attending === "Yes") {
      for (var i = 1; i <= MAX_PLUS; i++) {
        var p = clean_(data["plus" + i], 200);
        if (p) plus.push(p);
      }
    }

    var sh = rsvpSheet_();
    var row = [email, new Date(), clean_(data.code, 40), clean_(data.tier, 40) || "Guest", ceremony ? "Yes" : "No",
               attending, name, plus.join("\n"), clean_(data.note, 2000)];
    var existing = findRsvp_(sh, email);
    if (existing) sh.getRange(existing.rowIndex, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);

    var emailSent = true;
    try { sendConfirmation_(row, ceremony, data.lang === "vi" ? "vi" : "en"); }
    catch (mailErr) { emailSent = false; console.error("Confirmation email failed: " + mailErr); }  // see Executions in the editor
    return json_({ ok: true, emailSent: emailSent, updated: !!existing });
  } catch (err) {
    return json_({ ok: false, error: "server_error" });
  } finally {
    lock.releaseLock();
  }
}

// Builds the air-mail envelope email (Email.gs) and sends it with a plain-text fallback.
function sendConfirmation_(row, ceremony, lang) {
  var email = row[0], code = row[2];
  var names = [row[6]].concat(row[7] ? String(row[7]).split("\n") : []);
  var editUrl = SITE_URL + "?" + (code ? "c=" + encodeURIComponent(code) + "&" : "") + "e=" + encodeURIComponent(email) + "#rsvp";
  var m = buildEmail_({ lang: lang, attending: row[5] === "Yes", names: names, ceremony: ceremony, editUrl: editUrl });
  MailApp.sendEmail({ to: email, subject: m.subject, body: m.text, htmlBody: m.html,
                      name: lang === "vi" ? "Nhân & Ngân" : "Zack & Louise" });
}

// Run this ONCE from the editor (select it in the function dropdown, click Run) to grant the
// "send email as you" permission. Deploying a new version never asks for it, so without this
// every confirmation email fails and the form says "couldn't send the confirmation email".
function authorizeMail() {
  MailApp.sendEmail(Session.getActiveUser().getEmail(), "RSVP mail test", "Mail permission works.");
}
