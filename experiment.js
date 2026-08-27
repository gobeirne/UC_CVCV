/* ─────────────────────────────────────────────────────────────────────────
   experiment.js — Thesis experiment mode for the CVCV/CVC equivalence study.

   Activation: revealed only when the Clinician field contains "imogen" AND the
   Notes field contains "thesis" (both case-insensitive substring). When active,
   an "Experiment structure" section appears below Test configuration. Choosing a
   participant (1–50) drives the run through a FROZEN 12-position allocation
   (see experiment_allocation.js): 2 ears × 2 languages × 3 repeats. Each position
   is one A1 adaptive track of 30 words (3 ten-word lists); the software records
   the SRT at both the 20-word and 30-word points. The fields normally set by the
   clinician (language, ear, mode, lists, start level) are GHOSTED and take the
   values dictated by the allocation.

   The data layer writes two accumulating long-format CSVs designed for the R
   analysis (mixed model / TOST / Bland–Altman / reliability):
     • administration-level — one row per completed track (SRT20, SRT30, keys)
     • trial-level          — one row per word (level, phonemes, correctness)
   PTA is NOT captured here; a nullable PTA column is emitted for a later merge
   by participant ID (audiogram measured on separate clinical equipment).

   This module is intentionally self-contained: it reads/writes the existing
   `state`, calls the existing `setLanguage`/`startAdaptiveTrack`, and hooks the
   end of a track via a wrapper around `finishAdaptiveTrack`. It adds no behaviour
   to the normal (non-experiment) flow.
   ──────────────────────────────────────────────────────────────────────── */
