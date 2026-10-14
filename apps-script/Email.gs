/**
 * Confirmation email for the wedding RSVP: a 1960s Sai Gon air-mail envelope.
 * Pure functions (no Google services), so the same code renders the preview page.
 *
 * Email constraints that shaped this: no web fonts (Georgia, or a Palatino chain for Vietnamese, for headings; Helvetica for body), table layout
 * with inline styles, no images (they are blocked by default in many clients), so the striped
 * border, stamp and postmark are built from coloured table cells and CSS borders. Clients that
 * ignore border-radius just show a square postmark. A plain-text version is built alongside.
 *
 * buildEmail_({lang, attending, names:[...], ceremony, editUrl, siteUrl}) -> {subject, html, text}
 */

var EMAIL_C = { lacquer: "#B5482E", palm: "#2C4E2A", gold: "#B8912F", ivory: "#F5EDDD", paper: "#FCF7EA",
                ink: "#241C15", soft: "#5E5245", hair: "#D9CDB3" };
var EMAIL_ADDRESS = "06 Phan Văn Chương, Tân Mỹ, Quận 7, TP. Hồ Chí Minh";
var EMAIL_MAP_URL = "https://www.google.com/maps/search/?api=1&query=Chloe+Gallery+Phan+Van+Chuong+District+7";

var EMAIL_COPY = {
  en: {
    subject: "Your RSVP — Zack & Louise, 12 December 2026",
    couple: "Zack & Louise",
    airmail: "Par Avion · Máy Bay",
    yesHead: "Thank you!", noHead: "We’ll miss you",
    yesSub: "We can’t wait to celebrate with you.", noSub: "Thank you for letting us know. We’ll be thinking of you.",
    toLabel: "To", received: "RSVP received",
    date: "Saturday, 12 December 2026",
    progMast: "Radio Z&L", progSub: "Today’s programme", onAir: "On air",
    partAfternoon: "Afternoon · Vow ceremony", partEvening: "Evening · Celebration",
    rows: {
      v1: ["15:00", "Welcoming guests", "Please arrive from 15:00 and find your seat."],
      v2: ["16:00", "Vow ceremony", "Zack and Louise exchange their vows, outdoors in the Sunset Garden."],
      v3: ["16:40", "Photos", "We open the floor for pictures together."],
      e1: ["18:00", "Welcoming guests", "Welcome drinks and a warm hello as you find your seat."],
      e2: ["19:00", "Ceremony", "A ceremony with our families, outdoors in the Sunset Garden. Please be seated by 18:45."],
      e3: ["19:30", "Dinner", "A set Vietnamese banquet menu."],
      e4: ["21:30", "Closing ceremony", "Our thanks, a final toast, and goodnight."]
    },
    venueLabel: "The venue", venueName: "The Sunset Garden — Chloe Gallery",
    venueNote: "Outdoors, in an open-air hall. Flats or block heels are easier than stilettos.",
    map: "Open in Maps", cal: "Add to calendar",
    editHead: "Need to change something?", editBtn: "Edit your reply", editNote: "Until 15 November 2026, using this same link.",
    foot: "Zack & Louise · 12 · XII · 2026"
  },
  vi: {
    subject: "Xác nhận RSVP — Nhân & Ngân, 12/12/2026",
    couple: "Nhân & Ngân",
    airmail: "Par Avion · Máy Bay",
    yesHead: "Cảm ơn bạn!", noHead: "Tiếc là không gặp được",
    yesSub: "Chúng mình rất mong được chung vui cùng bạn.", noSub: "Cảm ơn bạn đã báo cho chúng mình. Chúng mình sẽ nhớ bạn.",
    toLabel: "Gửi", received: "Đã nhận phản hồi",
    date: "Thứ Bảy, 12 tháng 12, 2026",
    progMast: "Đài N&N", progSub: "Chương trình hôm nay", onAir: "Đang phát",
    partAfternoon: "Buổi chiều · Lễ trao lời thề", partEvening: "Buổi tối · Tiệc mừng",
    rows: {
      v1: ["15:00", "Đón khách", "Mời bạn đến từ 15:00 và an tọa."],
      v2: ["16:00", "Lễ trao lời thề", "Nhân và Ngân trao lời thề, ngoài trời giữa Sunset Garden."],
      v3: ["16:40", "Chụp ảnh", "Chúng mình mở màn chụp ảnh cùng các bạn."],
      e1: ["18:00", "Đón khách", "Thức uống chào mừng và lời chào thân tình khi bạn vào chỗ."],
      e2: ["19:00", "Nghi thức thành hôn", "Buổi lễ cùng gia đình hai bên, ngoài trời giữa Sunset Garden. Xin an tọa trước 18:45."],
      e3: ["19:30", "Tiệc tối", "Thực đơn tiệc cưới Việt Nam định sẵn."],
      e4: ["21:30", "Tiễn khách", "Lời cảm ơn, một ly chúc cuối cùng và lời chúc ngủ ngon."]
    },
    venueLabel: "Địa điểm", venueName: "Sunset Garden — Chloe Gallery",
    venueNote: "Ngoài trời, trong sảnh mở. Giày bệt hoặc gót vuông sẽ thoải mái hơn gót nhọn.",
    map: "Mở bản đồ", cal: "Thêm vào lịch",
    editHead: "Cần thay đổi?", editBtn: "Chỉnh sửa phản hồi", editNote: "Đến hết ngày 15/11/2026, dùng lại đường dẫn này.",
    foot: "Nhân & Ngân · 12 · XII · 2026"
  }
};

