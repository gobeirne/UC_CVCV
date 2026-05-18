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
    decodedBuffers: {}
  }
};

const $ = (id) => document.getElementById(id);

function init() {
  $("sessionDate").value = new Date().toISOString().slice(0,10);
  for (let i = 1; i <= 10; i++) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = `List ${i}`;
    $("listChoice").appendChild(opt);
  }
  bindEvents();
  setupCalibrationSlider();
  drawPI();
  loadDraftIntoForm();
  offerStoredCalibration();
}

function bindEvents() {
  $("toCalibrationBtn").onclick = () => { readClientForm(); show("screen-calibration"); };
  $("restoreBtn").onclick = restoreSession;
  $("calibrateBtn").onclick = toggleCalibration;
  $("testCalBtn").onclick = testCalibratedSound;
  $("skipCalBtn").onclick = () => show("screen-setup");
  $("outputLevel").addEventListener("input", updateOutputLevelFromSlider);
  $("outputLevel").addEventListener("change", updateOutputLevelFromSlider);
  $("outputLevel").addEventListener("touchend", updateOutputLevelFromSlider);

  $("stimEar").onchange = () => {
    const ear = $("stimEar").value;
    if (ear === "left") $("maskEar").value = "right";
    if (ear === "right") $("maskEar").value = "left";
    if (ear === "binaural") $("maskEar").value = "off";
    syncMaskerControls();
  };

  $("maskLevel").addEventListener("input", () => {
    $("maskLevelLive").value = $("maskLevel").value;
    updateLiveMasker();
  });
  $("maskEar").addEventListener("change", () => {
    $("maskEarLive").value = $("maskEar").value;
    updateLiveMasker();
  });
  $("maskLevelLive").addEventListener("input", () => {
    $("maskLevel").value = $("maskLevelLive").value;
    updateLiveMasker();
  });
  $("maskEarLive").addEventListener("change", () => {
    $("maskEar").value = $("maskEarLive").value;
    updateLiveMasker();
  });

  $("addListBtn").onclick = () => addList(Number($("listChoice").value), Number($("listLevel").value));
  $("addRandomBtn").onclick = () => addRandomList(Number($("listLevel").value));
  $("addNRandomBtn").onclick = addNRandomLists;
  $("startBtn").onclick = startTesting;

  $("playWordBtn").onclick = () => playCurrent(true);
  $("repeatWordBtn").onclick = () => playCurrent(false);
  $("toggleMaskBtn").onclick = toggleMasker;

  document.querySelectorAll(".score-buttons button").forEach(btn => {
    btn.onclick = () => { state.trialScore = Number(btn.dataset.score); markScoreButton(); };
  });
  $("clearScoreBtn").onclick = clearScoring;
  $("nextTrialBtn").onclick = nextTrial;
  $("abandonBtn").onclick = () => $("abandonDialog").showModal();
  $("confirmAbandonBtn").onclick = abandonList;

  $("downloadJsonBtn").onclick = downloadJson;
  $("downloadTsvBtn").onclick = downloadTsv;
  $("reportBtn").onclick = showReport;
  $("backToTestBtn").onclick = () => show("screen-test");
  $("printBtn").onclick = () => window.print();

  document.addEventListener("keydown", (e) => {
    if (!$("screen-test").classList.contains("active")) return;
    if (["1","2","3","4"].includes(e.key)) {
      state.trialScore = Number(e.key);
      markScoreButton();
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
  return { el, source, gain, pan };
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
  stopCurrentStimulusIfAny();
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
  gain.gain.value = gainForLevel(state.calibration.currentSliderDb);
  source.connect(gain).connect(state.audio.ctx.destination);
  source.start();
  state.audio.calNode = source;
  source.onended = () => {
    if (state.audio.calNode === source) state.audio.calNode = null;
  };
}

function stopCurrentStimulusIfAny() {
  // Placeholder hook: media-element stimulus playback is short-lived, masker is intentionally independent.
}

function addList(listNumber, level) {
  if (!listNumber || !level) return;
  state.queue.push({ listNumber, levelDbA: level, status: "queued", id: crypto.randomUUID?.() || String(Date.now()+Math.random()) });
  renderQueue();
  saveSession();
}

function addRandomList(level) {
  const used = new Set(state.queue.map(q => q.listNumber));
  const available = Object.keys(WORD_LISTS).map(Number).filter(n => !used.has(n));
  const pool = available.length ? available : Object.keys(WORD_LISTS).map(Number);
  const n = pool[Math.floor(Math.random() * pool.length)];
  addList(n, level);
}

function addNRandomLists() {
  const n = Math.max(1, Math.min(10, Number($("randomCount").value)));
  const level = Number($("randomLevel").value);
  for (let i = 0; i < n; i++) addRandomList(level);
}

function renderQueue() {
  const box = $("queueChips");
  box.innerHTML = "";
  state.queue.forEach((q, idx) => {
    const chip = document.createElement("span");
    chip.className = "chip" + (idx === state.currentListIndex ? " current" : "");
    chip.textContent = `List ${q.listNumber} @ ${q.levelDbA} dB(A) — ${q.status}`;
    box.appendChild(chip);
  });
  $("progressIndicator").innerHTML = box.innerHTML;
}

function startTesting() {
  readClientForm();
  if (!state.queue.length) addRandomList(Number($("listLevel").value));
  state.currentListIndex = state.queue.findIndex(q => q.status === "queued");
  if (state.currentListIndex < 0) state.currentListIndex = 0;
  syncMaskerControls();
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
  state.currentTrials = shuffle(WORD_LISTS[q.listNumber]).map((w, i) => ({ order: i + 1, word: w }));
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
  $("currentWord").textContent = word;
  $("currentMeta").textContent = `List ${q.listNumber}, ${q.levelDbA} dB(A), trial ${state.currentTrialIndex + 1} of ${state.currentTrials.length} — ${translation}`;
  renderTargetPhonemes([c1,v1,c2,v2]);
  renderAdvanced([c1,v1,c2,v2]);
  renderQueue();
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
      state.trialScore = state.targetSelections.filter(Boolean).length;
      markScoreButton();
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
    PHONEMES[type].forEach(p => {
      const btn = document.createElement("div");
      btn.className = "phoneme-option";
      btn.textContent = p;
      btn.onclick = () => {
        [...col.querySelectorAll(".phoneme-option")].forEach(x => x.classList.remove("selected"));
        btn.classList.add("selected");
        state.responseSelections[idx] = p;
        state.trialScore = computeAdvancedScore(targets, state.responseSelections);
        markScoreButton();
      };
      col.appendChild(btn);
    });
    box.appendChild(col);
  });
}

function equivalent(target, response) {
  if (!response) return false;
  if (V_EQ[target] && V_EQ[response]) return V_EQ[target] === V_EQ[response];
  return target === response;
}

function computeAdvancedScore(targets, responses) {
  return targets.reduce((sum, t, i) => sum + (equivalent(t, responses[i]) ? 1 : 0), 0);
}

function markScoreButton() {
  document.querySelectorAll(".score-buttons button").forEach(btn => {
    btn.style.outline = Number(btn.dataset.score) === state.trialScore ? "4px solid #ffbf00" : "";
  });
}

function clearScoring() {
  state.trialScore = null;
  state.targetSelections = [false,false,false,false];
  state.responseSelections = [null,null,null,null];
  $("trialComment").value = "";
  document.querySelectorAll(".phoneme-target,.phoneme-option").forEach(x => x.classList.remove("selected"));
  markScoreButton();
}

async function playCurrent(withCarrier) {
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
    state.audio.masker = await playFirstAvailable(["noise","masking"], $("maskEar").value, Number($("maskLevel").value), true);
    $("toggleMaskBtn").textContent = "Stop masker";
  } catch {
    $("toggleMaskBtn").textContent = "Start masker";
  }
}

