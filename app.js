/* Te reo Māori CVCV Speech Audiometry
   Static, GitHub Pages friendly, local-file friendly.
   Put audio files in /sounds. The app resolves by the text before the first "_",
   trying the known filename first, then .mp3/.wav alternatives.
*/

const WORD_LISTS = {
  1: [
    ["hēki","h","eː","k","i","egg"],
    ["keke","k","e","k","e","cake"],
    ["moni","m","o","n","i","money, cash"],
    ["nama","n","a","m","a","to owe, borrow"],
    ["ngutu","ŋ","u","t","u","lip"],
    ["papa","p","a","p","a","plank"],
    ["rangi","ɾ","a","ŋ","i","sky, day, heaven"],
    ["tiro","t","i","ɾ","o","inspection, gaze"],
    ["waho","w","a","h","o","outside"],
    ["whitu","f","i","t","u","seven"]
  ],
  2: [
    ["hipi","h","i","p","i","sheep"],["kurī","k","u","ɾ","iː","dog"],["mihi","m","i","h","i","greet"],
    ["neke","n","e","k","e","snake"],["ngata","ŋ","a","t","a","snail"],["poto","p","o","t","o","short"],
    ["runga","ɾ","u","ŋ","a","top"],["tuku","t","u","k","u","offering"],["wera","w","e","ɾ","a","heat"],["whana","f","a","n","a","spring/kick"]
  ],
  3: [
    ["huri","h","u","ɾ","i","turn"],["kēmu","k","eː","m","u","game"],["mata","m","a","t","a","face/screen"],
    ["niho","n","i","h","o","tooth"],["ngako","ŋ","a","k","o","essence"],["pune","p","u","n","e","spoon"],
    ["rōpū","ɾ","oː","p","uː","group"],["tāne","t","aː","n","e","man"],["waka","w","a","k","a","waka/vehicle"],["whiti","f","i","t","i","shining"]
  ],
  4: [
    ["hope","h","o","p","e","hip"],["kaha","k","a","h","a","strong"],["manu","m","a","n","u","bird"],
    ["nōku","n","oː","k","u","mine"],["ngāti","ŋ","aː","t","i","clan"],["pere","p","e","ɾ","e","bell"],
    ["rimu","ɾ","i","m","u","seaweed/red pine"],["tangi","t","a","ŋ","i","cry"],["wiri","w","i","ɾ","i","shaking"],["whatu","f","a","t","u","eye"]
  ],
  5: [
    ["heru","h","e","ɾ","u","comb"],["kino","k","i","n","o","bad"],["mangu","m","a","ŋ","u","black"],
    ["noho","n","o","h","o","living"],["ngaki","ŋ","a","k","i","weed/cultivate"],["pipi","p","i","p","i","cockle"],
    ["rūma","ɾ","uː","m","a","room"],["take","t","a","k","e","reason"],["wētā","w","eː","t","aː","wētā"],["whare","f","a","ɾ","e","house"]
  ],
  6: [
    ["hāte","h","aː","t","e","shirt"],["kupu","k","u","p","u","word"],["mīti","m","iː","t","i","meat"],
    ["noke","n","o","k","e","worm"],["ngeru","ŋ","e","ɾ","u","cat"],["pahi","p","a","h","i","bus"],
    ["rima","ɾ","i","m","a","five"],["tino","t","i","n","o","main/best"],["weka","w","e","k","a","woodhen"],["whanga","f","a","ŋ","a","bay"]
  ],
  7: [
    ["hapū","h","a","p","uː","subtribe/clan"],["kohu","k","o","h","u","fog"],["miro","m","i","ɾ","o","thread"],
    ["nēra","n","eː","ɾ","a","nail"],["ngenge","ŋ","e","ŋ","e","tired"],["piko","p","i","k","o","bend"],
    ["rama","ɾ","a","m","a","torch"],["tana","t","a","n","a","his/her"],["wiki","w","i","k","i","week"],["whetū","f","e","t","uː","star"]
  ],
  8: [
    ["hine","h","i","n","e","girl"],["kīngi","k","iː","ŋ","i","king"],["mōku","m","oː","k","u","for me"],
    ["nōna","n","oː","n","a","belonging to him/her"],["ngaru","ŋ","a","ɾ","u","wave"],["pāmu","p","aː","m","u","farm"],
    ["rata","ɾ","a","t","a","tame"],["tēpu","t","eː","p","u","table"],["wehi","w","e","h","i","fear/awe"],["whata","f","a","t","a","elevate/support"]
  ],
  9: [
    ["honu","h","o","n","u","turtle"],["koha","k","o","h","a","gift"],["mutu","m","u","t","u","cease"],
    ["nāna","n","aː","n","a","belongs to someone"],["ngira","ŋ","i","ɾ","a","needle"],["pēpi","p","eː","p","i","baby"],
    ["reka","ɾ","e","k","a","sweet"],["tiki","t","i","k","i","fetch"],["wāhi","w","aː","h","i","place"],["whero","f","e","ɾ","o","red"]
  ],
  10: [
    ["hinu","h","i","n","u","fat"],["kare","k","a","ɾ","e","dear/friend"],["muku","m","u","k","u","dishcloth"],
    ["nēhi","n","eː","h","i","nurse"],["ngaro","ŋ","a","ɾ","o","hidden"],["peka","p","e","k","a","branch"],
    ["roto","ɾ","o","t","o","lake"],["tapu","t","a","p","u","sacred"],["waha","w","a","h","a","mouth"],["whiwhi","f","i","f","i","acquire"]
  ]
};

