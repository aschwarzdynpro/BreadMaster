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

const FLOUR_LABELS = {
  weizen550: "Weizen 550",
  weizenVK:  "Weizen Vollkorn",
  dinkel550: "Dinkel 550",
  dinkelVK:  "Dinkel Vollkorn",
  roggen550: "Roggen 1150",
  roggenVK:  "Roggen Vollkorn",
};

// Vorteig-Typen.
//  hydration  – Wasser / Mehl im Vorteig (z. B. 1.0 = TA 200)
//  yeastPct   – Frischhefe als Anteil des Vorteigmehls
//  starterPct – Anstellgut-Anteil (Sauerteig) des Vorteigmehls
const VORTEIG_TYPES = {
  poolish: {
    name: "Poolish",
    hydration: 1.00,
    yeastPct: 0.001,
    starterPct: 0,
    usesStarter: false,
    ripeTime: "12–16 h bei Raumtemperatur (~20 °C)",
    desc: "Flüssiger Weizen-Vorteig (TA 200) nach französischer Art. Liefert milde Aromen und offene Porung.",
  },
  biga: {
    name: "Biga",
    hydration: 0.50,
    yeastPct: 0.005,
    starterPct: 0,
    usesStarter: false,
    ripeTime: "14–18 h bei ca. 16–18 °C",
    desc: "Fester italienischer Vorteig (TA 150). Kräftiges Aroma und sehr stabile Struktur – klassisch für Ciabatta.",
  },
  sauer: {
    name: "Sauerteig",
    hydration: 1.00,
    yeastPct: 0,
    starterPct: 0.10,
    usesStarter: true,
    ripeTime: "8–14 h bei Raumtemperatur, bis sich das Volumen verdoppelt hat",
    desc: "Natürlicher Sauerteig (TA 200, ~10 % Anstellgut). Ersetzt die Backhefe vollständig und sorgt für intensive Aromen.",
  },
};