function stopMasker() {
  if (state.audio.masker) {
    state.audio.masker.el.pause();
    state.audio.masker.el.currentTime = 0;
    state.audio.masker = null;
  }
  $("toggleMaskBtn").textContent = "Start masker";
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
  const score = state.trialScore ?? state.targetSelections.filter(Boolean).length;
  state.results.push({
    timestamp: new Date().toISOString(),
    client: state.client,
    listNumber: q.listNumber,
    listLevelDbA: q.levelDbA,
    stimulusEar: $("stimEar").value,
    maskerEar: $("maskEar").value,
    maskerLevelDbA: Number($("maskLevel").value),
    trialOrder: trial.order,
    presentedWord: trial.word[0],
    targetPhonemes: targets,
    responsePhonemes: [...state.responseSelections],
    selectedTargetCorrectness: [...state.targetSelections],
    score,
    percent: score * 25,
    comment: $("trialComment").value.trim()
  });

  state.currentTrialIndex++;
  if (state.currentTrialIndex >= state.currentTrials.length) finishList();
  else renderTrial();
  drawPI();
  saveSession();
}

function finishList() {
  const q = currentQueueItem();
  q.status = "complete";
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
    const key = `${r.listNumber}|${r.listLevelDbA}|${r.stimulusEar}`;
    if (!map.has(key)) map.set(key, { listNumber: r.listNumber, level: r.listLevelDbA, ear: r.stimulusEar, trials: 0, phonemes: 0 });
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
    ctx.font = "bold 22px system-ui";
    if (s.ear === "left") {
      ctx.fillStyle = "#135bd8"; ctx.fillText("×", px - 7, py + 7);
    } else if (s.ear === "right") {
      ctx.strokeStyle = "#c52222"; ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI*2); ctx.stroke();
    } else {
      ctx.fillStyle = "#111"; ctx.fillText("S", px - 7, py + 7);
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
  const payload = { exportedAt: new Date().toISOString(), app: "UC Te reo Māori CVCV Speech Audiometry", client: state.client, calibration: state.calibration, queue: state.queue, results: state.results, summaries: listSummaries() };
  download(`${safeName()}_te_reo_speech_audiometry.json`, "application/json", JSON.stringify(payload, null, 2));
}

