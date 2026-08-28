/* ─────────────────────────────────────────────────────────────────────────
   sessions.js — Multi-session keyed store, recent-sessions list, crash recovery.

   Replaces the old single-slot localStorage draft with a keyed collection so
   that:
     • every session persists independently (many clients kept, not overwritten);
     • each saved file gets a unique name (client + identifier + timestamp);
     • the Recent Sessions list shows all of them, newest first, with the live
       one tagged "(current session)" and any session left mid-test (browser
       closed / crash) tagged "[interrupted]" and resumable;
     • restoring another session warns first, and the session being left is
       itself already a recent entry, so nothing is lost.

   Storage layout (localStorage):
     ucSessions:index         → JSON array of lightweight descriptors
     ucSessions:data:<id>     → the full session payload for <id>

   A descriptor is { id, savedAt, startedAt, status, client:{name,id,dob,date},
   resultCount, testInProgress }. status ∈ "active" | "clean" | "interrupted".
   "active" means a save happened but the session was never cleanly closed; if we
   ever load and find an "active" entry that isn't the one we just resumed, it was
   interrupted. We flip active→interrupted at load time (see reconcileOnLoad).

   The module is storage + list logic only. app.js supplies buildPayload() (what
   to persist) and applyPayload() (how to restore) via register().
   ──────────────────────────────────────────────────────────────────────── */
