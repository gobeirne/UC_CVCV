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

  /* Level relationship between the two word sets. Leave this out to use the
     built-in default. */
  levels: {

    /* Gain adjustment applied to EVERY sound played from the sounds_cvc/ folder
       (the NZ English CVC words AND the CVC 1 kHz calibration tone), as a signed
       dB figure — negative attenuates. The CVC recordings are 5.07 dB hotter in
       absolute level than the te reo CVCV recordings, so -5.07 dB puts both word
       sets on the same effective level scale under a single audiometer
       calibration, and makes the CVC and CVCV 1 kHz tones meter to the same
       reading at one dial setting.

       This is only the shipped DEFAULT. A clinician can change it in-app from the
       Calibration panel (behind a confirmation); that saved value overrides this.
       Change this line only if your CVC recordings have a different relationship
       to the CVCV set. Re-calibrate after any change. */
    cvcFileGainDb: -5.07
  },

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
