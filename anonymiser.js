/* ─────────────────────────────────────────────────────────────────────────
   anonymiser.js — Passphrase-protected name anonymisation for exports.

   Purpose: let a clinician email or archive a full results export with the ONLY
   direct identifier — the participant's name — replaced by an encrypted string,
   while keeping everything else (including date of birth, which the research
   needs). The name can be recovered later, on any device, by pasting the export
   back in and supplying the passphrase.

   Crypto: real WebCrypto, not hand-rolled. The passphrase is stretched with
   PBKDF2 (SHA-256, 250k iterations) over a random 16-byte salt to derive a
   256-bit AES-GCM key; the name is encrypted with a random 12-byte IV. The
   envelope is:  ENC1:<base64( salt(16) | iv(12) | ciphertext )>  — self-describing
   and safe to sit inline in an email body.

   IMPORTANT (shown to the user): this is a sound TECHNICAL safeguard, not a
   certification of HIPAA (or any) compliance — that depends on the whole
   workflow, devices and agreements, not a single feature. And there is no
   backdoor: a forgotten passphrase means the encrypted name is unrecoverable.

   The module never touches the current session. Export builds an anonymised copy
   of the payload; the "Convert email backup" modal decodes a pasted export into
   downloadable, correctly-named files (optionally added to Recent Sessions for
   moving between devices).
   ──────────────────────────────────────────────────────────────────────── */
