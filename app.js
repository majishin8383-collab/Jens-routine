(() => {
  "use strict";

  const PLAN = {
    A: {
      title: "Lower Body and Glutes",
      exercises: ["Goblet Squat", "Hip Thrust", "Romanian Deadlift", "Leg Curl", "Standing Calf Raise"]
    },
    B: {
      title: "Upper Body",
      exercises: ["Lat Pulldown", "Seated Cable Row", "Dumbbell Shoulder Press", "Triceps Pressdown", "Dumbbell Curl"]
    },
    C: {
      title: "Full Body and Conditioning",
      exercises: ["Walking Lunge", "Kettlebell Swing", "Glute Bridge", "Plank", "Incline Treadmill Walk"]
    }
  };

  const RULES = {
    "Goblet Squat": { min: 10, max: 15, inc: 5, units: "pounds", metric: "reps" },
    "Hip Thrust": { min: 10, max: 15, inc: 10, units: "pounds", metric: "reps" },
    "Romanian Deadlift": { min: 8, max: 12, inc: 5, units: "pounds", metric: "reps" },
    "Leg Curl": { min: 10, max: 15, inc: 5, units: "pounds", metric: "reps" },
    "Standing Calf Raise": { min: 12, max: 20, inc: 5, units: "pounds", metric: "reps" },
    "Lat Pulldown": { min: 10, max: 12, inc: 5, units: "pounds", metric: "reps" },
    "Seated Cable Row": { min: 10, max: 12, inc: 5, units: "pounds", metric: "reps" },
    "Dumbbell Shoulder Press": { min: 8, max: 12, inc: 5, units: "pounds", metric: "reps" },
    "Triceps Pressdown": { min: 10, max: 15, inc: 5, units: "pounds", metric: "reps" },
    "Dumbbell Curl": { min: 10, max: 15, inc: 5, units: "pounds", metric: "reps" },
    "Walking Lunge": { min: 10, max: 16, inc: 5, units: "pounds", metric: "reps" },
    "Kettlebell Swing": { min: 12, max: 20, inc: 5, units: "pounds", metric: "reps" },
    "Glute Bridge": { min: 12, max: 20, inc: 10, units: "pounds", metric: "reps" },
    "Plank": { min: 30, max: 60, inc: 0, units: "seconds", metric: "seconds" },
    "Incline Treadmill Walk": { min: 10, max: 20, inc: 0, units: "minutes", metric: "minutes" }
  };

  const KEYS = {
    LOG: "JEN_FITNESS_LOG_V3",
    TARGETS: "JEN_FITNESS_TARGETS_V3",
    DAILY: "JEN_FITNESS_DAILY_V3",
    WEIGH: "JEN_FITNESS_WEIGH_V3"
  };

  const byId = (id) => document.getElementById(id);
  const requiredIds = [
    "nextDayPill", "nutritionPill", "daySelect", "dateInput", "exerciseSelect", "lastBadge", "targetBadge", "nextBadge",
    "weightLabel", "weightInput", "repsLabel", "repsInput", "unitsSelect", "chkClean", "lastComparison", "btnApplySuggested",
    "btnUseLast", "btnQuickLast", "btnToday", "notesInput", "btnAdd", "cadDown", "cadUp", "cadReps", "chkCadVoice",
    "chkCadBeep", "chkCadVibe", "btnCadStart", "btnCadStop", "btnVoiceCmdOn", "btnVoiceCmdOff", "cadStatus", "toast",
    "chkWorkoutDone", "chkProteinGoal", "chkWater", "chkSteps", "caloriesInput", "proteinInput", "carbohydratesInput", "fatInput",
    "btnSaveDaily", "btnResetDaily", "dailySavedText", "weighDate", "weighValue", "weighNote", "btnAddWeigh", "btnExportWeigh",
    "btnClearWeigh", "weighBody", "logCount", "searchInput", "btnDeleteLast", "btnExport", "btnClear", "logBody",
    "tab_entry", "tab_nutrition", "tab_progress"
  ];

  for (const id of requiredIds) {
    if (!byId(id)) {
      throw new Error(`Missing required element: ${id}`);
    }
  }

  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const parseNum = (v) => {
    const n = Number(String(v).trim());
    return Number.isFinite(n) ? n : null;
  };

  const escapeHtml = (str) => String(str).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[ch]));

  const load = (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const save = (key, data) => localStorage.setItem(key, JSON.stringify(data));

  const state = {
    log: load(KEYS.LOG, []),
    targets: load(KEYS.TARGETS, {}),
    daily: load(KEYS.DAILY, {}),
    weigh: load(KEYS.WEIGH, [])
  };

  function toast(message) {
    const el = byId("toast");
    el.textContent = message;
    setTimeout(() => {
      if (el.textContent === message) el.textContent = "";
    }, 2500);
  }

  function dayAfter(day) {
    return day === "A" ? "B" : day === "B" ? "C" : "A";
  }

  function trainingDayForDefault() {
    if (!state.log.length) return "A";
    const latest = [...state.log].sort((a, b) => b.ts - a.ts)[0];
    return dayAfter(latest.day);
  }

  function formatResult(entry) {
    if (!entry) return "—";
    if (entry.units === "seconds") return `${entry.metricValue} sec`;
    if (entry.units === "minutes") return `${entry.metricValue} min`;
    if (entry.units === "bodyweight") return `Bodyweight × ${entry.metricValue}`;
    return `${entry.weight} ${entry.units} × ${entry.metricValue}`;
  }

  function getLastEntry(day, exercise) {
    return [...state.log].sort((a, b) => b.ts - a.ts).find((x) => x.day === day && x.exercise === exercise) || null;
  }

  function keyForTarget(day, exercise) {
    return `${day}|${exercise}`;
  }

  function ruleFor(exercise) {
    return RULES[exercise] || null;
  }

  function updateExerciseOptions(day, preferred) {
    const select = byId("exerciseSelect");
    const list = PLAN[day].exercises;
    select.innerHTML = list.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
    if (preferred && list.includes(preferred)) {
      select.value = preferred;
    }
    if (!select.value && list.length) {
      select.value = list[0];
    }
  }

  function applyExerciseMode(exercise) {
    const rule = ruleFor(exercise);
    const weightLabel = byId("weightLabel");
    const weightInput = byId("weightInput");
    const repsLabel = byId("repsLabel");
    const units = byId("unitsSelect");

    if (!rule) return;

    if (exercise === "Plank") {
      weightLabel.textContent = "Weight";
      weightInput.value = "";
      weightInput.disabled = true;
      repsLabel.textContent = "Time in seconds";
      units.value = "seconds";
      units.disabled = true;
      return;
    }

    if (exercise === "Incline Treadmill Walk") {
      weightLabel.textContent = "Weight";
      weightInput.value = "";
      weightInput.disabled = true;
      repsLabel.textContent = "Time in minutes";
      units.value = "minutes";
      units.disabled = true;
      return;
    }

    weightInput.disabled = false;
    units.disabled = false;
    weightLabel.textContent = "Weight";
    repsLabel.textContent = "Repetitions";
    if (!units.value || units.value === "seconds" || units.value === "minutes") {
      units.value = rule.units;
    }
  }

  function updateBadges(day, exercise) {
    const rule = ruleFor(exercise);
    const last = getLastEntry(day, exercise);
    const target = state.targets[keyForTarget(day, exercise)] || null;

    byId("lastBadge").textContent = `Last: ${formatResult(last)}`;
    if (rule.metric === "reps") {
      byId("targetBadge").textContent = `Target range: ${rule.min}-${rule.max} reps`;
    } else if (rule.metric === "seconds") {
      byId("targetBadge").textContent = `Target range: ${rule.min}-${rule.max} seconds`;
    } else {
      byId("targetBadge").textContent = `Target range: ${rule.min}-${rule.max} minutes`;
    }

    byId("nextBadge").textContent = target ? `Next target: ${target.weight} ${target.units}` : "Next target: —";
    byId("lastComparison").textContent = last ? `Last entry: ${formatResult(last)}` : "";
  }

  function applyAutofill(day, exercise) {
    const last = getLastEntry(day, exercise);
    const target = state.targets[keyForTarget(day, exercise)] || null;
    const rule = ruleFor(exercise);

    applyExerciseMode(exercise);

    if (target && !byId("weightInput").disabled) {
      byId("weightInput").value = target.weight;
      byId("unitsSelect").value = target.units;
    } else if (last) {
      byId("weightInput").value = last.weight || "";
      if (!byId("unitsSelect").disabled) byId("unitsSelect").value = last.units;
    } else {
      byId("weightInput").value = "";
      if (rule && !byId("unitsSelect").disabled) byId("unitsSelect").value = rule.units;
    }

    byId("repsInput").value = "";
    byId("chkClean").checked = false;
    byId("notesInput").value = "";
    document.querySelectorAll('input[name="effortFeel"]').forEach((r) => { r.checked = false; });
    updateBadges(day, exercise);
  }

  function renderLog() {
    const q = byId("searchInput").value.trim().toLowerCase();
    const list = [...state.log].sort((a, b) => b.ts - a.ts).filter((item) => {
      if (!q) return true;
      return `${item.date} ${item.day} ${item.exercise} ${item.weight} ${item.units} ${item.metricValue} ${item.notes} ${item.feel}`.toLowerCase().includes(q);
    });

    byId("logCount").textContent = `${list.length} entries`;

    byId("logBody").innerHTML = list.length ? list.map((entry) => {
      return `<tr>
        <td>${escapeHtml(entry.date)}</td>
        <td>${escapeHtml(entry.day)}</td>
        <td>${escapeHtml(entry.exercise)}</td>
        <td>${escapeHtml(formatResult(entry))}${entry.clean ? " ✅" : ""}</td>
        <td>${escapeHtml(entry.feel || "")}</td>
        <td>${escapeHtml(entry.notes || "")}</td>
      </tr>`;
    }).join("") : '<tr><td colspan="6" class="muted">No entries yet.</td></tr>';
  }

  function renderWeigh() {
    const list = [...state.weigh].sort((a, b) => b.ts - a.ts);
    byId("weighBody").innerHTML = list.length ? list.map((w) => `<tr>
      <td>${escapeHtml(w.date)}</td>
      <td>${escapeHtml(String(w.weight))}</td>
      <td>${escapeHtml(w.note || "")}</td>
      <td><button type="button" class="danger" data-weigh-del="${w.ts}">Delete</button></td>
    </tr>`).join("") : '<tr><td colspan="4" class="muted">No weigh-ins yet.</td></tr>';

    document.querySelectorAll("[data-weigh-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const ts = Number(btn.getAttribute("data-weigh-del"));
        state.weigh = state.weigh.filter((w) => w.ts !== ts);
        save(KEYS.WEIGH, state.weigh);
        renderWeigh();
      });
    });
  }

  function refreshHeaderPills() {
    const next = trainingDayForDefault();
    byId("nextDayPill").textContent = `Next: ${PLAN[next].title}`;

    const d = state.daily[todayISO()] || {};
    const calories = d.calories ? String(d.calories) : "0";
    byId("nutritionPill").textContent = `Nutrition: ${calories} calories`;
  }

  function loadDaily() {
    const d = state.daily[todayISO()] || {};
    byId("chkWorkoutDone").checked = !!d.workoutDone;
    byId("chkProteinGoal").checked = !!d.proteinGoal;
    byId("chkWater").checked = !!d.water;
    byId("chkSteps").checked = !!d.steps;
    byId("caloriesInput").value = d.calories || "";
    byId("proteinInput").value = d.protein || "";
    byId("carbohydratesInput").value = d.carbohydrates || "";
    byId("fatInput").value = d.fat || "";
    byId("dailySavedText").textContent = d.savedAt ? `Saved at ${new Date(d.savedAt).toLocaleTimeString()}` : "";
  }

  function csvDownload(text, name) {
    const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportLogCSV() {
    const header = ["date", "day", "exercise", "weight", "units", "metricValue", "clean", "feel", "notes"];
    const lines = [...state.log].sort((a, b) => a.ts - b.ts).map((e) => {
      const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      return [e.date, e.day, e.exercise, e.weight, e.units, e.metricValue, e.clean ? 1 : 0, e.feel || "", e.notes || ""].map(q).join(",");
    });
    csvDownload([header.join(","), ...lines].join("\n"), "jen-workout-log.csv");
  }

  function exportWeighCSV() {
    const header = ["date", "bodyweight", "note"];
    const lines = [...state.weigh].sort((a, b) => a.ts - b.ts).map((w) => {
      const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      return [w.date, w.weight, w.note || ""].map(q).join(",");
    });
    csvDownload([header.join(","), ...lines].join("\n"), "jen-weigh-ins.csv");
  }

  function suggestionFromEntry(exercise, units, weight, metricValue, clean) {
    const rule = ruleFor(exercise);
    if (!rule || !clean) return null;
    if (rule.inc <= 0) return null;
    if (units === "seconds" || units === "minutes" || units === "bodyweight") return null;
    if (metricValue < rule.max) return null;

    const w = Number(weight);
    if (!Number.isFinite(w)) return null;

    return {
      units,
      weight: String(w + rule.inc),
      repsTarget: rule.min
    };
  }

  function switchTab(tab) {
    ["entry", "nutrition", "progress"].forEach((name) => {
      byId(`tab_${name}`).classList.toggle("hidden", name !== tab);
    });
    document.querySelectorAll(".tabbtn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });

    const day = byId("daySelect").value;
    updateExerciseOptions(day, byId("exerciseSelect").value);
    applyAutofill(day, byId("exerciseSelect").value);
  }

  let cadenceTimer = null;
  let speechRec = null;
  let speechRecOn = false;
  let audioCtx = null;

  function ensureAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx && Ctx) audioCtx = new Ctx();
  }

  function beep(freq = 840, ms = 110) {
    try {
      ensureAudio();
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      setTimeout(() => osc.stop(), ms);
    } catch {
      return;
    }
  }

  function vibrate(ms = 35) {
    try {
      if (navigator.vibrate && byId("chkCadVibe").checked) navigator.vibrate(ms);
    } catch {
      return;
    }
  }

  function speak(text) {
    try {
      if (!("speechSynthesis" in window) || !byId("chkCadVoice").checked) return;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    } catch {
      return;
    }
  }

  function cadenceStop() {
    if (cadenceTimer) clearInterval(cadenceTimer);
    cadenceTimer = null;
    byId("cadStatus").textContent = "Idle";
    try {
      window.speechSynthesis.cancel();
    } catch {
      return;
    }
  }

  function cadenceStart() {
    const down = parseNum(byId("cadDown").value);
    const up = parseNum(byId("cadUp").value);
    const reps = parseNum(byId("cadReps").value);

    if (!down || !up || !reps || down <= 0 || up <= 0 || reps <= 0) {
      toast("Enter valid cadence values.");
      return;
    }

    cadenceStop();
    let rep = 1;
    let phase = "down";
    let left = down;

    const cue = (msg, freq) => {
      byId("cadStatus").textContent = msg;
      if (byId("chkCadBeep").checked) beep(freq);
      vibrate();
      speak(msg);
    };

    cue(`Start. Rep 1. Down.`, 840);

    cadenceTimer = setInterval(() => {
      left -= 1;
      if (left > 0) {
        byId("cadStatus").textContent = `Rep ${rep}/${reps} ${phase} (${left}s)`;
        return;
      }

      if (phase === "down") {
        phase = "up";
        left = up;
        cue("Up.", 980);
        return;
      }

      if (phase === "up") {
        if (rep >= reps) {
          cue("Stop. Set complete.", 560);
          cadenceStop();
          return;
        }
        rep += 1;
        phase = "down";
        left = down;
        cue(`Rep ${rep}. Down.`, 840);
      }
    }, 1000);
  }

  function startVoiceCommands() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast("Voice commands are not supported in this browser.");
      return;
    }
    if (speechRecOn) {
      toast("Voice commands already on.");
      return;
    }

    speechRec = new SR();
    speechRec.lang = "en-US";
    speechRec.continuous = true;
    speechRec.interimResults = false;

    speechRec.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
      if (text.includes("start")) cadenceStart();
      if (text.includes("stop")) cadenceStop();
    };

    speechRec.onend = () => {
      if (speechRecOn) {
        try {
          speechRec.start();
        } catch {
          speechRecOn = false;
        }
      }
    };

    speechRecOn = true;
    try {
      speechRec.start();
      toast("Voice commands on.");
    } catch {
      speechRecOn = false;
      toast("Could not start voice commands.");
    }
  }

  function stopVoiceCommands() {
    speechRecOn = false;
    if (speechRec) {
      try {
        speechRec.stop();
      } catch {
        return;
      }
    }
    toast("Voice commands off.");
  }

  function bindEvents() {
    document.querySelectorAll(".tabbtn").forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });

    byId("daySelect").addEventListener("change", () => {
      const day = byId("daySelect").value;
      updateExerciseOptions(day);
      applyAutofill(day, byId("exerciseSelect").value);
    });

    byId("exerciseSelect").addEventListener("change", () => {
      applyAutofill(byId("daySelect").value, byId("exerciseSelect").value);
    });

    byId("btnUseLast").addEventListener("click", () => {
      const last = getLastEntry(byId("daySelect").value, byId("exerciseSelect").value);
      if (!last) {
        toast("No last entry for this exercise.");
        return;
      }
      byId("weightInput").value = last.weight || "";
      byId("repsInput").value = "";
      if (!byId("unitsSelect").disabled) byId("unitsSelect").value = last.units;
      toast("Loaded last result.");
    });

    byId("btnApplySuggested").addEventListener("click", () => {
      const key = keyForTarget(byId("daySelect").value, byId("exerciseSelect").value);
      const t = state.targets[key];
      if (!t) {
        toast("No suggested target yet.");
        return;
      }
      if (!byId("weightInput").disabled) {
        byId("weightInput").value = t.weight;
        byId("unitsSelect").value = t.units;
      }
      toast("Applied target.");
    });

    byId("btnQuickLast").addEventListener("click", () => {
      const last = getLastEntry(byId("daySelect").value, byId("exerciseSelect").value);
      if (!last) {
        toast("No previous entry.");
        return;
      }
      byId("dateInput").value = todayISO();
      byId("repsInput").value = String(last.metricValue);
      byId("weightInput").value = last.weight || "";
      if (!byId("unitsSelect").disabled) byId("unitsSelect").value = last.units;
      byId("notesInput").value = last.notes || "";
      byId("chkClean").checked = !!last.clean;
      document.querySelectorAll('input[name="effortFeel"]').forEach((r) => {
        r.checked = r.value === (last.feel || "");
      });
      toast("Last entry loaded.");
    });

    byId("btnToday").addEventListener("click", () => {
      byId("dateInput").value = todayISO();
    });

    byId("btnAdd").addEventListener("click", () => {
      const day = byId("daySelect").value;
      const exercise = byId("exerciseSelect").value;
      const units = byId("unitsSelect").value;
      const metricValue = parseNum(byId("repsInput").value);
      const clean = byId("chkClean").checked;
      const rule = ruleFor(exercise);

      if (!metricValue || metricValue <= 0) {
        toast("Enter repetitions or time.");
        return;
      }

      let weight = "";
      if (!(units === "seconds" || units === "minutes")) {
        const w = parseNum(byId("weightInput").value);
        if (w === null || w < 0) {
          toast("Enter weight.");
          return;
        }
        weight = String(w);
      }

      const feel = (document.querySelector('input[name="effortFeel"]:checked') || {}).value || "";
      const entry = {
        ts: Date.now(),
        date: byId("dateInput").value || todayISO(),
        day,
        exercise,
        weight,
        units,
        metricValue,
        clean,
        feel,
        notes: byId("notesInput").value.trim()
      };

      state.log.push(entry);
      save(KEYS.LOG, state.log);

      const suggestion = suggestionFromEntry(exercise, units, weight, metricValue, clean);
      if (suggestion) {
        state.targets[keyForTarget(day, exercise)] = suggestion;
        save(KEYS.TARGETS, state.targets);
      }

      const last = getLastEntry(day, exercise);
      byId("lastComparison").textContent = last ? `Saved. Last: ${formatResult(last)}` : "Saved.";

      byId("repsInput").value = "";
      byId("notesInput").value = "";
      byId("chkClean").checked = false;
      document.querySelectorAll('input[name="effortFeel"]').forEach((r) => { r.checked = false; });

      renderLog();
      refreshHeaderPills();
      applyAutofill(day, exercise);
      toast("Entry added.");

      if (rule && (exercise === "Plank" || exercise === "Incline Treadmill Walk")) {
        byId("weightInput").value = "";
      }
    });

    byId("btnDeleteLast").addEventListener("click", () => {
      if (!state.log.length) {
        toast("Log is empty.");
        return;
      }
      const latest = [...state.log].sort((a, b) => b.ts - a.ts)[0];
      state.log = state.log.filter((item) => item.ts !== latest.ts);
      save(KEYS.LOG, state.log);
      renderLog();
      refreshHeaderPills();
      updateExerciseOptions(byId("daySelect").value, byId("exerciseSelect").value);
      applyAutofill(byId("daySelect").value, byId("exerciseSelect").value);
      toast("Last entry deleted.");
    });

    byId("searchInput").addEventListener("input", renderLog);

    byId("btnExport").addEventListener("click", exportLogCSV);

    byId("btnClear").addEventListener("click", () => {
      if (!window.confirm("Clear the full workout log?")) return;
      state.log = [];
      state.targets = {};
      save(KEYS.LOG, state.log);
      save(KEYS.TARGETS, state.targets);
      renderLog();
      refreshHeaderPills();
      applyAutofill(byId("daySelect").value, byId("exerciseSelect").value);
      toast("Workout log cleared.");
    });

    byId("btnSaveDaily").addEventListener("click", () => {
      const key = todayISO();
      state.daily[key] = {
        workoutDone: byId("chkWorkoutDone").checked,
        proteinGoal: byId("chkProteinGoal").checked,
        water: byId("chkWater").checked,
        steps: byId("chkSteps").checked,
        calories: byId("caloriesInput").value.trim(),
        protein: byId("proteinInput").value.trim(),
        carbohydrates: byId("carbohydratesInput").value.trim(),
        fat: byId("fatInput").value.trim(),
        savedAt: Date.now()
      };
      save(KEYS.DAILY, state.daily);
      loadDaily();
      refreshHeaderPills();
      toast("Nutrition saved.");
    });

    byId("btnResetDaily").addEventListener("click", () => {
      const key = todayISO();
      delete state.daily[key];
      save(KEYS.DAILY, state.daily);
      loadDaily();
      refreshHeaderPills();
      toast("Today reset.");
    });

    byId("btnAddWeigh").addEventListener("click", () => {
      const weight = parseNum(byId("weighValue").value);
      if (weight === null || weight <= 0) {
        toast("Enter a valid bodyweight.");
        return;
      }
      state.weigh.push({
        ts: Date.now(),
        date: byId("weighDate").value || todayISO(),
        weight,
        note: byId("weighNote").value.trim()
      });
      save(KEYS.WEIGH, state.weigh);
      byId("weighValue").value = "";
      byId("weighNote").value = "";
      renderWeigh();
      toast("Weigh-in saved.");
    });

    byId("btnExportWeigh").addEventListener("click", exportWeighCSV);

    byId("btnClearWeigh").addEventListener("click", () => {
      if (!window.confirm("Clear all weigh-ins?")) return;
      state.weigh = [];
      save(KEYS.WEIGH, state.weigh);
      renderWeigh();
      toast("Weigh-ins cleared.");
    });

    byId("btnCadStart").addEventListener("click", cadenceStart);
    byId("btnCadStop").addEventListener("click", cadenceStop);
    byId("btnVoiceCmdOn").addEventListener("click", startVoiceCommands);
    byId("btnVoiceCmdOff").addEventListener("click", stopVoiceCommands);
  }

  function init() {
    byId("dateInput").value = todayISO();
    byId("weighDate").value = todayISO();

    const day = trainingDayForDefault();
    byId("daySelect").value = day;

    updateExerciseOptions(day);
    applyAutofill(day, byId("exerciseSelect").value);

    renderLog();
    renderWeigh();
    loadDaily();
    refreshHeaderPills();
    bindEvents();
  }

  init();
})();
