/* =====================================================================
   data.js – Statische Trainingsdaten (alles lokal, keine externen Quellen)
   - Übungsbibliothek
   - 3er Upper-Body-Split (Tag A/B/C, rotierende Schwerpunkte)
   - 8-Wochen-Periodisierung inkl. Deload
   - Aufwärmroutine & Standard-Profil
   ===================================================================== */

/* ---------- Standard-Nutzerprofil (anpassbar in der App) ---------- */
const DEFAULT_PROFILE = {
  age: 23,
  sex: "männlich",
  focus: "Oberkörper (Hypertrophie & Kraft)",
  daysPerWeek: 3,
  sessionMinutes: 60,
  location: "Fitnessstudio (volle Ausstattung)",
  experience: "Wiedereinstieg nach 3 Jahren Pause",
  startDate: new Date().toISOString().slice(0, 10) // heutiges Datum
};

/* ---------- Übungsbibliothek ----------
   unit: "reps" (Wiederholungen) oder "sec" (Zeit, z. B. Plank)
   rep:  [min, max] = Zielwiederholungsbereich
   inc:  empfohlene Laststeigerung in kg bei erreichtem Zielbereich
   rest: Pausenzeit in Sekunden
   type: "compound" (Mehrgelenk) | "isolation" (Isolation)            */
