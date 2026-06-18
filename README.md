# UC Speech Audiometry — Te reo Māori & NZ English

A static, GitHub-Pages-friendly speech-audiometry tool supporting two languages,
selectable on the setup screen.

Open `index.html` directly for local testing, or host the folder on GitHub Pages.

## Languages

**Te reo Māori** — CVCV words (4 phonemes), a separate "Kōrero mai…" carrier
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

- **Te reo Māori** files go in `sounds/` and are matched using the text before the
  first underscore, so `hēki_+1.7dB.wav` is resolved as `hēki`. The app tries the
  known filenames first, then `.mp3` and `.wav`.
- **NZ English** files go in `sounds_cvc/` and are matched by their `NNNN_Word`
  stem — the list/item number is in the filename itself (e.g. `0101_Pass.wav` is
  list 1, item 1), trying `.wav` then `.mp3`. The carrier phrase is part of each
  recording.

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

Scoring rules applied automatically: long/short vowel pairs (e/eː etc.) are
equivalent; dialect substitutions listed in the profile score as **correct**
anywhere they occur, with the teaching message shown to the trainee.
