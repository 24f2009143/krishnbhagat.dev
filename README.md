# krishnbhagat.dev

I make things.

Some of them work. Some of them don't fit anything yet. I keep them all, because the
next thing I build is usually made out of the last few things I tried.

This repository is my website: **[krishnbhagat.dev](https://krishnbhagat.dev)**

---

## What you'll find

**The homepage** tells one small story. What if Icarus didn't receive his wings, but
built them himself, out of everything he had tried? Every piece in those wings is
something I actually worked out: a heap, a shortest-path graph, a recurrence, a
decision tree, a regression fit. Scroll, and the pieces come together. The sun at the
end isn't a finish line. It's just the next idea.

**The Lab** is at the bottom of the homepage. It's a cabinet of things I've built, things I
tested to see what would happen, things I wrote down, and things that aren't finished.
A few of them you can play with: run a graph layout step by step, see which level of a
recursion does the work, look through the results of a practice simulation.

**[nerdhub](https://krishnbhagat.dev/nerdhub/)** is where my study sites live.

## nerdhub

When I study a subject, I build a site for it. I take the course's past papers and turn
them into a place to read, practise and revise. Notes, past questions, mock tests,
flashcards, a list of my mistakes, a plan.

Each subject also gets its own design idea, taken from the subject itself:

| Subject | The idea |
|---|---|
| **PDSA Quiz 2** | The course is a graph. Every topic is visited, frontier or unvisited. |
| **MLT** | Handwritten notes in pen-blue ink, every claim tagged by where it came from. |
| **MAD 1** | The whole course is a request and a response, so every screen is drawn that way. Still being built, one topic at a time. |

There will be many more subjects. This list is meant to keep growing.

Every study site works without signing in; your progress stays in your browser.
Sign in with Google if you want it synced across your devices.

## How it's built

No framework, no build step. Plain HTML, CSS and JavaScript, served by GitHub Pages.
The drawings are SVG, computed once by a small Python script and saved as plain HTML,
so the pages need nothing to run. The motion is a layer on top: switch it off and every
drawing is still there.

```
index.html            the homepage           (generated, don't edit by hand)
nerdhub/index.html    the nerdhub page       (generated, don't edit by hand)
nerdhub/<subject>/    one study site per subject, each its own little app
assets/               shared styles, fonts, scripts, share images
tools/build-home.py   writes the two generated pages and the share-image sources
tools/lab.json        what's in the Lab
firestore.rules       who can read and write synced progress
docs/                 setup notes
```

### Run it locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

### Add a new subject

1. Build the study site in `nerdhub/<subject>/`.
2. Add its plate to `nerdhub_page()` in `tools/build-home.py`.
3. Add its address to `sitemap.xml`, so search engines find it.
4. Run `python3 tools/build-home.py` and commit what changed.

### Add something to the Lab

Add an entry to `tools/lab.json`, run `python3 tools/build-home.py`, commit.
Only put in things that are real and can be pointed at.

---

Still building. Come back later; there will be something new.
