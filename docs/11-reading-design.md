# Reading design

The site is 246,000 words, and a single lesson is 13 screens on a laptop and 22 on a phone. This
document records how the reading surface was redesigned for long, continuous sessions: what was
measured before any change, what the evidence says, and what was decided and why. Measurements
are from the longest lesson, `the-log-as-a-backbone`, on Windows at 1440×900 and 375×812.

## What was measured

| Property | Before | Problem |
|---|---|---|
| Characters per line, desktop | **88** | Above the 55–75 range readers find easiest, and above WCAG's 80-character ceiling |
| Share of screen width that is text | **49%** | Nav sidebar (272px) and right rail (240px) sit in peripheral vision for the entire read |
| Paragraph gap | 16px at 18px type, **less than one line** (30px) | Paragraphs barely separate; long passages read as one block |
| `--faint` text contrast | **3.27:1** light, 4.47:1 dark | Fails the 4.5:1 minimum, on the small metadata text where it matters most |
| Body text contrast, dark | 15.2:1 near-white on near-black | High enough to cause halation for readers with astigmatism |
| Rendered serif | Palatino Linotype (Windows), Iowan Old Style (Mac) | Differs by OS; Palatino's x-height is small at 18px |
| Sticky top bar | 64px, always shown | 7% of every screen's height, permanently |
| Contents list below 1180px wide | **None** | A 22-screen mobile lesson has no way to see or jump to its sections |
| First line of body text, mobile | **476px** down | Nearly 60% of the first screen is chrome and header |
| Returning to a half-read lesson | Starts at the top | The reader re-finds their place by skimming |

## What the evidence says

