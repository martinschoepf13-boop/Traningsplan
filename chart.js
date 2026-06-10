/* =====================================================================
   chart.js – Abhängigkeitsfreies Liniendiagramm auf <canvas>.
   Bewusst OHNE Chart.js/CDN, damit der Offline-Betrieb garantiert ist.
   ===================================================================== */

function drawLineChart(canvas, points, opts = {}) {
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || 320;
  const cssH = canvas.clientHeight || 220;
  canvas.width = cssW * dpr;
  canvas.height = cssH * dpr;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssW, cssH);

  const padL = 38, padR = 14, padT = 16, padB = 28;
  const plotW = cssW - padL - padR;
  const plotH = cssH - padT - padB;

  if (!points || points.length === 0) {
    ctx.fillStyle = "#9fb0c2";
    ctx.font = "13px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Noch keine Daten vorhanden.", cssW / 2, cssH / 2);
    return;
  }

  const ys = points.map(p => p.y);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  if (minY === maxY) { minY -= 1; maxY += 1; } // flache Linie sichtbar machen
  const rangeY = maxY - minY;

  const xAt = i => padL + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const yAt = v => padT + plotH - ((v - minY) / rangeY) * plotH;

  // Gitter + Y-Achsenbeschriftung (4 Linien)
  ctx.strokeStyle = "#2a3645";
  ctx.fillStyle = "#9fb0c2";
  ctx.font = "10px 'Segoe UI', sans-serif";
  ctx.textAlign = "right";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const val = minY + (rangeY * i) / 4;
    const y = yAt(val);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(cssW - padR, y);
    ctx.stroke();
    ctx.fillText(val.toFixed(opts.decimals ?? 0), padL - 6, y + 3);
  }

  // Linie
  ctx.strokeStyle = opts.color || "#58A6E6";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = xAt(i), y = yAt(p.y);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Punkte
  ctx.fillStyle = opts.color || "#58A6E6";
  points.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(xAt(i), yAt(p.y), 3.2, 0, Math.PI * 2);
    ctx.fill();
  });

  // X-Beschriftung (max. 5 Labels, um Überlappung zu vermeiden)
  ctx.fillStyle = "#9fb0c2";
  ctx.textAlign = "center";
  const step = Math.max(1, Math.ceil(points.length / 5));
  points.forEach((p, i) => {
    if (i % step === 0 || i === points.length - 1) {
      ctx.fillText(p.x, xAt(i), cssH - 9);
    }
  });
}