# Wedding Site

The wedding website for Nhân & Ngân's wedding at Chloe Gallery, District 7, HCMC on
12 Dec 2026. It serves the couple's **friends and coworkers only** — the two families'
guests are invited and tracked offline in the traditional way. English by default with a
Vietnamese toggle.

Visual theme splits across two axes (see `docs/adr/0001-theme-split-venue-vs-street.md`):

- **Shape & color** — the venue's own **Sunset Garden hall** at Chloe Gallery: Rajput/Indo-
  Saracenic architecture (multi-cusped arches, chhatri domes, jali lattice). Palette is
  read honestly off that reference photo by actual visual weight: **marigold** and
  **ivory** are the dominant fields (hero, venue section), **palm green is a true third
  field** (its own section ground — Gallery, RSVP, footer — not just a garnish), **gold** is a
  fine accent (rules, small details) only. Red is *not* part of this axis — it was a
  misread of a thin petal-aisle strip, corrected mid-session.
- **Typography & texture** — **Sài Gòn Xưa** (old Saigon): a 1965 Kodachrome-photograph
  feel plus hand-painted shop-signage lettering (see `inspirations/`), not a generic
  "elegant Indochine" look. Display type: Playfair Display, set as painted-sign caps with
  ♥ heart separators in lacquer red; body: Be Vietnam Pro; imagery gets film grain + warm fade.
  Display face for names/headings: **Hồng Ký 1** (`assets/fonts/HongKy1.ttf`), from the
  free "Sài Gòn Xưa" pack by Thái Hiếu — modeled on a real hand-painted shop sign, free for
  commercial use. Chosen over Playfair Display/Oswald/Roboto Slab and five sibling faces
  from the same pack after a live diacritic stress test.

The two axes meet because red-and-green-and-gold is the Tết palette (lì xì red, lá dong
green, mai gold), so lacquer-red signage lettering still reads as intentional against the
marigold/ivory/palm-green ground — it just isn't *derived from* the venue photo the way the
shape and the other colors are.

## Motif kit

All original SVG in the palette.

**Venue axis** —
- **Door arch** — traced pixel-by-pixel from a reference clip (`assets/door-arch.txt`,
  viewBox `0 0 108 150`): wide body, rounded top corners, subtle shoulder step, big rounded
  central dome, no points, drawn with a double keyline. Hero frame, photo masks, RSVP card.
- **Kangura merlon strip** — the venue's pointed-merlon roofline, and now the page's *only*
  section-transition device (see "Divider consolidation" below). One CSS class
  (`.merlon-edge`) with a colour modifier (`.c-palm` / `.c-marigold` / `.c-ivory`) so the
  *entering* section's own roofline rises into the section above it; used at every
  band-colour seam. Section order (2026-09-29, see "Section order" below): Hero → Story
  (ivory) → Gallery (palm) → Schedule (ivory) → Venue (marigold) → Dress (ivory) → RSVP
  (palm) → FAQ (ivory) → footer (palm) — every section-to-section seam now changes colour,
  so all seven get a merlon (Story→Gallery, Gallery→Schedule, Schedule→Venue, Venue→Dress,
  Dress→RSVP, RSVP→FAQ, FAQ→footer); only Hero→Story needs none, since the hero is a photo
  field, not a colour band. Schedule and RSVP were deliberately reassigned (Schedule:
  palm→ivory, RSVP: ivory→palm) specifically so the reordered sequence never puts two
  same-colour bands back to back — see "Section order" below.

**Street axis (Sài Gòn Xưa — 1965 Saigon specifically, not pan-Vietnamese)** —
- **Gạch bông tile** — interlocking circles, lacquer-red on paper. Full-bleed backdrop
  (`.tex-gach`) behind the **Dress Code** section only — it's literally a floor tile, so a
  tailor-shop floor is the honest place for it. No longer doubles as a divider (see below).
- **Bông gió screen** — mid-century perforated concrete breeze-block geometry (pinwheel /
  prism / rings). Full-bleed backdrop (`.tex-bonggio`) behind the **Gallery** photo grid —
  a concrete screen wall behind a photo studio, at real (not near-zero) opacity.
- **Painted sign panel** — the double-keyline cream signboard from the KIM✦MY / Phương Anh
  street photos, with corner rivets; frame for section headers and the RSVP card. FAQ no
  longer uses this — see "Bảng thông báo" below.
- **♥ heart separator** — between the names and in section labels (replaced the originally
  planned ◆ diamond, commit `90de60a`).

**Bảng thông báo (FAQ section)** — not an abstract motif but a specific object: a real
Vietnamese public bulletin-board case (red-tile roof on struts, gold display frame,
dark-green felt behind glass), with each FAQ question as its own cream notice slip pinned
inside. Replaces an earlier manila "notice board" sign + cửa xếp gate backdrop — a closed
shop gate reads as "keep out," which fought a section whose job is to sound open and
helpful.

Cut as not fitting: a blind-arcade border and a rosette medallion (venue-axis overload).

### Divider consolidation (2026-09-14)

