/* Te reo Māori CVCV Speech Audiometry
   Static, GitHub Pages friendly, local-file friendly.
   Put audio files in /sounds. The app resolves by the text before the first "_",
   trying the known filename first, then .mp3/.wav alternatives.
*/

const MAORI_WORD_LISTS = {
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

/* ── NZ English CVC lists ─────────────────────────────────────────
   Word entry shape: [word, c1, v, c2, fileBase]
   - 3 phonemes per word (C V C).
   - fileBase is the NNNN_Word stem; audio resolves by that exact stem.
   - No translation column, no carrier (carrier is embedded in the file).
   The list/item number lives in the filename: NN(list)NN(item). */
const ENGLISH_WORD_LISTS = {
  1: [
    ["pass","p","a","ss","0101_Pass"],["rule","r","u","le","0102_Rule"],["cause","c","au","se","0103_Cause"],
    ["time","t","i","me","0104_Time"],["log","l","o","g","0105_Log"],["sick","s","i","ck","0106_Sick"],
    ["mean","m","ea","n","0107_Mean"],["bed","b","e","d","0108_Bed"],["hope","h","o","pe","0109_Hope"],["date","d","a","te","0110_Date"]
  ],
  2: [
    ["hall","h","a","ll","0201_Hall"],["come","c","o","me","0202_Come"],["bag","b","a","g","0203_Bag"],
    ["rose","r","o","se","0204_Rose"],["suit","s","ui","t","0205_Suit"],["made","m","a","de","0206_Made"],
    ["like","l","i","ke","0207_Like"],["peace","p","ea","ce","0208_Peace"],["dip","d","i","p","0209_Dip"],["ten","t","e","n","0210_Ten"]
  ],
  3: [
    ["pies","p","ie","s","0301_Pies"],["mock","m","o","ck","0302_Mock"],["room","r","oo","m","0303_Room"],
    ["dad","d","a","d","0304_Dad"],["loan","l","oa","n","0305_Loan"],["beg","b","e","g","0306_Beg"],
    ["tell","t","e","ll","0307_Tell"],["keep","k","ee","p","0308_Keep"],["hiss","h","i","ss","0309_Hiss"],["sought","s","ough","t","0310_Sought"]
  ],
  4: [
    ["boss","b","o","ss","0401_Boss"],["sip","s","i","p","0402_Sip"],["pal","p","a","l","0403_Pal"],
    ["coat","c","oa","t","0404_Coat"],["rod","r","o","d","0405_Rod"],["moon","m","oo","n","0406_Moon"],
    ["hem","h","e","m","0407_Hem"],["take","t","a","ke","0408_Take"],["league","l","ea","gue","0409_League"],["dies","d","ie","s","0410_Dies"]
  ],
  5: [
    ["time","t","i","me","0501_Time"],["caught","c","augh","t","0502_Caught"],["beg","b","e","g","0503_Beg"],
    ["rid","r","i","d","0504_Rid"],["loon","l","oo","n","0505_Loon"],["mop","m","o","p","0506_Mop"],
    ["doze","d","o","ze","0507_Doze"],["says","s","ay","s","0508_Says"],["pack","p","a","ck","0509_Pack"],["heel","h","ee","l","0510_Heel"]
  ],
  6: [
    ["make","m","a","ke","0601_Make"],["laws","l","aw","s","0602_Laws"],["rice","r","i","ce","0603_Rice"],
    ["bell","b","e","ll","0604_bell"],["tote","t","o","te","0605_Tote"],["cod","c","o","d","0606_Cod"],
    ["ham","h","a","m","0607_Ham"],["deep","d","ee","p","0608_Deep"],["pig","p","i","g","0609_Pig"],["soon","s","oo","n","0610_Soon"]
  ],
  7: [
    ["seal","s","ea","l","0701_Seal"],["dawn","d","aw","n","0702_Dawn"],["boom","b","oo","m","0703_Boom"],
    ["hog","h","o","g","0704_Hog"],["toes","t","oe","s","0705_Toes"],["mid","m","i","d","0706_Mid"],
    ["cat","c","a","t","0707_Cat"],["like","l","i","ke","0708_Like"],["pep","p","e","p","0709_Pep"],["race","r","a","ce","0710_Race"]
  ],
  8: [
    ["hide","h","i","de","0801_Hide"],["tame","t","a","me","0802_Tame"],["rule","r","u","le","0803_Rule"],
    ["cause","c","au","se","0804_Cause"],["big","b","i","g","0805_Big"],["sass","s","a","ss","0806_Sass"],
    ["pope","p","o","pe","0807_Pope"],["don","d","o","n","0808_Don"],["meek","m","ee","k","0809_Meek"],["let","l","e","t","0810_Let"]
  ],
  9: [
    ["call","c","a","ll","0901_Call"],["buys","b","uy","s","0902_Buys"],["same","s","a","me","0903_Same"],
    ["miss","m","i","ss","0904_Miss"],["rot","r","o","t","0905_Rot"],["hoop","h","oo","p","0906_Hoop"],
    ["load","l","oa","d","0907_Load"],["peck","p","e","ck","0908_Peck"],["tag","t","a","g","0909_Tag"],["dean","d","ea","n","0910_Dean"]
  ],
  10: [
    ["lean","l","ea","n","1001_Lean"],["hag","h","a","g","1002_Hag"],["bed","b","e","d","1003_Bed"],
    ["sews","s","ew","s","1004_Sews"],["cop","c","o","p","1005_Cop"],["root","r","oo","t","1006_Root"],
    ["pick","p","i","ck","1007_Pick"],["maim","m","ai","m","1008_Maim"],["toss","t","o","ss","1009_Toss"],["dial","d","ia","l","1010_Dial"]
  ],
  11: [
    ["lice","l","i","ce","1101_Lice"],["mall","m","a","ll","1102_Mall"],["tomb","t","o","mb","1103_Tomb"],
    ["bag","b","a","g","1104_Bag"],["soap","s","oa","p","1105_Soap"],["rake","r","a","ke","1106_Rake"],
    ["pen","p","e","n","1107_Pen"],["keys","k","ey","s","1108_Keys"],["hid","h","i","d","1109_Hid"],["dot","d","o","t","1110_Dot"]
  ],
  12: [
    ["dike","d","i","ke","1201_Dike"],["ball","b","a","ll","1202_Ball"],["mace","m","a","ce","1203_Mace"],
    ["rig","r","i","g","1204_Rig"],["lose","l","o","se","1205_Lose"],["sop","s","o","p","1206_Sop"],
    ["comb","c","o","mb","1207_Comb"],["ten","t","e","n","1208_Ten"],["pad","p","a","d","1209_Pad"],["heat","h","ea","t","1210_Heat"]
  ]
};

/* Per-language configuration. Everything language-specific is derived
   from here so the rest of the app stays count-agnostic. */
const LANGUAGES = {
  maori: {
    key: "maori",
    label: "Te reo Māori",
    lists: MAORI_WORD_LISTS,
    phonemeCount: 4,        // C V C V
    hasCarrier: true,       // separate KōreroMai carrier file
    hasTranslation: true,
    hasAdvanced: true,      // advanced response-phoneme picker available
    hasTraining: true,
    randomiseOrder: true,   // default: shuffle word order (fixed order not yet settled)
    unit: "kupu",           // singular term for the stimulus
    unitTitle: "Kupu"
  },
  english: {
    key: "english",
    label: "NZ English",
    lists: ENGLISH_WORD_LISTS,
    phonemeCount: 3,        // C V C
    hasCarrier: false,      // carrier embedded in the stimulus file
    hasTranslation: false,
    hasAdvanced: false,     // phoneme tiles + comment only
    hasTraining: false,
    randomiseOrder: false,  // default: present in listed order (CVC convention)
    unit: "word",
    unitTitle: "Word"
  }
};

function lang() { return LANGUAGES[state.language] || LANGUAGES.maori; }
function WORD_LISTS_FOR(langKey) { return (LANGUAGES[langKey] || LANGUAGES.maori).lists; }
function currentWordLists() { return lang().lists; }
function phonemeCount() { return lang().phonemeCount; }
// Phoneme columns of a word entry, regardless of language (skips the word itself).
function wordPhonemes(wordEntry) { return wordEntry.slice(1, 1 + phonemeCount()); }
function blankSelections() { return Array(phonemeCount()).fill(false); }
function blankResponses() { return Array(phonemeCount()).fill(null); }
function pointsPerPhoneme() { return 100 / phonemeCount(); } // 25 (Māori) or 33.3 (English)

// Whether word order should be shuffled for a language: a per-language override
// wins if set, otherwise the language default. Defaults: Māori shuffled, English fixed.
function randomiseEnabled(langKey = state.language) {
  const ov = state.randomiseOverride?.[langKey];
  if (ov === true || ov === false) return ov;
  return !!(LANGUAGES[langKey] || LANGUAGES.maori).randomiseOrder;
}

const KNOWN_SOUND_FILES = [
"hapū_+3.9dB.wav","hāte_-0.0dB.wav","hēki_+1.7dB.wav","heru_-1.3dB.wav","hine_-1.0dB.wav","hinu_-2.6dB.wav","hipi_+4.4dB.wav","honu_-2.5dB.wav","hope_+1.6dB.wav","huri_+0.6dB.wav","kaha_+3.2dB.wav","kare_-4.0dB.wav","keke_+1.5dB.wav","kēmu_-0.0dB.wav","kīngi_-2.1dB.wav","kino_-1.9dB.wav","koha_-2.2dB.wav","kohu_-2.7dB.wav","KōreroMai_01_+1.6dB.wav","KōreroMai_02_+2.2dB.wav","kupu_+1.7dB.wav","kurī_+0.2dB.wav","mangu_-2.2dB.wav","manu_-0.4dB.wav","mata_+1.1dB.wav","mihi_+1.9dB.wav","miro_-0.7dB.wav","mīti_+0.2dB.wav","mōku_+0.5dB.wav","moni_-1.1dB.wav","muku_-0.3dB.wav","mutu_-0.3dB.wav","nama_-0.2dB.wav","nāna_-2.1dB.wav","nēhi_-1.8dB.wav","neke_+4.0dB.wav","nēra_-1.1dB.wav","ngaki_+0.5dB.wav","ngako_+2.8dB.wav","ngaro_-3.9dB.wav","ngaru_-3.2dB.wav","ngata_+3.3dB.wav","ngāti_+2.0dB.wav","ngenge_-1.8dB.wav","ngeru_-1.8dB.wav","ngira_-2.8dB.wav","ngutu_+3.4dB.wav","niho_+2.1dB.wav","noho_+0.4dB.wav","noke_+1.6dB.wav","nōku_+2.3dB.wav","nōna_-1.7dB.wav","pahi_-0.9dB.wav","pāmu_-3.8dB.wav","papa_+2.5dB.wav","peka_-1.7dB.wav","pēpi_-1.4dB.wav","pere_-1.0dB.wav","piko_+0.6dB.wav","pipi_-1.5dB.wav","poto_+3.4dB.wav","pune_+0.5dB.wav","rama_-2.7dB.wav","rangi_+0.0dB.wav","rata_-4.2dB.wav","reka_-1.9dB.wav","rima_-2.3dB.wav","rimu_-1.9dB.wav","rōpū_+2.9dB.wav","roto_-0.3dB.wav","rūma_-1.6dB.wav","runga_+0.0dB.wav","take_+2.2dB.wav","tana_-2.7dB.wav","tāne_-1.7dB.wav","tangi_-1.1dB.wav","tapu_-0.8dB.wav","tēpu_+3.0dB.wav","tiki_+1.4dB.wav","tino_-2.0dB.wav","tiro_+4.9dB.wav","tuku_+4.8dB.wav","waha_+5.1dB.wav","wāhi_-6.1dB.wav","waho_-1.4dB.wav","waka_+0.4dB.wav","wehi_-0.3dB.wav","weka_-0.8dB.wav","wera_+0.4dB.wav","wētā_+0.9dB.wav","whana_-0.4dB.wav","whanga_-0.1dB.wav","whare_-3.2dB.wav","whata_-1.4dB.wav","whatu_+1.8dB.wav","whero_-2.5dB.wav","whetū_+2.2dB.wav","whiti_+3.0dB.wav","whitu_+3.9dB.wav","whiwhi_+4.4dB.wav","wiki_+0.0dB.wav","wiri_-1.7dB.wav"
];

const PHONEMES = {
  C: ["p","t","k","m","n","ŋ","w","f","ɾ","h"],
  V: ["a","aː","e","eː","i","iː","o","oː","u","uː"]
};
const V_EQ = { "a":"a","aː":"a","e":"e","eː":"e","i":"i","iː":"i","o":"o","oː":"o","u":"u","uː":"u" };

const state = {
  language: "maori",
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
  scoringMode: "none",
  targetSelections: [false,false,false,false],
  responseSelections: [null,null,null,null],
  _pendingAdvance: null,
  _advancing: false,
  // Per-language word-order override; null = use the language's default.
  randomiseOverride: { maori: null, english: null },
  clinicLogo: null,
  training: null,
  _trainingBypass: false,
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
  repopulateListSelects();
  loadClinicSettings();
  loadDraftIntoForm();
  bindEvents();
  applyLanguageToUI();
  setupCalibrationSlider();
  refreshPI();
  if ($("maskingEnabled")) updateMaskingEnabled();
  offerStoredCalibration();
  renderRecentSessions();
  renderQueue();
  updateSetupResultsSummary();
  updateTrainingBadge();
}

// ── Clinic settings (device-persistent, separate from session) ──
function loadClinicSettings() {
  const saved = localStorage.getItem("ucCVCVClinic");
  if (!saved) return;
  try {
    const d = JSON.parse(saved);
    if ($("clinicName") && d.name) $("clinicName").value = d.name;
    if (d.logo) renderLogoPreview(d.logo);
    if ($("facilityName") && d.facility) $("facilityName").value = d.facility;
    if ($("clinician") && d.clinician) $("clinician").value = d.clinician;
    if ($("clinicianRole") && d.role) $("clinicianRole").value = d.role;
    if ($("transducer") && d.transducer) $("transducer").value = d.transducer;
  } catch {}
}

function saveClinicSettings() {
  const data = {
    name: $("clinicName") ? $("clinicName").value.trim() : "",
    facility: $("facilityName") ? $("facilityName").value.trim() : "",
    clinician: $("clinician") ? $("clinician").value.trim() : "",
    role: $("clinicianRole") ? $("clinicianRole").value.trim() : "",
    transducer: $("transducer") ? $("transducer").value : "",
    logo: state.clinicLogo || null
  };
  localStorage.setItem("ucCVCVClinic", JSON.stringify(data));
}

function renderLogoPreview(dataUrl) {
  const preview = $("logoPreview");
  if (!preview) return;
  preview.innerHTML = dataUrl ? `<img src="${dataUrl}" alt="Clinic logo">` : "";
  if ($("removeLogoBtn")) $("removeLogoBtn").style.display = dataUrl ? "" : "none";
  state.clinicLogo = dataUrl || null;
}

function saveSession() {
  // Always snapshot current form values so recent sessions reflect live state
  state.client = {
    name:     $("clientName")     ? $("clientName").value.trim()     : (state.client?.name     || ""),
    id:       $("clientId")       ? $("clientId").value.trim()       : (state.client?.id       || ""),
    dob:      $("clientDob")      ? $("clientDob").value             : (state.client?.dob      || ""),
    date:     $("sessionDate")    ? $("sessionDate").value           : (state.client?.date     || ""),
    clinician:$("clinician")      ? $("clinician").value.trim()      : (state.client?.clinician|| ""),
    role:     $("clinicianRole")  ? $("clinicianRole").value.trim()  : (state.client?.role     || ""),
    facility: $("facilityName")   ? $("facilityName").value.trim()   : (state.client?.facility || ""),
    notes:    $("sessionNotes")   ? $("sessionNotes").value.trim()   : (state.client?.notes    || "")
  };

  const key = "ucTeReoSpeechAudiometry";
  const payload = {
    savedAt: new Date().toISOString(),
    language: state.language,
    randomiseOverride: state.randomiseOverride,
    client: state.client,
    calibration: state.calibration,
    queue: state.queue,
    currentListIndex: state.currentListIndex,
    currentTrialIndex: state.currentTrialIndex,
    currentTrials: state.currentTrials,
    results: state.results,
    training: state.training
  };
  localStorage.setItem(key, JSON.stringify(payload));
  renderRecentSessions();
}

function updateSetupResultsSummary() {
  const el = $("setupResultsSummary");
  if (!el) return;
  const n = state.results?.length || 0;
  if (!n) { el.textContent = "No results recorded yet."; return; }
  const summaries = listSummaries();
  const lines = summaries.map(s =>
    `List ${s.listNumber} @ ${s.level} dB(A) — ${conditionLabel(s.condition)} — ${s.percent}% (${s.trials} trial${s.trials !== 1 ? "s" : ""})`
  );
  el.innerHTML = lines.join("<br>");
}

function openSavedJson(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.results) { alert("This file doesn't appear to be a valid results JSON."); return; }
      // Restore state from file
      if (data.client)      state.client = data.client;
      if (data.calibration) state.calibration = data.calibration;
      if (data.queue)       state.queue = data.queue;
      if (data.results)     state.results = data.results;
      if (data.language && LANGUAGES[data.language]) { state.language = data.language; applyLanguageToUI(); }
      // Repopulate client fields
      $("clientName").value = state.client?.name || "";
      $("clientId").value   = state.client?.id   || "";
      if ($("clientDob"))  $("clientDob").value  = state.client?.dob  || "";
      $("sessionDate").value = state.client?.date || $("sessionDate").value;
      $("sessionNotes").value = state.client?.notes || "";
      renderQueue();
      refreshPI();
      updateSetupResultsSummary();
      renderRecentSessions();
      alert(`Loaded ${state.results.length} results for ${state.client?.name || "unknown client"}.`);
    } catch { alert("Could not read file — it may be corrupt or the wrong format."); }
  };
  reader.readAsText(file);
  // Reset input so the same file can be re-opened
  e.target.value = "";
}