const KNOWN_SOUND_FILES = [
"hapū_+3.9dB.wav","hāte_-0.0dB.wav","hēki_+1.7dB.wav","heru_-1.3dB.wav","hine_-1.0dB.wav","hinu_-2.6dB.wav","hipi_+4.4dB.wav","honu_-2.5dB.wav","hope_+1.6dB.wav","huri_+0.6dB.wav","kaha_+3.2dB.wav","kare_-4.0dB.wav","keke_+1.5dB.wav","kēmu_-0.0dB.wav","kīngi_-2.1dB.wav","kino_-1.9dB.wav","koha_-2.2dB.wav","kohu_-2.7dB.wav","KōreroMai_01_+1.6dB.wav","KōreroMai_02_+2.2dB.wav","kupu_+1.7dB.wav","kurī_+0.2dB.wav","mangu_-2.2dB.wav","manu_-0.4dB.wav","mata_+1.1dB.wav","mihi_+1.9dB.wav","miro_-0.7dB.wav","mīti_+0.2dB.wav","mōku_+0.5dB.wav","moni_-1.1dB.wav","muku_-0.3dB.wav","mutu_-0.3dB.wav","nama_-0.2dB.wav","nāna_-2.1dB.wav","nēhi_-1.8dB.wav","neke_+4.0dB.wav","nēra_-1.1dB.wav","ngaki_+0.5dB.wav","ngako_+2.8dB.wav","ngaro_-3.9dB.wav","ngaru_-3.2dB.wav","ngata_+3.3dB.wav","ngāti_+2.0dB.wav","ngenge_-1.8dB.wav","ngeru_-1.8dB.wav","ngira_-2.8dB.wav","ngutu_+3.4dB.wav","niho_+2.1dB.wav","noho_+0.4dB.wav","noke_+1.6dB.wav","nōku_+2.3dB.wav","nōna_-1.7dB.wav","pahi_-0.9dB.wav","pāmu_-3.8dB.wav","papa_+2.5dB.wav","peka_-1.7dB.wav","pēpi_-1.4dB.wav","pere_-1.0dB.wav","piko_+0.6dB.wav","pipi_-1.5dB.wav","poto_+3.4dB.wav","pune_+0.5dB.wav","rama_-2.7dB.wav","rangi_+0.0dB.wav","rata_-4.2dB.wav","reka_-1.9dB.wav","rima_-2.3dB.wav","rimu_-1.9dB.wav","rōpū_+2.9dB.wav","roto_-0.3dB.wav","rūma_-1.6dB.wav","runga_+0.0dB.wav","take_+2.2dB.wav","tana_-2.7dB.wav","tāne_-1.7dB.wav","tangi_-1.1dB.wav","tapu_-0.8dB.wav","tēpu_+3.0dB.wav","tiki_+1.4dB.wav","tino_-2.0dB.wav","tiro_+4.9dB.wav","tuku_+4.8dB.wav","waha_+5.1dB.wav","wāhi_-6.1dB.wav","waho_-1.4dB.wav","waka_+0.4dB.wav","wehi_-0.3dB.wav","weka_-0.8dB.wav","wera_+0.4dB.wav","wētā_+0.9dB.wav","whana_-0.4dB.wav","whanga_-0.1dB.wav","whare_-3.2dB.wav","whata_-1.4dB.wav","whatu_+1.8dB.wav","whero_-2.5dB.wav","whetū_+2.2dB.wav","whiti_+3.0dB.wav","whitu_+3.9dB.wav","whiwhi_+4.4dB.wav","wiki_+0.0dB.wav","wiri_-1.7dB.wav"
];

const PHONEMES = {
  C: ["p","t","k","m","n","ŋ","w","f","ɾ","h"],
  V: ["a","e","i","o","u","aː","eː","iː","oː","uː"]
};
const V_EQ = { "a":"a","aː":"a","e":"e","eː":"e","i":"i","iː":"i","o":"o","oː":"o","u":"u","uː":"u" };

const state = {
  client: {},
  calibration: { measuredDbA: null, timestamp: null, isCalibrated: false, sliderMinDb: -100, sliderMaxDb: 0, currentSliderDb: 0 },
  queue: [],
  currentListIndex: -1,
  currentTrialIndex: 0,
  currentTrials: [],
  currentResultIndexByTrial: {},
  firstTrialMaskerPrimed: false,
  results: [],
  trialScore: null,
  targetSelections: [false,false,false,false],
  responseSelections: [null,null,null,null],
  audio: {
    ctx: null,
    masker: null,
    maskerGain: null,
    calSource: null,
    calNode: null,
    testCalNode: null,
    activeStimuli: [],
    decodedBuffers: {}
  }
};

const $ = (id) => document.getElementById(id);

function snap5(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n / 5) * 5;
}

function conditionSymbol(condition) {
  return { left: "×", right: "○", binaural: "B", soundfield: "S", aided: "A", unaided: "U" }[condition] || "?";
}

function conditionLabel(condition) {
  return { left: "Left", right: "Right", binaural: "Binaural", soundfield: "Sound field", aided: "Aided", unaided: "Unaided" }[condition] || condition;
}

function init() {
  $("sessionDate").value = new Date().toISOString().slice(0,10);
  for (let i = 1; i <= 10; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `List ${i}`;
    $("listChoice").appendChild(opt);
    if ($("queueListNumber")) $("queueListNumber").appendChild(opt.cloneNode(true));
  }
  bindEvents();
  setupCalibrationSlider();
  drawPI();
  loadDraftIntoForm();
  if ($("maskingEnabled")) updateMaskingEnabled();
  offerStoredCalibration();
}

function setupFastScoreButtons() {
  const box = document.querySelector(".score-buttons");
  if (!box) return;
  box.innerHTML = "";
  for (let i = 0; i <= 4; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.score = String(i);
    btn.textContent = String(i);
    btn.onclick = () => {
      state.trialScore = i;
      state.targetSelections = [0,1,2,3].map(idx => idx < i);
      state.responseSelections = [null,null,null,null];
      markScoreButton();
      renderSelectionColours();
    };
    box.appendChild(btn);
  }
}

function bindEvents() {
  $("toCalibrationBtn").onclick = () => { readClientForm(); show("screen-calibration"); };
  $("restoreBtn").onclick = restoreSession;
  $("calibrateBtn").onclick = toggleCalibration;
  $("testCalBtn").onclick = testCalibratedSound;
  $("skipCalBtn").onclick = () => {
    stopCalibrationSound();
    stopTestCalibratedSound();
    show("screen-setup");
  };
  $("outputLevel").addEventListener("input", updateOutputLevelFromSlider);
  $("outputLevel").addEventListener("change", updateOutputLevelFromSlider);
  $("outputLevel").addEventListener("touchend", updateOutputLevelFromSlider);

  $("stimEar").onchange = () => {
    const ear = $("stimEar").value;
    if ($("maskingEnabled") && $("maskingEnabled").value === "off") {
      $("maskEar").value = "off";
    } else {
      if (ear === "left") $("maskEar").value = "right";
      if (ear === "right") $("maskEar").value = "left";
      if (ear === "binaural") $("maskEar").value = "binaural";
    }
    syncMaskerControls();
  };

  $("maskLevel").addEventListener("input", () => {
    $("maskLevel").value = snap5($("maskLevel").value);
    $("maskLevelLive").value = $("maskLevel").value;
    updateLiveMasker();
  });
  $("maskEar").addEventListener("change", () => {
    $("maskEarLive").value = $("maskEar").value;
    updateLiveMasker();
  });
  $("maskLevelLive").addEventListener("input", () => {
    $("maskLevelLive").value = snap5($("maskLevelLive").value);
    $("maskLevel").value = $("maskLevelLive").value;
    updateLiveMasker();
  });
  $("maskEarLive").addEventListener("change", () => {
    $("maskEar").value = $("maskEarLive").value;
    updateLiveMasker();
  });

  $("addListBtn").onclick = () => addList(Number($("listChoice").value), snap5($("listLevel").value));
  $("addRandomBtn").onclick = () => addRandomList(snap5($("listLevel").value));
  $("addNRandomBtn").onclick = addNRandomLists;
  $("startBtn").onclick = startTesting;

  if ($("addQueueBtn")) $("addQueueBtn").onclick = () => openQueueDialog(null);
  if ($("queueSaveBtn")) $("queueSaveBtn").onclick = saveQueueDialog;
  if ($("queueDeleteBtn")) $("queueDeleteBtn").onclick = deleteQueueDialog;
  if ($("presentationCondition")) $("presentationCondition").onchange = updatePresentationConditionRouting;
  if ($("maskingEnabled")) $("maskingEnabled").onchange = updateMaskingEnabled;
  if ($("conditionSaveBtn")) $("conditionSaveBtn").onclick = saveConditionDialog;
  if ($("trialEditSaveBtn")) $("trialEditSaveBtn").onclick = saveTrialEditDialog;

  $("playWordBtn").onclick = () => playCurrent(true);
  $("repeatWordBtn").onclick = () => playCurrent(false);
  $("toggleMaskBtn").onclick = toggleMasker;

  setupFastScoreButtons();
  $("clearScoreBtn").onclick = clearScoring;
  $("nextTrialBtn").onclick = nextTrial;
  $("abandonBtn").onclick = () => $("abandonDialog").showModal();
  $("confirmAbandonBtn").onclick = abandonList;

  $("downloadJsonBtn").onclick = downloadJson;
  $("downloadTsvBtn").onclick = downloadTsv;
  if ($("copyTsvBtn")) $("copyTsvBtn").onclick = copyTsv;
  $("reportBtn").onclick = showReport;
  $("backToTestBtn").onclick = () => show("screen-test");
  $("printBtn").onclick = () => window.print();

  document.addEventListener("keydown", (e) => {
    if (!$("screen-test").classList.contains("active")) return;
    if (["0","1","2","3","4"].includes(e.key)) {
      state.trialScore = Number(e.key);
      state.targetSelections = [0,1,2,3].map(idx => idx < state.trialScore);
      state.responseSelections = [null,null,null,null];
      markScoreButton();
      renderSelectionColours();
    }
    if (e.code === "Space" && !["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)) {
      e.preventDefault();
      playCurrent(true);
    }
    if (e.key === "Enter") nextTrial();
    if (e.key === "Escape") $("abandonDialog").showModal();
  });
}

function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $(id).classList.add("active");
}

