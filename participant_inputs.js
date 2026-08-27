/* ─────────────────────────────────────────────────────────────────────────
   participant_inputs.js — Per-ear participant specification for experiment mode.

   For each ear the clinician picks ONE input mode:
     • audiogram   — AC (unmasked/masked) and BC (unmasked/masked) at
                     250/500/1k/2k/4k/6k/8k Hz, every value optional
     • pta         — a single pure-tone average number (dB HL)
     • fourfa      — a single 4-frequency average number (dB HL)
     • start       — a starting presentation level entered directly, in dB(A)
                     or dB FS (the uncalibrated headphones/AirPods debug path)

   These drive the per-ear STARTING PRESENTATION LEVEL for the adaptive track and
   carry the data the masking engine will later read (best BC, air–bone gaps).

   Starting level rule (add to the reference threshold):
        < 50 dB HL → +25
       50–59       → +20
       60–69       → +15
       70–79       → +10
        ≥ 80       → +5   (and clamp to the calibrated ceiling; warn if the rule
                            wants more level than the reference allows — the fix
                            is to raise the audiometer dial and update the
                            calibration number)
   The reference threshold is the 2 kHz AC threshold (audiogram mode) or the
   PTA/4FA value (those modes). In start mode the entered number IS the start
   level, no band applied.

   Masking without an audiogram: pta/fourfa/start modes carry no bone conduction,
   so auto-masking can't run. Instead each ear offers a MANUAL initial masker
   level plus a "track with presentation level" tickbox; when ticked the masker
   follows the presentation level by the offset implied at track start (the same
   mechanism the adaptive masker already uses).

   This module owns the data and the maths; experiment.js reads startLevelFor(),
   maskerFor() and dataFor() when it drives each administration.
   ──────────────────────────────────────────────────────────────────────── */