const EXERCISES = {
  bb_bench: {
    name: "Bankdrücken (Langhantel)", type: "compound", unit: "reps",
    muscles: ["Brust", "vordere Schulter", "Trizeps"], rep: [6, 8], inc: 2.5, rest: 165,
    desc: "Flach auf der Bank, Schulterblätter zusammen und nach unten. Stange kontrolliert zur unteren Brust senken (Ellbogen ~45–60°), dann kraftvoll nach oben drücken. Exzentrik betont, kein Abfälschen."
  },
  bb_row: {
    name: "Langhantelrudern vorgebeugt", type: "compound", unit: "reps",
    muscles: ["mittlerer Rücken", "Latissimus", "hintere Schulter"], rep: [8, 10], inc: 2.5, rest: 135,
    desc: "Hüfte beugen (~45° Oberkörper), Rücken neutral. Stange zum unteren Brustkorb/Bauch ziehen, Schulterblätter zusammenführen, kontrolliert ablassen."
  },
  db_incline: {
    name: "Schrägbankdrücken (Kurzhanteln)", type: "compound", unit: "reps",
    muscles: ["obere Brust", "vordere Schulter"], rep: [8, 10], inc: 2, rest: 120,
    desc: "Bank ~30°. Kurzhanteln auf Höhe der oberen Brust, kontrolliert nach oben drücken ohne Hanteln zusammenzuschlagen, exzentrisch langsam senken."
  },
  lat_pulldown_wide: {
    name: "Latzug breit", type: "compound", unit: "reps",
    muscles: ["Latissimus", "mittlerer Rücken"], rep: [10, 12], inc: 2.5, rest: 105,
    desc: "Breiter Griff, Brust raus. Stange zur oberen Brust ziehen, Ellbogen nach unten/hinten, Lat aktiv anspannen, kontrolliert zurückführen."
  },
  db_lateral: {
    name: "Seitheben (Kurzhanteln)", type: "isolation", unit: "reps",
    muscles: ["seitliche Schulter"], rep: [12, 15], inc: 1, rest: 75,
    desc: "Leicht vorgebeugt, minimal angewinkelte Arme seitlich bis Schulterhöhe heben, kleinen Finger leicht führen, betont langsam absenken. Kein Schwung."
  },
  ez_curl: {
    name: "SZ-Curl (Bizeps)", type: "isolation", unit: "reps",
    muscles: ["Bizeps"], rep: [10, 12], inc: 1.25, rest: 75,
    desc: "Ellbogen am Körper fixiert, SZ-Stange ohne Schwung beugen, oben kurz anspannen, exzentrisch langsam senken."
  },
  tri_pushdown: {
    name: "Trizeps-Pushdown (Kabel)", type: "isolation", unit: "reps",
    muscles: ["Trizeps"], rep: [10, 12], inc: 1.25, rest: 75,
    desc: "Oberarme fixiert, Seil/Stange nach unten strecken, unten kurz halten, kontrolliert zurück."
  },
  plank: {
    name: "Unterarmstütz (Plank)", type: "isolation", unit: "sec",
    muscles: ["Core"], rep: [30, 60], inc: 0, rest: 60,
    desc: "Unterarme unter den Schultern, Körper bildet eine Linie, Bauch und Gesäß anspannen, nicht durchhängen."
  },

  pullup: {
    name: "Klimmzüge (bei Bedarf Latzug)", type: "compound", unit: "reps",
    muscles: ["Latissimus", "Bizeps", "mittlerer Rücken"], rep: [6, 10], inc: 2.5, rest: 150,
    desc: "Schulterbreiter bis breiter Obergriff. Aus voller Streckung hochziehen bis Kinn über die Stange, kontrolliert absenken. Falls noch zu schwer: assistiert oder Latzug."
  },
  db_shoulder_press: {
    name: "Schulterdrücken (Kurzhanteln)", type: "compound", unit: "reps",
    muscles: ["vordere Schulter", "seitliche Schulter", "Trizeps"], rep: [6, 10], inc: 2, rest: 120,
    desc: "Aufrecht sitzend, Kurzhanteln auf Ohrhöhe, gerade nach oben drücken ohne ins Hohlkreuz zu fallen, kontrolliert senken."
  },
  chest_press_machine: {
    name: "Brustpresse (Maschine)", type: "compound", unit: "reps",
    muscles: ["Brust", "vordere Schulter", "Trizeps"], rep: [8, 12], inc: 2.5, rest: 105,
    desc: "Griffe auf Brusthöhe einstellen, kontrolliert nach vorn drücken, Brust anspannen, langsame Exzentrik."
  },
  cable_row_narrow: {
    name: "Kabelrudern (enger Griff)", type: "compound", unit: "reps",
    muscles: ["mittlerer Rücken", "Latissimus"], rep: [10, 12], inc: 2.5, rest: 105,
    desc: "Aufrecht, Brust raus, Griff zum Bauch ziehen, Schulterblätter zusammenführen, kontrolliert zurück, kein Zurücklehnen mit Schwung."
  },
  reverse_fly: {
    name: "Reverse Flys", type: "isolation", unit: "reps",
    muscles: ["hintere Schulter", "oberer Rücken"], rep: [12, 15], inc: 1, rest: 75,
    desc: "Vorgebeugt oder an der Maschine, Arme leicht gebeugt seitlich öffnen, hintere Schulter anspannen, langsam zurück."
  },
  hammer_curl: {
    name: "Hammer-Curls", type: "isolation", unit: "reps",
    muscles: ["Bizeps", "Unterarm"], rep: [10, 12], inc: 1.25, rest: 75,
    desc: "Neutraler Griff (Handflächen zueinander), ohne Schwung beugen, oben anspannen, kontrolliert senken."
  },
  overhead_tri: {
    name: "Trizepsstrecken über Kopf (Kabel)", type: "isolation", unit: "reps",
    muscles: ["Trizeps"], rep: [10, 12], inc: 1.25, rest: 75,
    desc: "Seil über Kopf, Oberarme fixiert, Arme nach oben strecken, langsame Dehnung in der Exzentrik."
  },
  wrist_curl: {
    name: "Handgelenk-Curls", type: "isolation", unit: "reps",
    muscles: ["Unterarm"], rep: [12, 15], inc: 1, rest: 60,
    desc: "Unterarme aufgelegt, nur die Handgelenke beugen und strecken, voller Bewegungsumfang, kontrolliert."
  },
  hanging_knee_raise: {
    name: "Hängendes Knieheben", type: "isolation", unit: "reps",
    muscles: ["Core"], rep: [10, 15], inc: 0, rest: 60,
    desc: "An der Stange hängend Knie kontrolliert zur Brust ziehen, Becken leicht einrollen, ohne Schwung absenken."
  },

  bb_incline: {
    name: "Schrägbankdrücken (Langhantel)", type: "compound", unit: "reps",
    muscles: ["obere Brust", "vordere Schulter", "Trizeps"], rep: [8, 10], inc: 2.5, rest: 135,
    desc: "Bank ~30°, Stange zur oberen Brust senken, kontrolliert drücken, Schulterblätter fixiert."
  },
  machine_row: {
    name: "Maschinen-/T-Bar-Rudern", type: "compound", unit: "reps",
    muscles: ["mittlerer Rücken", "Latissimus"], rep: [8, 10], inc: 2.5, rest: 120,
    desc: "Brust am Pad, Griffe kräftig zum Körper ziehen, Schulterblätter zusammen, langsame Exzentrik."
  },
  arnold_press: {
    name: "Arnold Press", type: "compound", unit: "reps",
    muscles: ["vordere Schulter", "seitliche Schulter"], rep: [10, 12], inc: 1.5, rest: 105,
    desc: "Start mit Handflächen zum Körper, beim Drücken rotieren bis Handflächen nach vorn, kontrolliert wieder zurück."
  },
  lat_pulldown_narrow: {
    name: "Latzug eng/neutral", type: "compound", unit: "reps",
    muscles: ["Latissimus", "Bizeps"], rep: [10, 12], inc: 2.5, rest: 105,
    desc: "Neutraler/enger Griff, zur oberen Brust ziehen, Lat fokussiert anspannen, kontrolliert zurück."
  },
  cable_lateral: {
    name: "Seitheben am Kabel", type: "isolation", unit: "reps",
    muscles: ["seitliche Schulter"], rep: [12, 15], inc: 1, rest: 75,
    desc: "Kabel von unten/hinter dem Körper, Arm seitlich bis Schulterhöhe führen, betont langsam absenken, konstante Spannung."
  },
  face_pull: {
    name: "Face Pulls", type: "isolation", unit: "reps",
    muscles: ["hintere Schulter", "oberer Rücken"], rep: [15, 15], inc: 1, rest: 75,
    desc: "Seil auf Gesichtshöhe, zum Gesicht ziehen, Ellbogen hoch, außenrotieren, kurz halten, langsam zurück."
  },
  cable_curl: {
    name: "Bizeps-Curl am Kabel", type: "isolation", unit: "reps",
    muscles: ["Bizeps"], rep: [10, 12], inc: 1.25, rest: 75,
    desc: "Konstante Kabelspannung, Ellbogen fixiert, ohne Schwung beugen, oben anspannen, langsam senken."
  },
  dips: {
    name: "Dips (Barren)", type: "compound", unit: "reps",
    muscles: ["Brust", "Trizeps", "vordere Schulter"], rep: [8, 12], inc: 2.5, rest: 120,
    desc: "Leichte Vorlage betont die Brust, aufrecht den Trizeps. Kontrolliert bis ~90° Ellbogen senken, hochdrücken. Bei Bedarf assistiert."
  },
  cable_crunch: {
    name: "Kabel-Crunch", type: "isolation", unit: "reps",
    muscles: ["Core"], rep: [12, 15], inc: 2.5, rest: 60,
    desc: "Kniend, Seil im Nacken, Bauch einrollen (Wirbel für Wirbel), kurz anspannen, kontrolliert aufrichten."
  }
};