(function (global) {
  "use strict";

  const INDEX_KEY = "ucSessions:index";
  const DATA_PREFIX = "ucSessions:data:";

  // app.js registers these so this module stays UI/state-agnostic.
  let hooks = {
    buildPayload: () => ({}),      // () => full session object to persist
    applyPayload: () => {},        // (payload) => restore into app state
    describe: () => ({}),          // () => { client, resultCount, testInProgress }
    onListChanged: () => {}        // () => re-render the recent list
  };
  function register(h) { hooks = Object.assign(hooks, h); }

  // ── Index helpers ─────────────────────────────────────────────────────
  function readIndex() {
    try { return JSON.parse(localStorage.getItem(INDEX_KEY)) || []; }
    catch { return []; }
  }
  function writeIndex(idx) {
    try { localStorage.setItem(INDEX_KEY, JSON.stringify(idx)); } catch {}
  }
  function descriptorFor(id) { return readIndex().find(d => d.id === id) || null; }

  // ── Id + filename ─────────────────────────────────────────────────────
  function newId() {
    return "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }
  function sanitise(s) {
    return String(s || "").replace(/[^\p{Letter}\p{Number}]+/gu, "_").replace(/^_+|_+$/g, "") || "unknown";
  }
  // Unique filename base for any file exported for this session: client name +
  // identifier + timestamp. Collisions are prevented by the timestamp.
  function fileBase(client, whenIso) {
    const name = sanitise(client && client.name ? client.name : "client");
    const ident = client && client.id ? "_" + sanitise(client.id) : "";
    const ts = (whenIso || new Date().toISOString()).replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
    return `${name}${ident}_${ts}`;
  }

  // ── Save / update the current session ─────────────────────────────────
  // status: "active" while a session is live; caller passes "clean" on a clean
  // close. Writes both the descriptor and the payload.
  function save(id, status) {
    if (!id) return;
    let payload;
    try { payload = hooks.buildPayload(); } catch (e) { console.error("[sessions] buildPayload:", e); return; }
    const info = (() => { try { return hooks.describe(); } catch { return {}; } })();
    const now = new Date().toISOString();

    const idx = readIndex();
    let d = idx.find(x => x.id === id);
    if (!d) { d = { id, startedAt: now }; idx.push(d); }
    d.savedAt = now;
    d.status = status || "active";
    d.client = info.client || {};
    d.resultCount = info.resultCount || 0;
    d.testInProgress = !!info.testInProgress;

    try { localStorage.setItem(DATA_PREFIX + id, JSON.stringify(payload)); }
    catch (e) { console.error("[sessions] payload save (quota?):", e); }
    writeIndex(idx);
    hooks.onListChanged();
  }

  // Mark the current session cleanly closed (not interrupted).
  function markClean(id) {
    const idx = readIndex();
    const d = idx.find(x => x.id === id);
    if (d) { d.status = "clean"; d.testInProgress = false; writeIndex(idx); hooks.onListChanged(); }
  }

  // ── Load / restore ────────────────────────────────────────────────────
  function loadPayload(id) {
    try { return JSON.parse(localStorage.getItem(DATA_PREFIX + id)); }
    catch { return null; }
  }
  function restore(id) {
    const payload = loadPayload(id);
    if (!payload) { alert("That session's data could not be found."); return false; }
    try { hooks.applyPayload(payload); return true; }
    catch (e) { console.error("[sessions] applyPayload:", e); alert("Could not restore session — data may be corrupt."); return false; }
  }

  function remove(id) {
    const idx = readIndex().filter(d => d.id !== id);
    writeIndex(idx);
    try { localStorage.removeItem(DATA_PREFIX + id); } catch {}
    hooks.onListChanged();
  }

  // ── Crash reconciliation ──────────────────────────────────────────────
  // Called once at startup, BEFORE the app resumes any session. Any descriptor
  // still marked "active" was never cleanly closed → it was interrupted. We flag
  // it so the list shows [interrupted]. The currentId (if the app is continuing a
  // session in this tab) is exempted.
  function reconcileOnLoad(currentId) {
    const idx = readIndex();
    let changed = false;
    for (const d of idx) {
      if (d.status === "active" && d.id !== currentId) {
        d.status = "interrupted";
        changed = true;
      }
    }
    if (changed) writeIndex(idx);
    return idx.filter(d => d.status === "interrupted");
  }

  // Descriptors, newest first.
  function list() {
    return readIndex().slice().sort((a, b) =>
      String(b.savedAt || "").localeCompare(String(a.savedAt || "")));
  }

  // Migrate a legacy single-slot draft (old key) into the keyed store once.
  function migrateLegacy(legacyKey) {
    try {
      const raw = localStorage.getItem(legacyKey);
      if (!raw) return;
      const payload = JSON.parse(raw);
      if (!payload || !payload.client) { localStorage.removeItem(legacyKey); return; }
      const id = newId();
      const now = payload.savedAt || new Date().toISOString();
      const idx = readIndex();
      idx.push({
        id, startedAt: now, savedAt: now, status: "interrupted",   // legacy draft: treat as recoverable
        client: {
          name: payload.client.name || "", id: payload.client.id || "",
          dob: payload.client.dob || "", date: payload.client.date || ""
        },
        resultCount: (payload.results && payload.results.length) || 0,
        testInProgress: Array.isArray(payload.queue) &&
          payload.queue.some(q => q && q.status === "in-progress")
      });
      localStorage.setItem(DATA_PREFIX + id, JSON.stringify(payload));
      writeIndex(idx);
      localStorage.removeItem(legacyKey);
    } catch (e) { console.error("[sessions] legacy migrate:", e); }
  }

  // Write a specific payload + descriptor directly (used when importing a decoded
  // email backup). Marked "clean" — it's a completed record from elsewhere, not a
  // live session in this tab.
  function saveImported(id, payload, info) {
    if (!id || !payload) return;
    const now = new Date().toISOString();
    const idx = readIndex();
    let d = idx.find(x => x.id === id);
    if (!d) { d = { id, startedAt: now }; idx.push(d); }
    d.savedAt = now;
    d.status = "clean";
    d.client = (info && info.client) || {};
    d.resultCount = (info && info.resultCount) || 0;
    d.testInProgress = false;
    d.imported = true;
    try { localStorage.setItem(DATA_PREFIX + id, JSON.stringify(payload)); }
    catch (e) { console.error("[sessions] imported save (quota?):", e); }
    writeIndex(idx);
    hooks.onListChanged();
  }

  global.Sessions = {
    register, save, saveImported, markClean, restore, remove, list, descriptorFor,
    reconcileOnLoad, loadPayload, newId, fileBase, sanitise, migrateLegacy,
    INDEX_KEY, DATA_PREFIX
  };
})(typeof window !== "undefined" ? window : globalThis);