function readClientForm() {
  state.client = {
    name: $("clientName").value.trim(),
    id: $("clientId").value.trim(),
    dob: $("clientDob") ? $("clientDob").value : "",
    date: $("sessionDate").value,
    clinician: $("clinician").value.trim(),
    notes: $("sessionNotes").value.trim()
  };
  saveSession();
}

function loadDraftIntoForm() {
  const saved = localStorage.getItem("ucTeReoSpeechAudiometry");
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    if (parsed.client) {
      $("clientName").value = parsed.client.name || "";
      $("clientId").value = parsed.client.id || "";
      if ($("clientDob")) $("clientDob").value = parsed.client.dob || "";
      $("sessionDate").value = parsed.client.date || $("sessionDate").value;
      $("clinician").value = parsed.client.clinician || "";
      $("sessionNotes").value = parsed.client.notes || "";
    }
  } catch {}
}

function restoreSession() {
  const saved = localStorage.getItem("ucTeReoSpeechAudiometry");
  if (!saved) return alert("No saved session found.");
  Object.assign(state, JSON.parse(saved));
  setupCalibrationSlider();
  if (state.calibration?.isCalibrated) $("testCalBtn").hidden = false;
  syncMaskerControls();
  renderQueue();
  drawPI();
  show("screen-setup");
}

function saveSession() {
  localStorage.setItem("ucTeReoSpeechAudiometry", JSON.stringify({
    client: state.client,
    calibration: state.calibration,
    queue: state.queue,
    currentListIndex: state.currentListIndex,
    currentTrialIndex: state.currentTrialIndex,
    currentTrials: state.currentTrials,
    results: state.results
  }));
}

function ensureAudio() {
  if (!state.audio.ctx) {
    state.audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return state.audio.ctx;
}

function soundKey(filename) {
  // Strip path, extension, and final calibration suffix only.
  // This preserves meaningful underscores in names like KōreroMai_01_+1.6dB.wav.
  return filename
    .replace(/^.*\//, "")
    .replace(/\.(mp3|wav)$/i, "")
    .replace(/_[+-]?\d+(?:\.\d+)?dB$/i, "");
}

function fileForWord(word) {
  const exact = KNOWN_SOUND_FILES.find(f => soundKey(f) === word);
  if (exact) return `sounds/${exact}`;
  return `sounds/${word}.mp3`;
}

function candidatesForBase(base) {
  const known = KNOWN_SOUND_FILES.filter(f => soundKey(f) === base).map(f => `sounds/${f}`);
  return [...known, `sounds/${base}.wav`, `sounds/${base}.mp3`];
}

function pickKoreroMai() {
  return Math.random() < .5 ? "KōreroMai_01" : "KōreroMai_02";
}

function createRoutedAudio(url, ear, levelDbA, loop=false) {
  const ctx = ensureAudio();
  const el = new Audio(url);
  el.loop = loop;
  el.preload = "auto";
  const source = ctx.createMediaElementSource(el);
  const gain = ctx.createGain();
  const pan = ctx.createStereoPanner();

  pan.pan.value = ear === "left" ? -1 : ear === "right" ? 1 : 0;
  gain.gain.value = gainForLevel(levelDbA);

  source.connect(gain).connect(pan).connect(ctx.destination);
  const node = { el, source, gain, pan, loop };

  if (!loop) {
    state.audio.activeStimuli.push(node);
    setStimulusIndicator(true);
    el.addEventListener("ended", () => {
      state.audio.activeStimuli = state.audio.activeStimuli.filter(x => x !== node);
      if (!state.audio.activeStimuli.length) setStimulusIndicator(false);
    }, { once: true });
  } else {
    // Fallback only: iOS can gap HTMLAudioElement loops.
    // Main masker path uses AudioBufferSourceNode below.
    el.addEventListener("timeupdate", () => {
      if (el.duration && el.duration - el.currentTime < 0.12) {
        try { el.currentTime = 0; el.play(); } catch {}
      }
    });
  }
  return node;
}

function gainForLevel(levelDbA) {
  if (state.calibration.isCalibrated && state.calibration.measuredDbA !== null) {
    const attenuation = Number(state.calibration.measuredDbA) - Number(levelDbA);
    return Math.pow(10, -attenuation / 20);
  }
  // Uncalibrated fallback treats requested level as dB FS if negative, otherwise full scale.
  const dbfs = Math.min(0, Number(levelDbA));
  return Math.pow(10, dbfs / 20);
}

async function playFirstAvailable(bases, ear, levelDbA, loop=false) {
  let lastError = null;
  for (const base of bases) {
    const urls = base.includes("/") ? [base] : candidatesForBase(base);
    for (const url of urls) {
      try {
        const node = createRoutedAudio(url, ear, levelDbA, loop);
        await node.el.play();
        return node;
      } catch (err) {
        lastError = err;
      }
    }
  }
  throw lastError || new Error("No audio file found");
}

function setupCalibrationSlider() {
  const slider = $("outputLevel");
  slider.min = state.calibration.sliderMinDb ?? -100;
  slider.max = state.calibration.sliderMaxDb ?? 0;
  slider.step = 0.1;
  slider.value = state.calibration.currentSliderDb ?? slider.max;
  updateOutputLevelFromSlider();
}

function updateOutputLevelFromSlider() {
  const slider = $("outputLevel");
  let rawValue = parseFloat(slider.value);
  if (state.calibration.isCalibrated && state.calibration.measuredDbA !== null) {
    const max = parseFloat(slider.max);
    const tolerance = 0.25;
    const snapped = Math.abs(rawValue - max) <= tolerance ? max : Math.round(rawValue / 5) * 5;
    slider.value = snapped;
    state.calibration.currentSliderDb = snapped;
    $("outputLevelLabel").textContent = `${snapped} dB A`;
    $("modeBadge").textContent = "Calibrated Mode";
    $("modeBadge").classList.add("calibrated");
  } else {
    const snapped = Math.round(rawValue / 5) * 5;
    slider.value = snapped;
    state.calibration.currentSliderDb = snapped;
    $("outputLevelLabel").textContent = `${snapped} dB FS`;
    $("modeBadge").textContent = "Uncalibrated Mode";
    $("modeBadge").classList.remove("calibrated");
  }
  saveSession();
}

function applyCalibrationLevel(level, timestamp = new Date().toISOString()) {
  state.calibration.measuredDbA = level;
  state.calibration.timestamp = timestamp;
  state.calibration.isCalibrated = true;
  state.calibration.sliderMaxDb = level;
  state.calibration.sliderMinDb = Math.floor(level / 5) * 5 - 60;
  state.calibration.currentSliderDb = level;
  const slider = $("outputLevel");
  slider.min = state.calibration.sliderMinDb;
  slider.max = state.calibration.sliderMaxDb;
  slider.step = 0.1;
  slider.value = level;
  $("testCalBtn").hidden = false;
  updateOutputLevelFromSlider();
  saveSession();
}

function offerStoredCalibration() {
  const saved = localStorage.getItem("ucTeReoSpeechAudiometryCalibration");
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    if (!data.level) return;
    const when = data.timestamp ? new Date(data.timestamp).toLocaleString("en-NZ", { dateStyle: "short", timeStyle: "medium" }) : "an earlier session";
    const useIt = confirm(`You last calibrated this device to ${data.level} dB A on ${when}.\nUse this calibration?`);
    if (useIt) {
      alert("Remember to turn your device volume to full.");
      applyCalibrationLevel(Number(data.level), data.timestamp);
    }
  } catch {}
}

async function decodeFirstAvailable(bases) {
  const ctx = ensureAudio();
  for (const base of bases) {
    const urls = base.includes("/") ? [base] : candidatesForBase(base);
    for (const url of urls) {
      if (state.audio.decodedBuffers[url]) return state.audio.decodedBuffers[url];
      try {
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const arr = await resp.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arr);
        state.audio.decodedBuffers[url] = decoded;
        return decoded;
      } catch {}
    }
  }
  throw new Error("No decodable calibration sound found");
}

