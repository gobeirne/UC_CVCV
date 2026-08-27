/* ─────────────────────────────────────────────────────────────────────────
   masking.js — Clinical speech-masking engine.

   Implements the speech-masking rules (UC audiology, "When to mask for speech"):

   WHEN to mask the non-test ear (either condition triggers):
     1.  PL(TE) − IAA ≥ BC(NTE)         cross-hearing reaches the NTE cochlea
     2.  PL(TE) − bestBC(TE) ≥ IAA      the TE air–bone gap risks cross-hearing
     (speech is broadband, so BC means the BEST bone threshold at any frequency)

   Fallback when only SRTs exist (speech done before pure tones):
     mask if SRT(TE) − SRT(NTE) ≥ IAA

   HOW MUCH (mid-plateau effective masking, dB EM):
     Masking(NTE) = PL(TE) − IAA + ABgap(NTE) + 10

   OVER-MASKING limit (flag, don't silently cap): masking cross-heard back to the
   TE cochlea over-masks once
     Masking(NTE) − IAA ≥ bestBC(TE)          (broadband speech form)
   The engine reports the over-masking threshold and whether the computed level
   exceeds it, so the clinician can adjust; it does not silently clamp.

   IAA defaults are clinician-editable per transducer (conservative speech
   values): supra-aural 40, insert 55, AirPods/other user-entered. See iaaFor().

   Dynamic use: the required masking level is a function of PL(TE), which moves
   during an adaptive track. requiredMaskingLevel() is pure and can be recomputed
   each trial; the caller applies a gentle ramp so the masker doesn't pump.

   This module is pure logic + settings; app.js wires it to the masker gain path
   and the UI. It reads ParticipantInputs.dataFor(ear) for BC / AB-gap / SRT.
   ──────────────────────────────────────────────────────────────────────── */
