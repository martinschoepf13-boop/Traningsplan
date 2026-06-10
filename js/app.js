
/* =====================================================================
   app.js – UI, Routing, Workout-Tracker, Pausen-Timer, Diagramme.
   Reines Vanilla JS. Bindet data.js / storage.js / chart.js / progression.js.
   ===================================================================== */

(() => {
  "use strict";

  let state = loadState();
  let currentRoute = "plan";
  let workoutDayId = "A";       // aktuell gewählter Trainingstag im Tracker
  let draft = null;             // Arbeitskopie der laufenden Einheit
  let progressExId = "bb_bench";// gewählte Übung in der Fortschrittsansicht

  const view = document.getElementById("view");
  const headerWeek = document.getElementById("header-week");

  /* ---------------- Hilfen ---------------- */
  const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function isoWeekKey(d = new Date()) {
    // ISO-Wochenschlüssel "JJJJ-Www" zur Erkennung erledigter Einheiten pro Kalenderwoche
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const wk = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(wk).padStart(2, "0")}`;
  }

  function persist() { saveState(state); }

  function refreshHeader() {
    const s = getWeekScheme(state.settings.currentWeek);
    headerWeek.textContent = `Woche ${state.settings.currentWeek} · ${s.phase}`;
  }

  /* ---------------- Routing ---------------- */
  function setRoute(route) {
    currentRoute = route;
    document.querySelectorAll(".tab").forEach(t =>
      t.classList.toggle("active", t.dataset.route === route));
    render();
    window.scrollTo(0, 0);
  }

  function render() {
    refreshHeader();
    if (currentRoute === "plan") renderPlan();
    else if (currentRoute === "workout") renderWorkout();
    else if (currentRoute === "progress") renderProgress();
    else if (currentRoute === "library") renderLibrary();
    else if (currentRoute === "data") renderData();
  }

  /* ---------------- 1) Plan-Ansicht ---------------- */
  function renderPlan() {
    const s = getWeekScheme(state.settings.currentWeek);
    let html = `
      <div class="note">
        <b>Trainingswoche ${state.settings.currentWeek} – ${s.phase}.</b><br>
        Ziel-RIR: ${s.rir} (Wiederholungen im Tank). ${esc(s.note)}
      </div>
      ${weekOverviewHTML()}
      <div class="card">
        <h3>Aufwärmen (jede Einheit, ca. 6–8 Min.)</h3>
        <ul class="tight warmup">${WARMUP.map(w => `<li>${esc(w)}</li>`).join("")}</ul>
      </div>
    `;

    PLAN.forEach(day => {
      html += `<h2>${esc(day.title)}</h2>
        <p class="muted">${esc(day.focus)}</p>`;
      day.exercises.forEach(item => {
        const ex = EXERCISES[item.ex];
        const sets = appliedSets(item.baseSets, state.settings.currentWeek);
        const unit = ex.unit === "sec" ? "Sek." : "Wdh.";
        const repTxt = ex.rep[0] === ex.rep[1] ? `${ex.rep[0]}` : `${ex.rep[0]}–${ex.rep[1]}`;
        html += `
          <div class="card">
            <div class="card-head">
              <h3>${esc(ex.name)}</h3>
              <span class="pill">${ex.type === "compound" ? "Mehrgelenk" : "Isolation"}</span>
            </div>
            <p class="target">
              <b>${sets} Sätze</b> × ${repTxt} ${unit} ·
              RIR ${s.rir} · Pause ${formatRest(ex.rest)}
            </p>
            <div>${ex.muscles.map(m => `<span class="pill muscle">${esc(m)}</span>`).join("")}</div>
          </div>`;
      });
    });

    view.innerHTML = html;
  }

  function formatRest(sec) {
    return sec >= 60 ? `${Math.round(sec / 15) * 15} s (${(sec / 60).toFixed(1)} Min.)` : `${sec} s`;
  }

  function weekOverviewHTML() {
    const key = isoWeekKey();
    const doneDays = new Set(
      state.sessions.filter(se => se.weekKey === key).map(se => se.day)
    );
    const cells = PLAN.map(d => `
      <div class="day ${doneDays.has(d.id) ? "done" : ""}">
        <b>${d.id}</b>${doneDays.has(d.id) ? "✓ erledigt" : "offen"}
      </div>`).join("");
    return `<div class="card">
      <h3>Diese Woche (${doneDays.size}/3 erledigt)</h3>
      <div class="weekgrid">${cells}</div>
    </div>`;
  }

  /* ---------------- 2) Workout-Tracker ---------------- */
  function startDraft(dayId) {
    workoutDayId = dayId;
    const day = PLAN.find(d => d.id === dayId);
    draft = {
      day: dayId,
      date: new Date().toISOString(),
      weekNo: state.settings.currentWeek,
      weekKey: isoWeekKey(),
      entries: day.exercises.map(item => {
        const ex = EXERCISES[item.ex];
        const sets = appliedSets(item.baseSets, state.settings.currentWeek);
        const sug = suggestNext(state, item.ex);
        return {
          exId: item.ex,
          sets: Array.from({ length: sets }, () => ({
            weight: sug.weight !== "" ? sug.weight : "",
            reps: "",
            done: false
          }))
        };
      })
    };
  }

  function renderWorkout() {
    if (!draft || draft.day !== workoutDayId) startDraft(workoutDayId);

    const wScheme = getWeekScheme(state.settings.currentWeek);
    let html = `
      <div class="daypick">
        ${PLAN.map(d => `<button class="btn ${d.id === workoutDayId ? "active" : ""}"
            data-day="${d.id}">Tag ${d.id}</button>`).join("")}
      </div>
      <div class="note">Woche ${state.settings.currentWeek} · ${wScheme.phase} · Ziel-RIR ${wScheme.rir}.
        Hake jeden erledigten Satz ab – der Pausen-Timer startet
        ${state.settings.autoStartTimer ? "automatisch" : "auf Knopfdruck"}.</div>
      <div class="card">
        <h3>Aufwärmen zuerst</h3>
        <ul class="tight warmup">${WARMUP.map(w => `<li>${esc(w)}</li>`).join("")}</ul>
      </div>
    `;

    draft.entries.forEach((entry, ei) => {
      const ex = EXERCISES[entry.exId];
      const unit = ex.unit === "sec" ? "Sek." : "Wdh.";
      const repTxt = ex.rep[0] === ex.rep[1] ? `${ex.rep[0]}` : `${ex.rep[0]}–${ex.rep[1]}`;
      const sug = suggestNext(state, entry.exId);

      let rows = `
        <div class="set-grid">
          <div class="head">#</div>
          <div class="head">kg</div>
          <div class="head">${unit}</div>
          <div class="head">✓</div>
        </div>`;
      entry.sets.forEach((set, si) => {
        rows += `
          <div class="set-grid">
            <div class="set-no">${si + 1}</div>
            <input type="number" inputmode="decimal" step="0.5" min="0"
              data-w="${ei}-${si}" value="${set.weight}" placeholder="–" />
            <input type="number" inputmode="numeric" step="1" min="0"
              data-r="${ei}-${si}" value="${set.reps}" placeholder="–" />
            <button class="chk ${set.done ? "done" : ""}" data-chk="${ei}-${si}"
              data-rest="${ex.rest}">${set.done ? "✓" : ""}</button>
          </div>`;
      });

      html += `
        <div class="card">
          <div class="card-head">
            <h3>${esc(ex.name)}</h3>
            <span class="pill">${ex.type === "compound" ? "Mehrgelenk" : "Isolation"}</span>
          </div>
          <p class="target">Ziel: ${entry.sets.length} × ${repTxt} ${unit} · Pause ${formatRest(ex.rest)}</p>
          <p class="suggest">💡 ${esc(sug.text)}</p>
          ${rows}
        </div>`;
    });

    const done = draft.entries.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
    const total = draft.entries.reduce((a, e) => a + e.sets.length, 0);
    html += `<button id="finish" class="btn primary wide">Einheit speichern (${done}/${total} Sätze)</button>`;

    view.innerHTML = html;
  }

  /* ---------------- 3) Fortschritt ---------------- */
  function renderProgress() {
    const exIds = Object.keys(EXERCISES);
    let html = `
      <label for="prog-ex">Übung auswählen</label>
      <select id="prog-ex">
        ${exIds.map(id => `<option value="${id}" ${id === progressExId ? "selected" : ""}>${esc(EXERCISES[id].name)}</option>`).join("")}
      </select>
      <div class="card" style="margin-top:12px;">
        <h3>Bestes Arbeitsgewicht pro Einheit</h3>
        <canvas id="chart-weight"></canvas>
      </div>
      <div class="card">
        <h3>Geschätztes 1RM (Epley) pro Einheit</h3>
        <canvas id="chart-1rm"></canvas>
      </div>
      <div class="card">
        <h3>Verlauf (letzte Einheiten)</h3>
        <div id="prog-table"></div>
      </div>`;
    view.innerHTML = html;

    drawProgress();
  }

  function progressData(exId) {
    const ex = EXERCISES[exId];
    const rows = [];
    state.sessions.forEach(se => {
      const entry = se.entries.find(e => e.exId === exId);
      if (!entry) return;
      const done = entry.sets.filter(s => s.done && (s.reps > 0 || s.weight > 0));
      if (done.length === 0) return;
      const topWeight = Math.max(...done.map(s => +s.weight || 0));
      const best = done.reduce((a, s) => {
        const e1rm = (+s.weight || 0) * (1 + (+s.reps || 0) / 30); // Epley
        return e1rm > a.e1rm ? { e1rm, w: +s.weight || 0, r: +s.reps || 0 } : a;
      }, { e1rm: 0, w: 0, r: 0 });
      rows.push({
        date: se.date.slice(0, 10),
        label: se.date.slice(5, 10),
        topWeight,
        e1rm: best.e1rm,
        bestSet: `${best.w} kg × ${best.r}`,
        unit: ex.unit
      });
    });
    return rows;
  }

  function drawProgress() {
    const rows = progressData(progressExId);
    drawLineChart(document.getElementById("chart-weight"),
      rows.map(r => ({ x: r.label, y: r.topWeight })), { color: "#58A6E6", decimals: 1 });
    drawLineChart(document.getElementById("chart-1rm"),
      rows.map(r => ({ x: r.label, y: r.e1rm })), { color: "#87BFED", decimals: 0 });

    const tbl = document.getElementById("prog-table");
    if (rows.length === 0) { tbl.innerHTML = `<p class="muted">Noch keine Daten für diese Übung.</p>`; return; }
    const last = rows.slice(-12).reverse();
    tbl.innerHTML = `
      <table>
        <thead><tr><th>Datum</th><th>Top-Gewicht</th><th>Bester Satz</th><th>e1RM</th></tr></thead>
        <tbody>${last.map(r => `
          <tr><td>${esc(r.date)}</td><td>${r.topWeight} kg</td>
          <td>${esc(r.bestSet)}</td><td>${r.e1rm.toFixed(0)}</td></tr>`).join("")}</tbody>
      </table>`;
  }

  /* ---------------- 4) Übungsbibliothek ---------------- */
  function renderLibrary() {
    let html = `<div class="note">Kurz & korrekt: Ausführung und trainierte Muskulatur. Exzentrik (Absenken) jeweils betont und kontrolliert.</div>`;
    Object.keys(EXERCISES).forEach(id => {
      const ex = EXERCISES[id];
      const repTxt = ex.rep[0] === ex.rep[1] ? `${ex.rep[0]}` : `${ex.rep[0]}–${ex.rep[1]}`;
      const unit = ex.unit === "sec" ? "Sek." : "Wdh.";
      html += `
        <div class="card">
          <div class="card-head">
            <h3>${esc(ex.name)}</h3>
            <span class="pill">${ex.type === "compound" ? "Mehrgelenk" : "Isolation"}</span>
          </div>
          <div>${ex.muscles.map(m => `<span class="pill muscle">${esc(m)}</span>`).join("")}</div>
          <p>${esc(ex.desc)}</p>
          <p class="muted">Zielbereich: ${repTxt} ${unit} · Pause ${formatRest(ex.rest)}</p>
        </div>`;
    });
    view.innerHTML = html;
  }

  /* ---------------- 5) Daten / Profil / Einstellungen ---------------- */
  function renderData() {
    const p = state.profile, s = state.settings;
    view.innerHTML = `
      <h2>Trainingswoche</h2>
      <div class="card">
        <label for="set-week">Aktuelle Woche im 8-Wochen-Zyklus</label>
        <select id="set-week">
          ${WEEK_SCHEME.map(w => `<option value="${w.week}" ${w.week === s.currentWeek ? "selected" : ""}>Woche ${w.week} – ${w.phase}</option>`).join("")}
        </select>
        <div class="btn-row" style="margin-top:10px;">
          <button class="btn" id="week-minus">◀ Woche zurück</button>
          <button class="btn" id="week-plus">Woche weiter ▶</button>
        </div>
      </div>

      <h2>Einstellungen</h2>
      <div class="card">
        <label><input type="checkbox" id="set-sound" ${s.soundOn ? "checked" : ""} style="width:auto;margin-right:8px;">Signalton am Timer-Ende</label>
        <label><input type="checkbox" id="set-auto" ${s.autoStartTimer ? "checked" : ""} style="width:auto;margin-right:8px;">Timer beim Abhaken automatisch starten</label>
      </div>

      <h2>Profil</h2>
      <div class="card">
        <label>Alter</label><input type="number" id="p-age" value="${p.age}">
        <label>Geschlecht</label><input type="text" id="p-sex" value="${esc(p.sex)}">
        <label>Fokus</label><input type="text" id="p-focus" value="${esc(p.focus)}">
        <label>Einheiten pro Woche</label><input type="number" id="p-days" value="${p.daysPerWeek}">
        <label>Minuten pro Einheit</label><input type="number" id="p-min" value="${p.sessionMinutes}">
        <label>Trainingsort</label><input type="text" id="p-loc" value="${esc(p.location)}">
        <label>Erfahrung</label><input type="text" id="p-exp" value="${esc(p.experience)}">
        <button class="btn primary wide" id="p-save">Profil speichern</button>
      </div>

      <h2>Datensicherung (lokal, ohne Cloud)</h2>
      <div class="card">
        <p class="muted">${state.sessions.length} gespeicherte Einheiten.</p>
        <div class="btn-row">
          <button class="btn ok" id="export">⬇︎ Export (JSON)</button>
          <button class="btn" id="import-btn">⬆︎ Import (JSON)</button>
          <input type="file" id="import-file" accept="application/json" class="hidden">
        </div>
        <button class="btn ghost wide" id="reset" style="margin-top:14px;color:#e88;">Alle Daten zurücksetzen</button>
      </div>
    `;
  }

  /* ---------------- Pausen-Timer ---------------- */
  const overlay = document.getElementById("timer-overlay");
  const tDisplay = document.getElementById("timer-display");
  let tRemaining = 0, tInterval = null, audioCtx = null;

  function fmtTime(sec) {
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  function startTimer(seconds) {
    tRemaining = seconds;
    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
    tDisplay.classList.remove("flash");
    tDisplay.textContent = fmtTime(tRemaining);
    clearInterval(tInterval);
    tInterval = setInterval(() => {
      tRemaining--;
      tDisplay.textContent = fmtTime(Math.max(0, tRemaining));
      if (tRemaining <= 0) finishTimer();
    }, 1000);
  }
  function finishTimer() {
    clearInterval(tInterval);
    tInterval = null;
    tDisplay.classList.add("flash");
    if (state.settings.soundOn) beep();
    if (navigator.vibrate) navigator.vibrate([200, 120, 200]);
  }
  function stopTimer() {
    clearInterval(tInterval); tInterval = null;
    overlay.classList.add("hidden");
    overlay.setAttribute("aria-hidden", "true");
  }
  function beep() {
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.18, 0.36].forEach(offset => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = 880;
        osc.connect(gain); gain.connect(audioCtx.destination);
        const t = audioCtx.currentTime + offset;
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.start(t); osc.stop(t + 0.16);
      });
    } catch (e) { /* Audio nicht verfügbar – nicht kritisch */ }
  }

  /* ---------------- Globale Event-Delegation ---------------- */
  document.querySelector(".tabbar").addEventListener("click", e => {
    const tab = e.target.closest(".tab");
    if (tab) setRoute(tab.dataset.route);
  });

  overlay.addEventListener("click", e => {
    const adj = e.target.dataset.timer;
    if (adj) { tRemaining = Math.max(1, tRemaining + parseInt(adj, 10)); tDisplay.textContent = fmtTime(tRemaining); }
  });
  document.getElementById("timer-stop").addEventListener("click", stopTimer);

  // Klicks innerhalb der View
  view.addEventListener("click", e => {
    const t = e.target;

    // Tag wechseln (Workout)
    if (t.dataset.day) {
      if (draft && draft.entries.some(en => en.sets.some(s => s.done)) && draft.day !== t.dataset.day) {
        if (!confirm("Tag wechseln? Nicht gespeicherte Eingaben gehen verloren.")) return;
      }
      startDraft(t.dataset.day);
      renderWorkout();
      return;
    }

    // Satz abhaken
    if (t.dataset.chk) {
      const [ei, si] = t.dataset.chk.split("-").map(Number);
      const set = draft.entries[ei].sets[si];
      set.done = !set.done;
      t.classList.toggle("done", set.done);
      t.textContent = set.done ? "✓" : "";
      if (set.done && state.settings.autoStartTimer) {
        startTimer(parseInt(t.dataset.rest, 10) || 90);
      }
      return;
    }

    // Einheit speichern
    if (t.id === "finish") { finishWorkout(); return; }

    // ----- Daten-Tab Aktionen -----
    if (t.id === "week-plus") { state.settings.currentWeek = (state.settings.currentWeek % 8) + 1; persist(); renderData(); refreshHeader(); }
    if (t.id === "week-minus") { state.settings.currentWeek = state.settings.currentWeek <= 1 ? 8 : state.settings.currentWeek - 1; persist(); renderData(); refreshHeader(); }
    if (t.id === "p-save") { saveProfile(); }
    if (t.id === "export") { exportState(state); }
    if (t.id === "import-btn") { document.getElementById("import-file").click(); }
    if (t.id === "reset") {
      if (confirm("Wirklich ALLE lokalen Daten löschen? Vorher ggf. exportieren.")) {
        state = defaultState(); persist(); draft = null; setRoute("data");
      }
    }
  });

  // Eingaben in Workout-Inputs in den Draft schreiben
  view.addEventListener("input", e => {
    const t = e.target;
    if (t.dataset.w) { const [ei, si] = t.dataset.w.split("-").map(Number); draft.entries[ei].sets[si].weight = t.value === "" ? "" : Number(t.value); }
    if (t.dataset.r) { const [ei, si] = t.dataset.r.split("-").map(Number); draft.entries[ei].sets[si].reps = t.value === "" ? "" : Number(t.value); }
  });

  // Change-Events (Selects/Checkboxen im Daten-Tab, Übungsauswahl im Fortschritt)
  view.addEventListener("change", e => {
    const t = e.target;
    if (t.id === "prog-ex") { progressExId = t.value; drawProgress(); }
    if (t.id === "set-week") { state.settings.currentWeek = Number(t.value); persist(); refreshHeader(); }
    if (t.id === "set-sound") { state.settings.soundOn = t.checked; persist(); }
    if (t.id === "set-auto") { state.settings.autoStartTimer = t.checked; persist(); }
    if (t.id === "import-file" && t.files && t.files[0]) {
      importStateFromFile(t.files[0])
        .then(imported => { state = imported; persist(); alert("Import erfolgreich."); setRoute("data"); })
        .catch(() => alert("Import fehlgeschlagen: keine gültige Sicherungsdatei."));
    }
  });

  function saveProfile() {
    const g = id => document.getElementById(id).value;
    state.profile = {
      age: Number(g("p-age")) || state.profile.age,
      sex: g("p-sex"),
      focus: g("p-focus"),
      daysPerWeek: Number(g("p-days")) || state.profile.daysPerWeek,
      sessionMinutes: Number(g("p-min")) || state.profile.sessionMinutes,
      location: g("p-loc"),
      experience: g("p-exp"),
      startDate: state.profile.startDate
    };
    persist();
    alert("Profil gespeichert.");
  }

  function finishWorkout() {
    const hasData = draft.entries.some(e => e.sets.some(s => s.done));
    if (!hasData) { alert("Noch keine Sätze abgehakt."); return; }
    // nur abgehakte Sätze in saubere Zahlen umwandeln
    const clean = {
      id: Date.now(),
      day: draft.day,
      date: new Date().toISOString(),
      weekNo: draft.weekNo,
      weekKey: isoWeekKey(),
      entries: draft.entries.map(en => ({
        exId: en.exId,
        sets: en.sets.map(s => ({
          weight: s.weight === "" ? 0 : Number(s.weight),
          reps: s.reps === "" ? 0 : Number(s.reps),
          done: !!s.done
        }))
      }))
    };
    state.sessions.push(clean);
    persist();
    draft = null;
    stopTimer();
    alert("Einheit gespeichert! Vorschläge für nächstes Mal sind aktualisiert.");
    setRoute("plan");
  }

  /* ---------------- Service-Worker-Registrierung (PWA/Offline) ---------------- */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(err =>
        console.warn("Service Worker Registrierung fehlgeschlagen:", err));
    });
  }

  /* ---------------- Start ---------------- */
  setRoute("plan");
})();