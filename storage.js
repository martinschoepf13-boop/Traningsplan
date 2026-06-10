/* =====================================================================
   storage.js – Lokale Persistenz (localStorage), Export/Import als JSON
   Es verlässt KEINE Daten das Gerät. Kein Server, keine Cloud.
   ===================================================================== */

const STORAGE_KEY = "ubtrainer.v1";

/* Frischer Standardzustand */
function defaultState() {
  return {
    version: 1,
    profile: { ...DEFAULT_PROFILE },
    settings: {
      currentWeek: 1,       // aktuelle Trainingswoche (1–8, danach Zyklus)
      soundOn: true,        // Timer-Signalton
      autoStartTimer: true  // Timer startet automatisch beim Abhaken
    },
    sessions: []            // protokollierte Einheiten
  };
}

/* Laden mit defensivem Merge, damit neue Felder nicht fehlen */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    return {
      ...base,
      ...parsed,
      profile: { ...base.profile, ...(parsed.profile || {}) },
      settings: { ...base.settings, ...(parsed.settings || {}) },
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : []
    };
  } catch (e) {
    console.warn("State konnte nicht geladen werden, nutze Standard.", e);
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* JSON-Export als lokaler Download */
function exportState(state) {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `ubtrainer-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* JSON-Import (Datei -> State). Gibt Promise<state> zurück. */
function importStateFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== "object") throw new Error("Ungültige Datei");
        const base = defaultState();
        const merged = {
          ...base,
          ...parsed,
          profile: { ...base.profile, ...(parsed.profile || {}) },
          settings: { ...base.settings, ...(parsed.settings || {}) },
          sessions: Array.isArray(parsed.sessions) ? parsed.sessions : []
        };
        resolve(merged);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}