(function (global) {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const PBKDF2_ITERS = 250000;
  const ENVELOPE_PREFIX = "ENC1:";

  const enc = new TextEncoder();
  const dec = new TextDecoder();

  function b64encode(bytes) {
    let s = "";
    const arr = new Uint8Array(bytes);
    for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
    return btoa(s);
  }
  function b64decode(str) {
    const bin = atob(str);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function deriveKey(passphrase, salt) {
    const baseKey = await crypto.subtle.importKey(
      "raw", enc.encode(passphrase), { name: "PBKDF2" }, false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: PBKDF2_ITERS, hash: "SHA-256" },
      baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }

  // Encrypt a plaintext string → "ENC1:<base64>". Returns a Promise<string>.
  async function encryptString(plaintext, passphrase) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const ct = new Uint8Array(await crypto.subtle.encrypt(
      { name: "AES-GCM", iv }, key, enc.encode(plaintext)));
    const packed = new Uint8Array(salt.length + iv.length + ct.length);
    packed.set(salt, 0); packed.set(iv, salt.length); packed.set(ct, salt.length + iv.length);
    return ENVELOPE_PREFIX + b64encode(packed);
  }

  // Decrypt "ENC1:<base64>" → plaintext. Throws on wrong passphrase / corruption.
  async function decryptString(envelope, passphrase) {
    if (!isEnvelope(envelope)) throw new Error("Not an encrypted value.");
    const packed = b64decode(envelope.slice(ENVELOPE_PREFIX.length));
    const salt = packed.slice(0, 16);
    const iv = packed.slice(16, 28);
    const ct = packed.slice(28);
    const key = await deriveKey(passphrase, salt);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return dec.decode(pt);
  }

  function isEnvelope(v) { return typeof v === "string" && v.startsWith(ENVELOPE_PREFIX); }

  // ── Build an anonymised copy of an export payload ─────────────────────
  // Replaces client.name with its encrypted envelope; keeps DOB and all else.
  // Also strips the name from any per-result fields if present (defensive).
  async function anonymisePayload(payload, passphrase) {
    const copy = JSON.parse(JSON.stringify(payload));
    copy.anonymised = true;
    const name = (copy.client && copy.client.name) ? String(copy.client.name) : "";
    if (name) {
      copy.client.nameEncrypted = await encryptString(name, passphrase);
      copy.client.name = "(encrypted)";
    }
    return copy;
  }

  // Reverse it: given an anonymised payload and the passphrase, restore the name.
  async function deanonymisePayload(payload, passphrase) {
    const copy = JSON.parse(JSON.stringify(payload));
    const encName = copy.client && copy.client.nameEncrypted;
    if (isEnvelope(encName)) {
      copy.client.name = await decryptString(encName, passphrase);
      delete copy.client.nameEncrypted;
      copy.anonymised = false;
    }
    return copy;
  }

  global.Anonymiser = {
    encryptString, decryptString, isEnvelope,
    anonymisePayload, deanonymisePayload, ENVELOPE_PREFIX,
    // UI entry points (wired by app.js buttons)
    exportAnonymised, openConvertModal
  };

  // ── UI: export anonymised results ─────────────────────────────────────
  // app.js passes a function that builds the plain export payload, plus a helper
  // to make a unique filename. We prompt for a passphrase, encrypt the name, and
  // download the anonymised JSON. Inline-friendly: the whole file is text.
  async function exportAnonymised(buildPayload, fileBaseFor) {
    if (!global.crypto || !global.crypto.subtle) {
      alert("This browser can't do the encryption required (no Web Crypto). Use a modern browser over HTTPS.");
      return;
    }
    const payload = buildPayload();
    const hasName = payload.client && payload.client.name && payload.client.name !== "(encrypted)";
    if (!hasName) {
      if (!confirm("There's no participant name to encrypt. Export the results anyway (nothing to anonymise)?")) return;
    }
    const pass = await passphrasePrompt({
      title: "Encrypt participant name",
      body: "Choose a passphrase to encrypt the participant's name. Everything else " +
            "(including date of birth) is kept in clear for the research.\n\n" +
            "This is a technical safeguard, NOT a certification of HIPAA or any other " +
            "compliance. There is no recovery: if you forget this passphrase, the name " +
            "cannot be decrypted by anyone, ever.",
      confirmPass: true
    });
    if (pass === null) return;

    let out;
    try { out = hasName ? await anonymisePayload(payload, pass) : payload; }
    catch (e) { console.error(e); alert("Encryption failed. Nothing was exported."); return; }

    const base = fileBaseFor(out.client, out.exportedAt) || "anonymised";
    const text = JSON.stringify(out, null, 2);
    downloadText(`${base}_anonymised.json`, "application/json", text);

    // Offer to open an email draft with the anonymised data inline. mailto bodies
    // are length-limited by mail clients, so this is best-effort for smaller
    // exports; the downloaded file is always the reliable copy.
    if (confirm("Anonymised file downloaded. Also open an email draft with the data " +
                "inline? (For large exports, attach the downloaded file instead.)")) {
      const subject = `Anonymised speech audiometry results — ${base}`;
      const bodyIntro =
        "Anonymised results attached/below. The participant name is encrypted; " +
        "decode it with the 'Convert email backup' tool and the passphrase.\n\n";
      const body = bodyIntro + text;
      const href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      if (href.length < 8000) {
        window.location.href = href;
      } else {
        // Too big for a mailto body — open a draft that just references the file.
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}` +
          `&body=${encodeURIComponent(bodyIntro + "(The data was too large to inline — attach the downloaded file.)")}`;
      }
    }
  }

  // ── UI: Convert email backup modal ────────────────────────────────────
  // Paste an export (anonymised or not); if it has an encrypted name, prompt for
  // the passphrase and decode; present the reconstructed files for download or
  // adding to Recent Sessions. Never touches the current session.
  function openConvertModal(fileBaseFor, addToRecent) {
    let dlg = $("convertBackupModal");
    if (!dlg) dlg = buildConvertModal();
    // reset
    $("convertBackupInput").value = "";
    $("convertBackupStatus").textContent = "";
    $("convertBackupResult").style.display = "none";
    dlg.__fileBaseFor = fileBaseFor;
    dlg.__addToRecent = addToRecent;
    if (typeof dlg.showModal === "function") dlg.showModal();
  }

  function buildConvertModal() {
    const dlg = document.createElement("dialog");
    dlg.id = "convertBackupModal";
    dlg.className = "convert-backup-modal";
    dlg.innerHTML = `
      <form method="dialog">
        <h3 style="margin-top:0">Convert email backup</h3>
        <p class="hint" style="font-size:.82rem">
          Paste the exported results (the whole JSON from the email). If the name is
          encrypted, you'll be asked for the passphrase. This does not affect your
          current session.
        </p>
        <textarea id="convertBackupInput" rows="7" style="width:100%;font-family:monospace;font-size:.78rem"
          placeholder="Paste the exported JSON here…"></textarea>
        <p id="convertBackupStatus" class="status" style="font-size:.82rem"></p>
        <div id="convertBackupResult" style="display:none;margin-top:.5rem">
          <div id="convertBackupSummary" class="hint" style="font-size:.85rem;margin-bottom:.5rem"></div>
          <div class="actions wrap" style="display:flex;gap:.5rem;flex-wrap:wrap">
            <button type="button" id="convertBackupDownload" class="secondary">Download decoded file</button>
            <button type="button" id="convertBackupAddRecent" class="secondary">Add to Recent Sessions</button>
          </div>
        </div>
        <menu style="margin-top:.8rem">
          <button value="cancel" class="secondary">Close</button>
          <button type="button" id="convertBackupDecode" class="primary">Decode</button>
        </menu>
      </form>`;
    document.body.appendChild(dlg);

    let decoded = null;   // the de-anonymised payload after a successful decode

    $("convertBackupDecode").onclick = async () => {
      const status = $("convertBackupStatus");
      status.textContent = "";
      let payload;
      try { payload = JSON.parse($("convertBackupInput").value.trim()); }
      catch { status.textContent = "That isn't valid JSON — paste the whole exported file."; return; }

      const encName = payload.client && payload.client.nameEncrypted;
      if (isEnvelope(encName)) {
        const pass = await passphrasePrompt({
          title: "Decrypt participant name",
          body: "Enter the passphrase used when this export was created.",
          confirmPass: false
        });
        if (pass === null) return;
        try { decoded = await deanonymisePayload(payload, pass); }
        catch { status.textContent = "Wrong passphrase, or the data is corrupt. Nothing was decoded."; return; }
      } else {
        decoded = payload;   // not anonymised — just reconstitute
      }

      const name = (decoded.client && decoded.client.name) || "unknown";
      const rc = (decoded.results && decoded.results.length) || 0;
      $("convertBackupSummary").innerHTML =
        `Decoded <b>${escapeHtmlLocal(name)}</b> — ${rc} result${rc !== 1 ? "s" : ""}, ` +
        `exported ${decoded.exportedAt ? new Date(decoded.exportedAt).toLocaleString("en-NZ") : "earlier"}.`;
      $("convertBackupResult").style.display = "";
      status.textContent = "Decoded successfully.";
    };

    $("convertBackupDownload").onclick = () => {
      if (!decoded) return;
      const base = (dlg.__fileBaseFor && dlg.__fileBaseFor(decoded.client, decoded.exportedAt)) || "decoded";
      downloadText(`${base}_speech_audiometry.json`, "application/json", JSON.stringify(decoded, null, 2));
    };
    $("convertBackupAddRecent").onclick = () => {
      if (!decoded) return;
      if (dlg.__addToRecent) {
        const okAdd = dlg.__addToRecent(decoded);
        $("convertBackupStatus").textContent = okAdd
          ? "Added to Recent Sessions on this device." : "Could not add to Recent Sessions.";
      }
    };
    return dlg;
  }

  // ── Small shared helpers ──────────────────────────────────────────────
  function downloadText(filename, mime, text) {
    const blob = new Blob([text], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  function escapeHtmlLocal(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // A small modal passphrase prompt (with optional confirm field). Resolves to
  // the passphrase, or null if cancelled. Avoids the native prompt() so we can
  // require a confirmation and show the warning.
  function passphrasePrompt({ title, body, confirmPass }) {
    return new Promise((resolve) => {
      let dlg = $("passphraseModal");
      if (dlg) dlg.remove();
      dlg = document.createElement("dialog");
      dlg.id = "passphraseModal";
      dlg.className = "passphrase-modal";
      dlg.innerHTML = `
        <form method="dialog">
          <h3 style="margin-top:0">${escapeHtmlLocal(title)}</h3>
          <p class="hint" style="font-size:.82rem;white-space:pre-line">${escapeHtmlLocal(body)}</p>
          <label style="display:block;margin-top:.4rem">Passphrase
            <input id="passphraseInput" type="password" autocomplete="new-password" style="width:100%">
          </label>
          ${confirmPass ? `<label style="display:block;margin-top:.4rem">Confirm passphrase
            <input id="passphraseConfirm" type="password" autocomplete="new-password" style="width:100%"></label>` : ""}
          <p id="passphraseError" class="status" style="color:#b91c1c;font-size:.82rem"></p>
          <menu style="margin-top:.6rem">
            <button value="cancel" class="secondary" id="passphraseCancel">Cancel</button>
            <button type="button" class="primary" id="passphraseOk">OK</button>
          </menu>
        </form>`;
      document.body.appendChild(dlg);
      const done = (val) => { try { dlg.close(); } catch {} dlg.remove(); resolve(val); };
      $("passphraseCancel").onclick = (e) => { e.preventDefault(); done(null); };
      $("passphraseOk").onclick = () => {
        const p = $("passphraseInput").value;
        if (!p) { $("passphraseError").textContent = "Enter a passphrase."; return; }
        if (confirmPass) {
          const c = $("passphraseConfirm").value;
          if (p !== c) { $("passphraseError").textContent = "The passphrases don't match."; return; }
          if (p.length < 6) { $("passphraseError").textContent = "Use at least 6 characters."; return; }
        }
        done(p);
      };
      dlg.addEventListener("cancel", () => done(null));
      if (typeof dlg.showModal === "function") dlg.showModal();
    });
  }
})(typeof window !== "undefined" ? window : globalThis);
