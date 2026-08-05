# UC Speech Audiometry — Te reo Māori & NZ English

A static, GitHub-Pages-friendly speech-audiometry tool supporting two languages,
selectable on the setup screen.

Open `index.html` directly for local testing, or host the folder on GitHub Pages.

## Languages

**Te reo Māori** — CVCV kupu (4 phonemes), a separate "Kōrero mai…" carrier
phrase, vowel-length and dialect equivalence, an optional advanced response-phoneme
picker, and Training mode (below).

**NZ English** — CVC words (3 phonemes). The carrier phrase is embedded in each
stimulus file, so there is no separate carrier and "replay" plays the whole file
again. Scoring is out of 3 (three fast-score buttons and three phoneme tiles); the
advanced response-phoneme picker and Training mode are not used. "Word" replaces
"kupu" throughout.

The selector on the setup page tags each list added to the queue with the language
chosen at that moment, so a queue can freely mix both languages (e.g. three lists in
one language, then three in the other). Every result records its own language and
phoneme count, so percentages never mix 3- and 4-phoneme data. The language can be
switched at any time between lists.

## Sound files

### Te reo Māori — `sounds/`

112 files, all `.mp3`, all filtered to the ILTASS (international long-term
average speech spectrum):

| Files | What |
|---|---|
| 100 | Kupu, one per word in the ten lists — named exactly for the kupu, e.g. `hēki.mp3` |
| 11 | Carrier phrase, `kōrero_mai_01.mp3` … `kōrero_mai_11.mp3`, chosen at random per trial |
| 1 | `noise.mp3` — calibration signal and masker |

Filenames carry no calibration suffix. The earlier `hēki_+1.7dB.wav` convention
is gone: the set is level-matched at source, so there is nothing per-file left to
correct. The app still strips a trailing `_+1.7dB` when resolving a name, so
legacy recordings dropped into `sounds/` continue to work. Resolution order is
the known filename, then `.mp3`, then `.wav`.

Note that names are matched on the *whole* stem, not the text before the first
underscore — otherwise `kōrero_mai_01` would collapse to `kōrero`.

### NZ English — `sounds_cvc/`

Matched by `NNNN_Word` stem, with the list/item number in the filename itself
(`0101_Pass.mp3` is list 1, item 1). Files are `.mp3`. Because casing is
inconsistent across the recordings and static hosts are case-sensitive, the app
tries the stem as listed, then a Capitalised variant, then an all-lowercase one.
The carrier phrase is part of each recording.

## Levels and calibration

The Māori set has two properties that the level maths depends on:

- All 100 kupu share one momentary loudness: **−22.5 LUFS**.
- `noise.mp3` has a mean of **−25.85 dB(A)**, which is the average of the
  momentary dB(A) values of those 100 kupu.

Because those two figures coincide, measuring `noise.mp3` on the sound level
meter measures the mean speech level directly. The dB(A) figure entered at
calibration *is* the reference speech level — no offset sits between them. The
relationship is recorded in `app.js` as `AUDIO_SPEC` and
`SPEECH_NOISE_OFFSET_DB` (zero for this set). If the noise is ever re-rendered
at a different level, `SPEECH_NOISE_OFFSET_DB` is the one number to change.

To calibrate: turn device volume fully up, play the calibration noise, measure
the output in dB(A), then stop and enter the value. Uncalibrated, everything
plays at unity gain — still valid relative to itself, since the set is
level-normalised, but with no absolute reference.

The same coincidence puts the masker and stimulus dials on a common scale, so
SNR is simply stimulus dB(A) minus masker dB(A). The masker status pill shows it
live during a test.

### Carrier randomisation

The 11 carriers are drawn without replacement from a shuffled bag that reshuffles
when empty, rejecting any reshuffle that would repeat a carrier across the seam.
Over a ten-kupu list that gives an even spread with no back-to-back repeats —
unlike an independent random pick, which would collide roughly once every 11
trials.

### Macrons

Word lists and filenames are compared in NFC (pre-composed `ā` = U+0101). If a
file is uploaded with decomposed macrons (NFD, common from macOS), the app falls
back to the NFD spelling rather than failing to find it — the two spellings are
indistinguishable in a directory listing, so the mismatch is otherwise invisible.

## Performance-intensity plot

When the client has data in only one language, the plot shows that language. When
both languages have data, a tab controller appears above the plot so each language
is viewed on its own axes.

Within a plot: left = dashed line, right = solid line, with points connected across
levels. Markers — blue × (left), red ○ (right), B/S/A/U for binaural / sound field
/ aided / unaided. Masking — masked left is a double-× (two overlapping ×'s), masked
right is a filled ●. Every measured list is always plotted and always appears in the
report; where two points share a level, the connecting line passes through the
masked point (the more robust evidence) while both points remain drawn.

The report stacks one PI plot, summary table, and trial table per language.

## Training mode

Training mode (Te reo Māori only) plays a pre-recorded "client" response after each
stimulus so clinicians can practise phoneme scoring with immediate feedback.

Put training assets in `training/`:

1. **Client profiles** — `Client01.json`, `Client02.json`, … (the app probes
   `Client01`–`Client12` on the Training button). Each profile:

```json
{
  "id": "Client03",
  "name": "Aroha",
  "age": 67,
  "iwi": "Ngāi Tahu",
  "notes": "Elderly speaker, clear articulation",
  "dialectSubstitutions": {
    "ŋ": { "substitute": "k", "message": "Some speakers use /k/ for /ng/ — this is a valid regional variant, not a scoring error" }
  },
  "files": [
    "Client03_ngutu_k_u_t_u.mp3"
  ]
}
```

2. **Response recordings** — named `ClientXX_word_c1_v1_c2_v2.mp3`, where the
   four slots after the word are the phonemes the client actually produced:
   - an empty slot is an omission, e.g. `Client01_hine____e.mp3` = only the
     final /e/ was produced
   - diphthongs occupy one vowel slot, e.g. `Client01_kurī_k_au_ɾ_i.mp3`
   - run-on additions contaminate the final slot, e.g.
     `Client01_whare_f_a_ɾ_enui.mp3` ("wharenui") scores the final phoneme
     incorrect

   When a word has multiple recordings, one is chosen at random per trial.

Response recordings play binaurally at a fixed comfortable level (65 dB(A) when
calibrated), independent of the stimulus level, so the trainee always hears them
clearly.

Scoring rules applied automatically: long/short vowel pairs (e/eː etc.) are
equivalent; dialect substitutions listed in the profile score as **correct**
anywhere they occur, with the teaching message shown to the trainee.
