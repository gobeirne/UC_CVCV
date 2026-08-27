/* ─────────────────────────────────────────────────────────────────────────
   masking_ui.js — Wires the Masking engine to the interface.

   Reads the current test ear (stimulus routing), the presentation level, and the
   transducer, asks Masking.recommend(), and:
     • shows a plain-language recommendation ("Mask the left ear at 55 dB EM …");
     • flags over-masking;
     • flags missing data (e.g. no bone conduction → SRT fallback or none);
     • offers Apply (sets masker ear + level once) and Auto (keeps the masker
       tracking the presentation level as it moves, with a gentle ramp).

   The engine is pure; this module owns the DOM and the ramp. app.js calls
   MaskingUI.onLevelChanged() whenever the presentation level moves (fixed edit
   or adaptive step) so Auto can retrack.
   ──────────────────────────────────────────────────────────────────────── */
(function (global) {
  "use strict";
  const $ = (id) => document.getElementById(id);

  // Gentle ramp: don't move the masker unless the target differs by ≥ this, and
  // when it does move, step toward it by at most this much per update so it
  // doesn't audibly pump on every reversal.
  const RAMP_DEADBAND_DB = 3;
  const RAMP_MAX_STEP_DB = 5;

  function autoOn() { const c = $("maskingAuto"); return !!(c && c.checked); }

  // Current stimulus (test) ear.
  function testEar() {
    const v = $("stimEar") ? $("stimEar").value : "";
    return (v === "left" || v === "right") ? v : null;
  }
  function transducer() { return $("transducer") ? $("transducer").value : "other"; }

  // Current presentation level (dB). In an adaptive track, the live level; else
  // the adaptive start level or the fixed masker's paired stimulus level.
  function presentationLevel() {
    // Adaptive running: use the current queue item's level.
    if (global.state && global.state.adaptive && typeof global.currentQueueItem === "function") {
      const q = global.currentQueueItem();
      if (q && Number.isFinite(Number(q.levelDbA))) return Number(q.levelDbA);
    }
    // Else the adaptive start-level field, if present and set.
    const sf = $("adaptiveStartLevel");
    if (sf && sf.value !== "" && Number.isFinite(Number(sf.value))) return Number(sf.value);
    return null;
  }

  // ── IAA settings wiring ───────────────────────────────────────────────
  function loadIaaIntoFields() {
    if (!global.Masking) return;
    const iaa = global.Masking.iaaSettings();
    if ($("iaa_supraaural")) $("iaa_supraaural").value = iaa.supraaural;
    if ($("iaa_insert")) $("iaa_insert").value = iaa.insert;
    if ($("iaa_airpods")) $("iaa_airpods").value = iaa.airpods;
  }
  function wireIaaFields() {
    [["iaa_supraaural","supraaural"],["iaa_insert","insert"],["iaa_airpods","airpods"]]
      .forEach(([id, key]) => {
        const el = $(id);
        if (el && !el.__wired) {
          el.__wired = true;
          el.addEventListener("input", () => {
            if (global.Masking && el.value !== "") global.Masking.setIaa(key, Number(el.value));
            if (global.saveSession) global.saveSession();
            render();
          });
        }
      });
  }

  // ── Recommendation rendering ──────────────────────────────────────────
  function render() {
    const advice = $("maskingAdvice");
    const actions = $("maskingAdviceActions");
    if (!advice || !global.Masking) return;

    const te = testEar();
    const PL = presentationLevel();
    if (!te || PL == null) {
      advice.textContent = "Masking guidance needs a stimulus ear and a presentation level.";
      advice.classList.remove("pi-warn");
      if (actions) actions.style.display = "none";
      return;
    }

    const rec = global.Masking.recommend({ testEar: te, PL, transducer: transducer() });
    const maskEar = rec.maskEar;

    if (rec.rule === "none") {
      advice.textContent = `Can't determine masking automatically: ${rec.missingData}. ` +
        `Enter an audiogram (with bone conduction) for both ears, or set the masker manually.`;
      advice.classList.remove("pi-warn");
      if (actions) actions.style.display = "none";
      return;
    }

    if (!rec.needed) {
      advice.textContent = `Masking not indicated (${rec.reason}).` +
        (rec.missingData ? ` [${rec.missingData}]` : "");
      advice.classList.remove("pi-warn");
      if (actions) actions.style.display = "none";
      return;
    }

    // Needed.
    const a = rec.amount;
    let txt = `Mask the ${maskEar} ear at ${a.level} dB EM ` +
              `(PL ${PL} − IAA ${a.iaa}${a.abgapNTE ? ` + AB gap ${a.abgapNTE}` : ""} + 10). ` +
              `Rule: ${rec.reason}.`;
    if (a.overMask) {
      txt += ` ⚠ Over-masking risk: ${a.level} dB reaches the test-ear cochlea ` +
             `(over-masks at ≥ ${a.overMaskThreshold} dB EM). Reduce, use inserts, or ` +
             `note a masking dilemma.`;
    }
    if (rec.missingData) txt += ` [${rec.missingData}]`;
    advice.textContent = txt;
    advice.classList.toggle("pi-warn", !!a.overMask);
    if (actions) actions.style.display = "";
  }

  // ── Applying the recommendation ───────────────────────────────────────
  // Set masker ear + level from the recommendation. If ramp is true, move the
  // level toward the target gently rather than jumping.
  function applyRecommendation(opts) {
    const ramp = opts && opts.ramp;
    if (!global.Masking) return;
    const te = testEar(); const PL = presentationLevel();
    if (!te || PL == null) return;
    const rec = global.Masking.recommend({ testEar: te, PL, transducer: transducer() });
    if (!rec.needed || !rec.amount) return;

    // Masker ear = the NTE.
    if ($("maskEar")) $("maskEar").value = rec.maskEar;
    if ($("maskEarLive")) $("maskEarLive").value = rec.maskEar;

    const target = rec.amount.level;
    const field = $("maskLevel");
    const cur = field && field.value !== "" ? Number(field.value) : null;

    let next = target;
    if (ramp && cur != null) {
      const diff = target - cur;
      if (Math.abs(diff) < RAMP_DEADBAND_DB) return;           // within deadband: leave it
      const step = Math.sign(diff) * Math.min(Math.abs(diff), RAMP_MAX_STEP_DB);
      next = cur + step;
    }
    if (field) field.value = next;
    if ($("maskLevelLive")) $("maskLevelLive").value = next;

    // Ensure masking is enabled and push the change through the app's own path.
    if ($("maskingEnabled")) $("maskingEnabled").value = "on";
    if (typeof global.updateLiveMasker === "function") global.updateLiveMasker();
    else if (typeof global.syncMaskerControls === "function") global.syncMaskerControls();
    if (global.saveSession) global.saveSession();
  }

  // Called by app.js when the presentation level changes (fixed edit or adaptive
  // step). Re-render advice; if Auto is on, retrack the masker with a ramp.
  function onLevelChanged() {
    render();
    if (autoOn()) applyRecommendation({ ramp: true });
  }

  // ── Init / wiring ─────────────────────────────────────────────────────
  function wire() {
    loadIaaIntoFields();
    wireIaaFields();
    const apply = $("maskingApplyBtn");
    if (apply && !apply.__wired) { apply.__wired = true; apply.addEventListener("click", () => applyRecommendation({ ramp: false })); }
    const auto = $("maskingAuto");
    if (auto && !auto.__wired) { auto.__wired = true; auto.addEventListener("change", () => { if (auto.checked) applyRecommendation({ ramp: false }); if (global.saveSession) global.saveSession(); }); }
    // Re-render when the ear, transducer or level fields change.
    ["stimEar","transducer","adaptiveStartLevel"].forEach(id => {
      const el = $(id);
      if (el && !el.__maskWired) { el.__maskWired = true; el.addEventListener("change", onLevelChanged); el.addEventListener("input", onLevelChanged); }
    });
    render();
  }

  function init() { wire(); }

  global.MaskingUI = { init, render, applyRecommendation, onLevelChanged };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 0));
  } else {
    setTimeout(init, 0);
  }
})(typeof window !== "undefined" ? window : globalThis);