function stopCalibrationSound() {
  if (state.audio.calNode) {
    try { state.audio.calNode.stop(); } catch {}
    state.audio.calNode = null;
  }
}

async function toggleCalibration() {
  const btn = $("calibrateBtn");
  if (state.audio.calNode) {
    stopCalibrationSound();
    btn.textContent = "Calibration";
    btn.classList.remove("active");
    const measured = prompt("Enter measured calibration level (in dB A):");
    if (!measured || isNaN(measured)) return;
    const level = parseFloat(measured);
    applyCalibrationLevel(level);
    localStorage.setItem("ucTeReoSpeechAudiometryCalibration", JSON.stringify({ level, timestamp: state.calibration.timestamp }));
    $("calStatus").textContent = `Calibrated to ${level} dB A.`;
    return;
  }

  stopCurrentStimulusIfAny();
  stopTestCalibratedSound();
  ensureAudio();
  let buffer;
  try {
    buffer = await decodeFirstAvailable(["calib", "noise", "masking"]);
  } catch {
    alert("No calibration sound file found.\nPlease add calib.wav to the sounds/ folder.");
    return;
  }
  alert("Turn your device volume all the way up, then tap OK to play the calibration tone.");
  const source = state.audio.ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(state.audio.ctx.destination);
  source.start();
  state.audio.calNode = source;
  btn.textContent = "Stop & Enter Level";
  btn.classList.add("active");
  $("calStatus").textContent = "Calibration sound playing.";
}

async function testCalibratedSound() {
  if (!state.calibration.isCalibrated) return;

  if (state.audio.testCalNode) {
    stopTestCalibratedSound();
    return;
  }

  stopCurrentStimulusIfAny();
  stopCalibrationSound();

  let buffer;
  try {
    buffer = await decodeFirstAvailable(["calib", "noise", "masking"]);
  } catch {
    alert("No calibration sound file found.");
    return;
  }

  const source = state.audio.ctx.createBufferSource();
  const gain = state.audio.ctx.createGain();
  source.buffer = buffer;
  source.loop = true;
  gain.gain.value = gainForLevel(state.calibration.currentSliderDb);
  source.connect(gain).connect(state.audio.ctx.destination);
  source.start();

  state.audio.testCalNode = source;
  $("testCalBtn").textContent = "Stop";
  source.onended = () => {
    if (state.audio.testCalNode === source) {
      state.audio.testCalNode = null;
      $("testCalBtn").textContent = "Test Calibrated Sound";
    }
  };
}

function stopTestCalibratedSound() {
  if (state.audio.testCalNode) {
    try { state.audio.testCalNode.stop(); } catch {}
    state.audio.testCalNode = null;
  }
  if ($("testCalBtn")) $("testCalBtn").textContent = "Test Calibrated Sound";
}

function stopCurrentStimulusIfAny() {
  for (const node of state.audio.activeStimuli || []) {
    try {
      node.el.pause();
      node.el.currentTime = 0;
    } catch {}
  }
  state.audio.activeStimuli = [];
  setStimulusIndicator(false);
}

function updateMaskingEnabled() {
  const enabled = $("maskingEnabled") && $("maskingEnabled").value === "on";
  $("maskEar").disabled = !enabled;
  $("maskLevel").disabled = !enabled;
  if (!enabled) {
    $("maskEar").value = "off";
    if ($("maskEarLive")) $("maskEarLive").value = "off";
    stopMasker();
  } else if ($("maskEar").value === "off") {
    const stim = $("stimEar").value;
    $("maskEar").value = stim === "left" ? "right" : stim === "right" ? "left" : "binaural";
  }
  syncMaskerControls();
}

function openConditionDialog() {
  if (!$("conditionDialog")) return;
  $("conditionEditSelect").value = $("presentationCondition") ? $("presentationCondition").value : $("stimEar").value;
  $("conditionDialog").showModal();
}

function saveConditionDialog() {
  if ($("presentationCondition")) {
    $("presentationCondition").value = $("conditionEditSelect").value;
    updatePresentationConditionRouting();
    renderQueue();
    drawPI();
    saveSession();
  }
  $("conditionDialog").close();
}

function openTrialEdit(resultIndex) {
  const r = state.results[resultIndex];
  if (!r || !$("trialEditDialog")) return;
  $("trialEditResultIndex").value = String(resultIndex);
  $("trialEditTitle").textContent = `Edit ${r.presentedWord}`;
  $("trialEditScore").value = String(r.score ?? 0);
  $("trialEditComment").value = r.comment || "";
  $("trialEditDialog").showModal();
}