(function (global) {
  "use strict";

  const $ = (id) => document.getElementById(id);

  // ── Activation predicate ──────────────────────────────────────────────
  function fieldVal(id) { const el = $(id); return el ? String(el.value || "") : ""; }
  function clinicianField() {
    // The clinician name lives in #clinician; fall back to nothing if absent.
    return fieldVal("clinician");
  }
  function notesField() {
    // Notes field id in this app is #sessionNotes; try a couple of likely ids.
    return fieldVal("sessionNotes") || fieldVal("notes") || fieldVal("clientNotes");
  }
  function isExperimentUnlocked() {
    return /imogen/i.test(clinicianField()) && /thesis/i.test(notesField());
  }

  // ── Allocation access ─────────────────────────────────────────────────
  // EXPERIMENT_ALLOCATION rows: [participant, [ [pos,repeat,cond,ear,lang,[lists]], ... ]]
  function adminsFor(participant) {
    const row = (global.EXPERIMENT_ALLOCATION || []).find(r => r[0] === participant);
    if (!row) return null;
    return row[1].map(a => ({
      position: a[0], repeat: a[1], condition: a[2],
      ear: a[3], language: a[4], lists: a[5].slice()
    }));
  }
  function participantCount() { return (global.EXPERIMENT_ALLOCATION || []).length; }

  // ── Module state (kept on the app's state so it survives session save) ──
  function xstate() {
    if (!global.state.experiment) {
      global.state.experiment = { active: false, participant: null, position: 0, running: false };
    }
    return global.state.experiment;
  }

  // ── Instruction text for the per-position modal ───────────────────────
  function earWord(ear) { return ear === "L" ? "left" : "right"; }
  function stimulusNoun(language) { return language === "maori" ? "Māori kupu" : "English words"; }
  function instructionFor(admin) {
    return `Tell the participant they'll now hear ${stimulusNoun(admin.language)} in their ` +
           `${earWord(admin.ear)} ear. Are you ready? Press Continue to begin testing.`;
  }

  // ── Ghosting: reflect an admin's dictated values into the (locked) fields ──
  const GHOST_IDS = [
    "langMaoriBtn", "langEnglishBtn", "modeFixedBtn", "modeAdaptiveBtn",
    "presentationCondition", "stimEar", "adaptiveProcedure", "adaptiveStartLevel",
    "adaptiveNTrials", "randomiseOrderToggle"
  ];
  function setGhosted(on) {
    GHOST_IDS.forEach(id => {
      const el = $(id);
      if (!el) return;
      el.classList.toggle("experiment-ghost", on);
      // Lock interaction without hiding the value.
      if (on) { el.setAttribute("disabled", "disabled"); el.setAttribute("aria-disabled", "true"); }
      else { el.removeAttribute("disabled"); el.removeAttribute("aria-disabled"); }
    });
    // Also lock the adaptive list picker area, if present.
    const picker = $("adaptiveListPicker");
    if (picker) picker.classList.toggle("experiment-ghost", on);
  }

  // Drive the app's own controls to the dictated values for one admin.
  function applyAdminToForm(admin) {
    // Language
    if (typeof global.setLanguage === "function") global.setLanguage(admin.language, { silent: true });
    // Mode → adaptive
    if (typeof global.setTestMode === "function") global.setTestMode("adaptive");
    // Ear: presentation condition + stimulus routing
    const ear = admin.ear === "L" ? "left" : "right";
    if ($("presentationCondition")) $("presentationCondition").value = ear;
    if ($("stimEar")) $("stimEar").value = ear;
    // Adaptive settings: A1, 30 words, fixed start level.
    if ($("adaptiveProcedure")) $("adaptiveProcedure").value = "A1";
    if ($("adaptiveNTrials")) $("adaptiveNTrials").value = 30;
    if ($("adaptiveStartLevel") && !$("adaptiveStartLevel").value) $("adaptiveStartLevel").value = 60;
    // Lists: the three allocation lists for this administration.
    global.state.adaptiveForm = global.state.adaptiveForm || {};
    global.state.adaptiveForm.selectedLists = admin.lists.slice();
    global.state.adaptiveForm.procedure = "A1";
    global.state.adaptiveForm.nTrials = 30;
    // Reflect list selection into the picker UI if the app exposes a renderer.
    if (typeof global.renderAdaptiveListPicker === "function") {
      try { global.renderAdaptiveListPicker(); } catch {}
    }
    setGhosted(true);
    renderSection();
  }

  // ── The stepper ───────────────────────────────────────────────────────
  function currentAdmin() {
    const xs = xstate();
    if (!xs.participant) return null;
    const admins = adminsFor(xs.participant);
    if (!admins) return null;
    return admins[xs.position] || null;   // position is 0-based index
  }

  function startParticipant(participant) {
    const xs = xstate();
    xs.participant = participant;
    xs.position = 0;
    xs.running = false;
    xs.active = true;
    if (typeof global.saveSession === "function") global.saveSession();
    renderSection();
    promptNextPosition();
  }

  function promptNextPosition() {
    const xs = xstate();
    const admins = adminsFor(xs.participant);
    if (!admins) return;
    if (xs.position >= admins.length) { showComplete(); return; }
    const admin = admins[xs.position];
    applyAdminToForm(admin);
    showInstructionModal(admin);
  }

  // Called by the app when a track finishes (via the finishAdaptiveTrack hook).
  function onTrackFinished(summary) {
    const xs = xstate();
    if (!xs.active || !xs.running) return;   // not an experiment-driven track
    const admin = currentAdmin();
    if (!admin) return;
    recordAdministration(admin, summary);
    xs.running = false;
    xs.position += 1;
    if (typeof global.saveSession === "function") global.saveSession();
    // Small delay so the app's own summary dialog is seen first.
    setTimeout(() => promptNextPosition(), 50);
  }

  // ── Data layer: build and append CSV rows ─────────────────────────────
  function csvEscape(v) {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }
  function csvRow(fields) { return fields.map(csvEscape).join(","); }

  const ADMIN_HEADER = [
    "participant_id", "order_position", "repeat", "condition", "ear", "language",
    "lists", "SRT20_dB", "SRT30_dB", "slope30", "fit30_converged", "n_obs30",
    "start_level_dB", "masker_ear", "masker_offset_dB", "phoneme_count",
    "PTA_dB", "timestamp"
  ];
  const TRIAL_HEADER = [
    "participant_id", "order_position", "repeat", "ear", "language",
    "trial_index", "word", "list_number", "level_dB",
    "phonemes_correct", "phonemes_total", "word_correct"
  ];

  // Persist accumulating CSV text in state so it survives reloads and can be
  // downloaded at any time. (Rows are appended, never rewritten.)
  function ensureStores() {
    const xs = xstate();
    if (!xs.adminCsv) xs.adminCsv = csvRow(ADMIN_HEADER) + "\n";
    if (!xs.trialCsv) xs.trialCsv = csvRow(TRIAL_HEADER) + "\n";
  }

  function recordAdministration(admin, summary) {
    ensureStores();
    const xs = xstate();
    const log = (summary && summary.log) || [];
    // SRT(30) is the full-track fit already computed; SRT(20) re-fits the first 20.
    const srt30 = (summary && summary.srt != null) ? summary.srt : null;
    const fit20 = (global.Adaptive && global.Adaptive.fitFromLog)
      ? global.Adaptive.fitFromLog(log.slice(0, 20))
      : null;
    const srt20 = fit20 ? fit20.srt : null;

    const pid = xs.participant;
    xs.adminCsv += csvRow([
      pid, admin.position, admin.repeat, admin.condition, admin.ear, admin.language,
      admin.lists.join("+"),
      srt20 != null ? srt20.toFixed(2) : "",
      srt30 != null ? srt30.toFixed(2) : "",
      summary && summary.slope != null ? summary.slope.toFixed(5) : "",
      summary ? (summary.fitConverged ? 1 : 0) : "",
      summary ? summary.nObservations : "",
      summary ? summary.startLevel : "",
      summary ? summary.maskerEar : "",
      summary && summary.maskerOffsetDb != null ? summary.maskerOffsetDb.toFixed(2) : "",
      summary ? summary.phonemeCount : "",
      "",                       // PTA_dB — nullable, merged later by participant_id
      summary ? summary.timestamp : new Date().toISOString()
    ]) + "\n";

    // Trial-level rows.
    log.forEach((l, i) => {
      xs.trialCsv += csvRow([
        pid, admin.position, admin.repeat, admin.ear, admin.language,
        i + 1, l.word != null ? l.word : "",
        l.sourceList != null ? l.sourceList : "",
        l.level != null ? l.level.toFixed(2) : "",
        l.correct, l.phonemes,
        (l.correct != null && l.phonemes) ? (l.correct === l.phonemes ? 1 : 0) : ""
      ]) + "\n";
    });
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function downloadAdminCsv() {
    ensureStores();
    downloadText(`experiment_administrations.csv`, xstate().adminCsv);
  }
  function downloadTrialCsv() {
    ensureStores();
    downloadText(`experiment_trials.csv`, xstate().trialCsv);
  }

  // ── UI: the Experiment structure section ──────────────────────────────
  function ensureSection() {
    if ($("experimentSection")) return $("experimentSection");
    const anchor = document.querySelector('.card h2');
    // Find the Test configuration card to insert after it.
    let testCard = null;
    document.querySelectorAll(".card").forEach(c => {
      const h = c.querySelector("h2");
      if (h && /test configuration/i.test(h.textContent)) testCard = c;
    });
    const section = document.createElement("div");
    section.className = "card";
    section.id = "experimentSection";
    section.hidden = true;
    section.innerHTML = `
      <h2>Experiment structure</h2>
      <p class="hint" id="experimentIntro">
        Thesis mode. Choosing a participant runs the frozen 12-position allocation
        (2 ears × 2 languages × 3 repeats). Each position is one A1 track of 30
        words; the SRT is recorded at both 20 and 30 words. The dictated fields
        above are locked while a participant is selected.
      </p>
      <div class="grid three">
        <label>Participant
          <select id="experimentParticipant"></select>
        </label>
        <div style="align-self:end">
          <button type="button" id="experimentStartBtn" class="secondary">Start / restart participant</button>
        </div>
        <div style="align-self:end">
          <button type="button" id="experimentClearBtn" class="secondary">Clear (unlock fields)</button>
        </div>
      </div>
      <div id="experimentProgress" class="hint" style="margin-top:.5rem"></div>
      <table id="experimentTable" class="experiment-table" style="margin-top:.6rem;width:100%;border-collapse:collapse;font-size:.82rem"></table>
      <div class="actions wrap" style="margin-top:.7rem">
        <button type="button" id="experimentDownloadAdmin" class="secondary" style="font-size:.8rem">Download administrations CSV</button>
        <button type="button" id="experimentDownloadTrial" class="secondary" style="font-size:.8rem">Download trials CSV</button>
      </div>
    `;
    if (testCard && testCard.parentNode) {
      testCard.parentNode.insertBefore(section, testCard.nextSibling);
    } else {
      document.body.appendChild(section);
    }

    // Populate participant dropdown.
    const sel = section.querySelector("#experimentParticipant");
    sel.innerHTML = `<option value="">— select —</option>` +
      Array.from({ length: participantCount() }, (_, i) =>
        `<option value="${i + 1}">Participant ${i + 1}</option>`).join("");

    // Wire buttons.
    section.querySelector("#experimentStartBtn").onclick = () => {
      const p = Number(sel.value);
      if (!p) { alert("Select a participant first."); return; }
      if (xstate().participant && xstate().position > 0 &&
          !confirm(`Restart participant ${p} from position 1? Progress markers reset (data already written to CSV is kept).`)) return;
      startParticipant(p);
    };
    section.querySelector("#experimentClearBtn").onclick = clearParticipant;
    section.querySelector("#experimentDownloadAdmin").onclick = downloadAdminCsv;
    section.querySelector("#experimentDownloadTrial").onclick = downloadTrialCsv;
    return section;
  }

  function clearParticipant() {
    const xs = xstate();
    xs.participant = null; xs.position = 0; xs.running = false;
    setGhosted(false);
    renderSection();
    if (typeof global.saveSession === "function") global.saveSession();
  }

  function renderSection() {
    const section = ensureSection();
    const unlocked = isExperimentUnlocked();
    section.hidden = !unlocked;
    if (!unlocked) { setGhosted(false); return; }

    const xs = xstate();
    const sel = section.querySelector("#experimentParticipant");
    if (xs.participant && sel.value !== String(xs.participant)) sel.value = String(xs.participant);

    const progress = section.querySelector("#experimentProgress");
    const table = section.querySelector("#experimentTable");
    if (!xs.participant) {
      progress.textContent = "No participant selected — the fields above are unlocked.";
      table.innerHTML = "";
      return;
    }
    const admins = adminsFor(xs.participant);
    progress.innerHTML = `Participant <b>${xs.participant}</b> — position ` +
      `<b>${Math.min(xs.position + 1, admins.length)}</b> of ${admins.length}` +
      (xs.position >= admins.length ? ` · <span class="experiment-done">complete</span>` : "");

    const rows = admins.map((a, i) => {
      const done = i < xs.position;
      const current = i === xs.position;
      const cls = done ? "experiment-row-done" : current ? "experiment-row-current" : "";
      return `<tr class="${cls}">
        <td style="padding:.2rem .4rem">${a.position}</td>
        <td style="padding:.2rem .4rem">r${a.repeat}</td>
        <td style="padding:.2rem .4rem">${a.language === "maori" ? "Māori" : "English"}</td>
        <td style="padding:.2rem .4rem">${earWord(a.ear)}</td>
        <td style="padding:.2rem .4rem">${a.lists.join(", ")}</td>
        <td style="padding:.2rem .4rem">${done ? "✓" : current ? "▶" : ""}</td>
      </tr>`;
    }).join("");
    table.innerHTML =
      `<thead><tr style="text-align:left;border-bottom:1px solid var(--line)">
        <th style="padding:.2rem .4rem">#</th><th style="padding:.2rem .4rem">Rep</th>
        <th style="padding:.2rem .4rem">Lang</th><th style="padding:.2rem .4rem">Ear</th>
        <th style="padding:.2rem .4rem">Lists</th><th style="padding:.2rem .4rem"></th>
      </tr></thead><tbody>${rows}</tbody>`;
  }

  // ── Instruction & completion modals ───────────────────────────────────
  function ensureModal() {
    let dlg = $("experimentModal");
    if (dlg) return dlg;
    dlg = document.createElement("dialog");
    dlg.id = "experimentModal";
    dlg.className = "experiment-modal";
    dlg.innerHTML = `
      <div style="max-width:32rem">
        <h3 id="experimentModalTitle" style="margin-top:0"></h3>
        <p id="experimentModalBody" style="font-size:1.05rem;line-height:1.5"></p>
        <div class="actions" style="margin-top:1rem;display:flex;gap:.5rem;justify-content:flex-end">
          <button type="button" id="experimentModalCancel" class="secondary">Pause</button>
          <button type="button" id="experimentModalGo" class="primary">Continue</button>
        </div>
      </div>`;
    document.body.appendChild(dlg);
    dlg.querySelector("#experimentModalCancel").onclick = () => dlg.close();
    return dlg;
  }
  function showInstructionModal(admin) {
    const dlg = ensureModal();
    dlg.querySelector("#experimentModalTitle").textContent =
      `Position ${admin.position} of 12 — repeat ${admin.repeat}`;
    dlg.querySelector("#experimentModalBody").textContent = instructionFor(admin);
    const go = dlg.querySelector("#experimentModalGo");
    go.textContent = "Continue";
    go.onclick = () => { dlg.close(); beginAdminTrack(); };
    if (typeof dlg.showModal === "function") dlg.showModal();
  }
  function showComplete() {
    const dlg = ensureModal();
    dlg.querySelector("#experimentModalTitle").textContent = "Participant complete";
    dlg.querySelector("#experimentModalBody").textContent =
      `All 12 administrations are done. The data has been written to the two CSV ` +
      `stores — use the download buttons to save them. You can now select another participant.`;
    const go = dlg.querySelector("#experimentModalGo");
    go.textContent = "Done";
    go.onclick = () => { dlg.close(); setGhosted(false); renderSection(); };
    if (typeof dlg.showModal === "function") dlg.showModal();
  }

  function beginAdminTrack() {
    const xs = xstate();
    const admin = currentAdmin();
    if (!admin) return;
    applyAdminToForm(admin);   // ensure fields are set right before start
    xs.running = true;
    if (typeof global.startAdaptiveTrack === "function") {
      global.startAdaptiveTrack();
    }
  }

  // The app calls Experiment.onTrackFinished(summary) directly from the end of
  // finishAdaptiveTrack (a bare-identifier call can't be monkey-patched via the
  // window property, so an explicit notify is used instead of a wrapper).

  // ── Live trigger: watch the clinician/notes fields ────────────────────
  function installTriggerWatch() {
    ["clinician", "sessionNotes", "notes", "clientNotes"].forEach(id => {
      const el = $(id);
      if (el && !el.__experimentWatched) {
        el.addEventListener("input", renderSection);
        el.__experimentWatched = true;
      }
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────
  function init() {
    ensureSection();
    installTriggerWatch();
    renderSection();
  }

  // Expose a tiny API (used by init hook in app.js and for debugging).
  global.Experiment = {
    init, renderSection, isExperimentUnlocked, onTrackFinished,
    downloadAdminCsv, downloadTrialCsv
  };

  // Auto-init after load. Deferred a tick so the surrounding scripts (app.js,
  // the allocation) have finished executing and document.body is present.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 0);
  }
})(typeof window !== "undefined" ? window : globalThis);
