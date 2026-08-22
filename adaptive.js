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

  // Per-phoneme lower asymptote for open-set word scoring. Small but > 0
  // (a phoneme can be guessed from structured confusions). Matches the
  // demo's default open-set PerUnitFloor.
  const DEFAULT_PER_UNIT_FLOOR = 0.05;

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

      // Minimum-step floor on |ΔL|.
      if (Math.abs(deltaL) < bk.minStep) {
        deltaL = Math.sign(deltaL || 1) * bk.minStep;
      }

      // A2 step-doubling (Brand & Kollmeier rule 4): only when the target
      // itself is an extreme (≤20% or ≥80%), the response is past that
      // extreme, and the speed factor is large.
      let doubled = false;
      if (this.doubleStep) {
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

      // Reversal = sign change in ΔL (ignoring the first trial).
      let reversal = false;
      if (this.iteration >= 2 &&
          !((this.prevDeltaL > 0 && deltaL > 0) || (this.prevDeltaL < 0 && deltaL < 0))) {
        this.reversals += 1;
        reversal = true;
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

    // ── Psychometric fit over all accumulated per-phoneme data ──
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
      const medianX = sorted[Math.floor(sorted.length / 2)];
      const startSRT = isFinite(medianX) ? medianX : this.startLevel;
      const startSlope = 0.1;   // s50 as a sensible scale

      const res = nelderMead(nll, [startSRT, Math.log(startSlope)], [2.0, 0.5],
                             { maxIterations: 600, tolerance: 1e-9 });
      return {
        srt: res.x[0],
        slope: Math.exp(res.x[1]),
        nll: res.fx,
        converged: res.converged,
        n: xs.length,
        floor
      };
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

  global.Adaptive = {
    BK_DEFAULTS,
    DEFAULT_PER_UNIT_FLOOR,
    AdaptiveTrack,
    AdaptiveSession,
    intelligibilityClean,
    perUnitCurve,
    nelderMead
  };
})(typeof window !== "undefined" ? window : globalThis);