function saveTrialEditDialog() {
  const idx = Number($("trialEditResultIndex").value);
  if (!Number.isFinite(idx) || !state.results[idx]) return;
  state.results[idx].score = Number($("trialEditScore").value);
  state.results[idx].percent = state.results[idx].score * 25;
  state.results[idx].comment = $("trialEditComment").value.trim();
  saveSession();
  drawPI();
  renderTrialNavigator();
  $("trialEditDialog").close();
}

function updatePresentationConditionRouting() {
  const c = $("presentationCondition") ? $("presentationCondition").value : $("stimEar").value;
  if (c === "left") $("stimEar").value = "left";
  else if (c === "right") $("stimEar").value = "right";
  else $("stimEar").value = "binaural";
  if ($("stimEar").onchange) $("stimEar").onchange();
}

function addList(listNumber, level) {
  if (!listNumber || !level) return;
  state.queue.push({ listNumber, levelDbA: level, status: "queued", id: crypto.randomUUID?.() || String(Date.now()+Math.random()) });
  renderQueue();
  saveSession();
}

function addRandomList(level) {
  const allLists = Object.keys(WORD_LISTS).map(Number);
  let pool = allLists;

  // Do not duplicate a list while the queue contains fewer than 10 list entries.
  // Once the clinician adds more than 10 entries, repeats are unavoidable and allowed.
  if (state.queue.length < allLists.length) {
    const used = new Set(state.queue.map(q => q.listNumber));
    pool = allLists.filter(n => !used.has(n));
  }

  const n = pool[Math.floor(Math.random() * pool.length)];
  addList(n, level);
}

function addNRandomLists() {
  const n = Math.max(1, Math.min(10, Number($("randomCount").value)));
  const level = snap5($("randomLevel").value);
  for (let i = 0; i < n; i++) addRandomList(level);
}

function renderQueue() {
  const box = $("queueChips");
  if (!box) return;
  box.innerHTML = "";
  state.queue.forEach((q, idx) => {
    const chip = document.createElement("span");
    chip.className = "chip queue-chip" + (idx === state.currentListIndex ? " current" : "");
    chip.draggable = true;
    chip.dataset.index = String(idx);
    chip.innerHTML = `List ${q.listNumber} @ ${q.levelDbA} dB(A) — ${q.status} <span class="queue-arrows">↕</span>`;
    chip.onclick = () => openQueueDialog(idx);

    chip.addEventListener("dragstart", e => {
      chip.classList.add("dragging");
      e.dataTransfer.setData("text/plain", String(idx));
    });
    chip.addEventListener("dragend", () => chip.classList.remove("dragging"));
    chip.addEventListener("dragover", e => e.preventDefault());
    chip.addEventListener("drop", e => {
      e.preventDefault();
      const from = Number(e.dataTransfer.getData("text/plain"));
      moveQueueItem(from, idx);
    });

    box.appendChild(chip);
  });

  const progress = $("progressIndicator");
  if (progress) progress.innerHTML = box.innerHTML;
}

function openQueueDialog(index) {
  const dlg = $("queueDialog");
  if (!dlg) return;
  const isNew = index === null || index === undefined;
  $("queueDialogTitle").textContent = isNew ? "Add list" : "Edit list";
  $("queueEditIndex").value = isNew ? "" : String(index);
  $("queueListNumber").value = isNew ? String(Number($("listChoice")?.value || 1)) : String(state.queue[index].listNumber);
  $("queueLevel").value = isNew ? String(snap5($("listLevel")?.value || 60)) : String(state.queue[index].levelDbA);
  $("queueDeleteBtn").style.visibility = isNew ? "hidden" : "visible";
  dlg.showModal();
}

function saveQueueDialog() {
  const idxRaw = $("queueEditIndex").value;
  const listNumber = Number($("queueListNumber").value);
  const levelDbA = snap5($("queueLevel").value);
  if (idxRaw === "") {
    addList(listNumber, levelDbA);
  } else {
    const idx = Number(idxRaw);
    if (state.queue[idx]) {
      state.queue[idx].listNumber = listNumber;
      state.queue[idx].levelDbA = levelDbA;
      renderQueue();
      saveSession();
    }
  }
  $("queueDialog").close();
}

function deleteQueueDialog() {
  const idx = Number($("queueEditIndex").value);
  if (!Number.isFinite(idx) || !state.queue[idx]) return;
  if (state.queue[idx].status === "in progress" && !confirm("Delete the list currently in progress? Existing trial data already saved will remain in the report.")) return;
  state.queue.splice(idx, 1);
  if (state.currentListIndex >= state.queue.length) state.currentListIndex = Math.max(0, state.queue.length - 1);
  renderQueue();
  saveSession();
  $("queueDialog").close();
}

function moveQueueItem(from, to) {
  if (from === to || !state.queue[from] || !state.queue[to]) return;
  const [item] = state.queue.splice(from, 1);
  state.queue.splice(to, 0, item);
  if (state.currentListIndex === from) state.currentListIndex = to;
  renderQueue();
  saveSession();
}