**Line length.** Readers rate a medium line of about 55 characters as easiest on screen, while
very long lines are read faster but with more errors in finding the next line
([Dyson & Kipping; Dyson & Haselgrove](https://www.sciencedirect.com/science/article/abs/pii/S1071581901904586);
[Dyson](https://stu.westga.edu/~ssynan1/literacy/Dyson.pdf)). The long-standing working range is
50–75 characters with ~66 as the target
([review](https://journals.uc.edu/index.php/vl/article/view/5765)). WCAG's AAA visual
presentation criterion caps blocks of text at 80 characters, forbids justification, and asks for
line spacing of at least 1.5
([W3C, SC 1.4.8](https://www.w3.org/WAI/WCAG21/Understanding/visual-presentation.html)).

**Spacing.** At AA, content must survive a user raising line height to 1.5× and paragraph spacing
to 2× the font size
([W3C, SC 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html)). The design
should therefore start close to those values rather than depend on users overriding them.

**Size.** 16px is the floor; 18–20px is recommended specifically for long-form reading
([Marvel](https://marvelapp.com/blog/body-text-small/)).

**Serif or sans.** The research is inconclusive: no reliable legibility difference on screen, and
high-resolution displays removed the old argument against serifs
([NN/g](https://www.nngroup.com/articles/serif-vs-sans-serif-fonts-hd-screens/)). What does matter
is x-height, spacing and design quality at the size used.

**Contrast and glare.** Light-grey secondary text is one of the most common readability failures
([NN/g](https://www.nngroup.com/articles/low-contrast/)); 4.5:1 is the minimum for body-size text
([WebAIM](https://webaim.org/articles/contrast/)). In dark mode, very bright text on a very dark
background produces halation, which is worst for people with astigmatism, a large share of
readers; slightly dimmed text reduces it
([Level Access](https://www.levelaccess.com/blog/accessibility-for-people-with-astigmatism/)).
Warm, lower-glare backgrounds are widely reported as more comfortable for long sessions
([Perkins](https://www.perkins.org/resource/colored-paper-and-readability-test/)), and letting the
reader choose colours is itself part of SC 1.4.8.

**Alignment.** Justified text creates rivers of white space that many readers with dyslexia find
very hard to read, and browser hyphenation is not good enough to fix it
([PowerMapper](https://www.powermapper.com/products/sortsite/rules/accwcag2-f88-1/)).

**Place-keeping.** Losing your position in a long page is a high-cost failure; the recommended
pattern is to preserve or offer to restore it
([NN/g](https://www.nngroup.com/articles/saving-scroll-position/)).

## Decisions

### 1. A reading column, with figures allowed to be wider

Text blocks — paragraphs, lists, headings, callouts, claims — are capped at
`--measure-reading: 35.5rem`, which is about 67 characters per line at 18px Literata. Diagrams, tables,
code, the estimator and the what-breaks tables are allowed out to `--measure-wide: 46rem`, so a
table does not have to squeeze into the text measure and a diagram gets the room it needs.

Using `rem` rather than `ch` keeps the header, body and footer on the same edge, and scales
correctly when the reader changes their browser's text size.

When the right rail is visible, the text sits on the left edge and wide figures extend into the
space beside it. When it is not — narrower screens, or focus mode — the column is centred and wide
figures extend equally on both sides.

### 2. Type

| | Desktop | Mobile |
|---|---|---|
| Body size | 18px | 17px |
| Line height | 1.6 | 1.6 |
| Paragraph gap | 1.15em (about 22px) | 1.15em |
| Typeface | Literata, self-hosted; Georgia only while it loads | same |

The typeface is **Literata**, designed for Google Play Books specifically for long reading on
screens ([TypeTogether](https://www.type-together.com/literata-3)). Before it, the face depended on
the reader's operating system: Palatino Linotype on Windows, whose small x-height and calligraphic
detail slow reading at body sizes, and Iowan Old Style on a Mac. Now every reader gets the same one.

It is self-hosted from `src/app/fonts/` under the SIL Open Font License, so no reader's browser
contacts a third party and no build depends on one being reachable. Only what the text uses is
shipped: Latin, regular and italic, weights 400-700, 79 KB in all. Italic is included so emphasis is
real italic rather than a slanted copy of the upright. While it loads, a fallback whose metrics are
matched to it holds the layout still, so nothing jumps when it arrives.

The body is **18px rather than 19px** because typefaces are compared by x-height, not by pixel
size. Literata's x-height is 0.51 of its size against Georgia's 0.48, so 18px Literata shows the
same lowercase height as the 19px Georgia it replaced (9.2px against 9.1px), and keeps the same
column at about 67 characters.

Headings use `text-wrap: balance` and paragraphs `text-wrap: pretty`, which prevent one-word last
lines where the browser supports them and do nothing where it does not. Text is ragged-right, never
justified, and not auto-hyphenated: the vocabulary is technical, and "idempo-tency" across a line
break costs more than a slightly uneven edge.

### 3. Colour

| Token | Light | Paper (new) | Dark |
|---|---|---|---|
| Text | 15.6:1 | 11.8:1 | 12.8:1 |
| Muted | 7.0:1 | 6.6:1 | 7.4:1 |
| Faint | **4.8:1** (was 3.3) | 4.7:1 | **5.7:1** (was 4.5) |

- **Faint** is darkened (light) and lightened (dark) so every text colour passes 4.5:1.
- **Dark** text is dimmed from near-white to reduce halation; the background stays off-black.
- **Paper** is a new warm, lower-glare theme for long sessions. The theme control now cycles
  Auto → Light → Paper → Dark.

### 4. Less chrome while reading

- **Focus mode** hides the site navigation and the right rail and centres the column. It is a
  toggle in the top bar, off by default, and remembered.
- **The top bar hides when scrolling down and returns when scrolling up**, giving back 64px of
  every screen while reading and staying one gesture away. It never hides while it has focus.

### 5. Knowing where you are

- **The contents list highlights the current section** as you scroll.
- **Below 1180px, where the rail disappears, a collapsible Contents list** appears above the
  lesson, so mobile readers can see and jump to sections.
- **A thin progress line** at the top of the window shows how far through the page you are.

### 6. Picking up where you left off

Leaving a lesson part-way records which section you were in. Coming back offers to continue from
that section. It offers rather than jumps, because being moved without asking is disorienting,
and the reader may have come back for something else.

## Result

Measured in the browser after the change, on the same lesson and viewports.

| Property | Before | After |
|---|---|---|
| Characters per line, desktop | 88 | **67** |
| Typeface | Palatino Linotype on Windows, Iowan on a Mac | **Literata on every system** |
| Body size / line height | 18px / 1.68 | **18px / 1.6** desktop (x-height matched), 17px / 1.6 mobile |
| Paragraph gap | 16px | **21.9px** |
| `--faint` contrast, light / dark | 3.27 / 4.47 | **4.80 / 5.84** |
| Body text contrast, dark | 15.2:1 | **13.0:1**, reducing halation |
| Title and body left edge | different | **shared** |
| Diagrams and tables | text width, 704px | **736px**, beside a 568px text column |
| Navigation and rail while reading | always shown | **removable** with focus mode, remembered |
| Contents below 1180px | none | **collapsible list**, current section marked |
| Sticky top bar | always 64px | **hides while scrolling down** |
| Returning to a half-read lesson | starts at the top | **offered the section you were in**; Continue scrolls there and moves focus |

### Still open

**The first screen on a phone.** The body begins about 590px down an 812px screen. The top bar now
hides once reading starts and focus mode removes the brand bar, but the lesson header — title,
summary and details — was kept, because it is the one thing a reader needs on arrival. Tightening
it further is a judgement about that header rather than about spacing, and it has not been made.

## Browsing pages

The first pass covered the four page types where you read. The index, level, concept and library
pages were measured separately afterwards, at the same two viewports, and had the same problem at
a larger scale: they used a 74rem frame, so anything that was running text ran across all of it.

| Property | Before | After |
|---|---|---|
| List summaries | **178–187** characters a line, 13px | **73**, 14px |
| Glossary definitions | 142 | **72** |
| Level page module questions | 150 | **74** |
| Concept page paragraphs / lists | 128 / 101 | **76 / 73** |
| Page ledes | 84 | **67**, the same as a lesson |
| Title position against a lesson's | different frame, different edge | **identical** (337px at 1440 wide) |
| Level page details on a phone | 30 characters, label beside value | **58**, label above value |

- **One frame for every page.** Browsing pages put their content in the same 46rem column, at the
  same left edge, as the reading pages, and centre it below 1180px as they do. Moving between a
  level page and a lesson no longer moves the title or changes the width being tracked. The
  estimator and the interview simulator have multi-column layouts and opt out with `.is-tool`.
- **Running text capped at 60ch.** A `ch` cap follows the text's own size, so one rule serves 14px
  summaries and 18px ledes alike. The first attempt used 68ch, expecting 75–80 characters, and
  measured 83: `ch` is the width of a zero, which is wider than the average letter. 60ch measures
  at 73.
- **Summaries and glossary definitions from 13px to 14px.** They are read, not only scanned, and
  small grey text is the part of a long session that tires first.
- **Eleven hard-coded widths removed** from page components; the frame now does that job once.
- **Card grids** show two columns instead of three, at the same 360px card width.

## Deliberately not done

- **Justified text or automatic hyphenation**, for the reasons above.
- **Infinite scroll or merged lessons.** A lesson is a unit with an end, and the end is a natural
  resting point.
- **Motion.** The top bar and progress line do not animate for readers who prefer reduced motion.
- **A single-key focus shortcut.** Character-key shortcuts conflict with assistive technology
  unless they can be turned off (SC 2.1.4); a button is enough.
