# UC Te Reo Māori CVCV Speech Audiometry

Put the audio files in `sounds/`. The app matches sound files using the text before the first underscore, so `hēki_+1.7dB.wav` is resolved as `hēki`. It tries the known filenames first, then `.mp3` and `.wav`.

Open `index.html` directly for local testing, or host the folder on GitHub Pages.

## Training mode

Training mode plays a pre-recorded "client" response after each stimulus so
clinicians can practise phoneme scoring with immediate feedback.

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