/* ---------- Aufwärmroutine Oberkörper (ca. 6–8 Min.) ---------- */
const WARMUP = [
  "2–3 Min. lockeres Cardio (Rudergerät, Crosstrainer oder Seilspringen)",
  "Armkreisen vor/zurück – je 10 Wiederholungen",
  "Schulter-Außenrotation mit leichtem Band – 2×15",
  "Band-Pull-Aparts – 2×15",
  "Cat-Cow / Brustwirbelsäulen-Mobilisation – 8 Wiederholungen",
  "1–2 leichte Aufwärmsätze der ersten Hauptübung (ca. 50 % und 70 % des Arbeitsgewichts)"
];

/* ---------- 3er Upper-Body-Split (rotierende Schwerpunkte) ----------
   baseSets = Sätze in der Aufbauphase; die Wochen-Periodisierung
   passt die tatsächliche Satzzahl an (setDelta).                       */
const PLAN = [
  {
    id: "A",
    title: "Tag A – Horizontal (Brust & Rücken)",
    focus: "Schwerpunkt: Druck & Zug in der Horizontalen",
    exercises: [
      { ex: "bb_bench", baseSets: 3 },
      { ex: "bb_row", baseSets: 3 },
      { ex: "db_incline", baseSets: 3 },
      { ex: "lat_pulldown_wide", baseSets: 3 },
      { ex: "db_lateral", baseSets: 3 },
      { ex: "ez_curl", baseSets: 2 },
      { ex: "tri_pushdown", baseSets: 2 },
      { ex: "plank", baseSets: 3 }
    ]
  },
  {
    id: "B",
    title: "Tag B – Vertikal (Überkopf & Klimmzug)",
    focus: "Schwerpunkt: vertikaler Zug & Druck",
    exercises: [
      { ex: "pullup", baseSets: 3 },
      { ex: "db_shoulder_press", baseSets: 3 },
      { ex: "chest_press_machine", baseSets: 3 },
      { ex: "cable_row_narrow", baseSets: 3 },
      { ex: "reverse_fly", baseSets: 3 },
      { ex: "hammer_curl", baseSets: 2 },
      { ex: "overhead_tri", baseSets: 2 },
      { ex: "wrist_curl", baseSets: 2 },
      { ex: "hanging_knee_raise", baseSets: 3 }
    ]
  },
  {
    id: "C",
    title: "Tag C – Mix & Schwachstellen",
    focus: "Schwerpunkt: obere Brust, Rückendichte, Schulter & Arme",
    exercises: [
      { ex: "bb_incline", baseSets: 3 },
      { ex: "machine_row", baseSets: 3 },
      { ex: "arnold_press", baseSets: 3 },
      { ex: "lat_pulldown_narrow", baseSets: 3 },
      { ex: "cable_lateral", baseSets: 3 },
      { ex: "face_pull", baseSets: 3 },
      { ex: "cable_curl", baseSets: 2 },
      { ex: "dips", baseSets: 2 },
      { ex: "cable_crunch", baseSets: 3 }
    ]
  }
];

