/* ─────────────────────────────────────────────────────────────────────────
   nonadaptive.js — Optional non-adaptive (fixed-level) comparison block for the
   thesis experiment.

   WHY THIS EXISTS
   The equivalence study compares adaptive SRTs against conventional non-adaptive
   speech scores. There is no CVC *adaptive* norm in the literature, so to
   validate CVC-adaptive we also need CVC presented the conventional (fixed-level,
   PI-function) way. This module threads an optional block of THREE fixed-level
   lists into the run, per language, entirely under clinician control.

   Design decisions (from the Sep 2026 Roux/O'Beirne thread):
     • OFF by default. Two independent tickboxes — one for CVC (English), one for
       CVCV (Māori). Both start unticked; the whole block is optional at the point
       of testing so timing can be trialled (90-min session, 3 repeats/ear).
       The CVCV box carries a caveat: no CVCV list-equivalence has been
       established, so it is provided for timing/exploration only.
     • Levels are PROPOSED from the audiogram via the UC PI-max/HPL protocol
       (reusing ParticipantInputs), and remain EDITABLE THROUGHOUT — a clinician
       who sees an unexpectedly good score can drop the next level a long way to
       chase a half-peak. Nothing is locked in from the start. If ParticipantInputs
       has no usable threshold, the fields fall back to blank/manual.
     • Masker level is likewise PROPOSED from protocol (Level(TE) − IAA + ABgap +
       10, via the existing Masking engine) and is editable.
     • Candidate LISTS are the three whose words the adaptive schedule presented
       only AT OR BELOW that ear's threshold (lowest-level exposure) — chosen per
       participant at run time to minimise practice effect. Because that ranking
       needs adaptive data to exist, the block DEFAULTS to a group of three at the
       END of the run, but may be placed elsewhere; when placed earlier it ranks
       on whatever adaptive data has accumulated so far and warns if that is thin.

   This module is self-contained: it reads/writes the shared `state`, drives the
   app's existing fixed-mode queue (setTestMode("fixed") + the normal list queue),
   and appends to the experiment CSV stores via Experiment hooks. It adds NO
   behaviour to the normal (non-experiment) flow.
   ──────────────────────────────────────────────────────────────────────── */