// English keeps Georgia. Vietnamese uses a Palatino chain instead: Georgia has no glyphs for letters with two
// stacked marks (a with circumflex+acute, etc.), so the mail app draws the accents loose. Every font in the
// Vietnamese chain covers all of Vietnamese. Book Antiqua is left out because that is unverified.
var EMAIL_SERIF = "Georgia,'Times New Roman',serif";   // set per email by buildEmail_
function emailSerif_(lang) {
  return lang === "vi" ? "'Palatino Linotype',Palatino,Cambria,'Times New Roman',serif" : "Georgia,'Times New Roman',serif";
}

function emailEsc_(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Google Calendar "add event" link. Ceremony guests start at 15:00 ICT (08:00Z), everyone else 18:00 (11:00Z).
function emailCalUrl_(lang, ceremony) {
  var c = EMAIL_COPY[lang];
  var start = ceremony ? "20261212T080000Z" : "20261212T110000Z", end = "20261212T143000Z";
  return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(c.couple + " — " + (lang === "vi" ? "Tiệc cưới" : "Wedding")) +
    "&dates=" + start + "/" + end + "&location=" + encodeURIComponent("Chloe Gallery, " + EMAIL_ADDRESS) +
    "&details=" + encodeURIComponent(c.venueNote);
}

// A bar of coloured blocks: the air-mail border without needing diagonal stripes or images.
function emailStripe_() {
  var cols = [EMAIL_C.lacquer, EMAIL_C.ivory, EMAIL_C.palm, EMAIL_C.ivory, EMAIL_C.gold, EMAIL_C.ivory];
  var cells = "";
  for (var i = 0; i < 24; i++) {
    cells += '<td width="4.1666%" height="12" style="background:' + cols[i % cols.length] + ';font-size:0;line-height:0;">&nbsp;</td>';
  }
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr>' + cells + "</tr></table>";
}

function emailRows_(c, keys) {
  var out = "";
  for (var i = 0; i < keys.length; i++) {
    var r = c.rows[keys[i]];
    out += '<tr>' +
      '<td width="86" valign="top" style="padding:12px 14px 12px 0;white-space:nowrap;border-top:1px solid ' + EMAIL_C.hair + ';font-family:' + EMAIL_SERIF + ';font-size:18px;font-weight:bold;color:' + EMAIL_C.lacquer + ';">' + r[0] + '</td>' +
      '<td valign="top" style="padding:12px 0;border-top:1px solid ' + EMAIL_C.hair + ';">' +
        '<div style="font-family:' + EMAIL_SERIF + ';font-size:16px;font-weight:bold;color:' + EMAIL_C.ink + ';">' + emailEsc_(r[1]) + '</div>' +
        '<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:20px;color:' + EMAIL_C.soft + ';padding-top:2px;">' + emailEsc_(r[2]) + '</div>' +
      '</td></tr>';
  }
  return out;
}

function emailPart_(label) {
  return '<tr><td colspan="2" style="padding:16px 0 4px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:' + EMAIL_C.soft + ';">' + emailEsc_(label) + '</td></tr>';
}

function emailButton_(href, label, solid) {
  var bg = solid ? EMAIL_C.lacquer : EMAIL_C.paper, fg = solid ? "#FFFFFF" : EMAIL_C.palm, bd = solid ? EMAIL_C.lacquer : EMAIL_C.palm;
  return '<a href="' + emailEsc_(href) + '" style="display:inline-block;background:' + bg + ';color:' + fg + ';border:2px solid ' + bd + ';padding:12px 22px;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;">' + emailEsc_(label) + '</a>';
}

function buildEmail_(o) {
  var lang = o.lang === "vi" ? "vi" : "en", c = EMAIL_COPY[lang], C = EMAIL_C;
  var attending = !!o.attending, ceremony = !!o.ceremony;
  var names = (o.names || []).filter(function (n) { return n; });
  EMAIL_SERIF = emailSerif_(lang);
  var serif = EMAIL_SERIF, sans = "Helvetica,Arial,sans-serif";

  var programme = "";
  if (attending) {
    var inner = "";
    if (ceremony) inner += emailPart_(c.partAfternoon) + emailRows_(c, ["v1", "v2", "v3"]) + emailPart_(c.partEvening);
    inner += emailRows_(c, ["e1", "e2", "e3", "e4"]);
    programme =
      '<tr><td colspan="2" style="padding:26px 0 0;">' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ' + C.hair + ';background:' + C.paper + ';">' +
          '<tr><td style="background:' + C.palm + ';padding:12px 16px;">' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
              '<td style="padding-right:8px;font-family:' + serif + ';font-size:18px;font-weight:bold;color:' + C.ivory + ';">' + emailEsc_(c.progMast) + '<div style="font-family:' + sans + ';font-size:11px;font-weight:normal;letter-spacing:1.5px;text-transform:uppercase;color:#D8CFA8;padding-top:2px;">' + emailEsc_(c.progSub) + '</div></td>' +
              '<td align="right" valign="middle" style="padding-left:10px;white-space:nowrap;"><span style="display:inline-block;white-space:nowrap;background:' + C.lacquer + ';color:#FFFFFF;font-family:' + sans + ';font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;padding:4px 10px;">' + emailEsc_(c.onAir) + '</span></td>' +
            '</tr></table>' +
          '</td></tr>' +
          '<tr><td style="padding:6px 16px 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' + inner + '</table></td></tr>' +
        '</table>' +
      '</td></tr>' +
      '<tr><td colspan="2" style="padding:22px 0 0;">' +
        '<div style="font-family:' + sans + ';font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:' + C.soft + ';">' + emailEsc_(c.venueLabel) + '</div>' +
        '<div style="font-family:' + serif + ';font-size:20px;font-weight:bold;color:' + C.lacquer + ';padding-top:4px;">' + emailEsc_(c.venueName) + '</div>' +
        '<div style="font-family:' + sans + ';font-size:14px;line-height:21px;color:' + C.ink + ';padding-top:4px;">' + emailEsc_(EMAIL_ADDRESS) + '</div>' +
        '<div style="font-family:' + sans + ';font-size:14px;line-height:21px;color:' + C.soft + ';padding-top:6px;">' + emailEsc_(c.venueNote) + '</div>' +
        '<div style="padding-top:14px;">' + emailButton_(EMAIL_MAP_URL, c.map, false) + '&nbsp;&nbsp;' + emailButton_(emailCalUrl_(lang, ceremony), c.cal, false) + '</div>' +
      '</td></tr>';
  }

  var toLine = names.length ? emailEsc_(names.join(", ")) : "";
  var html =
    '<!DOCTYPE html><html lang="' + lang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>' + emailEsc_(c.subject) + '</title></head>' +
    '<body style="margin:0;padding:0;background:' + C.palm + ';">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + C.palm + ';"><tr><td align="center" style="padding:24px 12px;">' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:' + C.ivory + ';border-collapse:collapse;">' +
        '<tr><td>' + emailStripe_() + '</td></tr>' +
        '<tr><td style="padding:22px 26px 26px;">' +
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
            // top row: air-mail label (left), stamp + postmark (right)
            '<tr><td valign="top" style="font-family:' + sans + ';font-size:11px;font-weight:bold;letter-spacing:2.5px;text-transform:uppercase;color:' + C.lacquer + ';">' + emailEsc_(c.airmail) + '&nbsp;&#9992;&#xFE0E;</td>' +
              '<td align="right" valign="top" width="150">' +
                '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right"><tr>' +
                  '<td valign="middle" style="padding-right:6px;"><div style="width:62px;height:62px;border:2px solid ' + C.ink + ';border-radius:50%;text-align:center;font-family:' + sans + ';font-size:8px;font-weight:bold;line-height:11px;color:' + C.ink + ';opacity:.7;"><div style="padding-top:20px;">S&Agrave;I G&Ograve;N<br>12&middot;XII&middot;26</div></div></td>' +
                  '<td valign="top"><div style="border:2px dashed ' + C.lacquer + ';background:#F8E6D4;padding:6px 8px;text-align:center;font-family:' + serif + ';font-size:10px;line-height:13px;color:' + C.lacquer + ';">&hearts;<br><b>12&middot;XII</b><br>2026</div></td>' +
                '</tr></table>' +
              '</td></tr>' +
            // heading
            '<tr><td colspan="2" align="center" style="padding:20px 0 0;">' +
              '<div style="font-family:' + serif + ';font-size:34px;line-height:38px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:' + C.lacquer + ';">' + emailEsc_(attending ? c.yesHead : c.noHead) + '</div>' +
              '<div style="font-family:' + serif + ';font-size:16px;font-style:italic;line-height:24px;color:' + C.soft + ';padding-top:8px;">' + emailEsc_(attending ? c.yesSub : c.noSub) + '</div>' +
              '<div style="padding-top:14px;"><span style="display:inline-block;border:1px solid ' + C.palm + ';color:' + C.palm + ';font-family:' + sans + ';font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;padding:4px 10px;">&#10003;&nbsp;' + emailEsc_(c.received) + '</span></div>' +
            '</td></tr>' +
            // addressee block
            (toLine ? '<tr><td colspan="2" style="padding:22px 0 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ' + C.hair + ';border-bottom:1px solid ' + C.hair + ';padding:12px 0;font-family:' + serif + ';font-size:18px;color:' + C.ink + ';"><span style="font-family:' + sans + ';font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:' + C.soft + ';">' + emailEsc_(c.toLabel) + '&nbsp;&nbsp;</span><i>' + toLine + '</i></td></tr></table></td></tr>' : '') +
            // date
            (attending ? '<tr><td colspan="2" align="center" style="padding:18px 0 0;font-family:' + sans + ';font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:' + C.palm + ';">' + emailEsc_(c.date) + '</td></tr>' : '') +
            programme +
            // edit
            '<tr><td colspan="2" align="center" style="padding:30px 0 0;">' +
              '<div style="font-family:' + serif + ';font-size:18px;font-weight:bold;color:' + C.ink + ';">' + emailEsc_(c.editHead) + '</div>' +
              '<div style="padding-top:12px;">' + emailButton_(o.editUrl, c.editBtn, true) + '</div>' +
              '<div style="font-family:' + sans + ';font-size:12px;line-height:18px;color:' + C.soft + ';padding-top:10px;">' + emailEsc_(c.editNote) + '</div>' +
            '</td></tr>' +
            '<tr><td colspan="2" align="center" style="padding:26px 0 0;font-family:' + sans + ';font-size:11px;font-weight:bold;letter-spacing:2.5px;text-transform:uppercase;color:' + C.gold + ';">&hearts;&nbsp;' + emailEsc_(c.foot) + '&nbsp;&hearts;</td></tr>' +
          '</table>' +
        '</td></tr>' +
        '<tr><td>' + emailStripe_() + '</td></tr>' +
      '</table>' +
    '</td></tr></table></body></html>';

  // plain-text fallback
  var t = [];
  t.push((attending ? c.yesHead : c.noHead) + (names.length ? " " + names.join(", ") : ""));
  t.push(attending ? c.yesSub : c.noSub);
  if (attending) {
    t.push("", c.date);
    var keys = (ceremony ? ["v1", "v2", "v3"] : []).concat(["e1", "e2", "e3", "e4"]);
    keys.forEach(function (k) { t.push(c.rows[k][0] + "  " + c.rows[k][1] + " - " + c.rows[k][2]); });
    t.push("", c.venueName, EMAIL_ADDRESS, c.venueNote, EMAIL_MAP_URL);
  }
  t.push("", c.editHead, o.editUrl, c.editNote);
  return { subject: c.subject, html: html, text: t.join("\n") };
}
