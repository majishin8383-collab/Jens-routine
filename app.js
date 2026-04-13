(() => {
  const PLAN = {
    A: {
      title: "Lower Body and Glutes",
      exercises: [
        "Goblet Squat",
        "Hip Thrust",
        "Romanian Deadlift",
        "Leg Curl",
        "Standing Calf Raise"
      ]
    },
    B: {
      title: "Upper Body",
      exercises: [
        "Lat Pulldown",
        "Seated Cable Row",
        "Dumbbell Shoulder Press",
        "Triceps Pressdown",
        "Dumbbell Curl"
      ]
    },
    C: {
      title: "Full Body and Conditioning",
      exercises: [
        "Walking Lunge",
        "Kettlebell Swing",
        "Glute Bridge",
        "Plank",
        "Incline Treadmill Walk"
      ]
    }
  };

  const RULES = {
    "Goblet Squat": { repMin: 10, repMax: 15, inc: 5, units: "pounds" },
    "Hip Thrust": { repMin: 10, repMax: 15, inc: 10, units: "pounds" },
    "Romanian Deadlift": { repMin: 8, repMax: 12, inc: 5, units: "pounds" },
    "Leg Curl": { repMin: 10, repMax: 15, inc: 5, units: "pounds" },
    "Standing Calf Raise": { repMin: 12, repMax: 20, inc: 5, units: "pounds" },

    "Lat Pulldown": { repMin: 10, repMax: 12, inc: 5, units: "pounds" },
    "Seated Cable Row": { repMin: 10, repMax: 12, inc: 5, units: "pounds" },
    "Dumbbell Shoulder Press": { repMin: 8, repMax: 12, inc: 5, units: "pounds" },
    "Triceps Pressdown": { repMin: 10, repMax: 15, inc: 5, units: "pounds" },
    "Dumbbell Curl": { repMin: 10, repMax: 15, inc: 5, units: "pounds" },

    "Walking Lunge": { repMin: 10, repMax: 16, inc: 5, units: "pounds" },
    "Kettlebell Swing": { repMin: 12, repMax: 20, inc: 5, units: "pounds" },
    "Glute Bridge": { repMin: 12, repMax: 20, inc: 10, units: "pounds" },
    "Plank": { repMin: 30, repMax: 60, inc: 0, units: "seconds" },
    "Incline Treadmill Walk": { repMin: 10, repMax: 20, inc: 0, units: "minutes" }
  };

  const KEY_LOG = "JEN_FITNESS_LOG_V2";
  const KEY_DAILY = "JEN_FITNESS_DAILY_V2";
  const KEY_WEIGH = "JEN_FITNESS_WEIGH_V2";
  const KEY_TARGETS = "JEN_FITNESS_TARGETS_V2";

  const loadJSON = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  };

  const saveJSON = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const $ = (id) => document.getElementById(id);

  const todayISO = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseNum = (value) => {
    const n = Number(String(value).trim());
    return Number.isFinite(n) ? n : null;
  };

  const nextDay = (day) => (day === "A" ? "B" : day === "B" ? "C" : "A");

  const escapeHtml = (str) =>
    String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m]));

  function toast(message) {
    const t = $("toast");
    if (!t) return;
    t.textContent = message;
    setTimeout(() => {
      if (t.textContent === message) t.textContent = "";
    }, 2500);
  }

  function keyOf(day, exercise) {
    return `${day}||${exercise}`;
  }

  function getRule(exercise) {
    return RULES[exercise] || null;
  }

  function bestGuessNextDay(log) {
    if (!log.length) return "A";
    const lastEntry = [...log].sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
    return nextDay(lastEntry.day);
  }

  function formatResult(entry) {
    if (!entry) return "—";
    if (entry.units === "bodyweight") return `Bodyweight × ${entry.reps}`;
    if (entry.units === "seconds") return `${entry.reps} seconds`;
    if (entry.units === "minutes") return `${entry.reps} minutes`;
    return `${entry.weight} ${entry.units} × ${entry.reps}`;
  }

  function renderExercises(day) {
    $("exerciseSelect").innerHTML = PLAN[day].exercises
      .map((exercise) => `<option value="${escapeHtml(exercise)}">${escapeHtml(exercise)}</option>`)
      .join("");
  }

  function renderLog(log) {
    const q = $("searchInput").value.trim().toLowerCase();

    const filtered = [...log]
      .sort((a, b) => (b.ts || 0) - (a.ts || 0))
      .filter((entry) => {
        if (!q) return true;
        const blob = `${entry.date} ${entry.day} ${entry.exercise} ${entry.notes || ""} ${entry.weight || ""} ${entry.units} ${entry.reps} ${entry.feel || ""}`.toLowerCase();
        return blob.includes(q);
      });

    $("logCount").textContent = `${filtered.length} entries`;

    $("logBody").innerHTML = filtered.length
      ? filtered.map((entry) => `
          <tr>
            <td class="mono">${escapeHtml(entry.date)}</td>
            <td><span class="pill">${escapeHtml(entry.day)}</span></td>
            <td>${escapeHtml(entry.exercise)}</td>
            <td class="mono">${escapeHtml(formatResult(entry))}${entry.clean ? " ✅" : ""}</td>
            <td class="muted">${escapeHtml(entry.notes || "")}${entry.feel ? ` • ${escapeHtml(entry.feel)}` : ""}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="5" class="muted">No entries yet. Add the first set.</td></tr>`;
  }

  function findLastForExercise(log, day, exercise) {
    return [...log]
      .sort((a, b) => (b.ts || 0) - (a.ts || 0))
      .find((entry) => entry.day === day && entry.exercise === exercise) || null;
  }

  function compareToLast(current, last) {
    if (!last) return "No previous entry";
    if (current.units !== last.units) return `Last entry: ${formatResult(last)}`;

    const currentWeight = current.units === "seconds" || current.units === "minutes" || current.units === "bodyweight"
      ? 0
      : Number(current.weight || 0);

    const lastWeight = last.units === "seconds" || last.units === "minutes" || last.units === "bodyweight"
      ? 0
      : Number(last.weight || 0);

    const currentReps = Number(current.reps);
    const lastReps = Number(last.reps);

    let verdict = "Matched last entry";

    if (currentWeight === lastWeight && currentReps > lastReps) verdict = "Improved with more repetitions";
    else if (currentReps === lastReps && currentWeight > lastWeight) verdict = "Improved with more weight";
    else if (currentWeight > lastWeight && currentReps > lastReps) verdict = "Improved with more weight and more repetitions";
    else if (currentWeight < lastWeight && currentReps < lastReps) verdict = "Below last entry";

    return `${verdict} (Last entry: ${formatResult(last)})`;
  }

  function computeSuggestedNext(exercise, units, weightStr, repsNum, clean) {
    const rule = getRule(exercise);
    if (!rule) return null;
    if (!clean) return null;
    if (repsNum < rule.repMax) return null;
    if (rule.inc <= 0) return null;
    if (units === "bodyweight" || units === "seconds" || units === "minutes") return null;

    const weight = Number(weightStr || 0);
    if (!Number.isFinite(weight)) return null;

    const nextWeight = Math.round((weight + rule.inc) * 2) / 2;
    return {
      units,
      weight: String(nextWeight),
      repsTarget: rule.repMin
    };
  }

  function setBadges(day, exercise, last, targets) {
    const rule = getRule(exercise);
    $("lastBadge").textContent = `Last: ${last ? formatResult(last) : "—"}`;
    $("targetBadge").textContent = `Target range: ${rule ? `${rule.repMin}–${rule.repMax}` : "—"}`;

    const target = targets[keyOf(day, exercise)] || null;
    $("nextBadge").textContent = `Next target: ${target ? `${target.weight} ${target.units}` : "—"}`;
  }

  function applyAutoFill(day, exercise, log, targets) {
    const last = findLastForExercise(log, day, exercise);
    const rule = getRule(exercise);
    const target = targets[keyOf(day, exercise)] || null;

    if (target) {
      $("unitsSelect").value = target.units;
      $("weightInput").value = target.weight || "";
      $("repsInput").value = "";
    } else if (last) {
      $("unitsSelect").value = last.units;
      $("weightInput").value = last.weight || "";
      $("repsInput").value = "";
    } else if (rule) {
      $("unitsSelect").value = rule.units || "pounds";
      $("weightInput").value = "";
      $("repsInput").value = "";
    }

    setBadges(day, exercise, last, targets);
    $("chkClean").checked = false;
    $("lastComparison").textContent = last ? `Last entry: ${formatResult(last)}` : "";

    document.querySelectorAll('input[name="effortFeel"]').forEach((input) => {
      input.checked = false;
    });
  }

  let cadenceTimer = null;
  let cadenceState = { rep: 0, phase: "idle", secsLeft: 0, down: 4, up: 2, reps: 8 };
  let audioCtx = null;
  let voiceRecognition = null;
  let voiceRecognitionOn = false;

  function ensureAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx && Ctx) audioCtx = new Ctx();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  }

  function beep(ms = 120, freq = 880) {
    try {
      ensureAudio();
      if (!audioCtx) return;
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = freq;
      gain.gain.value = 0.08;
      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.start();
      setTimeout(() => {
        try { oscillator.stop(); } catch {}
      }, ms);
    } catch {}
  }

  function buzz(pattern = 40) {
    try {
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch {}
  }

  function speak(text) {
    try {
      if (!("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.03;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }

  function cue(text, freq) {
    if ($("chkCadBeep").checked) beep(120, freq || 880);
    if ($("chkCadVibe").checked) buzz(30);
    if ($("chkCadVoice").checked) speak(text);
    $("cadStatus").textContent = text;
  }

  function setCadenceStatus() {
    $("cadStatus").textContent = cadenceState.phase === "idle"
      ? "Idle"
      : `Repetition ${cadenceState.rep}/${cadenceState.reps} — ${cadenceState.phase} (${cadenceState.secsLeft}s)`;
  }

  function cadenceStop() {
    if (cadenceTimer) clearInterval(cadenceTimer);
    cadenceTimer = null;
    cadenceState.phase = "idle";
    cadenceState.rep = 0;
    cadenceState.secsLeft = 0;
    setCadenceStatus();
    try { window.speechSynthesis?.cancel?.(); } catch {}
  }

  function cadenceStart(down, up, reps) {
    cadenceStop();
    ensureAudio();

    cadenceState = { rep: 0, phase: "down", secsLeft: down, down, up, reps };
    setCadenceStatus();
    cue("Start. Repetition one. Down.", 880);

    cadenceTimer = setInterval(() => {
      cadenceState.secsLeft -= 1;

      if (cadenceState.secsLeft > 0) {
        if (cadenceState.secsLeft <= 3) cue(String(cadenceState.secsLeft), 660);
        else setCadenceStatus();
        return;
      }

      if (cadenceState.phase === "down") {
        cadenceState.phase = "up";
        cadenceState.secsLeft = cadenceState.up;
        cue("Up.", 990);
        return;
      }

      if (cadenceState.phase === "up") {
        cadenceState.rep += 1;

        if (cadenceState.rep >= cadenceState.reps) {
          cue("Set complete.", 520);
          cadenceStop();
          return;
        }

        cadenceState.phase = "down";
        cadenceState.secsLeft = cadenceState.down;
        cue(`Repetition ${cadenceState.rep + 1}. Down.`, 880);
      }
    }, 1000);
  }

  function startVoiceCommands() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return toast("Voice commands are not supported in this browser.");
    if (voiceRecognitionOn) return toast("Voice commands are already on.");

    voiceRecognition = new SR();
    voiceRecognition.lang = "en-US";
    voiceRecognition.continuous = true;
    voiceRecognition.interimResults = false;

    voiceRecognition.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();

      if (text.includes("stop")) {
        cadenceStop();
        toast("Rep counter stopped.");
        return;
      }

      if (text.includes("start")) {
        const down = parseNum($("cadDown").value);
        const up = parseNum($("cadUp").value);
        const reps = parseNum($("cadReps").value);

        if (!down || !up || !reps || down <= 0 || up <= 0 || reps <= 0) {
          toast("Cadence numbers are invalid.");
          return;
        }

        cadenceStart(down, up, reps);
        toast("Rep counter started.");
      }
    };

    voiceRecognition.onerror = () => {};
    voiceRecognition.onend = () => {
      if (voiceRecognitionOn) {
        try { voiceRecognition.start(); } catch {}
      }
    };

    voiceRecognitionOn = true;

    try {
      voiceRecognition.start();
      toast("Voice commands on. Say start or stop.");
    } catch {
      voiceRecognitionOn = false;
      toast("Voice commands failed to start.");
    }
  }

  function stopVoiceCommands() {
    voiceRecognitionOn = false;
    try { voiceRecognition && voiceRecognition.stop(); } catch {}
    toast("Voice commands off.");
  }

  function loadDailyUI() {
    const key = todayISO();
    const d = daily[key] || {};

    $("chkWorkoutDone").checked = !!d.workoutDone;
    $("chkProteinGoal").checked = !!d.proteinGoal;
    $("chkWater").checked = !!d.water;
    $("chkSteps").checked = !!d.steps;

    $("caloriesInput").value = d.calories || "";
    $("proteinInput").value = d.protein || "";
    $("carbohydratesInput").value = d.carbohydrates || "";
    $("fatInput").value = d.fat || "";

    $("dailySavedText").textContent = d.savedAt ? `Saved: ${new Date(d.savedAt).toLocaleTimeString()}` : "";
  }

  function refreshNutritionPill() {
    const key = todayISO();
    const d = daily[key] || {};
    $("nutritionPill").textContent = `Nutrition: ${d.calories ? `${d.calories} calories` : "0 calories"}`;
  }

  function renderWeigh() {
    const sorted = [...weigh].sort((a, b) => (b.ts || 0) - (a.ts || 0));

    $("weighBody").innerHTML = sorted.length
      ? sorted.map((entry) => `
          <tr>
            <td class="mono">${escapeHtml(entry.date)}</td>
            <td class="mono">${escapeHtml(entry.weight)}</td>
            <td class="muted">${escapeHtml(entry.note || "")}</td>
            <td><button class="danger" data-del="${entry.ts}">Delete</button></td>
          </tr>
        `).join("")
      : `<tr><td colspan="4" class="muted">No weigh-ins yet.</td></tr>`;

    document.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const ts = Number(btn.getAttribute("data-del"));
        weigh = weigh.filter((entry) => entry.ts !== ts);
        saveJSON(KEY_WEIGH, weigh);
        renderWeigh();
      });
    });
  }

  function exportCSV(log) {
    const header = ["date", "day", "exercise", "weight", "units", "reps", "clean", "feel", "notes"].join(",");
    const lines = [...log]
      .sort((a, b) => (a.ts || 0) - (b.ts || 0))
      .map((entry) => {
        const safe = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
        return [
          entry.date,
          entry.day,
          entry.exercise,
          entry.weight,
          entry.units,
          entry.reps,
          entry.clean ? "1" : "0",
          entry.feel || "",
          entry.notes || ""
        ].map(safe).join(",");
      });

    return [header, ...lines].join("\n");
  }

  function exportWeighCSV(weigh) {
    const header = ["date", "weight", "note"].join(",");
    const lines = [...weigh]
      .sort((a, b) => (a.ts || 0) - (b.ts || 0))
      .map((entry) => {
        const safe = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
        return [entry.date, entry.weight, entry.note].map(safe).join(",");
      });

    return [header, ...lines].join("\n");
  }

  function downloadText(text, filename, mime) {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  let log = loadJSON(KEY_LOG, []);
  let daily = loadJSON(KEY_DAILY, {});
  let weigh = loadJSON(KEY_WEIGH, []);
  let targets = loadJSON(KEY_TARGETS, {});

  if ($("dateInput")) $("dateInput").value = todayISO();
  if ($("weighDate")) $("weighDate").value = todayISO();

  const defaultDay = bestGuessNextDay(log);
  $("daySelect").value = defaultDay;
  renderExercises(defaultDay);
  $("nextDayPill").textContent = `Next: ${PLAN[defaultDay].title}`;

  renderLog(log);
  renderWeigh();
  loadDailyUI();
  refreshNutritionPill();
  applyAutoFill($("daySelect").value, $("exerciseSelect").value, log, targets);

  document.querySelectorAll(".tabbtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tabbtn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const tab = btn.getAttribute("data-tab");
      ["entry", "nutrition", "progress"].forEach((name) => {
        $("tab_" + name).classList.toggle("hidden", name !== tab);
      });
    });
  });

  $("daySelect").addEventListener("change", () => {
    const day = $("daySelect").value;
    renderExercises(day);
    applyAutoFill(day, $("exerciseSelect").value, log, targets);
  });

  $("exerciseSelect").addEventListener("change", () => {
    applyAutoFill($("daySelect").value, $("exerciseSelect").value, log, targets);
  });

  $("btnUseLast").addEventListener("click", () => {
    const day = $("daySelect").value;
    const exercise = $("exerciseSelect").value;
    const last = findLastForExercise(log, day, exercise);

    if (!last) {
      toast("No last entry found.");
      return;
    }

    $("unitsSelect").value = last.units;
    $("weightInput").value = last.weight || "";
    $("repsInput").value = "";
    toast("Loaded last weight.");
  });

  $("btnApplySuggested").addEventListener("click", () => {
    const day = $("daySelect").value;
    const exercise = $("exerciseSelect").value;
    const target = targets[keyOf(day, exercise)];

    if (!target) {
      toast("No suggested target yet.");
      return;
    }

    $("unitsSelect").value = target.units;
    $("weightInput").value = target.weight || "";
    $("repsInput").value = "";
    toast("Applied suggested target.");
  });

  $("btnCadStart").addEventListener("click", () => {
    const down = parseNum($("cadDown").value);
    const up = parseNum($("cadUp").value);
    const reps = parseNum($("cadReps").value);

    if (!down || !up || !reps || down <= 0 || up <= 0 || reps <= 0) {
      toast("Enter valid cadence numbers.");
      return;
    }

    cadenceStart(down, up, reps);
  });

  $("btnCadStop").addEventListener("click", cadenceStop);
  $("btnVoiceCmdOn").addEventListener("click", startVoiceCommands);
  $("btnVoiceCmdOff").addEventListener("click", stopVoiceCommands);
  $("searchInput").addEventListener("input", () => renderLog(log));

  $("btnToday").addEventListener("click", () => {
    $("dateInput").value = todayISO();
    toast("Date set to today.");
  });

  $("btnAdd").addEventListener("click", () => {
    const day = $("daySelect").value;
    const date = $("dateInput").value || todayISO();
    const exercise = $("exerciseSelect").value;
    const units = $("unitsSelect").value;
    const reps = parseNum($("repsInput").value);

    if (!reps || reps <= 0) {
      toast("Enter repetitions or time.");
      return;
    }

    let weight = $("weightInput").value.trim();
    if (units === "bodyweight" || units === "seconds" || units === "minutes") {
      weight = "";
    } else {
      const parsedWeight = parseNum(weight);
      if (parsedWeight === null || parsedWeight < 0) {
        toast("Enter weight.");
        return;
      }
      weight = String(parsedWeight);
    }

    const feel = document.querySelector('input[name="effortFeel"]:checked')?.value || "";

    const entry = {
      ts: Date.now(),
      date,
      day,
      exercise,
      weight,
      units,
      reps: String(reps),
      clean: $("chkClean").checked,
      feel,
      notes: $("notesInput").value.trim()
    };

    const last = findLastForExercise(log, day, exercise);
    $("lastComparison").textContent = compareToLast(entry, last);

    log.push(entry);
    saveJSON(KEY_LOG, log);
    renderLog(log);

    const suggested = computeSuggestedNext(exercise, units, weight, reps, entry.clean);
    if (suggested) {
      targets[keyOf(day, exercise)] = suggested;
      saveJSON(KEY_TARGETS, targets);
      toast(`Saved next target: ${suggested.weight} ${suggested.units}`);
    } else {
      toast("Saved.");
    }

    const nextTrainingDay = bestGuessNextDay(log);
    $("nextDayPill").textContent = `Next: ${PLAN[nextTrainingDay].title}`;

    $("repsInput").value = "";
    $("notesInput").value = "";
    $("chkClean").checked = false;
    document.querySelectorAll('input[name="effortFeel"]').forEach((input) => {
      input.checked = false;
    });

    applyAutoFill(day, exercise, log, targets);
  });

  $("btnQuickLast").addEventListener("click", () => {
    const day = $("daySelect").value;
    const exercise = $("exerciseSelect").value;
    const last = findLastForExercise(log, day, exercise);

    if (!last) {
      toast("No previous entry for this exercise.");
      return;
    }

    $("unitsSelect").value = last.units;
    $("weightInput").value = last.weight || "";
    $("repsInput").value = last.reps || "";
    $("notesInput").value = last.notes || "";
    $("chkClean").checked = !!last.clean;

    document.querySelectorAll('input[name="effortFeel"]').forEach((input) => {
      input.checked = input.value === last.feel;
    });

    toast("Loaded last entry.");
  });

  $("btnDeleteLast").addEventListener("click", () => {
    if (!log.length) {
      toast("Log is empty.");
      return;
    }

    const sortedIndex = log
      .map((entry, index) => ({ entry, index }))
      .sort((a, b) => (b.entry.ts || 0) - (a.entry.ts || 0))[0].index;

    const removed = log.splice(sortedIndex, 1)[0];
    saveJSON(KEY_LOG, log);
    renderLog(log);

    const nextTrainingDay = bestGuessNextDay(log);
    $("nextDayPill").textContent = `Next: ${PLAN[nextTrainingDay].title}`;

    toast(`Deleted: ${removed.exercise}`);
  });

  $("btnSettings").addEventListener("click", () => {
    $("settingsPanel").classList.toggle("hidden");
  });

  $("btnCloseSettings").addEventListener("click", () => {
    $("settingsPanel").classList.add("hidden");
  });

  $("btnExport").addEventListener("click", () => {
    downloadText(exportCSV(log), "jen-fitness-log.csv", "text/csv;charset=utf-8");
    toast("Exported workout log.");
  });

  $("btnExportWeigh").addEventListener("click", () => {
    downloadText(exportWeighCSV(weigh), "jen-weigh-ins.csv", "text/csv;charset=utf-8");
    toast("Exported weigh-ins.");
  });

  $("btnClear").addEventListener("click", () => {
    if (!confirm("Clear the entire workout log? This cannot be undone.")) return;
    log = [];
    saveJSON(KEY_LOG, log);
    renderLog(log);
    $("nextDayPill").textContent = `Next: ${PLAN.A.title}`;
    toast("Workout log cleared.");
  });

  $("btnClearWeigh").addEventListener("click", () => {
    if (!confirm("Clear the entire weigh-in log? This cannot be undone.")) return;
    weigh = [];
    saveJSON(KEY_WEIGH, weigh);
    renderWeigh();
    toast("Weigh-ins cleared.");
  });

  $("btnSaveDaily").addEventListener("click", () => {
    const key = todayISO();
    daily[key] = {
      workoutDone: $("chkWorkoutDone").checked,
      proteinGoal: $("chkProteinGoal").checked,
      water: $("chkWater").checked,
      steps: $("chkSteps").checked,
      calories
