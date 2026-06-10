/* =====================================================================
   progression.js – Automatische Progressionsvorschläge (Double Progression)
   Prinzip:
   - Erreicht man in ALLEN Arbeitssätzen das obere Ende des Zielbereichs
     (beim Ziel-RIR), wird die Last erhöht und die Wiederholungen starten
     wieder am unteren Ende ("Double Progression").
   - Andernfalls bleibt die Last, Ziel = mehr Wiederholungen.
   Datengrundlage ist ausschließlich die zuletzt protokollierte Einheit.
   ===================================================================== */

/* Letzte protokollierte Sätze einer Übung finden */
function lastEntryForExercise(state, exId) {
  for (let i = state.sessions.length - 1; i >= 0; i--) {
    const entry = state.sessions[i].entries.find(e => e.exId === exId);
    if (entry && entry.sets.some(s => s.done && (s.reps > 0 || s.weight > 0))) {
      return { session: state.sessions[i], entry };
    }
  }
  return null;
}

/* Vorschlag für die nächste Einheit berechnen */
function suggestNext(state, exId) {
  const ex = EXERCISES[exId];
  const [minR, maxR] = ex.rep;
  const last = lastEntryForExercise(state, exId);

  // Noch keine Historie -> Einstiegshinweis
  if (!last) {
    const u = ex.unit === "sec" ? "Sek." : "Wdh.";
    return {
      text: `Erste Einheit: mit kontrollierbarem Gewicht starten, Ziel ${minR}–${maxR} ${u} bei RIR ${getWeekScheme(state.settings.currentWeek).rir}.`,
      weight: "", reps: minR
    };
  }

  const doneSets = last.entry.sets.filter(s => s.done);
  const weights = doneSets.map(s => Number(s.weight) || 0);
  const topWeight = Math.max(...weights, 0);
  // alle Arbeitssätze haben das obere Repziel (auf der schwersten Last) erreicht?
  const allHitTop = doneSets.length > 0 &&
    doneSets.every(s => (Number(s.reps) || 0) >= maxR);

  const u = ex.unit === "sec" ? "Sek." : "Wdh.";

  if (ex.unit === "sec") {
    // Zeitbasiert (z. B. Plank): Dauer steigern
    if (allHitTop) {
      return { text: `Top! Dauer steigern: Ziel ${maxR + 10} ${u} pro Satz.`, weight: "", reps: maxR + 10 };
    }
    return { text: `Letztes Mal bis ${Math.max(...doneSets.map(s => +s.reps || 0))} ${u}. Ziel: ${maxR} ${u} halten.`, weight: "", reps: maxR };
  }

  if (allHitTop && topWeight > 0) {
    const next = +(topWeight + ex.inc).toFixed(2);
    return {
      text: `Zielbereich erreicht → Gewicht auf ${next} kg erhöhen, neu bei ${minR} ${u} starten.`,
      weight: next, reps: minR
    };
  }

  // Gewicht halten, Wiederholungen ausbauen
  const bestReps = Math.max(...doneSets.map(s => +s.reps || 0), 0);
  const targetReps = Math.min(maxR, bestReps + 1);
  return {
    text: `Gewicht ${topWeight > 0 ? topWeight + " kg" : "wie zuletzt"} halten, auf ${targetReps}–${maxR} ${u} steigern.`,
    weight: topWeight || "", reps: targetReps
  };
}