function renderRecentSessions() {
  const list = $("recentSessionsList");
  const hint = $("noRecentHint");
  if (!list) return;
  const saved = localStorage.getItem("ucTeReoSpeechAudiometry");
  if (!saved) { if (hint) hint.style.display = ""; return; }
  try {
    const data = JSON.parse(saved);
    if (!data.client) { if (hint) hint.style.display = ""; return; }
    if (hint) hint.style.display = "none";
    list.innerHTML = "";
    const item = document.createElement("div");
    item.className = "recent-session-item";
    const when = data.savedAt ? new Date(data.savedAt).toLocaleString("en-NZ", { dateStyle: "short", timeStyle: "short" }) : "earlier";
    const resultCount = data.results?.length || 0;
    item.innerHTML = `
      <div>
        <div class="recent-session-name">${data.client.name || "Unnamed client"}</div>
        <div class="recent-session-meta">${data.client.date || ""} · ${resultCount} trial${resultCount !== 1 ? "s" : ""} recorded · saved ${when}</div>
      </div>
      <button class="recent-session-dismiss" title="Dismiss" type="button">×</button>
    `;
    item.querySelector(".recent-session-dismiss").onclick = (e) => {
      e.stopPropagation();
      localStorage.removeItem("ucTeReoSpeechAudiometry");
      renderRecentSessions();
    };
    item.onclick = (e) => {
      if (e.target.classList.contains("recent-session-dismiss")) return;
      restoreSession();
    };
    list.appendChild(item);
  } catch { if (hint) hint.style.display = ""; }
}

const SCREEN_SUBTITLES = {
  "screen-setup":  "Setup",
  "screen-test":   "Testing",
  "screen-report": "Report"
};

function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $(id).classList.add("active");
  const sub = $("headerSubtitle");
  if (sub) {
    let label = SCREEN_SUBTITLES[id] || "Setup";
    if (trainingActive() && id !== "screen-report") label = `🎓 Training — ${label}`;
    sub.textContent = label;
  }
}

function readClientForm() {
  state.client = {
    name: $("clientName").value.trim(),
    id: $("clientId").value.trim(),
    dob: $("clientDob") ? $("clientDob").value : "",
    date: $("sessionDate").value,
    clinician: $("clinician").value.trim(),
    role: $("clinicianRole") ? $("clinicianRole").value.trim() : "",
    facility: $("facilityName") ? $("facilityName").value.trim() : "",
    notes: $("sessionNotes").value.trim()
  };
  saveClinicSettings();
  saveSession();
}

function loadDraftIntoForm() {
  const saved = localStorage.getItem("ucTeReoSpeechAudiometry");
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    if (parsed.client) {
      // Client fields — always load from saved
      $("clientName").value = parsed.client.name || "";
      $("clientId").value = parsed.client.id || "";
      if ($("clientDob")) $("clientDob").value = parsed.client.dob || "";
      $("sessionDate").value = parsed.client.date || $("sessionDate").value;
      $("sessionNotes").value = parsed.client.notes || "";
      // Clinician/role/facility loaded from clinic settings (device-persistent), not session
    }
  } catch {}
}

function restoreSession() {
  const saved = localStorage.getItem("ucTeReoSpeechAudiometry");
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    Object.assign(state, parsed);
    if (!LANGUAGES[state.language]) state.language = "maori";
    if (!state.randomiseOverride || typeof state.randomiseOverride !== "object") {
      state.randomiseOverride = { maori: null, english: null };
    }
    applyLanguageToUI();
    // Repopulate client fields
    if (parsed.client) {
      $("clientName").value = parsed.client.name || "";
      $("clientId").value = parsed.client.id || "";
      if ($("clientDob")) $("clientDob").value = parsed.client.dob || "";
      $("sessionDate").value = parsed.client.date || $("sessionDate").value;
      $("sessionNotes").value = parsed.client.notes || "";
    }
    setupCalibrationSlider();
    if (state.calibration?.isCalibrated) $("testCalBtn").hidden = false;
    syncMaskerControls();
    renderQueue();
    refreshPI();
    renderRecentSessions();
    updateSetupResultsSummary();
    updateTrainingBadge();
  } catch { alert("Could not restore session — data may be corrupt."); }
}

function setupFastScoreButtons() {
  const box = document.querySelector(".score-buttons");
  if (!box) return;
  box.innerHTML = "";
  const max = phonemeCount();
  for (let i = 0; i <= max; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.score = String(i);
    btn.textContent = String(i);
    btn.onclick = () => fastScore(i);
    box.appendChild(btn);
  }
}

// Shared fast-score logic used by buttons and keyboard.
// Sets the score then schedules auto-advance after 600ms.
// The trial navigator click handler cancels the pending advance
// and instead jumps to the clicked trial.
function fastScore(score) {
  state.scoringMode = "fast";
  state.trialScore = score;
  state.targetSelections = blankSelections();
  state.responseSelections = blankResponses();
  markScoreButton();
  renderSelectionColours();
  schedulePendingAdvance();
}

function schedulePendingAdvance() {
  // Cancel any existing pending advance
  if (state._pendingAdvance) {
    clearTimeout(state._pendingAdvance);
    state._pendingAdvance = null;
  }
  state._pendingAdvance = setTimeout(() => {
    state._pendingAdvance = null;
    nextTrial();
  }, 600);
}

