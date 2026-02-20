/* app.js — Organe raten + Funktionsfrage (offline, ohne Server-API)
   Voraussetzungen im HTML (IDs):
   qNow, qTotal, wrong, wrongMax, kicker, organImg, answers, feedback, bar,
   restartBtn, skipBtn, overlay, modalTitle, modalText, modalRestart, modalClose
*/

(() => {
  const WRONG_MAX = 5;
  const $ = (id) => document.getElementById(id);

  // UI refs
  const qNow = $("qNow");
  const qTotal = $("qTotal");
  const wrongEl = $("wrong");
  const wrongMaxEl = $("wrongMax");
  const kicker = $("kicker");
  const imgEl = $("organImg");
  const answersWrap = $("answers");
  const feedback = $("feedback");
  const bar = $("bar");

  const restartBtn = $("restartBtn");
  const skipBtn = $("skipBtn");

  const overlay = $("overlay");
  const modalTitle = $("modalTitle");
  const modalText = $("modalText");
  const modalRestart = $("modalRestart");
  const modalClose = $("modalClose");

  if (wrongMaxEl) wrongMaxEl.textContent = String(WRONG_MAX);

  // ---- Daten: 8 Organe (Bild + 3 Antworten) + Funktionsfrage (3 Antworten)
  // Passe hier bei Bedarf Bildpfade / Optionen an.
  const items = [
    {
      label: "Herz",
      img: "img/herz.png",
      organOptions: ["Herz", "Leber", "Lunge"],
      func: {
        text: "Welche Hauptfunktion hat das Herz?",
        options: ["Es pumpt Blut durch den Körper.", "Es speichert Galle.", "Es produziert Urin."],
        correct: "Es pumpt Blut durch den Körper.",
      },
    },
    {
      label: "Gehirn",
      img: "img/hirn.png",
      organOptions: ["Magen", "Gehirn", "Niere"],
      func: {
        text: "Welche Aufgabe hat das Gehirn hauptsächlich?",
        options: ["Es steuert Körperfunktionen und verarbeitet Informationen.", "Es produziert Verdauungssäfte.", "Es entgiftet das Blut."],
        correct: "Es steuert Körperfunktionen und verarbeitet Informationen.",
      },
    },
    {
      label: "Lunge",
      img: "img/lunge.png",
      organOptions: ["Lunge", "Darm", "Leber"],
      func: {
        text: "Wofür ist die Lunge vor allem zuständig?",
        options: ["Gasaustausch: Sauerstoff aufnehmen, CO₂ abgeben.", "Nährstoffe speichern.", "Blut filtern und Urin bilden."],
        correct: "Gasaustausch: Sauerstoff aufnehmen, CO₂ abgeben.",
      },
    },
    {
      label: "Leber",
      img: "img/leber.png",
      organOptions: ["Bauchspeicheldrüse", "Leber", "Gehirn"],
      func: {
        text: "Welche Funktion passt zur Leber?",
        options: ["Sie entgiftet und verarbeitet Stoffwechselprodukte.", "Sie pumpt Blut.", "Sie ist der Hauptort des Gasaustauschs."],
        correct: "Sie entgiftet und verarbeitet Stoffwechselprodukte.",
      },
    },
    {
      label: "Magen",
      img: "img/magen.png",
      organOptions: ["Niere", "Magen", "Herz"],
      func: {
        text: "Was macht der Magen hauptsächlich?",
        options: ["Er mischt Nahrung und beginnt die Verdauung mit Magensäure.", "Er bildet Urin.", "Er steuert Reflexe."],
        correct: "Er mischt Nahrung und beginnt die Verdauung mit Magensäure.",
      },
    },
    {
      label: "Niere",
      img: "img/niere.png",
      organOptions: ["Darm", "Niere", "Lunge"],
      func: {
        text: "Welche Aufgabe haben die Nieren vor allem?",
        options: ["Sie filtern Blut und bilden Urin.", "Sie speichern Vitamin B12.", "Sie produzieren Galle."],
        correct: "Sie filtern Blut und bilden Urin.",
      },
    },
    {
      label: "Darm",
      img: "img/darm.png",
      organOptions: ["Darm", "Leber", "Magen"],
      func: {
        text: "Welche Funktion passt am besten zum Darm?",
        options: ["Nährstoffe und Wasser werden aufgenommen.", "Blut wird gepumpt.", "Gase werden ausgetauscht."],
        correct: "Nährstoffe und Wasser werden aufgenommen.",
      },
    },
    {
      label: "Bauchspeicheldrüse",
      img: "img/pankreas.png",
      organOptions: ["Herz", "Bauchspeicheldrüse", "Gehirn"],
      func: {
        text: "Wofür ist die Bauchspeicheldrüse wichtig?",
        options: ["Sie bildet Verdauungsenzyme und Insulin.", "Sie produziert Urin.", "Sie speichert Galle."],
        correct: "Sie bildet Verdauungsenzyme und Insulin.",
      },
    },
  ];

  qTotal.textContent = String(items.length);

  // ---- State
  let idx = 0;                 // welches Organ (0..7)
  let stage = "organ";         // "organ" | "function"
  let wrongTotal = 0;
  let locked = false;

  let correctOrgans = 0;
  let correctFunctions = 0;

  // ---- Helpers
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function setFeedback(type, html) {
    feedback.classList.remove("good", "bad");
    if (type) feedback.classList.add(type);
    feedback.innerHTML = html;
  }

  function updateHeader() {
    qNow.textContent = String(idx + 1);
    wrongEl.textContent = String(wrongTotal);

    // Fortschritt: Organ = 50%, Funktion = 100% je Organ
    const totalSteps = items.length * 2;
    const step = idx * 2 + (stage === "function" ? 1 : 0);
    const pct = Math.round((step / totalSteps) * 100);
    bar.style.width = `${pct}%`;

    // Kicker
    kicker.textContent = stage === "organ"
      ? `Frage ${idx + 1} – Organ`
      : `Frage ${idx + 1} – Funktion`;
  }

  function render() {
    locked = false;
    const item = items[idx];

    updateHeader();

    // Bild immer zeigen (auch bei Funktionsfrage)
    imgEl.src = item.img;
    imgEl.alt = `Organ: ${item.label}`;

    // Frage + Optionen je Stage
    answersWrap.innerHTML = "";

    if (stage === "organ") {
      setFeedback(null, `<span>Welches Organ ist das?</span>`);
      const opts = shuffle(item.organOptions);

      opts.forEach((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "answer";
        btn.innerHTML = `<span>${opt}</span><span class="mark">Wählen</span>`;
        btn.addEventListener("click", () => handleAnswer(btn, opt));
        answersWrap.appendChild(btn);
      });

    } else {
      setFeedback(null, `<span><strong>Zusatzfrage:</strong> ${item.func.text}</span>`);
      const opts = shuffle(item.func.options);

      opts.forEach((opt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "answer";
        btn.innerHTML = `<span>${opt}</span><span class="mark">Wählen</span>`;
        btn.addEventListener("click", () => handleAnswer(btn, opt));
        answersWrap.appendChild(btn);
      });
    }
  }

  function handleAnswer(button, chosen) {
    if (locked) return;

    const item = items[idx];

    if (stage === "organ") {
      const correct = item.label;

      if (chosen === correct) {
        locked = true;
        correctOrgans++;
        setFeedback("good", `✅ <strong>Richtig!</strong> Das ist das <strong>${correct}</strong>.`);

        setTimeout(() => {
          stage = "function";
          render();
        }, 450);

      } else {
        wrongTotal++;
        button.disabled = true;
        button.querySelector(".mark").textContent = "Falsch";

        const rest = Math.max(0, WRONG_MAX - wrongTotal);
        setFeedback("bad", `❌ <strong>Falsch.</strong> Noch <strong>${rest}</strong> Versuch(e).`);
        wrongEl.textContent = String(wrongTotal);

        if (wrongTotal >= WRONG_MAX) endGame(false);
      }

    } else {
      const correct = item.func.correct;

      if (chosen === correct) {
        locked = true;
        correctFunctions++;
        setFeedback("good", `✅ <strong>Richtig!</strong>`);

        setTimeout(() => {
          nextItemOrFinish();
        }, 450);

      } else {
        wrongTotal++;
        button.disabled = true;
        button.querySelector(".mark").textContent = "Falsch";

        const rest = Math.max(0, WRONG_MAX - wrongTotal);
        setFeedback("bad", `❌ <strong>Falsch.</strong> Noch <strong>${rest}</strong> Versuch(e).`);
        wrongEl.textContent = String(wrongTotal);

        if (wrongTotal >= WRONG_MAX) endGame(false);
      }
    }
  }

  function nextItemOrFinish() {
    // Nach Funktionsfrage geht’s zum nächsten Organ
    idx++;
    stage = "organ";

    if (idx >= items.length) {
      endGame(true);
    } else {
      render();
    }
  }

  function endGame(won) {
    locked = true;
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");

    if (won) {
      modalTitle.textContent = "Geschafft 🎉";
      modalText.innerHTML =
        `Du bist durch!<br><br>` +
        `✅ Organe richtig: <strong>${correctOrgans}</strong> / ${items.length}<br>` +
        `✅ Funktionen richtig: <strong>${correctFunctions}</strong> / ${items.length}<br>` +
        `❌ Fehler: <strong>${wrongTotal}</strong> / ${WRONG_MAX}`;
      bar.style.width = "100%";
    } else {
      modalTitle.textContent = "Spiel beendet";
      modalText.innerHTML =
        `Du hast <strong>${WRONG_MAX}</strong> Fehlversuche erreicht.<br><br>` +
        `✅ Organe richtig: <strong>${correctOrgans}</strong> / ${items.length}<br>` +
        `✅ Funktionen richtig: <strong>${correctFunctions}</strong> / ${items.length}`;
    }
  }

  function closeOverlay() {
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
  }

  function restart() {
    idx = 0;
    stage = "organ";
    wrongTotal = 0;
    locked = false;
    correctOrgans = 0;
    correctFunctions = 0;

    closeOverlay();
    wrongEl.textContent = "0";
    bar.style.width = "0%";
    render();
  }

  function preloadImages() {
    items.forEach((q) => {
      const i = new Image();
      i.src = q.img;
    });
  }

  // Skip ohne Strafpunkt:
  // - Wenn du beim Organ bist: überspringt Organ + Funktionsfrage
  // - Wenn du bei Funktion bist: überspringt nur Funktion und geht weiter
  function skip() {
    if (locked) return;

    if (stage === "organ") {
      idx++;
      stage = "organ";
      if (idx >= items.length) endGame(true);
      else render();
    } else {
      nextItemOrFinish();
    }
  }

  // Events
  skipBtn?.addEventListener("click", skip);
  restartBtn?.addEventListener("click", restart);
  modalRestart?.addEventListener("click", restart);
  modalClose?.addEventListener("click", closeOverlay);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && overlay.classList.contains("show")) restart();
    if (e.key === "Escape" && overlay.classList.contains("show")) closeOverlay();
  });

  // Start
  preloadImages();
  render();
})();