(function (global) {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const AUDIOGRAM_FREQS = [250, 500, 1000, 2000, 4000, 6000, 8000];
  const AC_TRACKS = ["acUnmasked", "acMasked"];
  const BC_TRACKS = ["bcUnmasked", "bcMasked"];

  // ── Starting-level band table ─────────────────────────────────────────
  // Add to the reference threshold. Returns the increment in dB.
  function startLevelIncrement(refThresholdHL) {
    const t = Number(refThresholdHL);
    if (!Number.isFinite(t)) return null;
    if (t < 50) return 25;
    if (t < 60) return 20;   // 50–59
    if (t < 70) return 15;   // 60–69
    if (t < 80) return 10;   // 70–79
    return 5;                // ≥ 80
  }

  // ── Data model ────────────────────────────────────────────────────────
  // Participant specification is normal testing data, kept at state.participant.
  // (Earlier builds kept it under state.experiment.inputs; migrate if present.)
  function store() {
    const s = global.state;
    if (!s.participant) {
      if (s.experiment && s.experiment.inputs) {
        s.participant = s.experiment.inputs;      // migrate old location
        delete s.experiment.inputs;
      } else {
        s.participant = { left: blankEar(), right: blankEar() };
      }
    }
    return s.participant;
  }
  function blankEar() {
    return {
      mode: "start",                 // audiogram | pta | fourfa | start
      // audiogram: { acUnmasked:{250:..}, acMasked:{}, bcUnmasked:{}, bcMasked:{} }
      audiogram: { acUnmasked: {}, acMasked: {}, bcUnmasked: {}, bcMasked: {} },
      pta: null,
      fourfa: null,
      startValue: null,              // number
      startUnit: "dbA",              // dbA | dbFS
      masker: { level: null, track: false }  // manual masker + track-with-PL flag
    };
  }
  function earData(ear) {
    const inp = store();
    return inp[ear] || (inp[ear] = blankEar());
  }

  // ── Derived quantities ────────────────────────────────────────────────
  // The single reference threshold used by the band table for this ear.
  function referenceThreshold(ear) {
    const d = earData(ear);
    if (d.mode === "audiogram") {
      // 2 kHz AC threshold: prefer masked if present, else unmasked.
      const m = d.audiogram.acMasked[2000];
      const u = d.audiogram.acUnmasked[2000];
      const v = Number.isFinite(Number(m)) ? Number(m)
              : Number.isFinite(Number(u)) ? Number(u) : null;
      return v;
    }
    if (d.mode === "pta") return blankNum(d.pta) ? null : Number(d.pta);
    if (d.mode === "fourfa") return blankNum(d.fourfa) ? null : Number(d.fourfa);
    return null;   // start mode has no threshold reference
  }

  // True when a value is absent (null/undefined/"") — distinct from a real 0,
  // which Number() coercion would otherwise manufacture from null/"".
  function blankNum(v) {
    return v === null || v === undefined || v === "" || !Number.isFinite(Number(v));
  }

  // Best (lowest) bone-conduction threshold across frequencies, any freq —
  // speech is broadband so the best BC is what matters for masking. Prefers
  // masked BC where present. Returns null if no BC entered.
  function bestBC(ear) {
    const d = earData(ear);
    if (d.mode !== "audiogram") return null;
    let best = null;
    for (const track of BC_TRACKS) {
      for (const f of AUDIOGRAM_FREQS) {
        const v = Number(d.audiogram[track][f]);
        if (Number.isFinite(v) && (best === null || v < best)) best = v;
      }
    }
    return best;
  }

  // Air–bone gap per frequency (AC − BC), using best-available masked/unmasked.
  // Returns an object keyed by frequency; only frequencies with both present.
  function airBoneGaps(ear) {
    const d = earData(ear);
    if (d.mode !== "audiogram") return {};
    const pick = (obj1, obj2, f) => {
      const a = Number(obj1[f]); const b = Number(obj2[f]);
      return Number.isFinite(a) ? a : (Number.isFinite(b) ? b : null);
    };
    const gaps = {};
    for (const f of AUDIOGRAM_FREQS) {
      const ac = pick(d.audiogram.acMasked, d.audiogram.acUnmasked, f);
      const bc = pick(d.audiogram.bcMasked, d.audiogram.bcUnmasked, f);
      if (ac !== null && bc !== null) gaps[f] = ac - bc;
    }
    return gaps;
  }

  // The starting presentation level for this ear.
  // Returns { level, unit, source, warnCeiling } or null if not determinable.
  //   unit: "dbA" (calibrated scale) or "dbFS" (uncalibrated debug path)
  //   source: how it was derived, for display
  //   warnCeiling: true if the band rule wanted more than the calibrated max
  function startLevelFor(ear) {
    const d = earData(ear);

    // Start mode: the entered value IS the level, in its stated unit. Guard the
    // blank case explicitly — Number(null)/Number("") are 0, not NaN, so a blank
    // field must be caught before coercion or it would read as a real 0 dB level.
    if (d.mode === "start") {
      if (d.startValue === null || d.startValue === undefined || d.startValue === ""
          || !Number.isFinite(Number(d.startValue))) return null;
      return {
        level: Number(d.startValue),
        unit: d.startUnit === "dbFS" ? "dbFS" : "dbA",
        source: `entered start level`,
        warnCeiling: false
      };
    }

    // Threshold-based modes: band table added to the reference threshold.
    const ref = referenceThreshold(ear);
    if (ref === null) return null;
    const inc = startLevelIncrement(ref);
    if (inc === null) return null;
    let level = ref + inc;
    const refName = d.mode === "audiogram" ? "2 kHz AC" : d.mode.toUpperCase();

    // Clamp to the calibrated ceiling; flag if the rule wanted more.
    let warnCeiling = false;
    const b = (typeof global.levelBounds === "function") ? global.levelBounds() : null;
    if (b && b.usable && level > b.max) { warnCeiling = true; }
    // Note: we DON'T silently clamp the stored intent here — experiment.js sets
    // the adaptive start field, and the app's own clampLevel handles the audio
    // path. We surface the warning so the clinician can raise the dial.

    return {
      level,
      unit: "dbA",
      source: `${refName} ${ref} dB HL + ${inc} dB`,
      warnCeiling
    };
  }

  // Manual masker settings for this ear (used when there is no audiogram).
  // Returns { level, track } — level may be null (no masking).
  function maskerFor(ear) {
    const d = earData(ear);
    return { level: Number.isFinite(Number(d.masker.level)) ? Number(d.masker.level) : null,
             track: !!d.masker.track };
  }

  // Everything the masking engine / export will want for this ear.
  function dataFor(ear) {
    const d = earData(ear);
    return {
      mode: d.mode,
      referenceThreshold: referenceThreshold(ear),
      bestBC: bestBC(ear),
      airBoneGaps: airBoneGaps(ear),
      pta: d.pta, fourfa: d.fourfa,
      startValue: d.startValue, startUnit: d.startUnit,
      masker: maskerFor(ear),
      audiogram: d.mode === "audiogram" ? d.audiogram : null
    };
  }

  // ── UI ────────────────────────────────────────────────────────────────
  function ensurePanel() {
    if ($("participantInputsPanel")) return $("participantInputsPanel");
    // Mount into the normal Test-configuration column (always present), not the
    // experiment section — this is standard testing setup for every clinician.
    const mount = $("participantInputsMount");
    if (!mount) return null;
    const panel = document.createElement("div");
    panel.id = "participantInputsPanel";
    panel.className = "participant-inputs";
    panel.style.marginTop = ".4rem";
    panel.innerHTML = `
      <p class="hint" style="margin:.1rem 0 .6rem">
        Optional. Set each ear independently. Enter an audiogram, PTA or 4FA and the
        starting presentation level is derived for you (and shown with its reasoning);
        otherwise choose “Start level” and set it yourself. Masking without an
        audiogram uses the manual masker below.
      </p>
      <div class="participant-ears" style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        ${earPanelHtml("left")}
        ${earPanelHtml("right")}
      </div>`;
    mount.appendChild(panel);
    wireEar("left"); wireEar("right");
    renderEar("left"); renderEar("right");
    return panel;
  }

  function earPanelHtml(ear) {
    const label = ear === "left" ? "Left ear" : "Right ear";
    const id = (s) => `pi_${ear}_${s}`;
    return `
      <div class="participant-ear" data-ear="${ear}" style="border:1px solid var(--line);border-radius:8px;padding:.7rem">
        <div style="font-weight:600;margin-bottom:.4rem">${label}</div>
        <label style="display:block;font-size:.85rem;margin-bottom:.5rem">Input mode
          <select id="${id('mode')}" style="width:100%">
            <option value="audiogram">Full audiogram</option>
            <option value="pta">PTA</option>
            <option value="fourfa">4FA</option>
            <option value="start" selected>Start level</option>
          </select>
        </label>
        <div id="${id('body')}"></div>
        <div id="${id('startout')}" class="hint" style="margin-top:.5rem;font-size:.82rem"></div>
        <div style="margin-top:.5rem;border-top:1px solid var(--line);padding-top:.45rem">
          <label style="display:flex;align-items:center;gap:.4rem;font-size:.82rem">
            Manual masker level (dB)
            <input id="${id('maskLevel')}" type="number" step="5" style="width:5rem">
          </label>
          <label style="display:flex;align-items:center;gap:.4rem;font-size:.82rem;margin-top:.3rem">
            <input id="${id('maskTrack')}" type="checkbox"> Track with presentation level
          </label>
        </div>
      </div>`;
  }

  function bodyHtml(ear) {
    const d = earData(ear);
    const id = (s) => `pi_${ear}_${s}`;
    if (d.mode === "start") {
      return `
        <label style="display:flex;align-items:center;gap:.4rem;font-size:.85rem">
          Start level
          <input id="${id('startValue')}" type="number" step="1" style="width:5.5rem">
          <select id="${id('startUnit')}" style="width:5rem">
            <option value="dbA">dB(A)</option>
            <option value="dbFS">dB FS</option>
          </select>
        </label>`;
    }
    if (d.mode === "pta" || d.mode === "fourfa") {
      const lab = d.mode === "pta" ? "PTA (dB HL)" : "4FA (dB HL)";
      return `
        <label style="display:flex;align-items:center;gap:.4rem;font-size:.85rem">
          ${lab}
          <input id="${id(d.mode)}" type="number" step="1" style="width:5.5rem">
        </label>`;
    }
    // audiogram: a compact grid of AC/BC × unmasked/masked across frequencies
    const freqHead = AUDIOGRAM_FREQS.map(f => `<th style="font-weight:500;padding:0 .2rem">${f >= 1000 ? (f/1000) + "k" : f}</th>`).join("");
    const rowFor = (track, labelTxt) => {
      const cells = AUDIOGRAM_FREQS.map(f =>
        `<td style="padding:1px"><input id="${id(track + '_' + f)}" type="number" step="5" style="width:3.1rem;font-size:.78rem" data-track="${track}" data-freq="${f}"></td>`
      ).join("");
      return `<tr><td style="font-size:.75rem;white-space:nowrap;padding-right:.3rem">${labelTxt}</td>${cells}</tr>`;
    };
    return `
      <div style="overflow-x:auto">
        <table style="border-collapse:collapse;font-size:.78rem">
          <thead><tr><th></th>${freqHead}</tr></thead>
          <tbody>
            ${rowFor("acUnmasked", "AC")}
            ${rowFor("acMasked", "AC (m)")}
            ${rowFor("bcUnmasked", "BC")}
            ${rowFor("bcMasked", "BC (m)")}
          </tbody>
        </table>
      </div>`;
  }

  function wireEar(ear) {
    const id = (s) => `pi_${ear}_${s}`;
    const modeSel = $(id("mode"));
    if (modeSel && !modeSel.__wired) {
      modeSel.__wired = true;
      modeSel.addEventListener("change", () => {
        earData(ear).mode = modeSel.value;
        markReDerive();
        renderEar(ear);
        persist();
      });
    }
    // Masker fields
    const ml = $(id("maskLevel")), mt = $(id("maskTrack"));
    if (ml && !ml.__wired) { ml.__wired = true; ml.addEventListener("input", () => { earData(ear).masker.level = ml.value === "" ? null : Number(ml.value); persist(); }); }
    if (mt && !mt.__wired) { mt.__wired = true; mt.addEventListener("change", () => { earData(ear).masker.track = mt.checked; persist(); }); }
  }

  // Re-render the mode-specific body and (re)wire its fields.
  function renderEar(ear) {
    const id = (s) => `pi_${ear}_${s}`;
    const body = $(id("body"));
    if (!body) return;
    const d = earData(ear);
    if ($(id("mode"))) $(id("mode")).value = d.mode;
    body.innerHTML = bodyHtml(ear);

    // Wire the freshly-created fields and seed values from state.
    if (d.mode === "start") {
      const sv = $(id("startValue")), su = $(id("startUnit"));
      if (sv) { sv.value = d.startValue ?? ""; sv.addEventListener("input", () => { d.startValue = sv.value === "" ? null : Number(sv.value); markReDerive(); reflectStart(ear); persist(); }); }
      if (su) { su.value = d.startUnit; su.addEventListener("change", () => { d.startUnit = su.value; markReDerive(); reflectStart(ear); persist(); }); }
    } else if (d.mode === "pta" || d.mode === "fourfa") {
      const f = $(id(d.mode));
      if (f) { f.value = d[d.mode] ?? ""; f.addEventListener("input", () => { d[d.mode] = f.value === "" ? null : Number(f.value); markReDerive(); reflectStart(ear); persist(); }); }
    } else if (d.mode === "audiogram") {
      [...AC_TRACKS, ...BC_TRACKS].forEach(track => {
        AUDIOGRAM_FREQS.forEach(freq => {
          const el = $(id(track + "_" + freq));
          if (!el) return;
          const v = d.audiogram[track][freq];
          el.value = (v === undefined || v === null) ? "" : v;
          el.addEventListener("input", () => {
            if (el.value === "") delete d.audiogram[track][freq];
            else d.audiogram[track][freq] = Number(el.value);
            markReDerive(); reflectStart(ear); persist();
          });
        });
      });
    }
    // Masker fields reflect state
    if ($(id("maskLevel"))) $(id("maskLevel")).value = d.masker.level ?? "";
    if ($(id("maskTrack"))) $(id("maskTrack")).checked = !!d.masker.track;
    reflectStart(ear);
  }

  // Show the derived start level (and any ceiling warning) under the ear.
  function reflectStart(ear) {
    const out = $(`pi_${ear}_startout`);
    if (out) {
      const s = startLevelFor(ear);
      if (!s) {
        out.textContent = "Start level: — (enter an audiogram, PTA or 4FA, or set it manually below)";
        out.classList.remove("pi-warn");
      } else {
        const unit = s.unit === "dbFS" ? "dB FS" : "dB(A)";
        let txt = `Start at ${s.level} ${unit} — ${s.source}`;
        if (s.warnCeiling) {
          txt += ` — above the calibrated ceiling. Raise the audiometer dial and ` +
                 `update the calibration number, or the track starts at the ceiling.`;
          out.classList.add("pi-warn");
        } else {
          out.classList.remove("pi-warn");
        }
        out.textContent = txt;
      }
    }
    // In normal testing, pre-fill the adaptive start-level field from the ear
    // that matches the current stimulus routing, and explain the derivation.
    // During an experiment run, experiment.js owns that field — don't fight it.
    if (!experimentRunning()) driveNormalStartLevel();
    // Audiogram/PTA changes also change the masking recommendation.
    if (global.MaskingUI && typeof global.MaskingUI.render === "function") {
      try { global.MaskingUI.render(); } catch {}
    }
  }

  // True while the experiment stepper is actively running a participant.
  function experimentRunning() {
    const xs = global.state && global.state.experiment;
    return !!(xs && xs.active && xs.running);
  }

  // The stimulus ear currently selected in the normal UI ("left"/"right").
  function currentStimEar() {
    const el = $("stimEar");
    const v = el ? el.value : "";
    return (v === "left" || v === "right") ? v : null;
  }

  // Pre-fill #adaptiveStartLevel from the matching ear's derived level and show
  // a one-line rationale. If no derivation is possible, prompt the clinician to
  // set it rather than silently choosing a number.
  function driveNormalStartLevel() {
    const rationale = $("participantStartRationale");
    const ear = currentStimEar();
    if (!ear) { if (rationale) rationale.textContent = ""; return; }
    const s = startLevelFor(ear);
    const field = $("adaptiveStartLevel");
    if (!s) {
      if (rationale) {
        rationale.textContent =
          `No audiogram/PTA/4FA for the ${ear} ear — set the starting level manually.`;
        rationale.classList.remove("pi-warn");
      }
      return;
    }
    // Only dB(A) values belong in the calibrated start-level field. A dB FS start
    // (uncalibrated debug path) isn't a dB(A) — surface it but don't overwrite.
    if (s.unit === "dbA" && field && !field.dataset.userEdited) {
      field.value = s.level;
      if (global.state.adaptiveForm) global.state.adaptiveForm.startLevel = s.level;
    }
    if (rationale) {
      const unit = s.unit === "dbFS" ? "dB FS" : "dB(A)";
      rationale.textContent = s.unit === "dbFS"
        ? `${ear} ear start is ${s.level} dB FS (uncalibrated) — ${s.source}.`
        : `Start at ${s.level} ${unit} for the ${ear} ear, as per ${s.source}.` +
          (s.warnCeiling ? " (Above calibrated ceiling — raise the dial and recalibrate.)" : "");
      rationale.classList.toggle("pi-warn", !!s.warnCeiling);
    }
  }

  function persist() { if (typeof global.saveSession === "function") global.saveSession(); }

  // A fresh audiogram/PTA/4FA/start entry is an explicit intent to re-derive, so
  // clear the "clinician typed their own start level" flag and let the derivation
  // repopulate the field.
  function markReDerive() {
    const f = $("adaptiveStartLevel");
    if (f && f.dataset) delete f.dataset.userEdited;
  }

  // Render/refresh the whole panel. Called on load and whenever inputs change.
  function render() {
    const panel = ensurePanel();
    if (!panel) return;
    renderEar("left"); renderEar("right");
  }

  // Wire cross-field behaviour once: re-derive when the stimulus ear changes, and
  // stop auto-filling the start level once the clinician edits it by hand.
  function installGlobalWiring() {
    const stim = $("stimEar");
    if (stim && !stim.__piWired) {
      stim.__piWired = true;
      stim.addEventListener("change", () => { if (!experimentRunning()) driveNormalStartLevel(); });
    }
    const field = $("adaptiveStartLevel");
    if (field && !field.__piWired) {
      field.__piWired = true;
      // A manual edit marks the field as user-owned so we don't overwrite it.
      field.addEventListener("input", () => { field.dataset.userEdited = "1"; });
      // Changing an ear's audiogram/PTA is a fresh derivation intent — clear the
      // manual flag from the ear panels (done in reflectStart via driveNormal).
    }
  }

  function init() {
    render();
    installGlobalWiring();
    driveNormalStartLevel();
  }

  global.ParticipantInputs = {
    init, render, startLevelFor, maskerFor, dataFor,
    startLevelIncrement, referenceThreshold, bestBC, airBoneGaps,
    driveNormalStartLevel
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 0));
  } else {
    setTimeout(init, 0);
  }
})(typeof window !== "undefined" ? window : globalThis);