(function (global) {
  "use strict";

  // ── IAA (interaural attenuation) settings, per transducer ─────────────
  const DEFAULT_IAA = { supraaural: 40, insert: 55, airpods: 45, other: 40 };

  function iaaSettings() {
    const s = global.state || (global.state = {});
    if (!s.masking) s.masking = {};
    if (!s.masking.iaa) s.masking.iaa = Object.assign({}, DEFAULT_IAA);
    return s.masking.iaa;
  }
  // Resolve the transducer to an IAA value. transducer is a string id; unknown
  // falls back to "other".
  function iaaFor(transducer) {
    const iaa = iaaSettings();
    const key = (transducer || "").toLowerCase();
    if (key in iaa) return Number(iaa[key]);
    if (/insert/.test(key)) return Number(iaa.insert);
    if (/supra|tdh|hda|headphone/.test(key)) return Number(iaa.supraaural);
    if (/airpod|earbud|bud/.test(key)) return Number(iaa.airpods);
    return Number(iaa.other);
  }
  function setIaa(transducer, value) {
    const iaa = iaaSettings();
    if (Number.isFinite(Number(value))) iaa[transducer] = Number(value);
  }

  // ── Data access ───────────────────────────────────────────────────────
  function earData(ear) {
    return (global.ParticipantInputs && global.ParticipantInputs.dataFor)
      ? global.ParticipantInputs.dataFor(ear) : null;
  }
  function otherEar(ear) { return ear === "left" ? "right" : "left"; }

  // Best AB gap for the NTE to use in the amount formula. Speech is broadband;
  // the conventional choice is the gap at the frequency driving cross-hearing.
  // We use the LARGEST AB gap present (most conservative — needs most masking),
  // falling back to 0 when no gap data exists.
  function maxABGap(ear) {
    const d = earData(ear);
    if (!d || !d.airBoneGaps) return 0;
    let max = 0;
    for (const f in d.airBoneGaps) {
      const g = Number(d.airBoneGaps[f]);
      if (Number.isFinite(g) && g > max) max = g;
    }
    return max;
  }

  // ── The rules ─────────────────────────────────────────────────────────
  // Decide whether the NTE needs masking, given the test ear, its presentation
  // level PL (dB, on the calibrated scale), and the transducer.
  // Returns { needed, reason, rule, missingData }.
  function maskingNeeded({ testEar, PL, transducer }) {
    const iaa = iaaFor(transducer);
    const te = earData(testEar);
    const nte = earData(otherEar(testEar));

    // Primary rules need BC. If BC is available for either ear, use the BBC rule.
    const bcNTE = nte ? nte.bestBC : null;
    const bcTE = te ? te.bestBC : null;

    if (bcNTE != null || bcTE != null) {
      const r1 = (bcNTE != null) && (PL - iaa >= bcNTE);         // cross-hearing to NTE cochlea
      const r2 = (bcTE != null) && (PL - bcTE >= iaa);           // TE air–bone gap risk
      const needed = !!(r1 || r2);
      const reasons = [];
      if (r1) reasons.push(`PL(${PL}) − IAA(${iaa}) ≥ best BC(NTE)=${bcNTE}`);
      if (r2) reasons.push(`PL(${PL}) − best BC(TE)=${bcTE} ≥ IAA(${iaa})`);
      return {
        needed, rule: "bbc",
        reason: needed ? reasons.join("; ")
                       : `PL − IAA below NTE bone (${PL - iaa} < ${bcNTE ?? "—"})`,
        missingData: (bcNTE == null || bcTE == null)
          ? "partial BC data — rule applied with what's available" : null
      };
    }

    // Fallback: SRT-difference rule, if both ears have an SRT-like reference.
    // Use referenceThreshold as an SRT proxy only if that's all we have.
    const srtTE = te ? te.referenceThreshold : null;
    const srtNTE = nte ? nte.referenceThreshold : null;
    if (srtTE != null && srtNTE != null) {
      const needed = (srtTE - srtNTE >= iaa);
      return {
        needed, rule: "srt",
        reason: `SRT(TE)=${srtTE} − SRT(NTE)=${srtNTE} ${needed ? "≥" : "<"} IAA(${iaa})`,
        missingData: "no bone conduction — used SRT-difference fallback"
      };
    }

    // No data to decide.
    return {
      needed: false, rule: "none",
      reason: "insufficient audiometric data to apply a masking rule",
      missingData: "no BC and no SRT pair — masking cannot be auto-determined"
    };
  }

  // Required mid-plateau effective masking level for the NTE (dB EM).
  //   Masking(NTE) = PL(TE) − IAA + ABgap(NTE) + 10
  // Returns { level, overMask, overMaskThreshold } where overMask is true if the
  // computed level would over-mask (cross back to the TE cochlea).
  function requiredMaskingLevel({ testEar, PL, transducer }) {
    const iaa = iaaFor(transducer);
    const abgapNTE = maxABGap(otherEar(testEar));
    const level = PL - iaa + abgapNTE + 10;

    // Over-masking: masking cross-hears back to TE once Masking − IAA ≥ bestBC(TE).
    const te = earData(testEar);
    const bcTE = te ? te.bestBC : null;
    let overMask = false, overMaskThreshold = null;
    if (bcTE != null) {
      overMaskThreshold = bcTE + iaa;           // masking level at which over-mask begins
      overMask = level >= overMaskThreshold;
    }
    return { level: Math.round(level), overMask, overMaskThreshold, iaa, abgapNTE };
  }

  // Convenience: full masking recommendation for the current situation.
  function recommend({ testEar, PL, transducer }) {
    const need = maskingNeeded({ testEar, PL, transducer });
    const amount = need.needed ? requiredMaskingLevel({ testEar, PL, transducer }) : null;
    return { ...need, amount, maskEar: otherEar(testEar) };
  }

  global.Masking = {
    DEFAULT_IAA, iaaSettings, iaaFor, setIaa,
    maskingNeeded, requiredMaskingLevel, recommend, maxABGap, otherEar
  };
})(typeof window !== "undefined" ? window : globalThis);
