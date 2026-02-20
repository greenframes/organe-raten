

(() => {
  const WRONG_MAX = 5;
  document.getElementById("wrongMax").textContent = String(WRONG_MAX);

  // 👉 Hier nur Dateinamen anpassen, wenn du andere Namen/Endungen nutzt
  const questions = [
    { id: "heart",    label: "Herz",               img: "img/herz.png",     options: ["Herz", "Leber", "Lunge"] },
    { id: "brain",    label: "Gehirn",             img: "img/gehirn.png",   options: ["Magen", "Gehirn", "Niere"] },
    { id: "lungs",    label: "Lunge",              img: "img/lunge.png",    options: ["Lunge", "Darm", "Leber"] },
    { id: "liver",    label: "Leber",              img: "img/leber.png",    options: ["Bauchspeicheldrüse", "Leber", "Gehirn"] },
    { id: "stomach",  label: "Magen",              img: "img/magen.png",    options: ["Niere", "Magen", "Herz"] },
    { id: "kidney",   label: "Niere",              img: "img/niere.png",    options: ["Darm", "Niere", "Lunge"] },
    { id: "intestine",label: "Darm",               img: "img/darm.png",     options: ["Darm", "Leber", "Magen"] },
    { id: "pancreas", label: "Bauchspeicheldrüse", img: "img/pankreas.png", options: ["Herz", "Bauchspeicheldrüse", "Gehirn"] },
  ];

  let idx = 0;
  let wrongTotal = 0;
  let locked = false;

  const qNow = document.getElementById("qNow");
  const qTotal = document.getElementById("qTotal");
  const wrongEl = document.getElementById("wrong");
  const kicker = document.getElementById("kicker");
  const imgEl = document.getElementById("organImg");
  const answersWrap = document.getElementById("answers");
  const feedback = document.getElementById("feedback");
  const bar = document.getElementById("bar");

  const restartBtn = document.getElementById("restartBtn");
  const skipBtn = document.getElementById("skipBtn");

  const overlay = document.getElementById("overlay");
  const modalTitle = document.getElementById("modalTitle");
  const modalText = document.getElementById("modalText");
  const modalRestart = document.getElementById("modalRestart");
  const modalClose = document.getElementById("modalClose");

  qTotal.textContent = String(questions.length);

  function shuffle(arr){
    const a = [...arr];
    for(let i=a.length-1; i>0; i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function setFeedback(type, html){
    feedback.classList.remove("good", "bad");
    if(type) feedback.classList.add(type);
    feedback.innerHTML = html;
  }

  function updateProgress(){
    qNow.textContent = String(idx + 1);
    kicker.textContent = `Frage ${idx + 1}`;
    wrongEl.textContent = String(wrongTotal);

    const pct = Math.round((idx / questions.length) * 100);
    bar.style.width = `${pct}%`;
  }

  function preloadImages(){
    questions.forEach(q => {
      const i = new Image();
      i.src = q.img;
    });
  }

  function renderQuestion(){
    locked = false;
    const q = questions[idx];

    updateProgress();

    imgEl.src = q.img;
    imgEl.alt = `Organ: ${q.label}`;

    answersWrap.innerHTML = "";
    const opts = shuffle(q.options);

    opts.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "answer";
      btn.innerHTML = `<span>${opt}</span><span class="mark">Wählen</span>`;
      btn.addEventListener("click", () => onAnswer(btn, opt));
      answersWrap.appendChild(btn);
    });

    setFeedback(null, `<span>Wähle die richtige Bezeichnung.</span>`);
  }

  function onAnswer(button, chosen){
    if(locked) return;

    const correct = questions[idx].label;

    if(chosen === correct){
      locked = true;
      setFeedback("good", `✅ <strong>Richtig!</strong> ${correct}.`);
      setTimeout(() => {
        idx++;
        if(idx >= questions.length){
          endGame(true);
        } else {
          renderQuestion();
        }
      }, 550);
    } else {
      wrongTotal++;
      button.disabled = true;
      button.querySelector(".mark").textContent = "Falsch";

      const rest = Math.max(0, WRONG_MAX - wrongTotal);
      setFeedback("bad", `❌ <strong>Falsch.</strong> Noch <strong>${rest}</strong> Versuch(e).`);

      wrongEl.textContent = String(wrongTotal);

      if(wrongTotal >= WRONG_MAX){
        endGame(false);
      }
    }
  }

  function endGame(won){
    locked = true;
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");

    if(won){
      modalTitle.textContent = "Geschafft 🎉";
      modalText.textContent = `Alle ${questions.length} Organe erkannt – mit ${wrongTotal} Fehler(n).`;
      bar.style.width = "100%";
    } else {
      modalTitle.textContent = "Spiel beendet";
      modalText.textContent = `Du hast ${WRONG_MAX} Fehlversuche erreicht.`;
    }
  }

  function closeOverlay(){
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
  }

  function restart(){
    idx = 0;
    wrongTotal = 0;
    closeOverlay();
    wrongEl.textContent = "0";
    bar.style.width = "0%";
    renderQuestion();
  }

  skipBtn.addEventListener("click", () => {
    if(locked) return;
    idx++;
    if(idx >= questions.length){
      endGame(true);
    } else {
      renderQuestion();
    }
  });

  restartBtn.addEventListener("click", restart);
  modalRestart.addEventListener("click", restart);
  modalClose.addEventListener("click", closeOverlay);

  document.addEventListener("keydown", (e) => {
    if(e.key === "Enter" && overlay.classList.contains("show")) restart();
    if(e.key === "Escape" && overlay.classList.contains("show")) closeOverlay();
  });

  // Start
  preloadImages();
  renderQuestion();
})();