function downloadTsv() {
  const cols = ["timestamp","clientName","clientId","listNumber","listLevelDbA","stimulusEar","maskerEar","maskerLevelDbA","trialOrder","presentedWord","targetPhonemes","responsePhonemes","score","percent","comment"];
  const rows = state.results.map(r => [
    r.timestamp, state.client.name, state.client.id, r.listNumber, r.listLevelDbA, r.stimulusEar, r.maskerEar, r.maskerLevelDbA, r.trialOrder, r.presentedWord,
    r.targetPhonemes.join(" "), r.responsePhonemes.join(" "), r.score, r.percent, r.comment
  ]);
  const tsv = [cols, ...rows].map(row => row.map(x => String(x ?? "").replace(/\t/g," ").replace(/\n/g," ")).join("\t")).join("\n");
  download(`${safeName()}_te_reo_speech_audiometry.tsv`, "text/tab-separated-values", tsv);
}

function showReport() {
  readClientForm();
  const summaries = listSummaries();
  const rows = state.results.map(r => `<tr><td>${r.listNumber}</td><td>${r.listLevelDbA}</td><td>${r.stimulusEar}</td><td>${r.presentedWord}</td><td>${r.targetPhonemes.join(" ")}</td><td>${r.responsePhonemes.filter(Boolean).join(" ")}</td><td>${r.score}/4</td><td>${r.comment || ""}</td></tr>`).join("");
  const summaryRows = summaries.map(s => `<tr><td>${s.listNumber}</td><td>${s.level}</td><td>${s.ear}</td><td>${s.trials}</td><td>${s.percent}%</td></tr>`).join("");
  $("reportContent").innerHTML = `
    <h1>Te reo Māori CVCV Speech Audiometry Report</h1>
    <div class="report-grid">
      <div>
        <p><b>Client:</b> ${state.client.name || ""}</p>
        <p><b>NHI / ID:</b> ${state.client.id || ""}</p>
        <p><b>Date:</b> ${state.client.date || ""}</p>
      </div>
      <div>
        <p><b>Clinician:</b> ${state.client.clinician || ""}</p>
        <p><b>Calibration reference:</b> ${state.calibration.isCalibrated ? state.calibration.measuredDbA + " dB(A)" : "not set"}</p>
        <p><b>Notes:</b> ${state.client.notes || ""}</p>
      </div>
    </div>
    <h2>Summary</h2>
    <table class="report-table"><thead><tr><th>List</th><th>Level dB(A)</th><th>Ear</th><th>Trials</th><th>% correct</th></tr></thead><tbody>${summaryRows}</tbody></table>
    <h2>Trial data</h2>
    <table class="report-table"><thead><tr><th>List</th><th>dB(A)</th><th>Ear</th><th>Kupu</th><th>Target</th><th>Response</th><th>Score</th><th>Comment</th></tr></thead><tbody>${rows}</tbody></table>
  `;
  show("screen-report");
}

init();