// Rezept-Presets. Jedes Preset füllt die Mehlfelder (in Gramm) und
// setzt eine sinnvolle Stockgarezeit (h). Gesamt-Mehlmenge liegt
// jeweils bei ~500 g – der Nutzer kann anschließend frei anpassen.
const PRESETS = [
  {
    name: "Bauernbrot 70/30",
    desc: "Weizen 550 & Roggen 1150, kräftiges Alltagsbrot",
    time: 4,
    amounts: { weizen550: 350, roggen550: 150 },
    vorteig: { type: "poolish", pct: 20 },
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
    vorteig: { type: "sauer", pct: 30 },
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
  yeastSub:   document.getElementById("yeastSub"),
  presetGrid: document.getElementById("presetGrid"),
  // Vorteig
  vorteigToggle:   document.getElementById("vorteigToggle"),
  vorteigControls: document.getElementById("vorteigControls"),
  vorteigSlider:   document.getElementById("vorteigSlider"),
  vorteigPctValue: document.getElementById("vorteigPctValue"),
  vorteigDesc:     document.getElementById("vorteigDesc"),
  vorteigTypes:    Array.from(document.querySelectorAll('input[name="vtype"]')),
  // Sub-recipes
  subrecipeSection: document.getElementById("subrecipeSection"),
  vorteigHeading:   document.getElementById("vorteigHeading"),
  vorteigTag:       document.getElementById("vorteigTag"),
  vorteigDetails:   document.getElementById("vorteigDetails"),
  vorteigNote:      document.getElementById("vorteigNote"),
  hauptteigDetails: document.getElementById("hauptteigDetails"),
};

function applyPreset(preset) {
  for (const id of FLOUR_IDS) {
    els.inputs[id].value = preset.amounts[id] || 0;
  }
  els.timeSlider.value = preset.time;

  if (preset.vorteig) {
    els.vorteigToggle.checked = true;
    els.vorteigSlider.value = preset.vorteig.pct;
    for (const input of els.vorteigTypes) {
      input.checked = input.value === preset.vorteig.type;
    }
  } else {
    els.vorteigToggle.checked = false;
  }
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

function getVorteigType() {
  const checked = els.vorteigTypes.find(i => i.checked);
  return checked ? checked.value : "poolish";
}

function formatYeast(v) {
  if (v < 0.01) return "—";
  return v.toFixed(v < 1 ? 2 : 1) + " g";
}

function renderFlourRows(amounts) {
  const rows = [];
  for (const id of FLOUR_IDS) {
    if (amounts[id] > 0.5) {
      rows.push(
        `<div class="sr-row"><span class="sr-label">${FLOUR_LABELS[id]}</span>` +
        `<span class="sr-value">${Math.round(amounts[id])} g</span></div>`
      );
    }
  }
  return rows.join("");
}

function computeVorteig(amounts, totalFlour, totalWater, freshYeast) {
  const type = getVorteigType();
  const cfg = VORTEIG_TYPES[type];
  const pct = parseFloat(els.vorteigSlider.value) / 100;

  // Proportionaler Mehl-Split über alle Mehlsorten
  const vAmounts = {};
  const mAmounts = {};
  for (const id of FLOUR_IDS) {
    vAmounts[id] = amounts[id] * pct;
    mAmounts[id] = amounts[id] - vAmounts[id];
  }
  const vFlour = totalFlour * pct;
  const vWater = vFlour * cfg.hydration;

  if (vWater > totalWater + 0.5) {
    return {
      cfg, type, error:
        `Der ${cfg.name} würde ${Math.round(vWater)} g Wasser binden, ` +
        `aber das Rezept hat insgesamt nur ${Math.round(totalWater)} g Wasser. ` +
        `Anteil oder Vorteig-Typ anpassen.`
    };
  }

  const vYeast = cfg.usesStarter ? 0 : vFlour * cfg.yeastPct;
  const starter = cfg.usesStarter ? vFlour * cfg.starterPct : 0;
  const mFlour = totalFlour - vFlour;
  const mWater = totalWater - vWater;
  const mYeast = cfg.usesStarter ? 0 : Math.max(0, freshYeast - vYeast);

  return { cfg, type, pct, vAmounts, vFlour, vWater, vYeast, starter, mAmounts, mFlour, mWater, mYeast };
}

function renderVorteig(v, salt) {
  els.subrecipeSection.hidden = false;
  els.vorteigHeading.textContent = v.cfg.name;
  els.vorteigTag.textContent = `TA ${Math.round(100 + v.cfg.hydration * 100)}`;

  if (v.error) {
    els.vorteigDetails.innerHTML = `<div class="sr-error">${v.error}</div>`;
    els.vorteigNote.textContent = "";
    els.hauptteigDetails.innerHTML = "";
    return;
  }

  // Vorteig body
  const vRows = [renderFlourRows(v.vAmounts)];
  vRows.push(
    `<div class="sr-row divider"><span class="sr-label">Wasser</span>` +
    `<span class="sr-value">${Math.round(v.vWater)} g</span></div>`
  );
  if (v.cfg.usesStarter) {
    vRows.push(
      `<div class="sr-row"><span class="sr-label">Anstellgut</span>` +
      `<span class="sr-value">${Math.round(v.starter)} g</span></div>`
    );
  } else if (v.vYeast > 0) {
    vRows.push(
      `<div class="sr-row"><span class="sr-label">Frischhefe</span>` +
      `<span class="sr-value">${formatYeast(v.vYeast)}</span></div>`
    );
  }
  els.vorteigDetails.innerHTML = vRows.join("");
  els.vorteigNote.textContent = `Reifezeit: ${v.cfg.ripeTime}`;

  // Hauptteig body
  const mRows = [renderFlourRows(v.mAmounts)];
  mRows.push(
    `<div class="sr-row divider"><span class="sr-label">Wasser</span>` +
    `<span class="sr-value">${Math.round(v.mWater)} g</span></div>`
  );
  mRows.push(
    `<div class="sr-row"><span class="sr-label">Frischhefe</span>` +
    `<span class="sr-value">${formatYeast(v.mYeast)}</span></div>`
  );
  mRows.push(
    `<div class="sr-row"><span class="sr-label">Salz</span>` +
    `<span class="sr-value">${salt.toFixed(salt < 10 ? 1 : 0)} g</span></div>`
  );
  const vorteigWeight = v.vFlour + v.vWater + v.starter;
  mRows.push(
    `<div class="sr-row divider muted"><span class="sr-label">+ reifer Vorteig</span>` +
    `<span class="sr-value">${Math.round(vorteigWeight)} g</span></div>`
  );
  els.hauptteigDetails.innerHTML = mRows.join("");
}

function updateVorteigUI() {
  const enabled = els.vorteigToggle.checked;
  els.vorteigControls.setAttribute("aria-disabled", enabled ? "false" : "true");
  els.vorteigPctValue.textContent = els.vorteigSlider.value;
  const cfg = VORTEIG_TYPES[getVorteigType()];
  els.vorteigDesc.textContent = cfg.desc;
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

  // 5. Vorteig berechnen (falls aktiviert)
  updateVorteigUI();
  let vorteig = null;
  if (els.vorteigToggle.checked && totalFlour > 0) {
    vorteig = computeVorteig(amounts, totalFlour, water, freshYeast);
  }
  const isSauer = vorteig && !vorteig.error && vorteig.cfg.usesStarter;

  // 6. Hauptwerte ausgeben (bei Sauerteig keine Backhefe)
  els.totalFlour.textContent = Math.round(totalFlour);
  els.water.textContent      = Math.round(water);
  els.hydration.textContent  = hydrationPct.toFixed(0);
  els.salt.textContent       = salt.toFixed(salt < 10 ? 1 : 0);
  els.timeValue.textContent  = formatTime(time);

  if (isSauer) {
    els.fresh.textContent = "0";
    els.yeastSub.textContent = "durch Sauerteig ersetzt";
  } else {
    els.fresh.textContent = freshYeast.toFixed(freshYeast < 1 ? 2 : 1);
    els.yeastSub.innerHTML =
      `oder <span id="dryYeast">${dryYeast.toFixed(dryYeast < 1 ? 2 : 1)}</span> g Trockenhefe`;
    els.dry = document.getElementById("dryYeast");
  }

  // 7. Sub-Rezepte (Vorteig + Hauptteig) rendern
  if (vorteig) {
    renderVorteig(vorteig, salt);
  } else {
    els.subrecipeSection.hidden = true;
  }

  // 8. Tipp-Text
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
els.vorteigToggle.addEventListener("change", calc);
els.vorteigSlider.addEventListener("input", calc);
for (const input of els.vorteigTypes) {
  input.addEventListener("change", calc);
}

renderPresets();
updateVorteigUI();
calc();