function cancelPendingAdvance() {
  if (state._pendingAdvance) {
    clearTimeout(state._pendingAdvance);
    state._pendingAdvance = null;
  }
}

// Brief, non-modal cue shown when a "Next" press is ignored because the
// current trial has no score yet. Keeps the clinician from silently skipping.
function flashNextLocked() {
  const btn = $("nextTrialBtn");
  if (btn) {
    btn.classList.add("next-locked");
    btn.textContent = (lang && lang().unit === "word") ? "Score this word first" : "Score this kupu first";
    clearTimeout(state._nextLockTimer);
    state._nextLockTimer = setTimeout(() => {
      btn.classList.remove("next-locked");
      btn.textContent = "Next";
    }, 900);
  }
}

/* ── Training mode ──────────────────────────────────────────────
   Training client JSON profiles + response mp3s live in /training.
   Filename format: ClientXX_word_c1_v1_c2_v2.mp3 (empty slot = omission).
   The app plays the stimulus as normal, then the client's recorded
   response; the trainee scores it and gets immediate feedback. */

const TRAINING_DIR = "training";
const ENGLISH_SOUND_DIR = "sounds_cvc";
const ALL_WORDS = new Set(Object.values(MAORI_WORD_LISTS).flat().map(w => w[0]));

function trainingActive() { return !!state.training; }

function parseTrainingFilename(filename) {
  // ClientXX_word_s1_s2_s3_s4.mp3 → { word, response: [4] }; empty slot → "–"
  const stem = filename.replace(/\.mp3$/i, "").replace(/\.wav$/i, "");
  const parts = stem.split("_");
  if (parts.length !== 6) return null;
  const word = parts[1];
  if (!ALL_WORDS.has(word)) return null;
  const response = parts.slice(2, 6).map(s => (s === "" ? "–" : s));
  return { word, response };
}

async function loadTrainingClients() {
  // Probe training/Client01.json .. Client12.json; use whichever load.
  const found = [];
  for (let i = 1; i <= 12; i++) {
    const id = `Client${String(i).padStart(2, "0")}`;
    try {
      const resp = await fetch(`${TRAINING_DIR}/${id}.json`);
      if (!resp.ok) continue;
      const profile = await resp.json();
      if (profile && profile.id) found.push(profile);
    } catch {}
  }
  return found;
}

async function openTrainingPicker() {
  const sel = $("trainingClientSelect");
  const btn = $("trainingBtn");
  btn.disabled = true;
  btn.textContent = "Loading clients…";
  const profiles = await loadTrainingClients();
  btn.disabled = false;
  btn.textContent = "🎓 Training mode…";
  if (!profiles.length) {
    alert(`No training clients found.\nAdd ClientXX.json profiles and response mp3s to the /${TRAINING_DIR} folder.`);
    return;
  }
  sel.innerHTML = `<option value="">Choose a training client…</option>`;
  for (const p of profiles) {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.id} — ${p.name || "unnamed"}${p.iwi ? " (" + p.iwi + ")" : ""}`;
    opt._profile = p;
    sel.appendChild(opt);
  }
  sel.hidden = false;
  btn.hidden = true;
  sel.onchange = () => {
    const opt = sel.options[sel.selectedIndex];
    if (opt && opt._profile) activateTrainingClient(opt._profile);
  };
}

function activateTrainingClient(profile) {
  // Index response files by word; warn on unparseable names.
  const responsesByWord = {};
  for (const f of profile.files || []) {
    const parsed = parseTrainingFilename(f);
    if (!parsed) { console.warn("Training file not parseable, skipped:", f); continue; }
    (responsesByWord[parsed.word] = responsesByWord[parsed.word] || []).push({
      filename: f, response: parsed.response
    });
  }

  state.training = {
    id: profile.id,
    name: profile.name || profile.id,
    age: profile.age ?? "",
    iwi: profile.iwi || "",
    notes: profile.notes || "",
    dialectSubstitutions: profile.dialectSubstitutions || {},
    responsesByWord
  };

  // Populate client fields — notes prime the trainee with iwi + variants
  $("clientName").value = `${state.training.name} (TRAINING)`;
  $("clientId").value = profile.id;
  const dialectNotes = Object.entries(state.training.dialectSubstitutions)
    .map(([t, d]) => d.message || `May use /${d.substitute}/ for /${t}/`)
    .join(" ");
  $("sessionNotes").value =
    `TRAINING CLIENT — ${state.training.name}, age ${state.training.age}` +
    (state.training.iwi ? `, iwi: ${state.training.iwi}` : "") +
    `. ${state.training.notes}` +
    (dialectNotes ? ` ${dialectNotes}` : "");

  updateTrainingBadge();
  saveSession();
}

function exitTraining() {
  state.training = null;
  $("clientName").value = "";
  $("clientId").value = "";
  $("sessionNotes").value = "";
  $("trainingClientSelect").hidden = true;
  $("trainingClientSelect").value = "";
  $("trainingBtn").hidden = false;
  updateTrainingBadge();
  saveSession();
}

function updateTrainingBadge() {
  const badge = $("trainingBadge");
  const exitBtn = $("exitTrainingBtn");
  const sel = $("trainingClientSelect");
  const btn = $("trainingBtn");
  if (!badge) return;
  if (trainingActive()) {
    badge.textContent = `🎓 Training: ${state.training.name} (${state.training.id})`;
    badge.hidden = false;
    exitBtn.hidden = false;
    sel.hidden = true;
    btn.hidden = true;
  } else {
    badge.hidden = true;
    exitBtn.hidden = true;
    btn.hidden = false;
  }
}

// Dialect-aware equivalence: a substitution listed in the client's
// dialect profile is correct wherever it occurs.
function equivalentForScoring(target, response) {
  if (equivalent(target, response)) return true;
  if (trainingActive()) {
    const sub = state.training.dialectSubstitutions?.[target];
    if (sub && sub.substitute === response) return true;
  }
  return false;
}

function ensureTrialTrainingVariant(trial) {
  // Pick one response variant at random per trial; keep it so replays
  // and rescoring use the same recording.
  if (!trainingActive() || !trial || trial.trainingFile !== undefined) return;
  const variants = state.training.responsesByWord[trial.word[0]] || [];
  if (!variants.length) {
    trial.trainingFile = null; // explicitly: no recording for this kupu
    trial.trainingResponse = null;
    return;
  }
  const v = variants[Math.floor(Math.random() * variants.length)];
  trial.trainingFile = v.filename;
  trial.trainingResponse = v.response;
  trial.trainingAttempts = 0;
}

// Play just the target kupu, without chaining the training response
// (used by the feedback dialog so kupu and response can be compared).
async function playKupuOnly() {
  const trial = currentTrial();
  const q = currentQueueItem();
  if (!trial || !q) return;
  stopCurrentStimulusIfAny();
  try {
    await playFirstAvailable([trial.word[0]], $("stimEar").value, q.levelDbA, false);
  } catch {
    console.warn("Could not play kupu:", trial.word[0]);
  }
}

async function playClientResponse() {
  const trial = currentTrial();
  if (!trainingActive() || !trial || !trial.trainingFile) return;
  // Play the response binaurally at a clear, comfortable level:
  // 65 dB(A) when calibrated, otherwise as recorded (unity gain).
  const level = state.calibration.isCalibrated
    ? Math.min(65, state.calibration.measuredDbA)
    : 0;
  try {
    const node = await playFirstAvailable([`${TRAINING_DIR}/${trial.trainingFile}`], "binaural", level, false);
    setStimulusIndicator(true, "Client response");
    node.el.addEventListener("ended", () => {
      if (!state.audio.activeStimuli.length) setStimulusIndicator(false);
    }, { once: true });
  } catch {
    console.warn("Could not play training response:", trial.trainingFile);
  }
}

// Per-position truth: how each response phoneme scores against the target.
function evaluateTrainingPositions(targets, response) {
  return targets.map((t, i) => {
    const r = response[i];
    if (!r || r === "–") return { target: t, response: r || "–", correct: false, type: "omission" };
    if (t === r) return { target: t, response: r, correct: true, type: "exact" };
    if (equivalent(t, r)) return { target: t, response: r, correct: true, type: "length" };
    const sub = state.training?.dialectSubstitutions?.[t];
    if (sub && sub.substitute === r) return { target: t, response: r, correct: true, type: "dialect", message: sub.message };
    return { target: t, response: r, correct: false, type: "substitution" };
  });
}

function describePosition(pos, idx) {
  const n = idx + 1;
  switch (pos.type) {
    case "exact":
      return `<div class="tf-row ok"><span class="tf-phon">${n}: /${pos.target}/</span><span>Correct.</span></div>`;
    case "length":
      return `<div class="tf-row ok"><span class="tf-phon">${n}: /${pos.target}/</span><span>The client said /${pos.response}/ — vowel-length differences are subtle and not penalised. Scores correct.</span></div>`;
    case "dialect":
      return `<div class="tf-row note"><span class="tf-phon">${n}: /${pos.target}/</span><span class="tf-teach">The client said /${pos.response}/. ${pos.message || "This is a valid regional variant."} Scores correct.</span></div>`;
    case "omission":
      return `<div class="tf-row bad"><span class="tf-phon">${n}: /${pos.target}/</span><span>The client omitted this sound — scores incorrect.</span></div>`;
    default:
      return `<div class="tf-row bad"><span class="tf-phon">${n}: /${pos.target}/</span><span>The client said /${pos.response}/ — a substitution, scores incorrect.</span></div>`;
  }
}

function handleTrainingNext() {
  const trial = currentTrial();
  if (!trial) return;

  // No recording for this kupu → behave like a normal trial.
  if (!trial.trainingFile) { advanceTrainingTrial(); return; }

  if (state.scoringMode === "none") {
    showTrainingFeedback("Score first", `<p>Listen to the client's response and enter a score before continuing.</p>`, { listen: true });
    return;
  }

  const targets = trial.word.slice(1, 5);
  const positions = evaluateTrainingPositions(targets, trial.trainingResponse);
  const trueScore = positions.filter(p => p.correct).length;
  trial.trainingTrueScore = trueScore;
  const traineeScore = computeCurrentScore();

  // Per-position comparison when phoneme/advanced scoring was used.
  let positionsMatch = true;
  if (state.scoringMode !== "fast") {
    positions.forEach((pos, i) => {
      const transcribed = state.responseSelections[i];
      const judged = (transcribed !== null && transcribed !== undefined && transcribed !== "")
        ? equivalentForScoring(targets[i], transcribed)
        : !!state.targetSelections[i];
      if (judged !== pos.correct) positionsMatch = false;
    });
  }
  const match = (traineeScore === trueScore) && positionsMatch;

  if (match) {
    trial.trainingMatched = true;
    if (trueScore === 4) {
      showTrainingFeedback("✓ Correct", `<p class="tf-summary">All four phonemes correct — 4/4.</p>`, { continue: true });
    } else {
      const detail = positions.map(describePosition).join("");
      showTrainingFeedback(`✓ Correct — ${trueScore}/4`,
        `<p class="tf-summary">You scored this correctly.</p>${detail}`, { continue: true });
    }
  } else {
    trial.trainingAttempts = (trial.trainingAttempts || 0) + 1;
    let body;
    if (traineeScore === trueScore) {
      // Total is right but the wrong positions are marked correct/incorrect
      body = `<p class="tf-summary">Your total of ${trueScore}/4 is right, but you've marked the wrong phonemes as correct.</p>` +
             `<p>Listen again — which sounds did the client actually get right?</p>`;
    } else {
      body = `<p class="tf-summary">Not quite — you scored ${traineeScore}/4, the correct score is ${trueScore}/4.</p>`;
    }
    if (trial.trainingAttempts >= 2) {
      body += positions.map(describePosition).join("");
    } else {
      if (traineeScore !== trueScore) body += `<p>Have another listen to the client's response and re-score before pressing Next.</p>`;
      // Even on first miss, surface any teaching-moment positions
      const teach = positions.filter(p => p.type === "dialect" || p.type === "length");
      if (teach.length) body += teach.map(p => describePosition(p, positions.indexOf(p))).join("");
    }
    showTrainingFeedback("Have another listen", body, { listen: true, reveal: trial.trainingAttempts >= 2 });
  }
}