Three unrelated motifs were doing section-transition duty at once — gạch bông as the page
bookends, kangura merlon at interior colour seams, cửa xếp as a strip under the nav — each
justified on paper (one job apiece) but reading as visual noise together: three different
weights, colours and geometries with no family resemblance, plus the nav strip sat directly
under the nav's own red bottom border, doubling up right at the top of the page. Resolved by
making **merlon the only seam device on the page**. Gạch bông keeps its real job (Dress Code
backdrop) but no longer bookends the scroll. **Cửa xếp is fully parked — no live use
anywhere on the site** (it had already lost its FAQ-backdrop job for the same "closed gate"
reason; the nav strip was its last live use and is now cut too). Reference it back only if a
slot opens that's genuinely about an open/closed threshold, not just "make sure it appears."
**Khatam jali cut** (2026-09-12) — it was the weakest of three overlapping lattice motifs
(Khatam / Bông gió / Cửa xếp) and its only surface was the map placeholder, which a real
Maps embed will overwrite anyway; the other two Saigon-specific lattices now do more work
instead. A "star seamless fill" was listed here earlier but never actually built — dropped
from the kit rather than left as an undelivered claim.

### Section order (2026-09-29)

Reordered per design-critique finding: Hero → Story → Schedule → Venue → Dress → FAQ →
Gallery → RSVP (old) buried the emotional payoff (Gallery) and the one action the site
exists for (RSVP) behind task-mode content; Story and Gallery are now paired as one warm
opening, and FAQ moved to the end as reference material read *after* RSVPing, not before.
New order: Hero → Story → Gallery → Schedule → Venue → Dress → RSVP → FAQ.

That reorder put two same-colour band pairs back to back for the first time (Gallery→
Schedule, both palm; Dress→RSVP→FAQ, three ivory sections running together) — visually
"rough," since the merlon seam device only fires on a colour change. Rather than invent a
second seam device (the exact failure "Divider consolidation" already fixed once), Schedule
and RSVP's band colours were swapped: Schedule palm→ivory, RSVP ivory→palm. Both sections'
actual content (sign box, program card, envelope card) is self-contained with its own
explicit colours, so the swap only changes the plain band behind them — no contrast
regressions. Net effect: every section-to-section seam now changes colour, so the merlon
device covers all seven seams with zero new CSS. See the "Kangura merlon strip" entry above
for the resulting colour sequence.

### Parked motif ideas (not built — reference if a slot opens)

- **Phin cà phê disc** — the drip-filter's perforated base as a roundel; RSVP seal / monogram backing.
- **Trái dầu bay** — the spinning two-winged dipterocarp seed; a delicate lacquer-red scatter for the footer / "thank you" / page transitions.
- **Hoa sắt** — wrought-iron villa grille (S-scroll, circle-and-bar); a fine linear border on frames.
- **Rạp chiếu bóng graphics** — vintage cinema blade sign + ornate program-leaflet border; nav device / callouts.
- **Song cửa gỗ (Chợ Lớn fret)** — carved geometric window grille; heavier alternative screen.
- **Thủy ba / sóng nước** — Vietnamese scalloped water-wave border.
- **Trống đồng medallion** — Đông Sơn bronze-drum sunburst; alternative seal.
- **Hồi văn** — angular key-fret border. **Vân mây** — cloud-scroll corner. **Lá me** — tamarind-frond botanical border.
- **Louvered shutter slats**, **terrazzo speckle** — surface textures.

## Language

**Invitation**:
A single invite the couple issues through the website, to one person or one couple (one or
two named primary Guests). It carries a plus-one allowance on top of the primaries: how
many additional attenders that invitee may bring. Identified by a unique random code (≥6 chars, not
derived from the name); the RSVP link is `…/rsvp?c=<code>`. The unit that an RSVP responds
to. Holding a valid code is treated as authorization to respond for that Invitation — no
separate login.
_Avoid_: invite (verb is fine), ticket

**Guest**:
A person invited through the website — a friend or coworker of the couple. Distinct from a
family-invited attendee, who never touches the website.
_Avoid_: attendee (see Attender), invitee

**Plus-one**:
An additional attender an invited Guest brings, permitted only up to their Invitation's
allowance. Named (full name) at RSVP time.
_Avoid_: guest of guest, companion

**Attender**:
Anyone physically coming to the wedding via the website's list — a Guest plus their
plus-ones. The thing the venue headcount counts.
_Avoid_: attendee

**RSVP**:
A Guest's response to their Invitation: yes/no, the named plus-ones they're bringing, and a
required contact email. One RSVP per Invitation, stored as one row updated in place. Editable
via the same link until the deadline of **15 Nov 2026**; after that the link loads
read-only. On submit the system sends a confirmation email that doubles as the guest's
receipt and edit link.
_Avoid_: reply, response, confirmation (the email is "the confirmation email"; the act is an RSVP)

## Before release

- **RSVP form fields aren't finalized yet.** The Apps Script endpoint is wired up
  (`CONFIG.rsvpEndpoint` in the footer script, `build_frame.py`) and posts on submit, but
  the form's actual field set (code, guest names, plus-ones, email, note, attending) hasn't
  been decided. The Apps Script backend was originally built for the older
  `{guestName, attending, dietary}` shape and needs redeploying to match whatever the form
  ends up collecting — don't treat live RSVP submissions as working end-to-end until that's
  confirmed.
