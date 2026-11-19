// Температурный светофор: продукт + температура -> можно / нельзя.
// Сессия из 10. Диапазоны парсятся из storage.temp.

const TEMP_SESSION_SIZE = 10;

function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Парсим строку вида "1–4°C", "18–29°C", "−18…−23°C", "мин. 60°C", "+1…+4°C"
// Возвращает { min, max } или null
function parseTempRange(str) {
  if (!str) return null;
  const s = str.replace(/[−–—]/g, "-").replace(/…/g, "-").replace(/\+/g, "");

  // "мин. 60°C" -> от 60 до 60
  const minOnly = s.match(/мин\.?\s*(-?\d+)/i);
  if (minOnly) {
    const v = parseInt(minOnly[1], 10);
    return { min: v, max: v };
  }

  // "1-4°C" или "-18--23°C"
  const range = s.match(/(-?\d+)\s*-\s*(-?\d+)/);
  if (range) {
    let a = parseInt(range[1], 10);
    let b = parseInt(range[2], 10);
    if (a > b) [a, b] = [b, a];
    return { min: a, max: b };
  }

  // одно число "12°C"
  const single = s.match(/(-?\d+)/);
  if (single) {
    const v = parseInt(single[1], 10);
    return { min: v, max: v };
  }

  return null;
}

function generateTempPool() {
  const pool = [];

  STANDARDS.forEach((item) => {
    if (!item.storage || !item.storage.length) return;
    item.storage.forEach((s, i) => {
      const range = parseTempRange(s.temp);
      if (!range) return;

      // Случайная температура внутри диапазона (тогда "можно")
      const inside = Math.round(
        range.min + Math.random() * (range.max - range.min)
      );
      // Случайная снаружи: либо ниже min-3, либо выше max+3
      const outside =
        Math.random() < 0.5
          ? range.min - (3 + Math.floor(Math.random() * 10))
          : range.max + (3 + Math.floor(Math.random() * 10));

      const makeInside = Math.random() < 0.5;

      pool.push({
        id: `temp:${item.id}:${i}:${makeInside ? "in" : "out"}`,
        standardId: item.id,
        category: item.category,
        productName: item.name,
        place: s.place,
        rangeText: s.temp,
        testTemp: makeInside ? inside : outside,
        answer: makeInside, // true = можно, false = нельзя
      });
    });
  });

  return pool;
}

function renderTemp() {
  titleEl.textContent = "Температурный светофор";
  backBtn.hidden = false;

  const pool = generateTempPool();

  let sessionQueue = [];
  let current = null;
  let answered = false;
  let chosen = null; // true/false
  let questionIndex = 0;
  let correctCount = 0;
  let finished = false;

  function startSession() {
    const shuffled = shuffleArr(pool);
    sessionQueue = shuffled.slice(0, TEMP_SESSION_SIZE);
    while (sessionQueue.length < TEMP_SESSION_SIZE && shuffled.length > 0) {
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
      <h1>Температурный светофор</h1>
      <div class="timer-progress">
        <span class="timer-progress-text">Вопрос ${questionIndex + 1} из ${sessionQueue.length}</span>
        <div class="timer-progress-bar"><div class="timer-progress-fill" style="width:${(questionIndex / sessionQueue.length) * 100}%"></div></div>
        <span class="timer-progress-score">Верно: ${correctCount}</span>
      </div>

      <div class="timer-question">
        <div class="timer-cat">${catName}</div>
        <p class="timer-q-text">Можно хранить при такой температуре?</p>
        <div class="timer-q-details">
          <span class="timer-q-product">${current.productName}</span>
          <span class="timer-q-place">${current.place}</span>
          <span class="temp-test-temp">${current.testTemp}°C</span>
        </div>
      </div>

      <div class="temp-options">
        <button class="temp-opt temp-yes ${
          answered && current.answer === true ? "correct" : ""
        } ${
      answered && chosen === true && current.answer !== true ? "wrong" : ""
    }" id="btn-yes" ${answered ? "disabled" : ""}>✓ Можно</button>
        <button class="temp-opt temp-no ${
          answered && current.answer === false ? "correct" : ""
        } ${
      answered && chosen === false && current.answer !== false ? "wrong" : ""
    }" id="btn-no" ${answered ? "disabled" : ""}>✕ Нельзя</button>
      </div>

      <div class="timer-footer">
        ${
          answered
            ? `
          <div class="temp-range-info">Правильный диапазон: <strong>${current.rangeText}</strong></div>
          <button class="timer-next" id="next-q">${questionIndex + 1 < sessionQueue.length ? "Дальше →" : "Результат →"}</button>
        `
            : `<span class="timer-hint">Выбери ответ</span>`
        }
      </div>
    `;

    if (!answered) {
      document.getElementById("btn-yes").onclick = () => answer(true);
      document.getElementById("btn-no").onclick = () => answer(false);
    }

    const nextBtn = document.getElementById("next-q");
    if (nextBtn) {
      nextBtn.onclick = () => {
        questionIndex += 1;
        loadQuestion();
      };
    }
  }

  function answer(val) {
    if (answered) return;
    chosen = val;
    answered = true;
    if (val === current.answer) correctCount += 1;
    render();
  }

  function renderResult() {
    const total = sessionQueue.length;
    const percent = Math.round((correctCount / total) * 100);
    let verdict = "";
    if (percent === 100) verdict = "Идеально!";
    else if (percent >= 80) verdict = "Отлично!";
    else if (percent >= 60) verdict = "Неплохо, но есть что подтянуть.";
    else verdict = "Стоит повторить температурные режимы.";

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
    document.getElementById("restart").onclick = () => startSession();
  }

  startSession();
}