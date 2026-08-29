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
    // Adaptive settings: A1, 30 words.
    if ($("adaptiveProcedure")) $("adaptiveProcedure").value = "A1";
    if ($("adaptiveNTrials")) $("adaptiveNTrials").value = 30;

    // Starting level for THIS ear, from the participant specification (band table
    // on 2 kHz / PTA / 4FA, or an entered start value). Falls back to 60 if the
    // ear hasn't been specified yet.
    let startLevel = 60, startUnit = "dbA", startWarn = false;
    if (global.ParticipantInputs && typeof global.ParticipantInputs.startLevelFor === "function") {
      const s = global.ParticipantInputs.startLevelFor(ear);
      if (s) { startLevel = s.level; startUnit = s.unit; startWarn = s.warnCeiling; }
    }
    if ($("adaptiveStartLevel")) $("adaptiveStartLevel").value = startLevel;

    // Manual masker (used in the reduced-input modes with no audiogram): set the
    // live masker level and, if "track with presentation level" is ticked, leave
    // the app's adaptive masker-offset mechanism to follow the level.
    if (global.ParticipantInputs && typeof global.ParticipantInputs.maskerFor === "function") {
      const m = global.ParticipantInputs.maskerFor(ear);
      if (m && m.level != null) {
        if ($("maskLevel")) $("maskLevel").value = m.level;
        if ($("maskEar")) $("maskEar").value = (ear === "left" ? "right" : "left"); // mask the NON-test ear
      }
    }

    // Lists: the three allocation lists for this administration.
    global.state.adaptiveForm = global.state.adaptiveForm || {};
    global.state.adaptiveForm.selectedLists = admin.lists.slice();
    global.state.adaptiveForm.procedure = "A1";
    global.state.adaptiveForm.nTrials = 30;
    global.state.adaptiveForm.startLevel = startLevel;
    // Remember the derived start info for the export.
    admin._startLevel = startLevel; admin._startUnit = startUnit; admin._startWarn = startWarn;
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
    const admins = adminsFor(participant);
    xs.participant = participant;
    xs.position = 0;
    xs.running = false;
    xs.active = true;
    // Per-position status: "pending" | "done" | "aborted". Authoritative for the
    // playlist display and for finding the next thing to run. Preserved across a
    // restart of the SAME participant so completed positions keep their ticks
    // unless the clinician explicitly repeats them.
    if (!Array.isArray(xs.status) || xs.statusParticipant !== participant) {
      xs.status = admins ? admins.map(() => "pending") : [];
      xs.statusParticipant = participant;
    }
    if (typeof global.saveSession === "function") global.saveSession();
    renderSection();
    goToNextPending();
  }

  // Index of the first pending position, or -1 if none remain.
  function nextPendingIndex() {
    const xs = xstate();
    if (!Array.isArray(xs.status)) return -1;
    return xs.status.findIndex(s => s === "pending");
  }

  // Move to the next pending position and prompt it; if none, show completion.
  function goToNextPending() {
    const xs = xstate();
    const idx = nextPendingIndex();
    if (idx === -1) { xs.running = false; renderSection(); showComplete(); return; }
    xs.position = idx;
    promptPosition(idx);
  }

  // Run a SPECIFIC position (from a playlist click, or the linear flow). If it
  // already has data (done/aborted), running it again REPLACES that data — the
  // prior CSV rows are marked superseded so the analysis keeps every take but
  // knows which is current.
  function runPosition(idx) {
    const xs = xstate();
    const admins = adminsFor(xs.participant);
    if (!admins || idx < 0 || idx >= admins.length) return;
    xs.position = idx;
    promptPosition(idx);
  }

  function promptPosition(idx) {
    const xs = xstate();
    const admins = adminsFor(xs.participant);
    if (!admins) return;
    const admin = admins[idx];
    applyAdminToForm(admin);
    showInstructionModal(admin);
  }

  // Called by the app when a track finishes.
  function onTrackFinished(summary) {
    const xs = xstate();
    if (!xs.active || !xs.running) return;   // not an experiment-driven track
    const admin = currentAdmin();
    if (!admin) return;
    const idx = xs.position;
    // If this position already had data (a repeat/replace), mark prior rows
    // superseded so the analysis keeps every take but knows which is current.
    const wasReplaced = Array.isArray(xs.status) && xs.status[idx] && xs.status[idx] !== "pending";
    if (wasReplaced) supersedePriorRows(admin.position);
    recordAdministration(admin, summary, wasReplaced ? (takeCount(admin.position) + 1) : 1);
    if (Array.isArray(xs.status)) xs.status[idx] = "done";
    xs.running = false;
    if (typeof global.saveSession === "function") global.saveSession();
    renderSection();   // show the ✓ at once, before the next prompt
    // Small delay so the app's own summary dialog is seen first.
    setTimeout(() => goToNextPending(), 50);
  }

  // Called by the app when an experiment-driven track is abandoned.
  function onTrackAborted() {
    const xs = xstate();
    if (!xs.active || !xs.running) return;
    const idx = xs.position;
    if (Array.isArray(xs.status)) xs.status[idx] = "aborted";
    xs.running = false;
    if (typeof global.saveSession === "function") global.saveSession();
    renderSection();
  }

  // How many recorded takes exist for a given 1-based position (for take numbering).
  function takeCount(position) {
    const xs = xstate();
    if (!xs.adminCsv) return 0;
    let n = 0;
    xs.adminCsv.split("\n").forEach((line, i) => {
      if (i === 0 || !line) return;
      const cols = line.split(",");
      if (Number(cols[1]) === position && Number(cols[0]) === xs.participant) n++;
    });
    return n;
  }

  // Mark all prior CSV rows for this participant+position as superseded (set the
  // 'current' flag to 0). Keeps the raw data; flags which take is authoritative.
  function supersedePriorRows(position) {
    const xs = xstate();
    if (!xs.adminCsv) return;
    const lines = xs.adminCsv.split("\n");
    const header = lines[0].split(",");
    const curIdx = header.indexOf("is_current");
    if (curIdx === -1) return;
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue;
      const cols = lines[i].split(",");
      if (Number(cols[0]) === xs.participant && Number(cols[1]) === position) {
        cols[curIdx] = "0";
        lines[i] = cols.join(",");
      }
    }
    xs.adminCsv = lines.join("\n");
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
    "lists", "SRT20_dB", "slope20", "fit20_converged", "n_obs20",
    "SRT30_dB", "slope30", "fit30_converged", "n_obs30",
    "start_level_dB", "start_unit", "input_mode", "ref_threshold_HL", "best_BC_HL",
    "masker_ear", "masker_offset_dB", "manual_masker_dB", "masker_tracks_PL",
    "phoneme_count", "PTA_dB", "fourFA_dB", "take", "is_current", "timestamp"
  ];
  const TRIAL_HEADER = [
    "participant_id", "order_position", "repeat", "ear", "language",
    "trial_index", "word", "list_number", "level_dB",
    "phonemes_correct", "phonemes_total", "word_correct", "take"
  ];

  // Persist accumulating CSV text in state so it survives reloads and can be
  // downloaded at any time. (Rows are appended, never rewritten.)
  function ensureStores() {
    const xs = xstate();
    if (!xs.adminCsv) xs.adminCsv = csvRow(ADMIN_HEADER) + "\n";
    if (!xs.trialCsv) xs.trialCsv = csvRow(TRIAL_HEADER) + "\n";
  }

  function recordAdministration(admin, summary, take = 1) {
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
    const ear = admin.ear === "L" ? "left" : "right";
    const inp = (global.ParticipantInputs && global.ParticipantInputs.dataFor)
      ? global.ParticipantInputs.dataFor(ear) : null;
    xs.adminCsv += csvRow([
      pid, admin.position, admin.repeat, admin.condition, admin.ear, admin.language,
      admin.lists.join("+"),
      srt20 != null ? srt20.toFixed(2) : "",
      fit20 && fit20.slope != null ? fit20.slope.toFixed(5) : "",
      fit20 ? (fit20.converged ? 1 : 0) : "",
      fit20 ? fit20.n : "",
      srt30 != null ? srt30.toFixed(2) : "",
      summary && summary.slope != null ? summary.slope.toFixed(5) : "",
      summary ? (summary.fitConverged ? 1 : 0) : "",
      summary ? summary.nObservations : "",
      admin._startLevel != null ? admin._startLevel : (summary ? summary.startLevel : ""),
      admin._startUnit || "dbA",
      inp ? inp.mode : "",
      inp && inp.referenceThreshold != null ? inp.referenceThreshold : "",
      inp && inp.bestBC != null ? inp.bestBC : "",
      summary ? summary.maskerEar : "",
      summary && summary.maskerOffsetDb != null ? summary.maskerOffsetDb.toFixed(2) : "",
      inp && inp.masker && inp.masker.level != null ? inp.masker.level : "",
      inp && inp.masker ? (inp.masker.track ? 1 : 0) : "",
      summary ? summary.phonemeCount : "",
      inp && inp.pta != null ? inp.pta : "",       // PTA_dB — from PTA input mode
      inp && inp.fourfa != null ? inp.fourfa : "",  // fourFA_dB — from 4FA input mode
      take,                     // take number (1 = first; higher = repeat/replace)
      1,                        // is_current — this newest take supersedes earlier ones
      summary ? summary.timestamp : new Date().toISOString()
    ]) + "\n";

    // Trial-level rows (tagged with take so repeats are distinguishable).
    log.forEach((l, i) => {
      xs.trialCsv += csvRow([
        pid, admin.position, admin.repeat, admin.ear, admin.language,
        i + 1, l.word != null ? l.word : "",
        l.sourceList != null ? l.sourceList : "",
        l.level != null ? l.level.toFixed(2) : "",
        l.correct, l.phonemes,
        (l.correct != null && l.phonemes) ? (l.correct === l.phonemes ? 1 : 0) : "",
        take
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
      const xs = xstate();
      const switching = xs.participant && xs.participant !== p;
      const hasProgress = xs.participant === p && Array.isArray(xs.status) &&
                          xs.status.some(s => s !== "pending");
      if (hasProgress &&
          !confirm(`Participant ${p} already has progress. Continue from the next ` +
                   `unfinished position? (Completed positions keep their results; use ` +
                   `the row clicks to repeat individual ones.)`)) return;
      if (switching && !confirm(`Switch to participant ${p}? The current participant's ` +
          `progress markers are cleared (data already written to CSV is kept).`)) return;
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
    xs.status = null; xs.statusParticipant = null;
    setGhosted(false);
    renderSection();
    if (typeof global.saveSession === "function") global.saveSession();
  }

  function renderSection() {
    const section = ensureSection();
    const unlocked = isExperimentUnlocked();
    section.hidden = !unlocked;
    if (!unlocked) { setGhosted(false); return; }

    // Participant specification panel (per-ear input modes).
    if (global.ParticipantInputs && typeof global.ParticipantInputs.render === "function") {
      try { global.ParticipantInputs.render(); } catch (e) { console.error("[experiment] inputs render:", e); }
    }

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
    const status = Array.isArray(xs.status) ? xs.status : admins.map(() => "pending");
    const doneCount = status.filter(s => s === "done").length;
    progress.innerHTML = `Participant <b>${xs.participant}</b> — ` +
      `<b>${doneCount}</b> of ${admins.length} done` +
      (doneCount === admins.length ? ` · <span class="experiment-done">complete</span>` : "") +
      ` · <span class="hint">click any row to run, repeat or replace it</span>`;

    const rows = admins.map((a, i) => {
      const st = status[i] || "pending";
      const isCurrent = i === xs.position && xs.running;
      const cls = st === "done" ? "experiment-row-done"
                : st === "aborted" ? "experiment-row-aborted"
                : isCurrent ? "experiment-row-current" : "";
      const mark = st === "done" ? "✓" : st === "aborted" ? "✗" : isCurrent ? "▶" : "";
      const action = st === "done" ? "repeat" : st === "aborted" ? "retry" : "run";
      return `<tr class="experiment-row ${cls}" data-idx="${i}" title="Click to ${action} this position" style="cursor:pointer">
        <td style="padding:.2rem .4rem">${a.position}</td>
        <td style="padding:.2rem .4rem">r${a.repeat}</td>
        <td style="padding:.2rem .4rem">${a.language === "maori" ? "Māori" : "English"}</td>
        <td style="padding:.2rem .4rem">${earWord(a.ear)}</td>
        <td style="padding:.2rem .4rem">${a.lists.join(", ")}</td>
        <td style="padding:.2rem .4rem" class="experiment-mark">${mark}</td>
      </tr>`;
    }).join("");
    table.innerHTML =
      `<thead><tr style="text-align:left;border-bottom:1px solid var(--line)">
        <th style="padding:.2rem .4rem">#</th><th style="padding:.2rem .4rem">Rep</th>
        <th style="padding:.2rem .4rem">Lang</th><th style="padding:.2rem .4rem">Ear</th>
        <th style="padding:.2rem .4rem">Lists</th><th style="padding:.2rem .4rem"></th>
      </tr></thead><tbody>${rows}</tbody>`;

    // Click a row to run/repeat/replace that position.
    table.querySelectorAll("tr.experiment-row").forEach(tr => {
      tr.onclick = () => {
        const idx = Number(tr.getAttribute("data-idx"));
        const st = (xs.status && xs.status[idx]) || "pending";
        if (xs.running) {
          alert("A track is currently running. Finish or abandon it before choosing another position.");
          return;
        }
        if (st !== "pending" &&
            !confirm(`Position ${admins[idx].position} already has a result (${st}). ` +
                     `Run it again? The new take replaces the old as the current result ` +
                     `(the previous take is kept in the data, marked superseded).`)) return;
        runPosition(idx);
      };
    });
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
    init, renderSection, isExperimentUnlocked, onTrackFinished, onTrackAborted,
    runPosition, downloadAdminCsv, downloadTrialCsv
  };

  // Auto-init after load. Deferred a tick so the surrounding scripts (app.js,
  // the allocation) have finished executing and document.body is present.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 0);
  }
})(typeof window !== "undefined" ? window : globalThis);