function showTrainingFeedback(title, bodyHtml, opts = {}) {
  const dlg = $("trainingFeedbackDialog");
  if (!dlg) return;
  $("tfTitle").textContent = title;
  $("tfBody").innerHTML = bodyHtml;
  $("tfPlayKupuBtn").hidden = !opts.listen;
  $("tfPlayResponseBtn").hidden = !opts.listen;
  $("tfContinueBtn").hidden = !opts.continue;
  $("tfRevealBtn").hidden = !opts.reveal;
  $("tfCloseBtn").hidden = !!opts.continue; // when correct, Continue is the only exit
  dlg.showModal();
}

function advanceTrainingTrial() {
  state._trainingBypass = true;
  try { nextTrial(); } finally { state._trainingBypass = false; }
}

function bindEvents() {
  // Training mode
  if ($("trainingBtn")) $("trainingBtn").onclick = openTrainingPicker;
  if ($("exitTrainingBtn")) $("exitTrainingBtn").onclick = exitTraining;
  if ($("replayResponseBtn")) $("replayResponseBtn").onclick = () => { stopCurrentStimulusIfAny(); playClientResponse(); };
  if ($("tfPlayKupuBtn")) $("tfPlayKupuBtn").onclick = () => playKupuOnly();
  if ($("tfPlayResponseBtn")) $("tfPlayResponseBtn").onclick = () => { stopCurrentStimulusIfAny(); playClientResponse(); };
  if ($("tfContinueBtn")) $("tfContinueBtn").onclick = () => {
    $("trainingFeedbackDialog").close();
    advanceTrainingTrial();
  };
  if ($("tfRevealBtn")) $("tfRevealBtn").onclick = () => {
    // Accept the true score and move on (logged with attempts count)
    const trial = currentTrial();
    if (trial && Number.isFinite(trial.trainingTrueScore)) {
      trial.trainingRevealed = true;
      state.scoringMode = "fast";
      state.trialScore = trial.trainingTrueScore;
      markScoreButton();
    }
    $("trainingFeedbackDialog").close();
    advanceTrainingTrial();
  };

  // Calibration
  $("calibrateBtn").onclick = toggleCalibration;
  $("testCalBtn").onclick = testCalibratedSound;
  $("outputLevel").addEventListener("input", updateOutputLevelFromSlider);
  $("outputLevel").addEventListener("change", updateOutputLevelFromSlider);
  $("outputLevel").addEventListener("touchend", updateOutputLevelFromSlider);

  // Clinic settings — save on change
  ["clinicName","facilityName","clinician","clinicianRole","transducer"].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener("change", saveClinicSettings);
  });

  // Logo upload
  if ($("replaceLogoBtn")) $("replaceLogoBtn").onclick = () => $("logoFileInput").click();
  if ($("logoFileInput")) $("logoFileInput").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { renderLogoPreview(ev.target.result); saveClinicSettings(); };
    reader.readAsDataURL(file);
  };
  if ($("removeLogoBtn")) $("removeLogoBtn").onclick = () => { renderLogoPreview(null); saveClinicSettings(); };

  // Stimulus routing
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

  // Queue
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

  // Language selector
  document.querySelectorAll(".language-btn").forEach(btn => {
    btn.onclick = () => setLanguage(btn.dataset.lang);
  });

  // Word-order randomise override (per current language)
  if ($("randomiseOrderToggle")) {
    $("randomiseOrderToggle").onchange = (e) => {
      if (!state.randomiseOverride) state.randomiseOverride = { maori: null, english: null };
      state.randomiseOverride[state.language] = e.target.checked;
      applyLanguageToUI();
      saveSession();
    };
  }

  // Test screen
  $("playWordBtn").onclick = () => playCurrent(true);
  $("repeatWordBtn").onclick = () => playCurrent(false);
  $("toggleMaskBtn").onclick = toggleMasker;

  setupFastScoreButtons();
  $("clearScoreBtn").onclick = () => { cancelPendingAdvance(); clearScoring(); };
  $("nextTrialBtn").onclick = () => { cancelPendingAdvance(); nextTrial(); };
  $("abandonBtn").onclick = () => $("abandonDialog").showModal();
  $("confirmAbandonBtn").onclick = abandonList;

  $("downloadJsonBtn").onclick = downloadJson;
  $("downloadTsvBtn").onclick = downloadTsv;
  if ($("copyTsvBtn")) $("copyTsvBtn").onclick = copyTsv;
  $("reportBtn").onclick = showReport;
  $("backToTestBtn").onclick = () => show(state._reportCalledFrom || "screen-setup");
  $("printBtn").onclick = () => window.print();

  // Setup page results panel
  if ($("setupReportBtn"))       $("setupReportBtn").onclick = showReport;
  if ($("setupDownloadJsonBtn")) $("setupDownloadJsonBtn").onclick = downloadJson;
  if ($("setupDownloadTsvBtn"))  $("setupDownloadTsvBtn").onclick = downloadTsv;
  if ($("setupCopyTsvBtn"))      $("setupCopyTsvBtn").onclick = copyTsv;
  if ($("openJsonBtn"))          $("openJsonBtn").onclick = () => $("openJsonFileInput").click();
  if ($("openJsonFileInput"))    $("openJsonFileInput").onchange = openSavedJson;

  $("levelDownBtn").onclick = () => nudgeLevel(-5);
  $("levelUpBtn").onclick   = () => nudgeLevel(+5);

  document.addEventListener("keydown", (e) => {
    if (!$("screen-test").classList.contains("active")) return;
    if (document.querySelector("dialog[open]")) return; // don't score/play behind dialogs
    const tag = document.activeElement.tagName;
    const inInput = ["INPUT","TEXTAREA","SELECT"].includes(tag);

    // 0–N: fast score + auto-advance (600ms window for nav click interception)
    if (/^[0-9]$/.test(e.key) && Number(e.key) <= phonemeCount() && !inInput) {
      e.preventDefault();
      fastScore(Number(e.key));
      return;
    }

    // Space: play carrier + kupu
    if (e.code === "Space" && !inInput) {
      e.preventDefault();
      playCurrent(true);
      return;
    }

    // R: replay kupu only
    if ((e.key === "r" || e.key === "R") && !inInput) {
      e.preventDefault();
      playCurrent(false);
      return;
    }

    // ←/→: stimulus level ±5
    if (e.key === "ArrowLeft" && !inInput)  { e.preventDefault(); nudgeLevel(-5); return; }
    if (e.key === "ArrowRight" && !inInput) { e.preventDefault(); nudgeLevel(+5); return; }

    // ↑/↓: masker level ±5
    if (e.key === "ArrowUp" && !inInput) {
      e.preventDefault();
      nudgeMasker(+5);
      return;
    }
    if (e.key === "ArrowDown" && !inInput) {
      e.preventDefault();
      nudgeMasker(-5);
      return;
    }

    // Shift+M: toggle masker
    if (e.key === "M" && e.shiftKey && !inInput) {
      e.preventDefault();
      toggleMasker();
      return;
    }

    // Enter: next (kept for backwards compat)
    if (e.key === "Enter" && !inInput) nextTrial();

    // Escape: abandon dialog
    if (e.key === "Escape") $("abandonDialog").showModal();
  });
}


