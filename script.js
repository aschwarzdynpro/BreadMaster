// BreadMaster – Hydration & Yeast Calculator
//
// Hydrationswerte je Mehlsorte (% des Mehlgewichts).
// Diese Basiswerte liefern ein gut zu verarbeitendes, saftiges Brot.
const HYDRATION = {
  weizen550: 0.65,
  weizenVK:  0.75,
  dinkel550: 0.60, // Dinkel bindet weniger Wasser und wird schnell klebrig
  dinkelVK:  0.70,
  roggen550: 0.75, // heller Roggen (Type 1150)
  roggenVK:  0.85, // Vollkornroggen braucht viel Wasser
};

const FLOUR_IDS = Object.keys(HYDRATION);

// Rezept-Presets. Jedes Preset füllt die Mehlfelder (in Gramm) und
// setzt eine sinnvolle Stockgarezeit (h). Gesamt-Mehlmenge liegt
// jeweils bei ~500 g – der Nutzer kann anschließend frei anpassen.
const PRESETS = [
  {
    name: "Bauernbrot 70/30",
    desc: "Weizen 550 & Roggen 1150, kräftiges Alltagsbrot",
    time: 4,
    amounts: { weizen550: 350, roggen550: 150 },
  },
  {
    name: "Helles Weizenbrot",
    desc: "100 % Weizen 550, luftige Krume",
    time: 3,
    amounts: { weizen550: 500 },
  },
  {
    name: "Dinkel-Vollkorn",
    desc: "100 % Dinkel Vollkorn, nussig-aromatisch",
    time: 5,
    amounts: { dinkelVK: 500 },
  },
  {
    name: "Roggenmischbrot 60/40",
    desc: "Kräftiges Roggen-VK mit Weizen 550",
    time: 8,
    amounts: { roggenVK: 300, weizen550: 200 },
  },
  {
    name: "Kräftiges Vollkornbrot",
    desc: "Weizen & Dinkel Vollkorn 50/50",
    time: 6,
    amounts: { weizenVK: 250, dinkelVK: 250 },
  },
  {
    name: "Dinkelmisch hell",
    desc: "Dinkel 550 mit Weizen 550, fein & mild",
    time: 4,
    amounts: { dinkel550: 300, weizen550: 200 },
  },
];

const els = {
  inputs: Object.fromEntries(FLOUR_IDS.map(id => [id, document.getElementById(id)])),
  timeSlider: document.getElementById("timeSlider"),
  timeValue:  document.getElementById("timeValue"),
  totalFlour: document.getElementById("totalFlour"),
  water:      document.getElementById("waterAmount"),
  hydration:  document.getElementById("hydration"),
  fresh:      document.getElementById("freshYeast"),
  dry:        document.getElementById("dryYeast"),
  salt:       document.getElementById("saltAmount"),
  tip:        document.getElementById("tip"),
  presetGrid: document.getElementById("presetGrid"),
};

function applyPreset(preset) {
  for (const id of FLOUR_IDS) {
    els.inputs[id].value = preset.amounts[id] || 0;
  }
  els.timeSlider.value = preset.time;
  calc();
}

function renderPresets() {
  const frag = document.createDocumentFragment();
  for (const preset of PRESETS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "preset-btn";
    btn.innerHTML = `<span class="preset-name"></span><span class="preset-desc"></span>`;
    btn.querySelector(".preset-name").textContent = preset.name;
    btn.querySelector(".preset-desc").textContent = preset.desc;
    btn.addEventListener("click", () => applyPreset(preset));
    frag.appendChild(btn);
  }
  els.presetGrid.appendChild(frag);
}

function formatTime(hours) {
  if (hours < 1) return `${Math.round(hours * 60)} Min`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}`;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

function calc() {
  // 1. Mehlmengen einsammeln
  const amounts = {};
  let totalFlour = 0;
  for (const id of FLOUR_IDS) {
    const v = Math.max(0, parseFloat(els.inputs[id].value) || 0);
    amounts[id] = v;
    totalFlour += v;
  }

  // 2. Gewichtete Wassermenge berechnen
  let water = 0;
  for (const id of FLOUR_IDS) {
    water += amounts[id] * HYDRATION[id];
  }

  const hydrationPct = totalFlour > 0 ? (water / totalFlour) * 100 : 0;

  // 3. Hefemenge anhand der Stockgarezeit bestimmen
  //    Faustformel: Frischhefe (%) ≈ 2 / Zeit (h)
  //    → 1 h ~ 2 %,  3 h ~ 0.67 %,  12 h ~ 0.17 %,  24 h ~ 0.083 %
  const time = parseFloat(els.timeSlider.value);
  const freshPct = 2 / time;
  const freshYeast = totalFlour * (freshPct / 100);
  const dryYeast = freshYeast / 3; // Trockenhefe ~ 1/3 von Frischhefe

  // 4. Salz: 2 % des Mehls
  const salt = totalFlour * 0.02;

  // 5. Ausgabe
  els.totalFlour.textContent = Math.round(totalFlour);
  els.water.textContent      = Math.round(water);
  els.hydration.textContent  = hydrationPct.toFixed(0);
  els.fresh.textContent      = freshYeast.toFixed(freshYeast < 1 ? 2 : 1);
  els.dry.textContent        = dryYeast.toFixed(dryYeast < 1 ? 2 : 1);
  els.salt.textContent       = salt.toFixed(salt < 10 ? 1 : 0);
  els.timeValue.textContent  = formatTime(time);

  // 6. Tipp-Text
  if (totalFlour === 0) {
    els.tip.textContent = "Gib mindestens eine Mehlsorte ein, um deine Empfehlung zu erhalten.";
    return;
  }

  const tips = [];
  if (time <= 2) {
    tips.push("Schnelle Führung: viel Hefe, kaum Aroma-Entwicklung. Ideal wenn es schnell gehen muss.");
  } else if (time <= 6) {
    tips.push("Mittlere Führung: ausgewogenes Verhältnis von Aroma und Zeit.");
  } else if (time <= 12) {
    tips.push("Lange Führung: deutlich mehr Aroma und bekömmlicher Teig.");
  } else {
    tips.push("Sehr lange Führung: maximal aromatisch. Tipp – den Teig kühl (~6 °C) im Kühlschrank reifen lassen.");
  }

  const roggenAnteil = (amounts.roggen550 + amounts.roggenVK) / totalFlour;
  if (roggenAnteil >= 0.2) {
    tips.push("Bei Roggenanteil ≥ 20 % empfiehlt sich zusätzlich Sauerteig für Trieb und Aroma.");
  }
  if (amounts.dinkel550 + amounts.dinkelVK > 0) {
    tips.push("Dinkel nur kurz kneten – sonst wird das Klebergerüst schnell überdehnt.");
  }

  els.tip.innerHTML = tips.map(t => `• ${t}`).join("<br>");
}

// Events
for (const id of FLOUR_IDS) {
  els.inputs[id].addEventListener("input", calc);
}
els.timeSlider.addEventListener("input", calc);

renderPresets();
calc();
