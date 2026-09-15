/* Adaptive speech-audiometry engine — Brand & Kollmeier A1 / A2
   ────────────────────────────────────────────────────────────────
   Self-contained: no dependency on app.js internals. app.js feeds it
   scored trials (proportion of phonemes correct, plus the per-phoneme
   0/1 outcomes for the fit) and asks it for the next presentation level.

   Two things live here:

   1. The adaptive STEPPING rule (A1 / A2). After each word is scored at
      the current level L, the next level is
          L_next = L − ΔL,   ΔL = ( φ · (result − pTarget) ) / s50
      with φ = a · b^(−reversals) and a ΔL magnitude floor of `minStep`.
      A2 adds Brand & Kollmeier's step-doubling near the 20%/80% rails.
      Reversals are sign changes in ΔL. This is a direct port of the
      reference A1/A2 demo (UC4AFC), which itself follows Brand &
      Kollmeier (2002) with the parameter values Brand recommended by
      personal communication.

      We operate on PRESENTATION LEVEL in dB(A). Brand & Kollmeier track
      SNR; here the masker (if any) follows the stimulus at a fixed
      offset, so tracking level and tracking SNR are equivalent and the
      same constants apply. Note the sign: higher level → easier → the
      demo's SNR axis. `result − pTarget > 0` (too easy) lowers the level.

   2. The psychometric-function FIT (MLE), ported from the demo:
      per-phoneme Bernoulli likelihood over the intelligibility form,
      with a small per-unit "structured-guess" floor, minimised over
      [SRT, log slope] by Nelder–Mead. Returns SRT (the 50% point) and
      slope. Used for the estimator tab and the end-of-track summary.

   Everything is dB. Levels are NOT snapped to 5 dB — adaptive steps are
   deliberately fine (0.25 dB floor).
*/

