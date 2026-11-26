# MAD 1 design concept

Starting point (what works in MLT): calm paper background, high-contrast ink, a bookish serif for reading,
a plain sans for the interface, highlighter emphasis, no gradients or shadows, progress rings in a left sidebar,
a hub-style home with a hero and one card per topic. Nothing visual is taken from PDSA (no Red Hat type, no
teal-on-grey graph style, no node discs).

## Direction 1: "The Exchange" (built)

**Idea.** The whole course is about one conversation: a browser sends a request, a server sends a response.
Every screen is drawn as that conversation. What *you* do (questions, Continue) is a request, in vermilion;
what comes *back* (answers, progress, done) is a response, in deep teal. Topic cards are HTTP messages with a
mono request line (`GET /topic/flask-core`) and a status (`200 Done`, `206 In progress`, `— not started`).

**Palette** (contrast is text on paper / on card; WCAG AA needs 4.5):

| Token | Light | Dark | Contrast light | Contrast dark |
|---|---|---|---|---|
| paper | `#F5F3EC` warm newsprint | `#121418` | | |
| card | `#FFFFFF` | `#1B1E25` | | |
| ink | `#1A1D24` | `#ECE9E1` | 15.2 / 16.9 | 15.2 / 13.7 |
| muted | `#5A606D` | `#A19D94` | 5.7 / 6.3 | 6.8 / 6.2 |
| request (vermilion) | `#B3391B` | `#FF9070` | 5.4 / 6.0 | 8.3 / 7.5 |
| response (teal) | `#0A6964` | `#5ECFC3` | 5.9 / 6.5 | 9.8 / 8.9 |
| pending (amber) | `#8A5C00` | `#F2C14E` | 5.2 / 5.8 | 11.0 / 9.9 |
| highlighter (mint wash) | `#C9EFDD` | `rgba(94,207,195,.20)` | background only | background only |

**Type** (bundled, offline): Source Serif 4 for reading (a Literata-like bookish serif), Inter for the
interface, JetBrains Mono for code and request lines. MLT uses Literata/Plex and PDSA Red Hat, so this pair
is new to the hub.

**Brand mark.** A rounded square holding two arrows: an upper vermilion arrow pointing right (request) and a
lower teal arrow pointing left (response).

**Hero.** On the left a browser window, on the right a server. Between them a request line `GET /` travels
right and a `200 OK` response line travels back, with a short envelope on each. Home composition: hero with
title, the next-step card and the exam switcher; then one HTTP-message card per topic; then the course route
and the marks-per-block bars.

**Progress ring.** A segmented ring: one arc segment per lesson of the topic, filled in teal as lessons and
checks are done, dashed for topics not yet written. The centre shows the percentage.

**Callouts.** Message slips with a mono header tab (`def`, `rule`, `example`, `trap`, `analogy`, `remember`,
`notice`, `tip`, `extra`) and a small glyph: `#`, `ƒ`, `▸`, `!`, `≈`, `✓`, `→`, `?`, `+`. Traps get a
vermilion edge, rules and definitions a teal edge, tips a mint wash.

**Micro-interaction.** A correct answer shows a small `200 OK` stamp that slides in beside the verdict
(160 ms). With reduced motion, it simply appears.

**Microcopy voice.** Short, friendly HTTP puns kept to labels only, never in explanations:
"Next request" (the Continue card), "Every page starts with a request." (hero), "200 OK" (correct),
"Send" kept as plain "Submit" so actions stay obvious.

## Direction 2: "Blueprint" (not built unless chosen)

**Idea.** A web app drawn as an architect's blueprint: cyanotype paper, a faint grid, white construction lines,
amber pencil notes. Lessons are sheets, topics are floors of a building plan.

| Token | Light | Dark |
|---|---|---|
| paper | `#EAF1F7` | `#0D2238` |
| card | `#FFFFFF` | `#123050` |
| ink | `#0E2A44` (12.9) | `#E6EFF7` (13.9) |
| muted | `#46607A` (5.7) | `#9FB6CC` (7.7) |
| pencil amber | `#9C4F00` (5.2) | `#F4B740` (9.0) |
| done green | `#1F6F4A` (5.4) | `#7DDDB1` (9.9) |

Type: Inter and JetBrains Mono only (technical, no serif). Mark: a square floor plan with a door gap.
Rings become dimension arcs with tick marks; callouts are sticky pencil notes.

Direction 1 is built because it grows out of the subject itself (requests and responses) and keeps the
serif reading column you liked in MLT.

## Revision 3: calmer, reads like a chapter (after comparing with MLT again)

The first build of "The Exchange" was busy: vermilion on every button and label, the code font on almost half
the text, three navigation strips, and lessons that opened with a quiz. Revision 3 keeps the subject idea and
moves the rest towards what makes MLT pleasant to study from.

- **Colour:** near-white paper `#FAFAF8` (dark `#111316`), slate ink, one accent: response teal `#0B6B66`
  (dark `#5ECFC3`). Vermilion now appears only in the request/response drawings. Highlighter is soft yellow.
- **Type:** Inter for headings and interface, Source Serif at 18px for reading, JetBrains Mono only for code.
- **One map:** the rail lists the open topic's lessons under it (current one highlighted, read ones darker);
  the separate lesson column is gone on wide screens and the duplicate chip row is gone everywhere.
- **Teach, then test:** a topic opens with an orientation (what you will learn and why, the PYQ table by
  sub-topic, the question patterns with a first move, exam wording that points to the method, how it connects,
  how to use the page). A lesson opens with one plain sentence; the warm-up question is folded away.
- **Kept:** the arrows mark, the browser–server hero, segmented rings, the "200 OK" stamp, the reading bar.
