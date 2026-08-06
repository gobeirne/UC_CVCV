/* UC Speech Audiometry — local configuration
   ────────────────────────────────────────────────────────────────
   Edit the numbers below and reload. No build step, no rebuild of
   app.js. Anything you leave out falls back to the defaults in
   app.js, so it is safe to delete a line — or the whole file.

   Loaded as a plain script (not fetched as JSON) so that opening
   index.html straight off the disk keeps working; a fetch() of a
   .json file is blocked by the browser on file:// URLs.

   All timings are in milliseconds. */

window.APP_CONFIG = {

  timing: {

    /* Silence between the end of the "Kōrero mai…" carrier and the
       start of the kupu. Te reo Māori only — the NZ English carrier
       is baked into each recording, so this does not apply there. */
    carrierToKupuGapMs: 750,

    /* Training mode: silence between the end of the kupu and the
       pre-recorded client response. */
    kupuToResponseGapMs: 600,

    /* Pause after a trial is drawn on screen, before playback starts.
       Lets the UI paint first so the clinician sees the kupu they are
       about to hear. */
    autoplayDelayMs: 250,

    /* First trial of a list with masking on: how long the masker runs
       alone before the first carrier, so the ear settles into it. */
    maskerLeadInMs: 3100,

    /* Fast scoring (number keys): how long to wait after a score is
       entered before advancing. This is the window in which a
       mis-keyed score can still be corrected. */
    advanceDelayMs: 600
  }
};