(function (global) {
  "use strict";

  // ── Brand & Kollmeier constants (shared across A1/A2, quiet/noise) ──
  // These match the reference implementation's screenshot exactly:
  // a = 1.5, b = 1.41, smallest step = 0.25 dB, tracking s50 = 0.1.
  const BK_DEFAULTS = {
    a: 1.5,          // reversal step-shrink base
    b: 1.41,         // reversal step-shrink rate: φ = a·b^(−reversals)
    minStep: 0.25,   // smallest |ΔL| per trial, dB
    s50: 0.1         // assumed tracking slope (proportion/dB) in the step rule
  };

  // Per-phoneme lower asymptote. For an OPEN-SET, phoneme-scored speech test
  // there is no forced-choice guessing rate: a phoneme either matches the
  // target or it does not, so the correct lower asymptote is 0 and the fitted
  // 50% point is a genuine SRT50 (and the fitted slope a genuine s50). The
  // Brand & Kollmeier discrimination function is the ordinary 0→1 logistic.
  // (A non-zero floor is only appropriate for a closed-set task with a known
  // number of alternatives; it remains configurable for that case.)
  const DEFAULT_PER_UNIT_FLOOR = 0;

  // Fixed-slope fallback for degenerate free-slope fits.
  // A1 concentrates trials near threshold, so estimating threshold AND slope
  // together is weakly identified — on erratic data the free-slope fit can drift
  // to a degenerate corner (near-zero slope, SRT thrown off past the data). When
  // that happens we re-fit the SRT with the slope HELD at a fixed value, so the
  // fallback stays on the same MLE footing as the good tracks (rather than
  // switching to a different estimator).
  //
  // These slopes were derived from OUR OWN speech-in-QUIET word data: the median
  // free-slope estimate across all non-degenerate tracks collected to 14 Sep 2026
  // (Māori n=23, English n=24; medians 0.073 and 0.076, very close). They are on
  // this fitter's own slope scale — NOT the β=0.25 from the other student's
  // speech-in-NOISE sentence/tone work, which is a different paradigm and scale.
  // Re-derive and update if the pooled estimate shifts as more data arrives.
  const FIXED_SLOPE = { maori: 0.073, english: 0.076, default: 0.075 };
  function fixedSlopeFor(language) {
    const k = String(language || "").toLowerCase();
    return FIXED_SLOPE[k] != null ? FIXED_SLOPE[k] : FIXED_SLOPE.default;
  }

  // The demo's intelligibility() uses a large A to make a clean 0→1
  // per-unit curve; the floor is then applied on top. Baked in here.
  const A_CLEAN = 1e6;

  // ── Psychometric function (Brand & Kollmeier form, clean 0→1) ──
  // SImax fixed at 1 (max proportion correct). Returns the *clean* value
  // before the guess floor is applied.
  function intelligibilityClean(level, srt, slope) {
    const A = A_CLEAN;
    const SImax = 1;
    const denom = (SImax * (A - 1)) / (4 * A * slope);
    return (1 / A) * (1 + SImax * ((A - 1) / (1 + Math.exp(-1 * (level - srt) / denom))));
  }

  // Per-unit probability correct including the guess floor (for plotting).
  function perUnitCurve(level, srt, slope, floor) {
    const clean = intelligibilityClean(level, srt, slope);
    return floor + (1 - floor) * clean;
  }

  /* ─────────────────────────────────────────────────────────────────
     AdaptiveTrack — one interleavable adaptive track.
     For A1 single-track use one track (pTarget 0.5).
     For A2 use two tracks (pTarget 0.2 and 0.8), interleaved by the
     controller below.
     ───────────────────────────────────────────────────────────────── */
  class AdaptiveTrack {
    constructor(opts) {
      this.id = opts.id;                       // 1 or 2, for labelling
      this.pTarget = opts.pTarget;             // target proportion correct
      this.startLevel = opts.startLevel;       // dB(A)
      this.doubleStep = !!opts.doubleStep;     // A2 rule-4 doubling enabled?
      this.bk = Object.assign({}, BK_DEFAULTS, opts.bk || {});

      this.level = opts.startLevel;            // level for the NEXT trial
      this.reversals = 0;
      this.iteration = 0;                      // trials completed on this track
      this.prevDeltaL = 0;
      this.lastNonzeroDeltaL = null;           // direction of the last real move
      this.trials = [];                        // {level, result} per word
    }

    // Level (dB) at which the next word on this track should be presented.
    nextLevel() { return this.level; }

    // Record a scored word (result = proportion of phonemes correct in
    // [0,1]) presented at `presentedLevel`, and compute the level for the
    // next word on this track. Returns { deltaL, doubled, reversal }.
    record(result, presentedLevel) {
      const bk = this.bk;
      this.iteration += 1;
      this.trials.push({ level: presentedLevel, result });

      // φ = a · b^(−reversals)
      const phi = bk.a * Math.pow(bk.b, -1 * this.reversals);
      let deltaL = (phi * (result - this.pTarget)) / bk.s50;

      // Minimum-step floor on |ΔL| — but ONLY for genuine (non-zero) steps.
      // When result === pTarget the Brand & Kollmeier update is exactly zero:
      // the listener is at target, so the level must not move. Forcing a
      // Math.sign(0)-based step here would push the level (the production bug
      // that made 2/4 at a 50% target step quieter). A zero step stays put.
      if (deltaL !== 0 && Math.abs(deltaL) < bk.minStep) {
        deltaL = Math.sign(deltaL) * bk.minStep;
      }

      // A2 step-doubling (Brand & Kollmeier rule 4): only when the target
      // itself is an extreme (≤20% or ≥80%), the response is past that
      // extreme, and the speed factor is large.
      let doubled = false;
      if (this.doubleStep && deltaL !== 0) {
        const rule1 = (this.pTarget <= 0.2) || (this.pTarget >= 0.8);
        const rule2 = (result < 0.2 && this.pTarget <= 0.2) ||
                      (result > 0.8 && this.pTarget >= 0.8);
        const rule3 = Math.abs(deltaL) > 0.5;
        if (rule1 && rule2 && rule3) { deltaL = 2 * deltaL; doubled = true; }
      }

      // Higher level → easier. result > pTarget (too easy) ⇒ ΔL > 0 ⇒
      // level decreases. This is the demo's `SNR − deltaL` with SNR↔level.
      let next = presentedLevel - deltaL;
      next = Math.round(next * 100) / 100;   // 0.01 dB bookkeeping precision

      // Reversal = a change in the direction of movement. A zero step is not
      // a movement, so it is never a reversal, and it does not overwrite the
      // remembered direction: reversals are judged against the last NON-ZERO
      // step. (Both are corrections to the demo's edge-case, which counted a
      // zero as a reversal and then let it poison the next comparison.)
      let reversal = false;
      if (deltaL !== 0) {
        if (this.lastNonzeroDeltaL != null &&
            !((this.lastNonzeroDeltaL > 0 && deltaL > 0) ||
              (this.lastNonzeroDeltaL < 0 && deltaL < 0))) {
          this.reversals += 1;
          reversal = true;
        }
        this.lastNonzeroDeltaL = deltaL;
      }
      this.prevDeltaL = deltaL;
      this.level = next;
      return { deltaL, doubled, reversal, nextLevel: next };
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     AdaptiveSession — drives A1 (single track) or A2 (dual interleaved).
     Owns the interleave order, the running per-phoneme data for the fit,
     and produces the SRT/slope estimate on demand.
     ───────────────────────────────────────────────────────────────── */
  class AdaptiveSession {
    /* config:
         procedure : "A1" | "A2"
         startLevel: dB(A)
         nTrials   : total words across all tracks (e.g. 20 for A1, 30 for A2)
         phonemeCount: 3 (CVC) or 4 (CVCV)
         perUnitFloor: optional, default 0.05
         bk        : optional overrides for {a,b,minStep,s50}
         pTargets  : optional; defaults [0.5] for A1, [0.2,0.8] for A2
    */
    constructor(config) {
      this.procedure = config.procedure === "A2" ? "A2" : "A1";
      this.startLevel = Number(config.startLevel);
      this.nTrials = Math.max(1, Math.round(config.nTrials));
      this.phonemeCount = Math.max(1, Math.round(config.phonemeCount || 4));
      // Language drives the fixed-slope fallback constant. Fall back to inferring
      // from phonemeCount (4 = CVCV/Māori, 3 = CVC/English) when not supplied.
      this.language = config.language ||
        (this.phonemeCount === 3 ? "english" : "maori");
      this.perUnitFloor = (config.perUnitFloor != null)
        ? Math.min(0.5, Math.max(0, config.perUnitFloor))
        : DEFAULT_PER_UNIT_FLOOR;
      this.bk = Object.assign({}, BK_DEFAULTS, config.bk || {});

      const pTargets = config.pTargets ||
        (this.procedure === "A2" ? [0.2, 0.8] : [0.5]);

      this.tracks = pTargets.map((p, i) => new AdaptiveTrack({
        id: i + 1,
        pTarget: p,
        startLevel: this.startLevel,
        doubleStep: this.procedure === "A2",
        bk: this.bk
      }));

      // Per-phoneme Bernoulli data accumulated for the MLE fit:
      // one (level, 0/1) pair per phoneme of every word.
      this.fitLevels = [];
      this.fitOutcomes = [];

      // Trial log in presentation order (for the estimator + export).
      this.log = [];

      this.interleave = this._buildInterleave();
      this.pos = 0;   // index into interleave for the NEXT word
    }

    // Build the order in which tracks are visited. A1: all track 0.
    // A2: alternate in shuffled pairs so the two targets are balanced
    // without a fixed 1,2,1,2 pattern (mirrors the demo's shuffled base).
    _buildInterleave() {
      if (this.tracks.length === 1) {
        return new Array(this.nTrials).fill(0);
      }
      const order = [];
      // fill in balanced shuffled pairs [0,1] until we reach nTrials
      while (order.length < this.nTrials) {
        const pair = [0, 1];
        for (let i = pair.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pair[i], pair[j]] = [pair[j], pair[i]];
        }
        order.push(...pair);
      }
      return order.slice(0, this.nTrials);
    }

    get total() { return this.nTrials; }
    get done() { return this.pos; }
    get finished() { return this.pos >= this.nTrials; }

    // Which track the next word belongs to, and the level to present it at.
    current() {
      if (this.finished) return null;
      const t = this.tracks[this.interleave[this.pos]];
      return { track: t, trackId: t.id, pTarget: t.pTarget, level: t.nextLevel(), index: this.pos };
    }

    /* Record the just-presented word.
         phonemeOutcomes: array of 0/1, length = phonemeCount
         presentedLevel : the dB(A) it was actually presented at (post-clamp)
       Returns the step result plus the next word's descriptor (or null).  */
    record(phonemeOutcomes, presentedLevel) {
      if (this.finished) return null;
      const cur = this.current();
      const outcomes = phonemeOutcomes.map(v => (v ? 1 : 0));
      const correct = outcomes.reduce((a, b) => a + b, 0);
      const result = correct / outcomes.length;   // proportion correct

      // accumulate per-phoneme fit data at the presented level
      for (const o of outcomes) {
        this.fitLevels.push(presentedLevel);
        this.fitOutcomes.push(o);
      }

      const step = cur.track.record(result, presentedLevel);
      this.log.push({
        order: this.pos + 1,
        trackId: cur.trackId,
        pTarget: cur.pTarget,
        level: presentedLevel,
        result,
        correct,
        phonemes: outcomes.length,
        reversals: cur.track.reversals,
        reversal: step.reversal,
        doubled: step.doubled,
        deltaL: step.deltaL
      });
      this.pos += 1;
      return { step, next: this.current() };
    }

    // Psychometric fit over all accumulated per-phoneme data.
    // Returns { srt, slope, nll, converged, n } or null if too little data.
    estimate() {
      const xs = this.fitLevels, ys = this.fitOutcomes;
      if (xs.length < 4) return null;
      const floor = this.perUnitFloor;

      const nll = (params) => {
        const srt = params[0];
        const slope = Math.exp(params[1]);
        if (!isFinite(srt) || !isFinite(slope) || slope <= 0 || slope > 10) {
          return Number.POSITIVE_INFINITY;
        }
        const eps = 1e-12;
        let s = 0;
        for (let i = 0; i < xs.length; i++) {
          let p = floor + (1 - floor) * intelligibilityClean(xs[i], srt, slope);
          p = Math.min(1 - eps, Math.max(eps, p));
          const y = ys[i];
          s += -(y * Math.log(p) + (1 - y) * Math.log(1 - p));
        }
        return s;
      };

      const sorted = xs.slice().sort((a, b) => a - b);
      const lo = sorted[0], hi = sorted[sorted.length - 1];
      const medianX = sorted[Math.floor(sorted.length / 2)];
      const startSRT = isFinite(medianX) ? medianX : this.startLevel;

      // Multi-start: scattered data can leave a nearly flat likelihood surface, so
      // a single start can drift to a degenerate corner (near-zero slope, SRT
      // pushed off past the data). Try several SRT/slope starts and keep the best.
      const srtStarts = [startSRT, lo + (hi - lo) * 0.25, lo + (hi - lo) * 0.5, lo + (hi - lo) * 0.75];
      const slopeStarts = [0.05, 0.1, 0.3];
      let best = null;
      for (const s0 of srtStarts) {
        for (const sl0 of slopeStarts) {
          const r = nelderMead(nll, [s0, Math.log(sl0)], [2.0, 0.5],
                               { maxIterations: 600, tolerance: 1e-9 });
          if (r && isFinite(r.fx) && (!best || r.fx < best.fx)) best = r;
        }
      }
      if (!best) return null;

      let srt = best.x[0];
      let slope = Math.exp(best.x[1]);
      let converged = best.converged;
      let degenerate = false;
      let method = "free-slope";

      // Sanity check the free-slope ML solution. A trustworthy A1 fit puts the 50%
      // point within (or very near) the tested range, with a slope not pinned at
      // ~0. If the SRT lands outside the range or the slope collapses, the free
      // fit is degenerate (weak joint identifiability on scattered data).
      const pad = Math.max(3, 0.15 * (hi - lo));
      const inRange = (v) => isFinite(v) && v >= lo - pad && v <= hi + pad;
      if (!inRange(srt) || slope < 0.01) {
        degenerate = true;
      }

      if (degenerate) {
        // Step 1 — re-fit with the slope HELD FIXED at the language constant,
        // estimating only the SRT. This keeps the fallback on the same MLE footing
        // as the good (free-slope) tracks, rather than switching estimator.
        const fixed = fixedSlopeFor(this.language);
        const nllFixed = (params) => nll([params[0], Math.log(fixed)]);
        let bestF = null;
        for (const s0 of srtStarts) {
          const r = nelderMead(nllFixed, [s0], [2.0], { maxIterations: 400, tolerance: 1e-9 });
          if (r && isFinite(r.fx) && (!bestF || r.fx < bestF.fx)) bestF = r;
        }
        if (bestF && inRange(bestF.x[0])) {
          srt = bestF.x[0];
          slope = fixed;
          converged = false;      // flag: free fit didn't stand; fixed-slope used
          method = "fixed-slope";
        } else {
          // Step 2 — even fixed-slope MLE didn't land in range: use the fit-free
          // reversal-mean (last resort).
          const rb = this.robustSRT();
          if (rb != null) { srt = rb; slope = null; converged = false; method = "reversal-mean"; }
        }
      }

      return {
        srt,
        slope,
        nll: best.fx,
        converged,
        degenerate,
        method,
        n: xs.length,
        floor
      };
    }

    // Robust, fit-free SRT for an A1 track: the mean of the reversal levels
    // (falling back to the mean of the settled second half if reversals weren't
    // recorded). This is the classic adaptive-threshold estimate and doesn't
    // depend on fitting a slope, so it survives scattered/non-monotonic data.
    robustSRT() {
      const log = Array.isArray(this.log) ? this.log : [];
      const revLevels = log.filter(e => e && e.reversal && isFinite(e.level)).map(e => e.level);
      const pick = revLevels.length >= 4
        ? revLevels
        : log.slice(Math.floor(log.length / 2)).map(e => e.level).filter(isFinite);
      if (!pick.length) return null;
      return pick.reduce((a, b) => a + b, 0) / pick.length;
    }

    // Sample the fitted curve for plotting: array of {x, y} across a range.
    curve(fit, xmin, xmax, steps) {
      if (!fit) return [];
      const out = [];
      const n = steps || 80;
      for (let i = 0; i <= n; i++) {
        const x = xmin + (xmax - xmin) * (i / n);
        out.push({ x, y: perUnitCurve(x, fit.srt, fit.slope, this.perUnitFloor) });
      }
      return out;
    }
  }

  // ── Nelder–Mead (2-parameter), ported from the reference demo ──
  function nelderMead(objective, start, step, options) {
    const alpha = 1, gamma = 2, rho = 0.5, sigma = 0.5;
    const maxIterations = (options && options.maxIterations) || 400;
    const tolerance = (options && options.tolerance) || 1e-7;

    let simplex = [
      { x: [start[0], start[1]], fx: objective([start[0], start[1]]) },
      { x: [start[0] + step[0], start[1]], fx: objective([start[0] + step[0], start[1]]) },
      { x: [start[0], start[1] + step[1]], fx: objective([start[0], start[1] + step[1]]) }
    ];

    for (let iter = 0; iter < maxIterations; iter++) {
      simplex.sort((a, b) => a.fx - b.fx);
      const best = simplex[0], second = simplex[1], worst = simplex[2];

      const spread = Math.max(Math.abs(best.fx - second.fx), Math.abs(best.fx - worst.fx));
      const size = Math.max(
        Math.hypot(best.x[0] - second.x[0], best.x[1] - second.x[1]),
        Math.hypot(best.x[0] - worst.x[0], best.x[1] - worst.x[1])
      );
      if (spread < tolerance && size < tolerance) {
        return { x: best.x, fx: best.fx, iterations: iter, converged: true };
      }

      const centroid = [(best.x[0] + second.x[0]) / 2, (best.x[1] + second.x[1]) / 2];
      const reflectedX = [
        centroid[0] + alpha * (centroid[0] - worst.x[0]),
        centroid[1] + alpha * (centroid[1] - worst.x[1])
      ];
      const reflected = { x: reflectedX, fx: objective(reflectedX) };

      if (reflected.fx < best.fx) {
        const expandedX = [
          centroid[0] + gamma * (reflected.x[0] - centroid[0]),
          centroid[1] + gamma * (reflected.x[1] - centroid[1])
        ];
        const expanded = { x: expandedX, fx: objective(expandedX) };
        simplex[2] = expanded.fx < reflected.fx ? expanded : reflected;
        continue;
      }
      if (reflected.fx < second.fx) { simplex[2] = reflected; continue; }

      let contractedX;
      if (reflected.fx < worst.fx) {
        contractedX = [
          centroid[0] + rho * (reflected.x[0] - centroid[0]),
          centroid[1] + rho * (reflected.x[1] - centroid[1])
        ];
      } else {
        contractedX = [
          centroid[0] - rho * (centroid[0] - worst.x[0]),
          centroid[1] - rho * (centroid[1] - worst.x[1])
        ];
      }
      const contracted = { x: contractedX, fx: objective(contractedX) };
      if (contracted.fx < worst.fx) { simplex[2] = contracted; continue; }

      simplex[1] = {
        x: [best.x[0] + sigma * (simplex[1].x[0] - best.x[0]),
            best.x[1] + sigma * (simplex[1].x[1] - best.x[1])], fx: 0
      };
      simplex[1].fx = objective(simplex[1].x);
      simplex[2] = {
        x: [best.x[0] + sigma * (simplex[2].x[0] - best.x[0]),
            best.x[1] + sigma * (simplex[2].x[1] - best.x[1])], fx: 0
      };
      simplex[2].fx = objective(simplex[2].x);
    }
    simplex.sort((a, b) => a.fx - b.fx);
    return { x: simplex[0].x, fx: simplex[0].fx, iterations: maxIterations, converged: false };
  }

  // ── Standalone re-fit from a log slice (for SRT(20) vs SRT(30) etc.) ──
  // Reconstructs the per-phoneme observations from log entries (each carries
  // level, correct, phonemes) and runs the identical MLE the session uses, so a
  // truncated estimate is computed exactly like the full one. `logEntries` is an
  // array of {level, correct, phonemes}; `floor` defaults to the open-set 0.
  // Returns { srt, slope, nll, converged, n } or null if too little data.
  // `opts.language` (or a phonemeCount inferred from the log) selects the
  // fixed-slope fallback constant.
  function fitFromLog(logEntries, floor = DEFAULT_PER_UNIT_FLOOR, opts) {
    const xs = [], ys = [];
    let inferredPh = null;
    for (const e of (logEntries || [])) {
      const lvl = Number(e.level);
      const ph = Number(e.phonemes) || 0;
      const cor = Number(e.correct) || 0;
      if (!isFinite(lvl) || ph <= 0) continue;
      if (inferredPh == null) inferredPh = ph;
      for (let i = 0; i < ph; i++) { xs.push(lvl); ys.push(i < cor ? 1 : 0); }
    }
    if (xs.length < 4) return null;
    const language = (opts && opts.language) || (inferredPh === 3 ? "english" : "maori");
    const nll = (params) => {
      const srt = params[0];
      const slope = Math.exp(params[1]);
      if (!isFinite(srt) || !isFinite(slope) || slope <= 0 || slope > 10) return Number.POSITIVE_INFINITY;
      const eps = 1e-12;
      let s = 0;
      for (let i = 0; i < xs.length; i++) {
        let p = floor + (1 - floor) * intelligibilityClean(xs[i], srt, slope);
        p = Math.min(1 - eps, Math.max(eps, p));
        s += -(ys[i] * Math.log(p) + (1 - ys[i]) * Math.log(1 - p));
      }
      return s;
    };
    const sorted = xs.slice().sort((a, b) => a - b);
    const lo = sorted[0], hi = sorted[sorted.length - 1];
    const medianX = sorted[Math.floor(sorted.length / 2)];
    const startSRT = isFinite(medianX) ? medianX : 0;

    // Multi-start (see estimate() for rationale: scattered data → flat likelihood).
    const srtStarts = [startSRT, lo + (hi - lo) * 0.25, lo + (hi - lo) * 0.5, lo + (hi - lo) * 0.75];
    const slopeStarts = [0.05, 0.1, 0.3];
    let best = null;
    for (const s0 of srtStarts) {
      for (const sl0 of slopeStarts) {
        const r = nelderMead(nll, [s0, Math.log(sl0)], [2.0, 0.5],
                             { maxIterations: 600, tolerance: 1e-9 });
        if (r && isFinite(r.fx) && (!best || r.fx < best.fx)) best = r;
      }
    }
    if (!best) return null;

    let srt = best.x[0];
    let slope = Math.exp(best.x[1]);
    let converged = best.converged;
    let degenerate = false;
    let method = "free-slope";

    const pad = Math.max(3, 0.15 * (hi - lo));
    const inRange = (v) => isFinite(v) && v >= lo - pad && v <= hi + pad;
    if (!inRange(srt) || slope < 0.01) {
      degenerate = true;
      // Step 1: fixed-slope MLE (same footing as good tracks).
      const fixed = fixedSlopeFor(language);
      const nllFixed = (params) => nll([params[0], Math.log(fixed)]);
      let bestF = null;
      for (const s0 of srtStarts) {
        const r = nelderMead(nllFixed, [s0], [2.0], { maxIterations: 400, tolerance: 1e-9 });
        if (r && isFinite(r.fx) && (!bestF || r.fx < bestF.fx)) bestF = r;
      }
      if (bestF && inRange(bestF.x[0])) {
        srt = bestF.x[0]; slope = fixed; converged = false; method = "fixed-slope";
      } else {
        // Step 2: reversal-mean (last resort).
        const rb = robustSRTFromLog(logEntries);
        if (rb != null) { srt = rb; slope = null; converged = false; method = "reversal-mean"; }
      }
    }
    return { srt, slope, nll: best.fx, converged, degenerate, method, n: xs.length, floor };
  }

  // Fit-free SRT from a log: mean of reversal levels, else mean of the settled
  // second half. Mirrors AdaptiveSession.robustSRT for the standalone path.
  function robustSRTFromLog(logEntries) {
    const log = Array.isArray(logEntries) ? logEntries : [];
    const rev = log.filter(e => e && e.reversal && isFinite(Number(e.level))).map(e => Number(e.level));
    const pick = rev.length >= 4
      ? rev
      : log.slice(Math.floor(log.length / 2)).map(e => Number(e.level)).filter(isFinite);
    if (!pick.length) return null;
    return pick.reduce((a, b) => a + b, 0) / pick.length;
  }

  // Rebuild an AdaptiveSession to the exact state captured in a snapshot, by
  // replaying its scored trials. The engine is a pure function of its trial
  // history, so replaying (level, proportion-correct) through record() restores
  // level, reversals, direction and fit data identically. For A2 the original
  // interleave is restored first (it's random per build); for A1 it's trivial.
  // snapshot = { meta:{procedure,startLevel,nTrials,phonemeCount,perUnitFloor,
  //   bk,pTargets,interleave,pos}, log:[{trackId?,level,correct,phonemes}|
  //   {level,outcomes}] }.
  function replaySession(snapshot) {
    if (!snapshot || !snapshot.meta) return null;
    const m = snapshot.meta;
    const s = new AdaptiveSession({
      procedure: m.procedure, startLevel: m.startLevel, nTrials: m.nTrials,
      phonemeCount: m.phonemeCount, perUnitFloor: m.perUnitFloor,
      bk: m.bk, pTargets: m.pTargets
    });
    if (Array.isArray(m.interleave) && m.interleave.length) {
      s.interleave = m.interleave.slice();
    }
    for (const e of (snapshot.log || [])) {
      // Reconstruct a phoneme-outcome vector giving the same proportion. record()
      // only uses the proportion, so exact ordering doesn't matter.
      let outcomes;
      if (Array.isArray(e.outcomes)) outcomes = e.outcomes;
      else {
        const n = e.phonemes || s.phonemeCount;
        const c = e.correct != null ? e.correct : Math.round((e.result || 0) * n);
        outcomes = Array.from({ length: n }, (_, i) => (i < c ? 1 : 0));
      }
      s.record(outcomes, e.level);
    }
    return s;
  }

  global.Adaptive = {
    BK_DEFAULTS,
    DEFAULT_PER_UNIT_FLOOR,
    AdaptiveTrack,
    AdaptiveSession,
    intelligibilityClean,
    perUnitCurve,
    nelderMead,
    fitFromLog,
    replaySession
  };
})(typeof window !== "undefined" ? window : globalThis);