function startTesting() {
  readClientForm();
  if (!state.queue.length) addRandomList(Number($("listLevel").value));
  state.currentListIndex = state.queue.findIndex(q => q.status === "queued");
  if (state.currentListIndex < 0) state.currentListIndex = 0;
  syncMaskerControls();
  state.firstTrialMaskerPrimed = false;
  beginCurrentList();
  show("screen-test");
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function beginCurrentList() {
  const q = state.queue[state.currentListIndex];
  if (!q) return showReport();
  q.status = "in progress";
  state.firstTrialMaskerPrimed = false;
  state.currentTrials = shuffle(WORD_LISTS[q.listNumber]).map((w, i) => ({ order: i + 1, word: w }));
  state.currentResultIndexByTrial = {};
  state.currentTrialIndex = 0;
  renderQueue();
  renderTrial();
  startMaskerIfNeeded();
  saveSession();
}

function currentQueueItem() { return state.queue[state.currentListIndex]; }
function currentTrial() { return state.currentTrials[state.currentTrialIndex]; }

function renderTrial() {
  clearScoring();
  const trial = currentTrial();
  const q = currentQueueItem();
  if (!trial || !q) return;
  const [word, c1, v1, c2, v2, translation] = trial.word;
  $("currentWord").innerHTML = `${word}<span class="kupu-translation">${translation}</span>`;
  const c = $("presentationCondition") ? $("presentationCondition").value : $("stimEar").value;
  $("currentMeta").innerHTML = `List ${q.listNumber}, ${q.levelDbA} dB(A), trial ${state.currentTrialIndex + 1} of ${state.currentTrials.length} — <span class="condition-chip" title="Click to change condition">${conditionLabel(c)}</span>`;
  const conditionChip = $("currentMeta").querySelector(".condition-chip");
  if (conditionChip) conditionChip.onclick = openConditionDialog;
  if ($("phonemeHeading")) $("phonemeHeading").textContent = `Phoneme scoring - ${word}`;
  renderTargetPhonemes([c1,v1,c2,v2]);
  renderAdvanced([c1,v1,c2,v2]);
  renderSelectionColours();
  renderQueue();
  renderTrialNavigator();
  scheduleAutoplay();
}

function scheduleAutoplay() {
  // Let the UI paint first, then play the carrier phrase + kupu.
  // For the first kupu in a list, if masking is active, give the masker at least 3 seconds first.
  const maskerOn = $("maskEar").value !== "off";
  const needsMaskerLeadIn = maskerOn && !state.firstTrialMaskerPrimed && state.currentTrialIndex === 0;
  const delay = needsMaskerLeadIn ? 3100 : 250;
  if (needsMaskerLeadIn) state.firstTrialMaskerPrimed = true;

  setTimeout(() => {
    if ($("screen-test").classList.contains("active")) playCurrent(true);
  }, delay);
}

function renderTrialNavigator() {
  const box = $("trialNavigator");
  if (!box) return;
  box.innerHTML = "";
  if (!state.currentTrials || !state.currentTrials.length) return;

  state.currentTrials.forEach((trial, idx) => {
    const resultIdx = state.currentResultIndexByTrial?.[idx];
    const result = Number.isFinite(resultIdx) ? state.results[resultIdx] : null;
    const item = document.createElement("div");
    item.className = "trial-nav-item" + (idx === state.currentTrialIndex ? " current" : "") + (result ? " done" : "");
    const scoreText = result ? `${result.score}/4` : idx === state.currentTrialIndex ? "now" : "—";
    const scoreClass = result ? (result.score >= 3 ? "good" : "bad") : "";
    item.innerHTML = `<span>${idx + 1}</span><span>${trial.word[0]}</span><span class="trial-nav-score ${scoreClass}">${scoreText}</span>`;
    item.onclick = () => {
      if (result) openTrialEdit(resultIdx);
      else if (idx >= state.currentTrialIndex) {
        state.currentTrialIndex = idx;
        renderTrial();
      }
    };
    box.appendChild(item);
  });
}

function renderTargetPhonemes(phonemes) {
  const row = $("targetPhonemes");
  row.innerHTML = "";
  phonemes.forEach((p, idx) => {
    const div = document.createElement("div");
    div.className = "phoneme-target";
    div.textContent = p;
    div.onclick = () => {
      state.targetSelections[idx] = !state.targetSelections[idx];
      div.classList.toggle("selected", state.targetSelections[idx]);
      state.trialScore = computeCurrentScore();
      markScoreButton();
      renderSelectionColours();
    };
    row.appendChild(div);
  });
}

function renderAdvanced(targets) {
  const box = $("advancedColumns");
  box.innerHTML = "";
  targets.forEach((target, idx) => {
    const type = idx % 2 === 0 ? "C" : "V";
    const col = document.createElement("div");
    col.className = "advanced-col";
    col.innerHTML = `<h4>${idx + 1}: /${target}/</h4>`;
    ["–", ...PHONEMES[type]].forEach(p => {
      const btn = document.createElement("div");
      btn.className = "phoneme-option" + (p === "–" ? " blank-option" : "");
      btn.textContent = p;
      btn.title = p === "–" ? "Blank / no response for this position" : "";
      btn.onclick = () => {
        [...col.querySelectorAll(".phoneme-option")].forEach(x => x.classList.remove("selected", "correct-selected", "incorrect-selected"));
        btn.classList.add("selected");
        state.responseSelections[idx] = p === "–" ? "–" : p;
        state.trialScore = computeCurrentScore();
        markScoreButton();
        renderSelectionColours();
      };
      col.appendChild(btn);
    });
    box.appendChild(col);
  });
}

function equivalent(target, response) {
  if (!response || response === "–") return false;
  if (V_EQ[target] && V_EQ[response]) return V_EQ[target] === V_EQ[response];
  return target === response;
}

function computeAdvancedScore(targets, responses) {
  return targets.reduce((sum, t, i) => sum + (equivalent(t, responses[i]) ? 1 : 0), 0);
}

function computeCurrentScore() {
  const trial = currentTrial();
  if (!trial) return 0;
  const targets = trial.word.slice(1,5);
  let score = 0;
  targets.forEach((target, idx) => {
    const advanced = state.responseSelections[idx];
    if (advanced !== null && advanced !== undefined && advanced !== "") {
      if (equivalent(target, advanced)) score++;
    } else if (state.targetSelections[idx]) {
      score++;
    }
  });
  return score;
}

function renderSelectionColours() {
  const trial = currentTrial();
  if (!trial) return;
  const targets = trial.word.slice(1,5);

  document.querySelectorAll(".phoneme-target").forEach((el, idx) => {
    const advanced = state.responseSelections[idx];
    const topSelected = !!state.targetSelections[idx];
    const advancedChosen = !!advanced;

    el.classList.toggle("selected", topSelected || advancedChosen);
    el.classList.toggle("correct-selected", topSelected || (advancedChosen && equivalent(targets[idx], advanced)));
    el.classList.toggle("incorrect-selected", advancedChosen && !equivalent(targets[idx], advanced));
  });

  document.querySelectorAll(".advanced-col").forEach((col, idx) => {
    const target = targets[idx];
    const explicitResponse = state.responseSelections[idx];

    col.querySelectorAll(".phoneme-option").forEach(btn => {
      const p = btn.textContent;
      const isChosen = explicitResponse === p;
      const isTopSelected = !explicitResponse && state.targetSelections[idx] && equivalent(target, p);

      btn.classList.toggle("selected", isChosen);
      btn.classList.toggle("correct-selected", (isChosen && equivalent(target, p)) || isTopSelected);
      btn.classList.toggle("incorrect-selected", isChosen && !equivalent(target, p));
    });
  });
}

function markScoreButton() {
  document.querySelectorAll(".score-buttons button").forEach(btn => {
    btn.classList.toggle("fast-selected", Number(btn.dataset.score) === state.trialScore);
  });
}

function clearScoring() {
  state.trialScore = null;
  state.targetSelections = [false,false,false,false];
  state.responseSelections = [null,null,null,null];
  $("trialComment").value = "";
  document.querySelectorAll(".phoneme-target,.phoneme-option").forEach(x => x.classList.remove("selected", "correct-selected", "incorrect-selected"));
  markScoreButton();
}

async function playCurrent(withCarrier) {
  stopCurrentStimulusIfAny();
  const trial = currentTrial();
  const q = currentQueueItem();
  if (!trial || !q) return;
  const word = trial.word[0];
  const level = q.levelDbA;
  const ear = $("stimEar").value;
  try {
    if (withCarrier) {
      const carrier = await playFirstAvailable([pickKoreroMai()], ear, level, false);
      carrier.el.addEventListener("ended", () => playFirstAvailable([word], ear, level, false), { once: true });
    } else {
      await playFirstAvailable([word], ear, level, false);
    }
  } catch {
    alert(`Could not play ${word}. Check the file exists in /sounds.`);
  }
}

function setMaskerIndicator(isOn) {
  const el = $("maskerStatus");
  if (!el) return;
  el.classList.toggle("on", !!isOn);
  el.classList.toggle("off", !isOn);
  el.textContent = isOn ? "Masker playing" : "Masker off";
}

function setStimulusIndicator(isOn) {
  const el = $("stimulusStatus");
  if (!el) return;
  el.classList.toggle("on", !!isOn);
  el.classList.toggle("off", !isOn);
  el.textContent = isOn ? "Kupu playing" : "Kupu idle";
}

function syncMaskerControls() {
  if ($("maskLevelLive")) $("maskLevelLive").value = $("maskLevel").value;
  if ($("maskEarLive")) $("maskEarLive").value = $("maskEar").value;
}

function updateLiveMasker() {
  syncMaskerControls();
  if (state.audio.masker) {
    state.audio.masker.gain.gain.value = gainForLevel(Number($("maskLevel").value));
    state.audio.masker.pan.pan.value = $("maskEar").value === "left" ? -1 : $("maskEar").value === "right" ? 1 : 0;
    if ($("maskEar").value === "off") stopMasker();
    else setMaskerIndicator(true);
  } else if ($("maskEar").value !== "off" && $("screen-test").classList.contains("active")) {
    startMasker();
  }
  saveSession();
}

async function startMaskerIfNeeded() {
  stopMasker();
  if ($("maskEar").value !== "off") await startMasker();
}

async function startMasker() {
  if (state.audio.masker) return;
  try {
    const ctx = ensureAudio();
    const buffer = await decodeFirstAvailable(["noise","masking"]);
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner();

    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = gainForLevel(Number($("maskLevel").value));
    pan.pan.value = $("maskEar").value === "left" ? -1 : $("maskEar").value === "right" ? 1 : 0;

    source.connect(gain).connect(pan).connect(ctx.destination);
    source.start();

    state.audio.masker = { bufferSource: source, gain, pan, isBufferLoop: true };
    $("toggleMaskBtn").textContent = "Stop masker";
    setMaskerIndicator(true);
  } catch {
    try {
      state.audio.masker = await playFirstAvailable(["noise","masking"], $("maskEar").value, Number($("maskLevel").value), true);
      $("toggleMaskBtn").textContent = "Stop masker";
      setMaskerIndicator(true);
    } catch {
      $("toggleMaskBtn").textContent = "Start masker";
      setMaskerIndicator(false);
    }
  }
}

function stopMasker() {
  if (state.audio.masker) {
    if (state.audio.masker.isBufferLoop) {
      try { state.audio.masker.bufferSource.stop(); } catch {}
    } else if (state.audio.masker.el) {
      state.audio.masker.el.pause();
      state.audio.masker.el.currentTime = 0;
    }
    state.audio.masker = null;
  }
  $("toggleMaskBtn").textContent = "Start masker";
  setMaskerIndicator(false);
}

function toggleMasker() {
  syncMaskerControls();
  if (state.audio.masker) stopMasker();
  else startMasker();
}

function nextTrial() {
  const trial = currentTrial();
  const q = currentQueueItem();
  if (!trial || !q) return;
  const targets = trial.word.slice(1,5);
  const score = computeCurrentScore();
  const resultPayload = {
    timestamp: new Date().toISOString(),
    client: state.client,
    listNumber: q.listNumber,
    listLevelDbA: q.levelDbA,
    presentationCondition: $("presentationCondition") ? $("presentationCondition").value : $("stimEar").value,
    stimulusEar: $("stimEar").value,
    transducer: $("transducer") ? $("transducer").value : "",
    maskerEar: $("maskEar").value,
    maskerLevelDbA: Number($("maskLevel").value),
    trialOrder: trial.order,
    presentedWord: trial.word[0],
    targetPhonemes: targets,
    responsePhonemes: [...state.responseSelections],
    selectedTargetCorrectness: [...state.targetSelections],
    score,
    percent: score * 25,
    maskerLevelReport: $("maskEar").value === "off" ? "none" : Number($("maskLevel").value),
    comment: $("trialComment").value.trim()
  };

  const existingIdx = state.currentResultIndexByTrial[state.currentTrialIndex];
  if (Number.isFinite(existingIdx)) {
    state.results[existingIdx] = resultPayload;
  } else {
    state.results.push(resultPayload);
    state.currentResultIndexByTrial[state.currentTrialIndex] = state.results.length - 1;
  }

  state.currentTrialIndex++;
  if (state.currentTrialIndex >= state.currentTrials.length) finishList();
  else renderTrial();
  drawPI();
  saveSession();
}

function finishList() {
  const q = currentQueueItem();
  q.status = "complete";
  stopMasker();
  const next = state.queue.findIndex(x => x.status === "queued");
  renderQueue();
  saveSession();
  if (next >= 0) {
    const proceed = confirm("List complete. Present the next queued list?");
    if (proceed) {
      state.currentListIndex = next;
      beginCurrentList();
    }
  } else {
    alert("All queued lists complete.");
    showReport();
  }
}

function abandonList() {
  const q = currentQueueItem();
  if (!q) return;
  q.status = "abandoned";
  saveSession();
  const next = state.queue.findIndex(x => x.status === "queued");
  if (next >= 0) {
    state.currentListIndex = next;
    beginCurrentList();
  } else {
    showReport();
  }
}

function listSummaries() {
  const map = new Map();
  for (const r of state.results) {
    const condition = r.presentationCondition || r.stimulusEar;
    const masked = r.maskerEar && r.maskerEar !== "off";
    const key = `${r.listNumber}|${r.listLevelDbA}|${condition}|${masked}`;
    if (!map.has(key)) map.set(key, { listNumber: r.listNumber, level: r.listLevelDbA, condition, ear: condition, masked, trials: 0, phonemes: 0 });
    const s = map.get(key);
    s.trials++;
    s.phonemes += Number(r.score || 0);
  }
  return [...map.values()].map(s => ({ ...s, percent: s.trials ? Math.round((s.phonemes / (s.trials * 4)) * 100) : 0 }));
}

function drawPI() {
  const canvas = $("piCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = "#fff"; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle = "#777"; ctx.lineWidth = 1;
  const left = 50, right = w - 20, top = 20, bottom = h - 45;

  ctx.beginPath();
  ctx.moveTo(left, top); ctx.lineTo(left, bottom); ctx.lineTo(right, bottom); ctx.stroke();

  ctx.font = "13px system-ui";
  ctx.fillStyle = "#111";
  for (let y = 0; y <= 100; y += 20) {
    const py = bottom - (y / 100) * (bottom - top);
    ctx.strokeStyle = "#ddd"; ctx.beginPath(); ctx.moveTo(left, py); ctx.lineTo(right, py); ctx.stroke();
    ctx.fillText(String(y), 18, py + 4);
  }
  for (let x = 0; x <= 100; x += 20) {
    const px = left + (x / 100) * (right - left);
    ctx.strokeStyle = "#ddd"; ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, bottom); ctx.stroke();
    ctx.fillStyle = "#111"; ctx.fillText(String(x), px - 8, bottom + 20);
  }
  ctx.fillText("dB(A)", (left+right)/2 - 18, h - 8);
  ctx.save(); ctx.translate(12, (top+bottom)/2 + 35); ctx.rotate(-Math.PI/2); ctx.fillText("% correct", 0, 0); ctx.restore();

  for (const s of listSummaries()) {
    const px = left + (Math.max(0, Math.min(100, s.level)) / 100) * (right - left);
    const py = bottom - (s.percent / 100) * (bottom - top);
    const condition = s.condition || s.ear;
    const sym = conditionSymbol(condition);
    ctx.font = "bold 22px system-ui";

    if (condition === "left") {
      ctx.fillStyle = "#135bd8";
      ctx.fillText("×", px - 7, py + 7);
      if (s.masked) ctx.fillText("×", px - 2, py + 7);
    } else if (condition === "right") {
      ctx.strokeStyle = "#c52222";
      ctx.fillStyle = "#c52222";
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI*2);
      if (s.masked) ctx.fill();
      else ctx.stroke();
    } else {
      ctx.fillStyle = "#111";
      ctx.fillText(sym, px - 7, py + 7);
    }
  }
}