/* ---------- 8-Wochen-Periodisierung ----------
   setDelta:    Anpassung der Satzzahl ggü. baseSets
   weightFactor: Lastfaktor (nur Deload < 1)                          */
const WEEK_SCHEME = [
  { week: 1, phase: "Einführung",     setDelta: -1, rir: "3 (sehr konservativ)", weightFactor: 1.0, note: "Technik festigen, Gewichte bewusst leicht wählen. Ziel: sauberes Bewegungsgefühl." },
  { week: 2, phase: "Einführung",     setDelta: -1, rir: "3",                     weightFactor: 1.0, note: "Gleiches Volumen, Last leicht steigern wenn Technik sitzt." },
  { week: 3, phase: "Aufbau",         setDelta: 0,  rir: "2–3",                   weightFactor: 1.0, note: "Volumen steigt auf Basisniveau. Progression aktiv nutzen." },
  { week: 4, phase: "Aufbau",         setDelta: 0,  rir: "2–3",                   weightFactor: 1.0, note: "Lasten weiter konsequent steigern." },
  { week: 5, phase: "Intensivierung", setDelta: 1,  rir: "2",                     weightFactor: 1.0, note: "Ein zusätzlicher Satz pro Übung – näher ans Muskelversagen." },
  { week: 6, phase: "Intensivierung", setDelta: 1,  rir: "2",                     weightFactor: 1.0, note: "Hohes Volumen, Erholung & Schlaf priorisieren." },
  { week: 7, phase: "Peak",           setDelta: 1,  rir: "1–2",                   weightFactor: 1.0, note: "Höchste Belastung des Zyklus. Grundübungen konservativ (RIR 2)." },
  { week: 8, phase: "Deload",         setDelta: -1, rir: "3–4",                   weightFactor: 0.9, note: "Erholungswoche: Volumen reduziert, Last ~10 % runter. Bewegung statt Belastung." }
];

/* Hilfsfunktionen für die Periodisierung */
function getWeekScheme(week) {
  const w = ((week - 1) % 8 + 8) % 8; // sicher in 0..7
  return WEEK_SCHEME[w];
}
function appliedSets(baseSets, week) {
  const s = getWeekScheme(week);
  return Math.max(1, baseSets + s.setDelta);
}