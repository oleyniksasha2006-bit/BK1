// Таймер-тренажёр: сессия из 10 вопросов.
// Вопрос чётче, ответ — только срок, варианты — правдоподобные из той же категории.

const TIMER_SESSION_SIZE = 10;

function generateTimerPool() {
  const pool = [];
  STANDARDS.forEach((item) => {
    if (!item.storage || !item.storage.length) return;
    item.storage.forEach((s, i) => {
      pool.push({
        id: `timer:${item.id}:${i}`,
        standardId: item.id,
        category: item.category,
        productName: item.name,
        place: s.place,
        temp: s.temp,
        answer: s.time,
      });
    });
  });
  return pool;
}

function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Приводим срок к "весу" в минутах, чтобы подбирать близкие варианты
function parseTimeToMinutes(str) {
  if (!str) return null;
  let total = 0;
  let matched = false;
  const dayMatch = str.match(/(\d+)\s*дн/);
  if (dayMatch) {
    total += parseInt(dayMatch[1], 10) * 24 * 60;
    matched = true;
  }
  const hourMatch = str.match(/(\d+)\s*час/);
  if (hourMatch) {
    total += parseInt(hourMatch[1], 10) * 60;
    matched = true;
  }
  const minMatch = str.match(/(\d+)\s*мин/);
  if (minMatch) {
    total += parseInt(minMatch[1], 10);
    matched = true;
  }
  return matched ? total : null;
}

function buildOptions(current, allPool) {
  const correct = current.answer;

  // Кандидаты — только из той же категории, кроме правильного
  const sameCat = allPool
    .filter((p) => p.category === current.category && p.answer !== correct)
    .map((p) => p.answer);

  // Уникальные
  const uniq = [...new Set(sameCat)];

  // Если в категории мало вариантов — добираем из остальных
  let candidates = uniq;
  if (candidates.length < 3) {
    const others = allPool
      .filter((p) => p.answer !== correct)
      .map((p) => p.answer);
    candidates = [...new Set([...candidates, ...others])];
  }

  // Сортируем по близости к правильному сроку (в минутах)
  const correctMin = parseTimeToMinutes(correct);
  let sorted = candidates;
  if (correctMin !== null) {
    sorted = [...candidates].sort((a, b) => {
      const am = parseTimeToMinutes(a);
      const bm = parseTimeToMinutes(b);
      const ad = am === null ? Infinity : Math.abs(am - correctMin);
      const bd = bm === null ? Infinity : Math.abs(bm - correctMin);
      return ad - bd;
    });
  }

  // Берём 3 ближайших (или случайных, если не смогли распарсить)
  const wrongs = sorted.slice(0, 3);

  return shuffleArr([correct, ...wrongs]);
}

function renderTimer() {
  titleEl.textContent = "Таймер-тренажёр";
  backBtn.hidden = false;

  const pool = generateTimerPool();

  let sessionQueue = [];
  let current = null;
  let options = [];
  let answered = false;
  let chosen = null;
  let questionIndex = 0;
  let correctCount = 0;
  let finished = false;

  function startSession() {
    // Перемешиваем пул и берём 10 уникальных вопросов (по id)
    const shuffled = shuffleArr(pool);
    const seen = new Set();
    sessionQueue = [];
    for (const q of shuffled) {
      if (seen.has(q.id)) continue;
      seen.add(q.id);
      sessionQueue.push(q);
      if (sessionQueue.length === TIMER_SESSION_SIZE) break;
    }
    // Если уникальных меньше 10 — добираем повторами
    while (sessionQueue.length < TIMER_SESSION_SIZE) {
      sessionQueue.push(shuffled[Math.floor(Math.random() * shuffled.length)]);
    }

    questionIndex = 0;
    correctCount = 0;
    finished = false;
    loadQuestion();
  }

  function loadQuestion() {
    if (questionIndex >= sessionQueue.length) {
      finished = true;
      current = null;
      render();
      return;
    }
    current = sessionQueue[questionIndex];
    options = buildOptions(current, pool);
    answered = false;
    chosen = null;
    render();
  }

  function render() {
    if (finished) {
      renderResult();
      return;
    }

    const cat = CATEGORIES.find((c) => c.key === current.category);
    const catName = cat ? cat.name : "";

    app.innerHTML = `
      <h1>Таймер-тренажёр</h1>
      <div class="timer-progress">
        <span class="timer-progress-text">Вопрос ${questionIndex + 1} из ${sessionQueue.length}</span>
        <div class="timer-progress-bar"><div class="timer-progress-fill" style="width:${((questionIndex) / sessionQueue.length) * 100}%"></div></div>
        <span class="timer-progress-score">Верно: ${correctCount}</span>
      </div>

      <div class="timer-question">
        <div class="timer-cat">${catName}</div>
        <p class="timer-q-text">Какой срок хранения?</p>
        <div class="timer-q-details">
          <span class="timer-q-product">${current.productName}</span>
          <span class="timer-q-place">${current.place} · ${current.temp}</span>
        </div>
      </div>

      <div class="timer-options">
        ${options
          .map((opt) => {
            let cls = "timer-opt";
            let icon = "";
            if (answered) {
              if (opt === current.answer) {
                cls += " correct";
                icon = " ✓";
              } else if (opt === chosen) {
                cls += " wrong";
                icon = " ✕";
              }
            }
            return `<button class="${cls}" data-opt="${encodeURIComponent(opt)}">${opt}${icon}</button>`;
          })
          .join("")}
      </div>

      <div class="timer-footer">
        ${
          answered
            ? `<button class="timer-next" id="next-q">${questionIndex + 1 < sessionQueue.length ? "Дальше →" : "Результат →"}</button>`
            : `<span class="timer-hint">Выбери срок</span>`
        }
      </div>
    `;

    app.querySelectorAll(".timer-opt").forEach((btn) => {
      btn.onclick = () => {
        if (answered) return;
        const val = decodeURIComponent(btn.getAttribute("data-opt"));
        chosen = val;
        answered = true;
        if (val === current.answer) correctCount += 1;
        render();
      };
    });

    const nextBtn = document.getElementById("next-q");
    if (nextBtn) {
      nextBtn.onclick = () => {
        questionIndex += 1;
        loadQuestion();
      };
    }
  }

  function renderResult() {
    const total = sessionQueue.length;
    const percent = Math.round((correctCount / total) * 100);
    let verdict = "";
    if (percent === 100) verdict = "Идеально!";
    else if (percent >= 80) verdict = "Отлично!";
    else if (percent >= 60) verdict = "Неплохо, но есть что подтянуть.";
    else verdict = "Стоит повторить сроки.";

    app.innerHTML = `
      <h1>Результат</h1>
      <div class="timer-result">
        <div class="timer-result-score">${correctCount} / ${total}</div>
        <div class="timer-result-percent">${percent}%</div>
        <p class="timer-result-verdict">${verdict}</p>
      </div>
      <div class="timer-footer">
        <button class="timer-next" id="restart">Ещё раз</button>
      </div>
    `;
    document.getElementById("restart").onclick = () => {
      startSession();
    };
  }

  startSession();
}