function download(filename, mime, text) {
  const blob = new Blob([text], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function safeName() {
  return (state.client.name || "client").replace(/[^\p{Letter}\p{Number}]+/gu, "_");
}

function downloadJson() {
  readClientForm();
  const payload = { exportedAt: new Date().toISOString(), app: "UC Te reo Māori CVCV Speech Audiometry", client: state.client, setup: { presentationCondition: $("presentationCondition") ? $("presentationCondition").value : "", stimulusRouting: $("stimEar") ? $("stimEar").value : "", transducer: $("transducer") ? $("transducer").value : "", maskingAtExport: $("maskEar") && $("maskEar").value !== "off", maskerEar: $("maskEar") ? $("maskEar").value : "", maskerLevelDbA: $("maskLevel") ? $("maskLevel").value : "" }, calibration: state.calibration, queue: state.queue, results: state.results, summaries: listSummaries() };
  download(`${safeName()}_te_reo_speech_audiometry.json`, "application/json", JSON.stringify(payload, null, 2));
}

function buildTsv() {
  readClientForm();
  const headerRows = [
    ["Client name", state.client.name || ""],
    ["Client ID", state.client.id || ""],
    ["Date of birth", state.client.dob || ""],
    ["Session date", state.client.date || ""],
    ["Clinician", state.client.clinician || ""],
    ["Notes", state.client.notes || ""],
    ["Calibration dB(A)", state.calibration?.isCalibrated ? state.calibration.measuredDbA : "not set"],
    ["Default presentation condition", $("presentationCondition") ? conditionLabel($("presentationCondition").value) : ""],
    ["Stimulus routing", $("stimEar") ? $("stimEar").value : ""],
    ["Transducer", $("transducer") ? $("transducer").value : ""],
    ["Masking enabled at export", $("maskEar") && $("maskEar").value !== "off" ? "Yes" : "No"],
    []
  ];

  const cols = ["timestamp","clientName","clientId","clientDob","listNumber","listLevelDbA","presentationCondition","stimulusEar","transducer","maskerEar","maskerLevelDbA","trialOrder","presentedWord","targetPhonemes","responsePhonemes","score","percent","comment"];
  const rows = state.results.map(r => [
    r.timestamp, state.client.name, state.client.id, state.client.dob, r.listNumber, r.listLevelDbA, r.presentationCondition, r.stimulusEar, r.transducer, r.maskerEar, r.maskerLevelReport ?? r.maskerLevelDbA ?? "none", r.trialOrder, r.presentedWord,
    r.targetPhonemes.join(" "), r.responsePhonemes.join(" "), r.score, r.percent, r.comment
  ]);

  return [...headerRows, cols, ...rows]
    .map(row => row.map(x => String(x ?? "").replace(/\t/g," ").replace(/\n/g," ")).join("\t"))
    .join("\n");
}

function downloadTsv() {
  download(`${safeName()}_te_reo_speech_audiometry.tsv`, "text/tab-separated-values", buildTsv());
}

async function copyTsv() {
  const tsv = buildTsv();
  try {
    await navigator.clipboard.writeText(tsv);
    alert("TSV copied to clipboard.");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = tsv;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    alert("TSV copied to clipboard.");
  }
}

function showReport() {
  readClientForm();
  const summaries = listSummaries();
  const rows = state.results.map(r => {
    const combinedResponse = r.targetPhonemes.map((target, idx) => {
      const advanced = r.responsePhonemes?.[idx];
      const selectedCorrect = r.selectedTargetCorrectness?.[idx];

      if (advanced !== null && advanced !== undefined && advanced !== "") return advanced;
      if (selectedCorrect) return target;
      return "–";
    }).join(" ");

    return `<tr><td>${r.listNumber}</td><td>${r.listLevelDbA}</td><td>${conditionLabel(r.presentationCondition || r.stimulusEar)}</td><td>${r.transducer || ""}</td><td>${r.maskerLevelReport ?? r.maskerLevelDbA ?? "none"}</td><td>${r.presentedWord}</td><td>${r.targetPhonemes.join(" ")}</td><td>${combinedResponse}</td><td>${r.score}/4</td><td>${r.comment || ""}</td></tr>`;
  }).join("");
  const summaryRows = summaries.map(s => `<tr><td>${s.listNumber}</td><td>${s.level}</td><td>${conditionLabel(s.condition || s.ear)}</td><td>${s.masked ? "Yes" : "No"}</td><td>${s.trials}</td><td>${s.percent}%</td></tr>`).join("");
  drawPI();
  const piDataUrl = $("piCanvas") ? $("piCanvas").toDataURL("image/png") : "";
  $("reportContent").innerHTML = `
    <h1>Te reo Māori CVCV Speech Audiometry Report</h1>
    <div class="report-grid">
      <div>
        <p><b>Client:</b> ${state.client.name || ""}</p>
        <p><b>NHI / ID:</b> ${state.client.id || ""}</p>
        <p><b>Date of birth:</b> ${state.client.dob || ""}</p>
        <p><b>Date:</b> ${state.client.date || ""}</p>
      </div>
      <div>
        <p><b>Clinician:</b> ${state.client.clinician || ""}</p>
        <p><b>Calibration reference:</b> ${state.calibration.isCalibrated ? state.calibration.measuredDbA + " dB(A)" : "not set"}</p>
        <p><b>Notes:</b> ${state.client.notes || ""}</p>
      </div>
    </div>
    <h2>Performance intensity function</h2>
    ${piDataUrl ? `<img class="report-pi" src="${piDataUrl}" alt="Performance intensity plot">` : ""}
    <h2>Summary</h2>
    <table class="report-table"><thead><tr><th>List</th><th>Level dB(A)</th><th>Condition</th><th>Masked</th><th>Trials</th><th>% correct</th></tr></thead><tbody>${summaryRows}</tbody></table>
    <h2>Trial data</h2>
    <table class="report-table"><thead><tr><th>List</th><th>dB(A)</th><th>Condition</th><th>Transducer</th><th>Masker dB(A)</th><th>Kupu</th><th>Target</th><th>Response</th><th>Score</th><th>Comment</th></tr></thead><tbody>${rows}</tbody></table>
  `;
  show("screen-report");
}

init();
