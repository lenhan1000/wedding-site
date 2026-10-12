/**
 * RSVP backend for the wedding site. Bound to the spreadsheet (Extensions > Apps Script).
 *
 * Sheets (create the "Invitations" tab by hand; "RSVPs" is created/headed automatically):
 *   Invitations:  A Code | B Name(s) | C Plus-one allowance | D Email (optional, for reference)
 *   RSVPs:        A Code | B Updated | C Attending | D Guest names | E Plus-ones | F Email | G Note
 *
 * Deploy: Deploy > Manage deployments > edit > New version (Execute as: Me, Access: Anyone).
 * The Invitations sheet is the source of truth for names and plus-one allowance; the page
 * never gets to choose them. A valid code is the only authorization (see CONTEXT.md).
 */

var DEADLINE = new Date("2026-11-15T23:59:59+07:00"); // end of 15 Nov, Saigon time
var SITE_URL = "https://REPLACE-ME.github.io/wedding-site/"; // used in the confirmation email link
var RSVP_HEADERS = ["Code", "Updated", "Attending", "Guest names", "Plus-ones", "Email", "Note"];

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function rsvpSheet_() {
  var sh = ss_().getSheetByName("RSVPs");
  if (!sh) sh = ss_().insertSheet("RSVPs");
  if (sh.getLastRow() === 0) sh.appendRow(RSVP_HEADERS);
  return sh;
}

// Returns {row, name, plus} for a code, or null. Codes compare case-insensitively.
function findInvitation_(code) {
  code = String(code || "").trim().toLowerCase();
  if (code.length < 6) return null;
  var sh = ss_().getSheetByName("Invitations");
  if (!sh || sh.getLastRow() < 2) return null;
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toLowerCase() === code) {
      return { name: String(rows[i][1]), plus: Math.max(0, parseInt(rows[i][2], 10) || 0) };
    }
  }
  return null;
}

// Returns {rowIndex, values} for the code's existing RSVP row, or null.
function findRsvp_(sh, code) {
  code = String(code).trim().toLowerCase();
  if (sh.getLastRow() < 2) return null;
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, RSVP_HEADERS.length).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toLowerCase() === code) return { rowIndex: i + 2, values: rows[i] };
  }
  return null;
}

// GET ?c=CODE -> the invitation (name, allowance), any saved response, and whether the deadline passed.
function doGet(e) {
  try {
    var inv = findInvitation_(e.parameter && e.parameter.c);
    if (!inv) return json_({ ok: false, error: "invalid_code" });
    var existing = findRsvp_(rsvpSheet_(), e.parameter.c);
    var resp = null;
    if (existing) {
      var v = existing.values;
      resp = {
        attending: v[2],
        guests: String(v[3]).split("\n"),
        plus: String(v[4]) ? String(v[4]).split("\n") : [],
        email: v[5],
        note: v[6]
      };
    }
    return json_({ ok: true, name: inv.name, plus: inv.plus, closed: new Date() > DEADLINE, response: resp });
  } catch (err) {
    return json_({ ok: false, error: "server_error" });
  }
}

function clean_(s, max) { return String(s == null ? "" : s).replace(/[\r\u0000]/g, "").trim().slice(0, max); }

// POST text/plain JSON {code, attending, guest1, plus1.., email, note, lang}
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var data = JSON.parse(e.postData.contents);

    var inv = findInvitation_(data.code);
    if (!inv) return json_({ ok: false, error: "invalid_code" });
    if (new Date() > DEADLINE) return json_({ ok: false, error: "closed" });

    var attending = data.attending === "no" ? "No" : "Yes";
    var email = clean_(data.email, 200);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json_({ ok: false, error: "bad_email" });

    var guests = clean_(data.guest1, 200) || inv.name;
    var plus = [];
    if (attending === "Yes") {
      for (var i = 1; i <= inv.plus; i++) {   // allowance comes from the sheet, not the client
        var p = clean_(data["plus" + i], 200);
        if (p) plus.push(p);
      }
    }

    var sh = rsvpSheet_();
    var row = [clean_(data.code, 40), new Date(), attending, guests, plus.join("\n"), email, clean_(data.note, 2000)];
    var existing = findRsvp_(sh, data.code);
    if (existing) sh.getRange(existing.rowIndex, 1, 1, row.length).setValues([row]);
    else sh.appendRow(row);

    var emailSent = true;
    try { sendConfirmation_(row, inv, data.lang === "vi" ? "vi" : "en"); } catch (mailErr) { emailSent = false; }
    return json_({ ok: true, emailSent: emailSent, updated: !!existing });
  } catch (err) {
    return json_({ ok: false, error: "server_error" });
  } finally {
    lock.releaseLock();
  }
}

function sendConfirmation_(row, inv, lang) {
  var attending = row[2] === "Yes";
  var link = SITE_URL + "?c=" + encodeURIComponent(row[0]) + "#rsvp";
  var names = [row[3]].concat(row[4] ? String(row[4]).split("\n") : []).join(", ");
  var t = lang === "vi" ? {
    subject: "Xác nhận RSVP - Nhân & Ngân, 12/12/2026",
    yes: "Cảm ơn bạn! Chúng mình rất mong được gặp: ",
    no: "Cảm ơn bạn đã báo cho chúng mình. Rất tiếc không thể gặp: ",
    edit: "Cần thay đổi? Dùng lại đường dẫn này đến hết ngày 15/11/2026:"
  } : {
    subject: "Your RSVP - Zack & Louise, 12 December 2026",
    yes: "Thank you! We can't wait to celebrate with ",
    no: "Thank you for letting us know. We'll miss ",
    edit: "Need to change something? Use this same link until 15 November 2026:"
  };
  MailApp.sendEmail({
    to: row[5],
    subject: t.subject,
    body: (attending ? t.yes : t.no) + names + ".\n\n" + t.edit + "\n" + link
  });
}