(function (global) {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const LANGS = [
    { key: "english", label: "CVC (NZ English)", listMax: 12, caveat: null },
    { key: "maori",   label: "CVCV (te reo Māori)", listMax: 10,
      caveat: "No CVCV list-equivalence has been established — for timing/exploration only." }
  ];

  // ── Settings, persisted on state so they survive a reload ───────────────
  function cfg() {
    const s = global.state || (global.state = {});
    if (!s.nonAdaptive) {
      s.nonAdaptive = {
        include: { english: false, maori: false },  // both OFF by default
        placement: "end",                           // "end" | "shuffled"
        nLists: 3,
        // Per language, per ear: the three proposed levels + masker, and the
        // chosen candidate lists. Filled lazily when the block is prepared.
        plan: {}                                     // plan[lang][ear] = {...}
      };
    }
    return s.nonAdaptive;
  }

  // ── Level proposal (UC PI-max / HPL protocol) ───────────────────────────
  // PI-max seed: reference threshold + band increment (ParticipantInputs already
  // implements the UC band table: 2 kHz + 25/20/15/10/5). HPL seed: PI-max − 15
  // (protocol says 10–20 dB below; 15 is the midpoint). Mid seed: halfway between,
  // snapped to the 5 dB grid. All three are seeds the clinician edits throughout.
  function snap5(v) {
    return (typeof global.snap5 === "function") ? global.snap5(v) : Math.round(Number(v) / 5) * 5;
  }
  function proposeLevels(ear) {
    let piMax = null, source = "manual";
    if (global.ParticipantInputs && typeof global.ParticipantInputs.startLevelFor === "function") {
      const s = global.ParticipantInputs.startLevelFor(ear);
      if (s && Number.isFinite(Number(s.level))) { piMax = Number(s.level); source = s.source || "audiogram"; }
    }
    if (piMax === null) {
      // No threshold available: leave blank for manual entry.
      return { levels: [null, null, null], source: "manual (no audiogram)", editable: true };
    }
    const hpl = piMax - 15;
    const mid = snap5((piMax + hpl) / 2);
    return {
      levels: [snap5(piMax), mid, snap5(hpl)],   // high → low, matching a PI sweep
      labels: ["PI-max", "mid", "HPL"],
      source,
      editable: true
    };
  }

  // ── Masker proposal (reuse the Masking engine, protocol formula) ────────
  // Non-test ear masking = Level(TE) − IAA + ABgap(NTE) + 10. We seed off the
  // PI-max level (the loudest of the three) so the dialled masker safely covers
  // the whole block; the clinician can lower it per list. Returns null when the
  // masking rule says no masking is needed (or there's no data to decide).
  function proposeMasker(ear, piMaxLevel) {
    if (!(global.Masking && typeof global.Masking.recommend === "function")) return null;
    if (!Number.isFinite(Number(piMaxLevel))) return null;
    const transducer = $("transducer") ? $("transducer").value : "";
    let rec = null;
    try {
      rec = global.Masking.recommend({ testEar: ear, PL: Number(piMaxLevel), transducer });
    } catch { return null; }
    if (!rec || !rec.needed || !rec.amount) return { needed: false, level: null, reason: rec ? rec.reason : "" };
    return {
      needed: true,
      level: rec.amount.level,
      maskEar: rec.maskEar,
      overMask: rec.amount.overMask,
      reason: rec.reason
    };
  }

  // ── Candidate list selection (at/below threshold) ───────────────────────
  // Rank the language's lists by how much of their adaptive exposure was AT OR
  // BELOW the ear's estimated threshold: for each list, the fraction of its
  // presented words whose level ≤ (SRT for that condition). Prefer lists with the
  // most sub-threshold exposure (least practice). Ties broken by lower mean level.
  // Falls back to lowest-mean-level, then to any unused numbers, so it always
  // returns three lists even with thin data.
  function adaptiveTrialsSoFar() {
    // Prefer the experiment trial store (authoritative, includes source list &
    // level); fall back to state.results for a live, not-yet-exported run.
    const rows = [];
    const xs = global.state && global.state.experiment;
    if (xs && xs.trialCsv) {
      const lines = xs.trialCsv.split("\n");
      const head = lines[0].split(",");
      const iLang = head.indexOf("language"), iList = head.indexOf("list_number"),
            iLvl = head.indexOf("level_dB"), iEar = head.indexOf("ear");
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i]) continue;
        const c = lines[i].split(",");
        rows.push({ language: c[iLang], list: Number(c[iList]), level: Number(c[iLvl]),
                    ear: c[iEar] === "L" ? "left" : c[iEar] === "R" ? "right" : c[iEar] });
      }
    }
    if (!rows.length && Array.isArray(global.state.results)) {
      global.state.results.forEach(r => {
        if (!r || !r.adaptive) return;
        rows.push({ language: r.language || "maori", list: Number(r.sourceList),
                    level: Number(r.listLevelDbA),
                    ear: r.stimulusEar || r.presentationCondition });
      });
    }
    return rows;
  }

  // Best available SRT estimate for a language+ear, from recorded adaptive tracks.
  function srtFor(language, ear) {
    const tracks = Array.isArray(global.state.adaptiveTracks) ? global.state.adaptiveTracks : [];
    const matches = tracks.filter(t =>
      t && t.language === language &&
      (t.stimulusEar === ear || t.condition === ear) &&
      Number.isFinite(Number(t.srt)));
    if (!matches.length) return null;
    // Mean of the available SRTs for this condition.
    return matches.reduce((s, t) => s + Number(t.srt), 0) / matches.length;
  }

  function chooseCandidateLists(language, ear, listMax, nLists) {
    const rows = adaptiveTrialsSoFar().filter(r => r.language === language && Number.isFinite(r.list));
    const srt = srtFor(language, ear);
    const stat = {};   // list -> { n, sub, sumLvl }
    rows.forEach(r => {
      if (!stat[r.list]) stat[r.list] = { n: 0, sub: 0, sumLvl: 0 };
      stat[r.list].n++;
      stat[r.list].sumLvl += r.level;
      if (srt != null && r.level <= srt) stat[r.list].sub++;
    });
    const all = [];
    for (let l = 1; l <= listMax; l++) {
      const s = stat[l];
      all.push({
        list: l,
        seen: s ? s.n : 0,
        subFrac: s && s.n ? s.sub / s.n : (s ? 0 : 1),   // unseen lists count as fully "unpractised"
        meanLvl: s && s.n ? s.sumLvl / s.n : -Infinity
      });
    }
    // Sort: most sub-threshold exposure first; then lowest mean level; then fewest
    // times seen (least practice). Unseen lists (subFrac defaulted to 1) naturally
    // sort to the top — they carry no practice at all.
    all.sort((a, b) =>
      (b.subFrac - a.subFrac) ||
      (a.meanLvl - b.meanLvl) ||
      (a.seen - b.seen) ||
      (a.list - b.list));
    const chosen = all.slice(0, nLists).map(x => x.list);
    const thinData = rows.length < listMax * 4;   // heuristic: <~4 words/list seen
    return { lists: chosen, thinData, srtUsed: srt, ranking: all.slice(0, nLists) };
  }

  // ── Build the fixed-level queue for one language block ──────────────────
  // Returns an array of queue entries [{listNumber, levelDbA, language}] — three
  // lists × the three proposed levels is NOT the intent; the convention is ONE
  // level per list across the PI sweep (list A @ PI-max, list B @ mid, list C @
  // HPL), which is how a conventional 3-point PI function is gathered. The
  // clinician re-levels any list live via the normal queue editor.
  function buildBlock(language, ear) {
    const conf = cfg();
    const L = LANGS.find(x => x.key === language);
    const cand = chooseCandidateLists(language, ear, L.listMax, conf.nLists);
    const prop = proposeLevels(ear);
    const piMax = prop.levels[0];
    const masker = proposeMasker(ear, piMax);
    const entries = cand.lists.map((listNumber, i) => ({
      listNumber,
      levelDbA: prop.levels[i] != null ? prop.levels[i] : "",
      language,
      nonAdaptive: true,
      proposedLabel: prop.labels ? prop.labels[i] : null,
      maskerLevel: masker && masker.needed ? masker.level : null,
      maskEar: masker && masker.needed ? masker.maskEar : (ear === "left" ? "right" : "left")
    }));
    // Stash the plan for display/export and so a re-render shows the same picks.
    conf.plan[language] = conf.plan[language] || {};
    conf.plan[language][ear] = {
      lists: cand.lists, levels: prop.levels, levelSource: prop.source,
      masker, thinData: cand.thinData, srtUsed: cand.srtUsed
    };
    if (typeof global.saveSession === "function") global.saveSession();
    return { entries, cand, prop, masker };
  }

  // ── Public: is any non-adaptive block requested? ────────────────────────
  function anyIncluded() {
    const c = cfg().include;
    return !!(c.english || c.maori);
  }
  function includedLanguages() {
    const c = cfg().include;
    return LANGS.filter(l => c[l.key]).map(l => l.key);
  }

  // ── UI: inject the tickboxes + placement + preview into the experiment card
  function ensureUI() {
    if ($("nonAdaptivePanel")) return;
    const host = $("experimentSection");
    if (!host) return;   // experiment card not present/unlocked yet
    const conf = cfg();
    const wrap = document.createElement("div");
    wrap.id = "nonAdaptivePanel";
    wrap.style.marginTop = ".8rem";
    wrap.style.paddingTop = ".6rem";
    wrap.style.borderTop = "1px solid var(--line)";
    wrap.innerHTML = `
      <h3 style="margin:.2rem 0 .4rem;font-size:.95rem">Non-adaptive comparison lists <span class="hint" style="font-weight:normal">(optional)</span></h3>
      <p class="hint" id="naIntro" style="margin:.2rem 0 .5rem">
        Adds a block of three fixed-level lists per selected language, for the
        conventional PI-function comparison. Levels and masking are proposed from
        the audiogram (UC protocol) and stay editable throughout. Off by default —
        turning both on adds noticeably to session time.
      </p>
      <div style="display:flex;flex-direction:column;gap:.35rem">
        ${LANGS.map(l => `
          <label style="display:flex;align-items:flex-start;gap:.5rem;font-weight:normal;cursor:pointer">
            <input type="checkbox" id="naInclude_${l.key}" ${conf.include[l.key] ? "checked" : ""}
                   style="flex:0 0 auto;margin:.15rem 0 0 0">
            <span style="flex:1 1 auto">Include 3 non-adaptive ${l.label}
              ${l.caveat ? `<br><span class="hint" style="color:var(--warn,#b45309)">${l.caveat}</span>` : ""}
            </span>
          </label>`).join("")}
      </div>
      <div style="margin-top:.6rem;max-width:24rem">
        <label style="display:block">Placement
          <select id="naPlacement" style="width:100%">
            <option value="end" ${conf.placement === "end" ? "selected" : ""}>Block of three at the end (default)</option>
            <option value="shuffled" ${conf.placement === "shuffled" ? "selected" : ""}>Shuffled into the run</option>
          </select>
        </label>
        <div class="hint" id="naPlacementHint" style="margin-top:.25rem"></div>
      </div>
      <div id="naPreview" class="hint" style="margin-top:.5rem"></div>`;
    host.appendChild(wrap);

    LANGS.forEach(l => {
      const cb = $("naInclude_" + l.key);
      if (cb) cb.addEventListener("change", () => {
        cfg().include[l.key] = cb.checked;
        if (typeof global.saveSession === "function") global.saveSession();
        renderPreview();
      });
    });
    const pl = $("naPlacement");
    if (pl) pl.addEventListener("change", () => {
      cfg().placement = pl.value;
      if (typeof global.saveSession === "function") global.saveSession();
      renderPreview();
    });
    renderPreview();
  }

  function renderPreview() {
    const box = $("naPreview");
    const hint = $("naPlacementHint");
    if (!box) return;
    const conf = cfg();
    if (hint) {
      hint.textContent = conf.placement === "shuffled"
        ? "When shuffled earlier, list ranking uses only the adaptive data collected so far."
        : "Runs after the 12 adaptive administrations, when all lists have been ranked.";
    }
    const langs = includedLanguages();
    if (!langs.length) { box.innerHTML = "<em>No non-adaptive block — both boxes off.</em>"; return; }
    // Preview uses the CURRENT participant + a representative ear if available.
    const xs = global.state && global.state.experiment;
    const participant = xs && xs.participant;
    if (!participant) { box.innerHTML = "Select a participant to preview the proposed lists and levels."; return; }
    const parts = langs.map(lang => {
      const L = LANGS.find(x => x.key === lang);
      // Preview both ears if the allocation tests both (it always does).
      return ["left", "right"].map(ear => {
        const cand = chooseCandidateLists(lang, ear, L.listMax, conf.nLists);
        const prop = proposeLevels(ear);
        const lv = prop.levels.map(v => v == null ? "—" : `${v}`).join(" / ");
        const masker = proposeMasker(ear, prop.levels[0]);
        const mtext = masker
          ? (masker.needed ? `masker ${masker.level} dB → ${masker.maskEar}` : "no masking indicated")
          : "masker: enter manually";
        const warn = cand.thinData ? ` <span style="color:var(--warn,#b45309)">(ranked on limited data)</span>` : "";
        return `<div style="margin:.15rem 0">
          <b>${L.label}, ${ear} ear:</b> lists ${cand.lists.join(", ")} @ ${lv} dB(A)
          <span class="hint">[${prop.source}]</span>; ${mtext}${warn}</div>`;
      }).join("");
    }).join("");
    box.innerHTML = parts +
      `<div class="hint" style="margin-top:.3rem">Levels and masking are seeds — adjust each list live from the queue as scores come in.</div>`;
  }

  // ── Public: enqueue the non-adaptive block(s) for the current ear/lang ──
  // Called by the experiment stepper when it reaches a non-adaptive slot (end or
  // shuffled). Sets fixed mode and pushes the three lists at their proposed
  // levels into the normal queue, then hands control to the app's test screen.
  function runBlock(language, ear) {
    if (typeof global.setTestMode === "function") global.setTestMode("fixed");
    if (typeof global.setLanguage === "function") global.setLanguage(language, { silent: true });
    if ($("stimEar")) { $("stimEar").value = ear; if (typeof $("stimEar").onchange === "function") { try { $("stimEar").onchange(); } catch {} } }
    if ($("presentationCondition")) $("presentationCondition").value = ear;

    const { entries, cand, masker } = buildBlock(language, ear);
    // Reset the queue to just this block's lists.
    global.state.queue = entries.map(e => ({
      listNumber: e.listNumber,
      levelDbA: (typeof global.clampLevel === "function" && e.levelDbA !== "")
        ? global.clampLevel(e.levelDbA) : e.levelDbA,
      language,
      status: "queued",
      nonAdaptive: true,
      id: (global.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.random())
    }));
    global.state.currentListIndex = 0;
    // Seed the live masker from the proposal (editable on-screen).
    if (masker && masker.needed) {
      if ($("maskLevel")) $("maskLevel").value = masker.level;
      if ($("maskEar")) $("maskEar").value = masker.maskEar;
    }
    if (typeof global.saveSession === "function") global.saveSession();
    return { entries, cand, masker };
  }

  // ── Init / expose ───────────────────────────────────────────────────────
  function init() { ensureUI(); }

  global.NonAdaptive = {
    init, ensureUI, renderPreview,
    anyIncluded, includedLanguages,
    proposeLevels, proposeMasker, chooseCandidateLists, buildBlock, runBlock,
    cfg
  };

  // The experiment module calls NonAdaptive.init() after it renders its section.
  // Also self-init on load in case the section already exists.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 0));
  } else {
    setTimeout(init, 0);
  }
})(typeof window !== "undefined" ? window : globalThis);