function ensureAudio() {
  if (!state.audio.ctx) {
    state.audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // iOS suspends AudioContext until a user gesture — resume on every call
  if (state.audio.ctx.state === "suspended") {
    state.audio.ctx.resume().catch(() => {});
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
  // Māori bases are the word/known stem; match known files, then .wav/.mp3.
  const known = KNOWN_SOUND_FILES.filter(f => soundKey(f) === base).map(f => `sounds/${f}`);
  return [...known, `sounds/${base}.wav`, `sounds/${base}.mp3`];
}

// English stems are NNNN_Word (e.g. "0301_Pies"). The recordings are all .mp3,
// but the word part is inconsistently cased across files (e.g. "0604_bell.mp3"
// vs "0301_Pies.mp3"). To be robust on a case-sensitive host we try, in order:
// the stem exactly as listed, then a Capitalised-word variant, then an
// all-lowercase-word variant — deduped. Order = preference.
function englishCandidates(stem) {
  const m = /^(\d{4})_(.+)$/.exec(stem);
  const stems = [stem];
  if (m) {
    const num = m[1], wRaw = m[2];
    const cap = wRaw.charAt(0).toUpperCase() + wRaw.slice(1).toLowerCase();
    const lower = wRaw.toLowerCase();
    for (const variant of [`${num}_${cap}`, `${num}_${lower}`]) {
      if (!stems.includes(variant)) stems.push(variant);
    }
  }
  return stems.map(s => `${ENGLISH_SOUND_DIR}/${s}.mp3`);
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
  // Uncalibrated: all files are already level-normalised relative to each other,
  // so play everything at unity gain and let device volume control the output.
  return 1.0;
}

async function playFirstAvailable(bases, ear, levelDbA, loop=false) {
  let lastError = null;
  for (const base of bases) {
    const urls = base.includes("/") ? [base] : candidatesForBase(base);
    for (const url of urls) {
      // Confirm the file actually exists before trying to play it. Probing with
      // fetch makes the .wav→.mp3 fallback reliable (a missing extension is a
      // clean 404 here, not an unreliable HTMLAudioElement play() rejection)
      // and surfaces real case-sensitivity mismatches instead of masking them.
      let exists = true;
      try {
        const resp = await fetch(url, { method: "HEAD" });
        exists = resp.ok;
      } catch {
        // HEAD can be blocked (some static hosts); fall back to a ranged GET.
        try {
          const resp = await fetch(url, { headers: { Range: "bytes=0-0" } });
          exists = resp.ok;
        } catch (err) {
          exists = false;
          lastError = err;
        }
      }
      if (!exists) continue;
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
    applyCalibrationLevel(Number(data.level), data.timestamp);
    const when = data.timestamp
      ? new Date(data.timestamp).toLocaleString("en-NZ", { dateStyle: "short", timeStyle: "short" })
      : "earlier";
    if ($("calStatus")) $("calStatus").textContent = `Calibration restored: ${data.level} dB(A) from ${when}. Device volume must be at maximum.`;
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
    refreshPI();
    saveSession();
  }
  $("conditionDialog").close();
}

function openTrialEdit(resultIndex) {
  const r = state.results[resultIndex];
  if (!r || !$("trialEditDialog")) return;
  $("trialEditResultIndex").value = String(resultIndex);
  $("trialEditTitle").textContent = `Edit ${r.presentedWord}`;
  // Rebuild the score options to match this result's phoneme count.
  const denom = r.phonemeCount || r.targetPhonemes?.length || 4;
  const sel = $("trialEditScore");
  if (sel) {
    sel.innerHTML = "";
    for (let i = 0; i <= denom; i++) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = `${i}/${denom}`;
      sel.appendChild(opt);
    }
    sel.value = String(r.score ?? 0);
  }
  $("trialEditComment").value = r.comment || "";
  $("trialEditDialog").showModal();
}

function saveTrialEditDialog() {
  const idx = Number($("trialEditResultIndex").value);
  if (!Number.isFinite(idx) || !state.results[idx]) return;
  const r = state.results[idx];
  const denom = r.phonemeCount || r.targetPhonemes?.length || 4;
  r.score = Number($("trialEditScore").value);
  r.scoringMode = "edited-numeric";
  r.responsePhonemes = Array(denom).fill(null);
  r.selectedTargetCorrectness = Array(denom).fill(false);
  r.percent = Math.round((r.score / denom) * 100);
  r.comment = $("trialEditComment").value.trim();
  saveSession();
  refreshPI();
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
  state.queue.push({ listNumber, levelDbA: level, language: state.language, status: "queued", id: crypto.randomUUID?.() || String(Date.now()+Math.random()) });
  renderQueue();
  saveSession();
}

function addRandomList(level) {
  const allLists = Object.keys(currentWordLists()).map(Number);
  let pool = allLists;

  // Do not duplicate a list (within the current language) while the queue
  // contains fewer entries than there are lists. Repeats allowed beyond that.
  const sameLang = state.queue.filter(q => (q.language || "maori") === state.language);
  if (sameLang.length < allLists.length) {
    const used = new Set(sameLang.map(q => q.listNumber));
    pool = allLists.filter(n => !used.has(n));
  }
  if (!pool.length) pool = allLists;

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
    chip.innerHTML = `<span class="queue-lang-tag ${(q.language||'maori')}">${(LANGUAGES[q.language||'maori']||LANGUAGES.maori).label}</span> List ${q.listNumber} @ ${q.levelDbA} dB(A) — ${q.status} <span class="queue-arrows">↕</span>`;
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
  // Follow the list's language so scoring, terminology and the carrier behave correctly.
  if (q.language && q.language !== state.language) {
    state.language = q.language;
    applyLanguageToUI();
  }
  q.status = "in progress";
  state.firstTrialMaskerPrimed = false;
  const qLang = q.language || "maori";
  const lists = WORD_LISTS_FOR(qLang);
  // Shuffle only when randomisation is enabled for this language; otherwise
  // present the words in their listed (file) order.
  const words = randomiseEnabled(qLang) ? shuffle(lists[q.listNumber]) : lists[q.listNumber].slice();
  state.currentTrials = words.map((w, i) => ({ order: i + 1, word: w }));
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
  const L = lang();
  ensureTrialTrainingVariant(trial);
  const word = trial.word[0];
  const phonemes = wordPhonemes(trial.word);
  const translation = L.hasTranslation ? (trial.word[trial.word.length - 1] || "") : "";
  $("currentWord").innerHTML = `${word}${translation ? `<span class="kupu-translation">${translation}</span>` : ""}`;
  const c = $("presentationCondition") ? $("presentationCondition").value : $("stimEar").value;
  const trainingTag = trainingActive() ? `🎓 ${state.training.name} — ` : "";
  const noRecording = trainingActive() && !trial.trainingFile ? ` <b>(no training recording for this ${L.unit})</b>` : "";
  $("currentMeta").innerHTML = `${trainingTag}List ${q.listNumber}, ${q.levelDbA} dB(A), trial ${state.currentTrialIndex + 1} of ${state.currentTrials.length} — <span class="condition-chip" title="Click to change condition">${conditionLabel(c)}</span>${noRecording}`;
  const conditionChip = $("currentMeta").querySelector(".condition-chip");
  if (conditionChip) conditionChip.onclick = openConditionDialog;
  if ($("phonemeHeading")) $("phonemeHeading").textContent = `Phoneme scoring - ${word}`;
  if ($("replayResponseBtn")) $("replayResponseBtn").hidden = !(trainingActive() && trial.trainingFile);
  updateLevelDisplay();
  renderTargetPhonemes(phonemes);
  if (L.hasAdvanced) renderAdvanced(phonemes);
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
    const denom = result ? (result.phonemeCount || result.targetPhonemes?.length || 4) : phonemeCount();
    const scoreText = result ? `${result.score}/${denom}` : idx === state.currentTrialIndex ? "now" : "—";
    const scoreClass = result ? (result.score >= Math.ceil(denom * 0.75) ? "good" : "bad") : "";
    item.innerHTML = `<span>${idx + 1}</span><span>${trial.word[0]}</span><span class="trial-nav-score ${scoreClass}">${scoreText}</span>`;
    item.onclick = () => {
      if (idx === state.currentTrialIndex) {
        // Replay current word — cancel any pending advance first
        cancelPendingAdvance();
        playCurrent(true);
      } else if (result || idx > state.currentTrialIndex) {
        // Jump to this trial — save current score first if pending, then jump
        cancelPendingAdvance();
        // Save current trial's score before jumping
        const curTrial = currentTrial();
        const curQ = currentQueueItem();
        if (curTrial && curQ && state.scoringMode !== "none") {
          const targets = wordPhonemes(curTrial.word);
          const score = computeCurrentScore();
          const payload = {
            timestamp: new Date().toISOString(),
            client: state.client,
            language: curQ.language || state.language,
            listNumber: curQ.listNumber,
            listLevelDbA: curQ.levelDbA,
            presentationCondition: $("presentationCondition") ? $("presentationCondition").value : $("stimEar").value,
            stimulusEar: $("stimEar").value,
            transducer: $("transducer") ? $("transducer").value : "",
            maskerEar: $("maskEar").value,
            maskerLevelDbA: Number($("maskLevel").value),
            trialOrder: curTrial.order,
            presentedWord: curTrial.word[0],
            targetPhonemes: targets,
            phonemeCount: targets.length,
            scoringMode: state.scoringMode,
            responsePhonemes: state.scoringMode === "fast" ? blankResponses() : [...state.responseSelections],
            selectedTargetCorrectness: state.scoringMode === "fast" ? blankSelections() : [...state.targetSelections],
            score,
            percent: Math.round((score / targets.length) * 100),
            maskerLevelReport: $("maskEar").value === "off" ? "none" : Number($("maskLevel").value),
            comment: $("trialComment").value.trim()
          };
          const existingIdx = state.currentResultIndexByTrial[state.currentTrialIndex];
          if (Number.isFinite(existingIdx)) {
            state.results[existingIdx] = payload;
          } else {
            state.results.push(payload);
            state.currentResultIndexByTrial[state.currentTrialIndex] = state.results.length - 1;
          }
        }
        state.currentTrialIndex = idx;
        renderTrial();
        refreshPI();
        updateRunningScore();
        saveSession();
      }
    };
    box.appendChild(item);
  });
}

function renderTargetPhonemes(phonemes) {
  const row = $("targetPhonemes");
  row.innerHTML = "";
  // Match the column count to the phoneme count so 3 English tiles fill the row.
  row.style.gridTemplateColumns = `repeat(${phonemes.length}, 1fr)`;
  phonemes.forEach((p, idx) => {
    const div = document.createElement("div");
    div.className = "phoneme-target";
    div.textContent = p;
    div.onclick = () => {
      state.scoringMode = "phoneme";
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
  box.style.gridTemplateColumns = `repeat(${targets.length}, 1fr)`;
  targets.forEach((target, idx) => {
    const type = idx % 2 === 0 ? "C" : "V";
    const col = document.createElement("div");
    col.className = "advanced-col";
    col.innerHTML = `<h4>${idx + 1}: /${target}/</h4>`;

    function selectOption(p) {
      [...col.querySelectorAll(".phoneme-option, .diphthong-chip")].forEach(x =>
        x.classList.remove("selected", "correct-selected", "incorrect-selected")
      );
      state.scoringMode = "advanced";
      state.responseSelections[idx] = p === "–" ? "–" : p;
      state.targetSelections[idx] = false;
      state.trialScore = computeCurrentScore();
      markScoreButton();
      renderSelectionColours();
    }

    ["–", ...PHONEMES[type]].forEach(p => {
      const btn = document.createElement("div");
      btn.className = "phoneme-option" + (p === "–" ? " blank-option" : "");
      btn.textContent = p;
      btn.title = p === "–" ? "Blank / no response for this position" : "";
      btn.onclick = () => {
        btn.classList.add("selected");
        selectOption(p);
      };
      col.appendChild(btn);
    });

    // Diphthong builder — V columns only (positions 2 and 4)
    if (type === "V") {
      const divider = document.createElement("div");
      divider.className = "diphthong-divider";
      divider.textContent = "＋ diphthong";
      divider.onclick = () => {
        if (col._diphthongBuildMode) {
          // Cancel build mode
          col._diphthongBuildMode = false;
          col._diphthongFirst = null;
          col.querySelectorAll(".phoneme-option").forEach(b => {
            b.classList.remove("diphthong-first-selected");
            if (b._origOnclick) { b.onclick = b._origOnclick; b._origOnclick = null; }
          });
          divider.classList.remove("active");
          divider.textContent = "＋ diphthong";
        } else {
          // Enter build mode — next vowel click = first component
          col._diphthongBuildMode = true;
          divider.classList.add("active");
          divider.textContent = "select 1st vowel…";
          col.querySelectorAll(".phoneme-option:not(.blank-option)").forEach(btn => {
            btn._origOnclick = btn.onclick;
            btn.onclick = () => {
              const baseShort = V_EQ[btn.textContent] || btn.textContent;
              col._diphthongFirst = baseShort;
              col.querySelectorAll(".phoneme-option").forEach(b => b.classList.remove("diphthong-first-selected"));
              btn.classList.add("diphthong-first-selected");
              divider.textContent = `/${baseShort}/ + select 2nd…`;
              // Re-wire all vowel buttons for second component
              col.querySelectorAll(".phoneme-option:not(.blank-option)").forEach(btn2 => {
                btn2.onclick = () => {
                  const base2 = V_EQ[btn2.textContent] || btn2.textContent;
                  const combo = baseShort + base2;
                  col._diphthongFirst = null;
                  col._diphthongBuildMode = false;
                  divider.classList.remove("active");
                  divider.textContent = "＋ diphthong";
                  col.querySelectorAll(".phoneme-option").forEach(b => {
                    b.classList.remove("diphthong-first-selected");
                    if (b._origOnclick) { b.onclick = b._origOnclick; b._origOnclick = null; }
                  });
                  renderDiphthongChip(col, combo, idx, selectOption);
                  selectOption(combo);
                };
              });
            };
          });
        }
      };
      col.appendChild(divider);

      const chipArea = document.createElement("div");
      chipArea.className = "diphthong-chip-area";
      col._chipArea = chipArea;
      col.appendChild(chipArea);
    }

    box.appendChild(col);
  });
}

function renderDiphthongChip(col, combo, idx, selectOption) {
  const chipArea = col._chipArea;
  if (!chipArea) return;
  chipArea.innerHTML = "";
  const chip = document.createElement("div");
  chip.className = "diphthong-chip";
  chip.textContent = combo;
  chip.title = `Diphthong /${combo}/ — click to clear`;
  chip.onclick = () => {
    chipArea.innerHTML = "";
    state.responseSelections[idx] = null;
    state.trialScore = computeCurrentScore();
    markScoreButton();
    renderSelectionColours();
  };
  chipArea.appendChild(chip);
}

function isDiphthong(p) {
  // Two bare vowels joined, e.g. "au", "ai", "ei" — no macrons
  return typeof p === "string" && /^[aeiou]{2}$/.test(p);
}

function equivalent(target, response) {
  if (!response || response === "–") return false;
  // Diphthongs must match exactly (au ≠ ao)
  if (isDiphthong(target) || isDiphthong(response)) return target === response;
  // Long/short vowel equivalence
  if (V_EQ[target] && V_EQ[response]) return V_EQ[target] === V_EQ[response];
  return target === response;
}

function computeAdvancedScore(targets, responses) {
  return targets.reduce((sum, t, i) => sum + (equivalentForScoring(t, responses[i]) ? 1 : 0), 0);
}

function computeCurrentScore() {
  if (state.scoringMode === "fast") return Number(state.trialScore ?? 0);

  const trial = currentTrial();
  if (!trial) return 0;
  const targets = wordPhonemes(trial.word);
  let score = 0;
  targets.forEach((target, idx) => {
    const advanced = state.responseSelections[idx];
    if (advanced !== null && advanced !== undefined && advanced !== "") {
      if (equivalentForScoring(target, advanced)) score++;
    } else if (state.targetSelections[idx]) {
      score++;
    }
  });
  return score;
}

function renderSelectionColours() {
  const trial = currentTrial();
  if (!trial) return;
  const targets = wordPhonemes(trial.word);
  const fastAllCorrect = state.scoringMode === "fast" && Number(state.trialScore) === phonemeCount();

  document.querySelectorAll(".phoneme-target").forEach((el, idx) => {
    const advanced = state.responseSelections[idx];
    const topSelected = !!state.targetSelections[idx];
    const advancedChosen = !!advanced;

    if (state.scoringMode === "fast") {
      el.classList.toggle("selected", fastAllCorrect);
      el.classList.toggle("correct-selected", fastAllCorrect);
      el.classList.toggle("incorrect-selected", false);
      return;
    }

    el.classList.toggle("selected", topSelected || advancedChosen);
    el.classList.toggle("correct-selected", topSelected || (advancedChosen && equivalentForScoring(targets[idx], advanced)));
    el.classList.toggle("incorrect-selected", advancedChosen && !equivalentForScoring(targets[idx], advanced));
  });

  document.querySelectorAll(".advanced-col").forEach((col, idx) => {
    const target = targets[idx];
    const explicitResponse = state.responseSelections[idx];

    col.querySelectorAll(".phoneme-option").forEach(btn => {
      const p = btn.textContent;
      const isChosen = explicitResponse === p;
      const isTopSelected = state.scoringMode !== "fast" && !explicitResponse && state.targetSelections[idx] && equivalentForScoring(target, p);
      const fastCorrect = fastAllCorrect && equivalentForScoring(target, p);

      btn.classList.toggle("selected", isChosen);
      btn.classList.toggle("correct-selected", (isChosen && equivalentForScoring(target, p)) || isTopSelected || fastCorrect);
      btn.classList.toggle("incorrect-selected", isChosen && !equivalentForScoring(target, p));
    });

    // Colour the diphthong chip if present
    const chip = col.querySelector(".diphthong-chip");
    if (chip) {
      const isChosen = explicitResponse === chip.textContent;
      chip.classList.toggle("selected", isChosen);
      chip.classList.toggle("correct-selected", isChosen && equivalentForScoring(target, chip.textContent));
      chip.classList.toggle("incorrect-selected", isChosen && !equivalentForScoring(target, chip.textContent));
    }
  });
}

function markScoreButton() {
  document.querySelectorAll(".score-buttons button").forEach(btn => {
    btn.classList.toggle("fast-selected", Number(btn.dataset.score) === state.trialScore);
  });
}

function clearScoring() {
  state.trialScore = null;
  state.scoringMode = "none";
  state.targetSelections = blankSelections();
  state.responseSelections = blankResponses();
  $("trialComment").value = "";
  document.querySelectorAll(".phoneme-target,.phoneme-option").forEach(x => x.classList.remove("selected", "correct-selected", "incorrect-selected"));
  document.querySelectorAll(".diphthong-chip-area").forEach(a => a.innerHTML = "");
  document.querySelectorAll(".advanced-col").forEach(col => {
    col._diphthongFirst = null;
    col._diphthongBuildMode = false;
  });
  document.querySelectorAll(".diphthong-divider").forEach(d => {
    d.classList.remove("active");
    d.textContent = "＋ diphthong";
  });
  markScoreButton();
}

async function playCurrent(withCarrier) {
  stopCurrentStimulusIfAny();
  const trial = currentTrial();
  const q = currentQueueItem();
  if (!trial || !q) return;
  const L = lang();
  const word = trial.word[0];
  // English resolves audio from sounds_cvc/ by its NNNN_Word file stem (col 4).
  // Recordings are all .mp3; word casing varies between files, so we try a few
  // case variants. Māori resolves by the word from sounds/.
  const stem = trial.word[4] || word;
  const stimBases = L.hasCarrier ? [word] : englishCandidates(stem);
  const level = q.levelDbA;
  const ear = $("stimEar").value;

  // In training mode (Māori only), the client's recorded response follows the kupu.
  const chainResponse = (kupuNode) => {
    if (!trainingActive() || !trial.trainingFile) return;
    kupuNode.el.addEventListener("ended", () => {
      setTimeout(() => {
        if ($("screen-test").classList.contains("active")) playClientResponse();
      }, 600);
    }, { once: true });
  };

  try {
    if (withCarrier && L.hasCarrier) {
      // Māori: play the separate KōreroMai carrier, then the kupu.
      const carrier = await playFirstAvailable([pickKoreroMai()], ear, level, false);
      carrier.el.addEventListener("ended", async () => {
        try {
          const kupu = await playFirstAvailable(stimBases, ear, level, false);
          chainResponse(kupu);
        } catch {}
      }, { once: true });
    } else {
      // English: carrier is embedded in the file — just play the file.
      const kupu = await playFirstAvailable(stimBases, ear, level, false);
      chainResponse(kupu);
    }
  } catch {
    const where = L.hasCarrier ? "/sounds" : `/${ENGLISH_SOUND_DIR}`;
    alert(`Could not play ${word}. Check the file exists in ${where}.`);
  }
}

function setMaskerIndicator(isOn) {
  const el = $("maskerStatus");
  if (!el) return;
  el.classList.toggle("on", !!isOn);
  el.classList.toggle("off", !isOn);
  el.textContent = isOn ? "Masker playing" : "Masker off";
}

function setStimulusIndicator(isOn, label) {
  const el = $("stimulusStatus");
  if (!el) return;
  el.classList.toggle("on", !!isOn);
  el.classList.toggle("off", !isOn);
  el.textContent = isOn ? (label || "Kupu playing") : "Kupu idle";
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

function nudgeMasker(delta) {
  const newVal = (Number($("maskLevelLive").value) || 40) + delta;
  $("maskLevelLive").value = newVal;
  $("maskLevel").value = newVal;
  updateLiveMasker();
}

function nudgeLevel(delta) {
  const q = currentQueueItem();
  if (!q) return;
  const newLevel = q.levelDbA + delta;
  const qLang = q.language || "maori";

  // Check if results exist for the current list (this language, list & level)
  const listHasResults = state.results.some(r =>
    r.listNumber === q.listNumber && r.listLevelDbA === q.levelDbA && (r.language || "maori") === qLang
  );

  if (listHasResults) {
    const ok = confirm(
      `Changing level from ${q.levelDbA} to ${newLevel} dB will discard results for this list. Continue?`
    );
    if (!ok) return;
    // Mark current list abandoned, remove its results, create new queue entry
    q.status = "abandoned";
    state.results = state.results.filter(r =>
      !(r.listNumber === q.listNumber && r.listLevelDbA === q.levelDbA && (r.language || "maori") === qLang)
    );
    const newEntry = {
      listNumber: q.listNumber,
      levelDbA: newLevel,
      language: qLang,
      status: "in-progress",
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
    };
    state.queue.splice(state.currentListIndex + 1, 0, newEntry);
    state.currentListIndex++;
    state.currentTrials = [...state.currentTrials]; // keep same trial order
    state.currentTrialIndex = 0;
    state.currentResultIndexByTrial = {};
  } else {
    q.levelDbA = newLevel;
  }

  updateLevelDisplay();
  renderTrial();
  refreshPI();
  saveSession();
}

function updateLevelDisplay() {
  const q = currentQueueItem();
  if (!q) return;
  const el = $("levelNudgeLabel");
  if (el) el.textContent = String(q.levelDbA);
  updateRunningScore();
  refreshPI();
}

function updateRunningScore() {
  const el = $("runningScore");
  if (!el) return;
  const q = currentQueueItem();
  if (!q) { el.textContent = "—"; return; }
  const listResults = state.results.filter(r =>
    r.listNumber === q.listNumber && r.listLevelDbA === q.levelDbA &&
    (r.language || "maori") === (q.language || "maori")
  );
  if (!listResults.length) { el.textContent = "—"; return; }
  const correct = listResults.reduce((sum, r) => sum + Number(r.score || 0), 0);
  const total = listResults.reduce((sum, r) => sum + (r.phonemeCount || r.targetPhonemes?.length || 4), 0);
  const pct = Math.round((correct / total) * 100);
  el.textContent = `${correct}/${total} phonemes · ${pct}%`;
}

function nextTrial() {
  // Training mode: evaluate the trainee's scoring before advancing.
  if (trainingActive() && !state._trainingBypass) {
    cancelPendingAdvance();
    handleTrainingNext();
    return;
  }

  // Re-entrancy lockout: ignore a second advance while one is already running.
  // This stops a manual "Next" tap from stacking on top of the auto-advance
  // timer (or a double-tap) and skipping the trial in between.
  if (state._advancing) return;

  const trial = currentTrial();
  const q = currentQueueItem();
  if (!trial || !q) return;

  // Don't advance off an unscored trial. The auto-advance only fires *after*
  // a score is entered, so this blocks only stray manual/double "Next" presses
  // that would otherwise skip a trial and silently record it as 0.
  // (Training bypass has already validated/recorded a score, so it's exempt.)
  const alreadyHasResult = Number.isFinite(state.currentResultIndexByTrial[state.currentTrialIndex]);
  if (!state._trainingBypass && state.scoringMode === "none" && !alreadyHasResult) {
    flashNextLocked();
    return;
  }

  state._advancing = true;
  try {
    advanceTrialNow(trial, q);
  } finally {
    state._advancing = false;
  }
}

// The actual record-and-advance, separated so the lockout/guard logic above
// stays readable.
function advanceTrialNow(trial, q) {
  const targets = wordPhonemes(trial.word);
  const score = computeCurrentScore();
  const resultPayload = {
    timestamp: new Date().toISOString(),
    client: state.client,
    language: q.language || state.language,
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
    phonemeCount: targets.length,
    scoringMode: state.scoringMode,
    responsePhonemes: state.scoringMode === "fast" ? blankResponses() : [...state.responseSelections],
    selectedTargetCorrectness: state.scoringMode === "fast" ? blankSelections() : [...state.targetSelections],
    score,
    percent: Math.round((score / targets.length) * 100),
    maskerLevelReport: $("maskEar").value === "off" ? "none" : Number($("maskLevel").value),
    comment: $("trialComment").value.trim(),
    ...(trainingActive() ? {
      training: true,
      trainingClientId: state.training.id,
      trainingFile: trial.trainingFile || null,
      trueResponsePhonemes: trial.trainingResponse || null,
      trueScore: Number.isFinite(trial.trainingTrueScore) ? trial.trainingTrueScore : null,
      attempts: (trial.trainingAttempts || 0) + 1,
      revealed: !!trial.trainingRevealed
    } : {})
  };

  const existingIdx = state.currentResultIndexByTrial[state.currentTrialIndex];
  if (Number.isFinite(existingIdx)) {
    state.results[existingIdx] = resultPayload;
  } else {
    state.results.push(resultPayload);
    state.currentResultIndexByTrial[state.currentTrialIndex] = state.results.length - 1;
  }

  state.currentTrialIndex++;
  // Skip over any trials that already have a score (jumped-to trials filled in earlier)
  while (
    state.currentTrialIndex < state.currentTrials.length &&
    Number.isFinite(state.currentResultIndexByTrial[state.currentTrialIndex])
  ) {
    state.currentTrialIndex++;
  }
  if (state.currentTrialIndex >= state.currentTrials.length) finishList();
  else {
    renderTrial();
  }
  refreshPI();
  updateRunningScore();
  updateSetupResultsSummary();
  saveSession();
}

function finishList() {
  // Find the first trial that has no recorded result yet
  const firstUnscored = state.currentTrials.findIndex((_, idx) =>
    !Number.isFinite(state.currentResultIndexByTrial[idx])
  );

  if (firstUnscored >= 0) {
    // There are gaps — jump to the first unscored trial
    state.currentTrialIndex = firstUnscored;
    renderTrial();
    return;
  }

  // All trials scored — truly done
  const q = currentQueueItem();
  q.status = "complete";
  stopMasker();
  renderQueue();
  saveSession();

  // Training: show the performance summary first; continue on close.
  if (trainingActive() && showTrainingSummary()) return;

  finishListProceed();
}

function finishListProceed() {
  const next = state.queue.findIndex(x => x.status === "queued");
  if (next >= 0) {
    const proceed = confirm(`List complete. Start next queued list (List ${state.queue[next].listNumber} @ ${state.queue[next].levelDbA} dB)?`);
    if (proceed) {
      state.currentListIndex = next;
      beginCurrentList();
      return;
    }
  } else {
    alert("All queued lists complete. Results are being saved automatically.");
    autoSaveJson();
  }
  updateSetupResultsSummary();
  show("screen-setup");
}

// Build and show the end-of-list training performance summary.
// Returns true if the dialog was shown (finishListProceed runs on close).
function showTrainingSummary() {
  const dlg = $("trainingSummaryDialog");
  if (!dlg) return false;

  // This run's results, in trial order
  const entries = Object.keys(state.currentResultIndexByTrial)
    .map(k => state.results[state.currentResultIndexByTrial[k]])
    .filter(Boolean);

  // Only trials that actually had a recording count toward scoring accuracy
  const scored = entries.filter(e => e.training && e.trainingFile);
  if (!scored.length) return false;

  const total = scored.length;
  const firstTry = scored.filter(e => e.attempts === 1);
  const revealed = scored.filter(e => e.revealed);
  const retried = scored.filter(e => e.attempts > 1 && !e.revealed);
  const pct = Math.round((firstTry.length / total) * 100);

  // Count the teaching-moment phonemes this list contained
  let dialectCount = 0, lengthCount = 0;
  for (const e of scored) {
    if (!e.trueResponsePhonemes) continue;
    for (const pos of evaluateTrainingPositions(e.targetPhonemes, e.trueResponsePhonemes)) {
      if (pos.type === "dialect") dialectCount++;
      if (pos.type === "length") lengthCount++;
    }
  }

  const headline =
    pct === 100 ? "Ka rawe! Perfect scoring — every kupu right on the first attempt." :
    pct >= 80   ? "Ka pai! Strong scoring accuracy." :
    pct >= 50   ? "Good progress — keep practising." :
                  "Keep at it — scoring accuracy builds with practice.";

  let body = `<p class="tf-summary">${headline}</p>` +
    `<div class="tf-row ok"><span class="tf-phon">${firstTry.length}/${total}</span><span>kupu scored correctly on the first attempt (${pct}%).</span></div>`;

  if (retried.length) {
    const items = retried.map(e => `${e.presentedWord} (${e.attempts} attempts)`).join(", ");
    body += `<div class="tf-row note"><span class="tf-phon">${retried.length}</span><span>needed another listen: ${items}.</span></div>`;
  }
  if (revealed.length) {
    const items = revealed.map(e => `${e.presentedWord}`).join(", ");
    body += `<div class="tf-row bad"><span class="tf-phon">${revealed.length}</span><span>answer revealed: ${items} — worth replaying these in a future session.</span></div>`;
  }
  if (dialectCount || lengthCount) {
    const bits = [];
    if (dialectCount) bits.push(`${dialectCount} regional-variant phoneme${dialectCount !== 1 ? "s" : ""}`);
    if (lengthCount) bits.push(`${lengthCount} vowel-length case${lengthCount !== 1 ? "s" : ""}`);
    body += `<div class="tf-row note"><span class="tf-phon">📚</span><span class="tf-teach">This list included ${bits.join(" and ")} — these score as correct.</span></div>`;
  }

  const skipped = entries.filter(e => e.training && !e.trainingFile).length;
  if (skipped) {
    body += `<p class="hint">${skipped} kupu had no training recording and ${skipped !== 1 ? "were" : "was"} excluded from these figures.</p>`;
  }

  $("tsTitle").textContent = `Training summary — ${state.training.name}`;
  $("tsBody").innerHTML = body;
  dlg.addEventListener("close", () => finishListProceed(), { once: true });
  dlg.showModal();
  return true;
}

function abandonList() {
  const q = currentQueueItem();
  if (!q) return;
  q.status = "abandoned";
  stopMasker();
  saveSession();
  if (state.results?.length) autoSaveJson();
  renderQueue();
  renderRecentSessions();
  updateSetupResultsSummary();
  show("screen-setup");
}

function listSummaries() {
  const map = new Map();
  for (const r of state.results) {
    const condition = r.presentationCondition || r.stimulusEar;
    const masked = r.maskerEar && r.maskerEar !== "off";
    const language = r.language || "maori";
    const key = `${language}|${r.listNumber}|${r.listLevelDbA}|${condition}|${masked}`;
    if (!map.has(key)) map.set(key, { language, listNumber: r.listNumber, level: r.listLevelDbA, condition, ear: condition, masked, trials: 0, phonemes: 0, phonemeTotal: 0 });
    const s = map.get(key);
    s.trials++;
    s.phonemes += Number(r.score || 0);
    s.phonemeTotal += (r.phonemeCount || r.targetPhonemes?.length || 4);
  }
  return [...map.values()].map(s => ({ ...s, percent: s.phonemeTotal ? Math.round((s.phonemes / s.phonemeTotal) * 100) : 0 }));
}

// Which languages currently have any recorded results.
function languagesWithResults() {
  const set = new Set(state.results.map(r => r.language || "maori"));
  return ["maori", "english"].filter(k => set.has(k));
}

// ── Language switching ────────────────────────────────────────────
function repopulateListSelects() {
  const listNums = Object.keys(currentWordLists()).map(Number).sort((a,b)=>a-b);
  [["listChoice"], ["queueListNumber"]].forEach(([id]) => {
    const sel = $(id);
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = "";
    listNums.forEach(i => {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = `List ${i}`;
      sel.appendChild(opt);
    });
    if (listNums.includes(Number(prev))) sel.value = prev;
  });
}

// Reflect the active language across the UI: toggle buttons, terminology,
// available list numbers, and the visibility of Māori-only controls.
function applyLanguageToUI() {
  const L = lang();
  document.querySelectorAll(".language-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.lang === state.language));

  // Stimulus play-button label + terminology
  if ($("playWordBtn")) {
    $("playWordBtn").textContent = L.hasCarrier ? 'Play "Kōrero mai..." + kupu' : "Play word";
  }
  if ($("repeatWordBtn")) {
    $("repeatWordBtn").textContent = L.hasCarrier ? "Replay kupu only" : "Replay word";
    // English has no separate word-only stimulus — replay plays the same file.
    $("repeatWordBtn").title = L.hasCarrier ? "" : "Replays the full recording (carrier is part of the file)";
  }
  if ($("phonemeHeading")) $("phonemeHeading").textContent = "Phoneme scoring";

  // Advanced phoneme selection — Māori only.
  const advancedDetails = document.getElementById("advancedDetails");
  if (advancedDetails) advancedDetails.style.display = L.hasAdvanced ? "" : "none";

  // Training controls — Māori only.
  const trainingControls = document.querySelector(".training-controls");
  if (trainingControls) trainingControls.style.display = L.hasTraining ? "" : "none";

  // Word-order randomise toggle reflects the current language's effective setting.
  const rndToggle = $("randomiseOrderToggle");
  if (rndToggle) {
    rndToggle.checked = randomiseEnabled(state.language);
    const usingDefault = (state.randomiseOverride?.[state.language] ?? null) === null;
    const lbl = $("randomiseOrderLabel");
    if (lbl) lbl.textContent = "Randomise word order" + (usingDefault ? ` (default: ${L.randomiseOrder ? "on" : "off"})` : "");
  }

  repopulateListSelects();
  setupFastScoreButtons();
}

function setLanguage(langKey, opts = {}) {
  if (!LANGUAGES[langKey] || langKey === state.language) {
    applyLanguageToUI();
    return;
  }
  // If switching away from a language that has training active, exit training.
  if (langKey !== "maori" && trainingActive()) exitTraining();
  state.language = langKey;
  applyLanguageToUI();
  renderQueue();
  if (!opts.silent) saveSession();
}

// Tabs above the PI canvas — shown only when both languages have data.
function renderPiTabs() {
  const box = $("piTabs");
  if (!box) return;
  const withData = languagesWithResults();
  if (withData.length < 2) {
    box.hidden = true;
    box.innerHTML = "";
    // Keep the displayed tab consistent with what's actually plotted.
    state._piTab = withData[0] || null;
    return;
  }
  box.hidden = false;
  const active = activePiLanguage();
  box.innerHTML = "";
  withData.forEach(k => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pi-tab" + (k === active ? " active" : "");
    btn.textContent = LANGUAGES[k].label;
    btn.onclick = () => {
      state._piTab = k;
      renderPiTabs();
      drawPI(k);
    };
    box.appendChild(btn);
  });
}

// Always refresh tabs alongside the plot.
function refreshPI() {
  renderPiTabs();
  drawPI();
}

// Which language the PI canvas is currently showing. Defaults to the
// active test language, falling back to whatever has data.
function activePiLanguage() {
  const withData = languagesWithResults();
  if (state._piTab && withData.includes(state._piTab)) return state._piTab;
  if (withData.includes(state.language)) return state.language;
  return withData[0] || state.language;
}

// Glyph for one plotted point. condition + masking decide the mark.
function drawPiGlyph(ctx, px, py, condition, masked) {
  ctx.save();
  ctx.font = "bold 22px system-ui";
  ctx.textBaseline = "middle";
  if (condition === "left") {
    ctx.fillStyle = "#135bd8";
    if (masked) {
      // Masked left: two ×'s overlapping by 50% of the glyph width, centred on px.
      ctx.textAlign = "center";
      const w = ctx.measureText("×").width;
      const off = w * 0.25; // each × shifted a quarter-width from centre → 50% overlap
      ctx.fillText("×", px - off, py);
      ctx.fillText("×", px + off, py);
    } else {
      ctx.textAlign = "center";
      ctx.fillText("×", px, py);
    }
  } else if (condition === "right") {
    ctx.strokeStyle = "#c52222";
    ctx.fillStyle = "#c52222";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    if (masked) ctx.fill();   // masked right: filled circle
    else ctx.stroke();        // unmasked right: open circle
  } else {
    ctx.fillStyle = "#111";
    ctx.textAlign = "center";
    ctx.fillText(conditionSymbol(condition), px, py);
  }
  ctx.restore();
}

function drawPI(forLanguage) {
  const canvas = $("piCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = "#fff"; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle = "#777"; ctx.lineWidth = 1;
  const left = 50, right = w - 20, top = 20, bottom = h - 45;
  const xOf = lvl => left + (Math.max(0, Math.min(100, lvl)) / 100) * (right - left);
  const yOf = pct => bottom - (Math.max(0, Math.min(100, pct)) / 100) * (bottom - top);

  ctx.beginPath();
  ctx.moveTo(left, top); ctx.lineTo(left, bottom); ctx.lineTo(right, bottom); ctx.stroke();

  ctx.font = "13px system-ui";
  ctx.fillStyle = "#111";
  for (let y = 0; y <= 100; y += 20) {
    const py = yOf(y);
    ctx.strokeStyle = "#ddd"; ctx.beginPath(); ctx.moveTo(left, py); ctx.lineTo(right, py); ctx.stroke();
    ctx.fillStyle = "#111"; ctx.fillText(String(y), 18, py + 4);
  }
  for (let x = 0; x <= 100; x += 20) {
    const px = xOf(x);
    ctx.strokeStyle = "#ddd"; ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, bottom); ctx.stroke();
    ctx.fillStyle = "#111"; ctx.fillText(String(x), px - 8, bottom + 20);
  }
  ctx.fillText("dB(A)", (left+right)/2 - 18, h - 8);
  ctx.save(); ctx.translate(12, (top+bottom)/2 + 35); ctx.rotate(-Math.PI/2); ctx.fillText("% correct", 0, 0); ctx.restore();

  const plotLang = forLanguage || activePiLanguage();
  const summaries = listSummaries().filter(s => (s.language || "maori") === plotLang);

  // ── Connecting lines ─────────────────────────────────────────────
  // One line per condition (ear), threaded across levels. Where two
  // points share the same level, the masked one wins the line; if the
  // masking state also matches, the most recent wins. Every point is
  // still drawn as its own glyph below — nothing is dropped.
  const byCondition = {};
  for (const s of summaries) {
    const cond = s.condition || s.ear;
    (byCondition[cond] = byCondition[cond] || []).push(s);
  }

  for (const [cond, pts] of Object.entries(byCondition)) {
    // Pick the line-bearing point at each level.
    const bestByLevel = new Map();
    for (const p of pts) {
      const existing = bestByLevel.get(p.level);
      if (!existing) { bestByLevel.set(p.level, p); continue; }
      // masked wins; otherwise keep the one already chosen (latest insertion)
      if (p.masked && !existing.masked) bestByLevel.set(p.level, p);
    }
    const linePts = [...bestByLevel.values()].sort((a, b) => a.level - b.level);
    if (linePts.length >= 2) {
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = cond === "left" ? "#135bd8" : cond === "right" ? "#c52222" : "#444";
      // Left = dashed, right & others = solid.
      ctx.setLineDash(cond === "left" ? [6, 4] : []);
      ctx.beginPath();
      linePts.forEach((p, i) => {
        const px = xOf(p.level), py = yOf(p.percent);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.restore();
    }
  }

  // ── Glyphs (all points, always) ──────────────────────────────────
  for (const s of summaries) {
    drawPiGlyph(ctx, xOf(s.level), yOf(s.percent), s.condition || s.ear, s.masked);
  }

  // ── Crosshair: only on the tab matching the active test language ──
  const q = currentQueueItem();
  const showCrosshair = q && $("screen-test").classList.contains("active") &&
    plotLang === (q.language || state.language);
  if (showCrosshair) {
    const clevel = q.levelDbA;
    const listResults = state.results.filter(r =>
      r.listNumber === q.listNumber && r.listLevelDbA === clevel &&
      (r.language || "maori") === (q.language || "maori")
    );
    const correct = listResults.reduce((s,r) => s + Number(r.score||0), 0);
    const total = listResults.reduce((s,r) => s + (r.phonemeCount || r.targetPhonemes?.length || 4), 0);
    const cpct = total ? Math.round((correct / total) * 100) : 0;
    const cx = xOf(clevel);
    const cy = yOf(cpct);

    ctx.save();
    ctx.strokeStyle = "#b31b1b";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx, bottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(left, cy); ctx.lineTo(right, cy); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#b31b1b";
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI*2); ctx.fill();

    // Tiny red % label by the Y-axis, baseline resting on the horizontal line.
    // Clamp near the top so it tucks under the line instead of clipping.
    ctx.font = "bold 11px system-ui";
    ctx.textAlign = "left";
    const labelBaseline = (cy - 3 < top + 10) ? cy + 12 : cy - 3;
    ctx.fillText(`${cpct}%`, left + 3, labelBaseline);
    ctx.restore();
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

function autoSaveJson() {
  // Silently trigger a JSON download so data is never lost on session end
  readClientForm();
  const payload = {
    exportedAt: new Date().toISOString(),
    app: "UC Speech Audiometry (Te reo Māori / NZ English)",
    activeLanguage: state.language,
    languagesPresent: languagesWithResults(),
    client: state.client,
    setup: {
      presentationCondition: $("presentationCondition") ? $("presentationCondition").value : "",
      stimulusRouting: $("stimEar") ? $("stimEar").value : "",
      transducer: $("transducer") ? $("transducer").value : "",
      maskingAtExport: $("maskEar") && $("maskEar").value !== "off",
      maskerEar: $("maskEar") ? $("maskEar").value : "",
      maskerLevelDbA: $("maskLevel") ? $("maskLevel").value : ""
    },
    calibration: state.calibration,
    queue: state.queue,
    results: state.results,
    summaries: listSummaries()
  };
  const date = (state.client.date || new Date().toISOString().slice(0,10)).replace(/-/g,"");
  download(`${safeName()}_${date}_speech_audiometry.json`, "application/json", JSON.stringify(payload, null, 2));
}

function downloadJson() {
  autoSaveJson();
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

  const cols = ["timestamp","language","clientName","clientId","clientDob","listNumber","listLevelDbA","presentationCondition","stimulusEar","transducer","maskerEar","maskerLevelDbA","trialOrder","presentedWord","targetPhonemes","scoringMode","responsePhonemes","score","scoreOutOf","percent","comment"];
  const rows = state.results.map(r => {
    const denom = r.phonemeCount || r.targetPhonemes?.length || 4;
    const langLabel = (LANGUAGES[r.language || "maori"] || LANGUAGES.maori).label;
    const responseStr = r.scoringMode === "fast"
      ? (Number(r.score) === denom ? r.targetPhonemes.join(" ") : "not recorded")
      : (r.responsePhonemes || []).join(" ");
    return [
      r.timestamp, langLabel, state.client.name, state.client.id, state.client.dob, r.listNumber, r.listLevelDbA, r.presentationCondition, r.stimulusEar, r.transducer, r.maskerEar, r.maskerLevelReport ?? r.maskerLevelDbA ?? "none", r.trialOrder, r.presentedWord,
      r.targetPhonemes.join(" "), r.scoringMode || "", responseStr, r.score, denom, r.percent, r.comment
    ];
  });

  return [...headerRows, cols, ...rows]
    .map(row => row.map(x => String(x ?? "").replace(/\t/g," ").replace(/\n/g," ")).join("\t"))
    .join("\n");
}

function downloadTsv() {
  download(`${safeName()}_speech_audiometry.tsv`, "text/tab-separated-values", buildTsv());
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
  if (!state.results || !state.results.length) {
    alert("No results to report yet.");
    return;
  }
  state._reportCalledFrom = document.querySelector(".screen.active")?.id || "screen-setup";

  const langs = languagesWithResults();
  const allSummaries = listSummaries();

  const denomOf = r => r.phonemeCount || r.targetPhonemes?.length || 4;
  const responseText = (r) => {
    const denom = denomOf(r);
    if (r.scoringMode === "fast") {
      return Number(r.score) === denom ? r.targetPhonemes.join(" ") : "not recorded";
    }
    return r.targetPhonemes.map((target, idx) => {
      const advanced = r.responsePhonemes?.[idx];
      const selectedCorrect = r.selectedTargetCorrectness?.[idx];
      if (advanced !== null && advanced !== undefined && advanced !== "") return advanced;
      if (selectedCorrect) return target;
      return "–";
    }).join(" ");
  };

  // Capture one PI image per language by drawing each into the canvas.
  const piImages = {};
  for (const lk of langs) {
    drawPI(lk);
    piImages[lk] = $("piCanvas") ? $("piCanvas").toDataURL("image/png") : "";
  }
  // Restore the live canvas to the active tab.
  refreshPI();

  // Per-language report sections (plot + summary + trial table).
  const langSection = (lk) => {
    const L = LANGUAGES[lk] || LANGUAGES.maori;
    const summaries = allSummaries.filter(s => (s.language || "maori") === lk);
    const results = state.results.filter(r => (r.language || "maori") === lk);
    const summaryRows = summaries.map(s =>
      `<tr><td>${s.listNumber}</td><td>${s.level}</td><td>${conditionLabel(s.condition || s.ear)}</td><td>${s.masked ? "Yes" : "No"}</td><td>${s.trials}</td><td>${s.percent}%</td></tr>`
    ).join("");
    const trialRows = results.map(r =>
      `<tr><td>${r.listNumber}</td><td>${r.listLevelDbA}</td><td>${conditionLabel(r.presentationCondition || r.stimulusEar)}</td><td>${r.transducer || ""}</td><td>${r.maskerLevelReport ?? r.maskerLevelDbA ?? "none"}</td><td>${r.presentedWord}</td><td>${r.targetPhonemes.join(" ")}</td><td>${responseText(r)}</td><td>${r.score}/${denomOf(r)}</td><td>${r.comment || ""}</td></tr>`
    ).join("");
    const wordHeader = L.unitTitle;
    return `
      <section class="report-lang-section">
        <h2>${L.label} — performance intensity function</h2>
        ${piImages[lk] ? `<img class="report-pi" src="${piImages[lk]}" alt="${L.label} performance intensity plot">` : ""}
        <p class="report-pi-legend">× Left (dashed) &nbsp; ×× Masked left &nbsp; ○ Right (solid) &nbsp; ● Masked right &nbsp; B Binaural &nbsp; S/A/U Sound field / Aided / Unaided</p>
        <h3>${L.label} — summary</h3>
        <table class="report-table"><thead><tr><th>List</th><th>Level dB(A)</th><th>Condition</th><th>Masked</th><th>Trials</th><th>% correct</th></tr></thead><tbody>${summaryRows}</tbody></table>
        <h3>${L.label} — trial data</h3>
        <table class="report-table"><thead><tr><th>List</th><th>dB(A)</th><th>Condition</th><th>Transducer</th><th>Masker dB(A)</th><th>${wordHeader}</th><th>Target</th><th>Response</th><th>Score</th><th>Comment</th></tr></thead><tbody>${trialRows}</tbody></table>
      </section>`;
  };

  const sectionsHtml = langs.map(langSection).join("");

  const logoHtml = state.clinicLogo
    ? `<img src="${state.clinicLogo}" alt="Clinic logo" style="max-height:60px;max-width:200px;object-fit:contain">`
    : "";
  const clinicNameVal = ($("clinicName") ? $("clinicName").value.trim() : "") || "University of Canterbury Hearing Clinic";
  const titleLangs = langs.map(lk => (LANGUAGES[lk] || LANGUAGES.maori).label).join(" / ");

  $("reportContent").innerHTML = `
    <div class="report-header-row">
      <div>${logoHtml}</div>
      <div style="text-align:right;color:#555;font-size:.9rem">${clinicNameVal}</div>
    </div>
    <h1>Speech Audiometry Report</h1>
    <p class="report-pi-legend">Languages assessed: ${titleLangs}</p>
    <div class="report-grid">
      <div>
        <p><b>Client:</b> ${state.client.name || ""}</p>
        <p><b>NHI / ID:</b> ${state.client.id || ""}</p>
        <p><b>Date of birth:</b> ${state.client.dob || ""}</p>
        <p><b>Date:</b> ${state.client.date || ""}</p>
      </div>
      <div>
        <p><b>Clinician:</b> ${state.client.clinician || ""}${state.client.role ? " — " + state.client.role : ""}</p>
        <p><b>Facility:</b> ${state.client.facility || ""}</p>
        <p><b>Calibration:</b> ${state.calibration.isCalibrated ? state.calibration.measuredDbA + " dB(A)" : "not set"}</p>
        <p><b>Notes:</b> ${state.client.notes || ""}</p>
      </div>
    </div>
    ${sectionsHtml}
  `;
  show("screen-report");
}

init();
