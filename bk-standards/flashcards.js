// Карточки: сессия из 10, автогенерация из STANDARDS.
// Типы: сроки хранения, порционирование, цветовые коды.

const FC_STORAGE_KEY = "bk_flashcards_stats";
const FC_SESSION_SIZE = 10;

function getStats() {
  try {
    return JSON.parse(localStorage.getItem(FC_STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveStats(stats) {
  localStorage.setItem(FC_STORAGE_KEY, JSON.stringify(stats));
}

function generateFlashcards() {
  const cards = [];

  STANDARDS.forEach((item) => {
    // 1. Сроки хранения
    if (item.storage && item.storage.length) {
      item.storage.forEach((s, i) => {
        cards.push({
          id: `storage:${item.id}:${i}`,
          standardId: item.id,
          category: item.category,
          question: `Какой срок хранения?`,
          details: `${item.name} — ${s.place} (${s.temp})`,
          answer: s.time,
        });
      });
    }

    // 2. Порционирование
    if (item.portioning && item.portioning.length) {
      item.portioning.forEach((p, i) => {
        const fingerPart = p.fingers > 0 ? `, ${p.fingers} пальца` : "";
        cards.push({
          id: `portion:${item.id}:${i}`,
          standardId: item.id,
          category: item.category,
          question: `Сколько грамм?`,
          details: `${item.name} — ${p.bun}${fingerPart}`,
          answer: `${p.grams} г`,
        });
      });
    }

    // 3. Цветовые коды
    if (item.colorCode && item.colorCode.color) {
      cards.push({
        id: `color:${item.id}`,
        standardId: item.id,
        category: item.category,
        question: `Какого цвета накладка на ручку дозатора?`,
        details: item.name,
        answer: item.colorCode.color,
      });
    }
  });

  return cards;
}

function cardWeight(id, stats) {
  const s = stats[id] || { know: 0, dontKnow: 0 };
  return (s.dontKnow + 1) / (s.know + s.dontKnow + 2);
}

function pickWeighted(deck, stats) {
  const weights = deck.map((c) => cardWeight(c.id, stats));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < deck.length; i++) {
    r -= weights[i];
    if (r <= 0) return deck[i];
  }
  return deck[deck.length - 1];
}

function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderFlashcards() {
  titleEl.textContent = "Карточки";
  backBtn.hidden = false;

  const allCards = generateFlashcards();
  const stats = getStats();

  let sessionQueue = [];
  let current = null;
  let flipped = false;
  let questionIndex = 0;
  let sessionKnown = 0;
  let sessionUnknown = 0;
  let finished = false;

  function startSession() {
    // Берём 10 карточек с учётом веса (чаще — проблемные)
    const picked = [];
    const remaining = [...allCards];
    for (let i = 0; i < FC_SESSION_SIZE && remaining.length > 0; i++) {
      const card = pickWeighted(remaining, stats);
      picked.push(card);
      const idx = remaining.findIndex((c) => c.id === card.id);
      if (idx >= 0) remaining.splice(idx, 1);
    }
    sessionQueue = picked;
    questionIndex = 0;
    sessionKnown = 0;
    sessionUnknown = 0;
    finished = false;
    loadCard();
  }

  function loadCard() {
    if (questionIndex >= sessionQueue.length) {
      finished = true;
      current = null;
      render();
      return;
    }
    current = sessionQueue[questionIndex];
    flipped = false;
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
      <h1>Карточки</h1>
      <div class="timer-progress">
        <span class="timer-progress-text">Карточка ${questionIndex + 1} из ${sessionQueue.length}</span>
        <div class="timer-progress-bar"><div class="timer-progress-fill" style="width:${(questionIndex / sessionQueue.length) * 100}%"></div></div>
        <span class="timer-progress-score">Знаю: ${sessionKnown}</span>
      </div>

      <div class="flashcard" id="flashcard">
        <div class="flashcard-inner ${flipped ? "flipped" : ""}">
          <div class="flashcard-face flashcard-front">
            <div class="timer-cat">${catName}</div>
            <p class="flashcard-q">${current.question}</p>
            <p class="flashcard-details">${current.details}</p>
            <p class="flashcard-hint">Нажми, чтобы увидеть ответ</p>
          </div>
          <div class="flashcard-face flashcard-back">
            <div class="timer-cat">Ответ</div>
            <p class="flashcard-a">${current.answer}</p>
            <button class="link-btn" id="open-base">Открыть в базе</button>
          </div>
        </div>
      </div>

      <div class="flashcard-controls">
        ${
          flipped
            ? `
          <button class="fc-btn fc-no" id="btn-no">Не знаю</button>
          <button class="fc-btn fc-yes" id="btn-yes">Знаю</button>
        `
            : `<button class="fc-btn fc-show" id="btn-show">Показать ответ</button>`
        }
      </div>
    `;

    const cardEl = document.getElementById("flashcard");
    cardEl.onclick = () => {
      if (!flipped) {
        flipped = true;
        render();
      }
    };

    if (!flipped) {
      document.getElementById("btn-show").onclick = (e) => {
        e.stopPropagation();
        flipped = true;
        render();
      };
    } else {
      document.getElementById("btn-yes").onclick = (e) => {
        e.stopPropagation();
        answerCard(true);
      };
      document.getElementById("btn-no").onclick = (e) => {
        e.stopPropagation();
        answerCard(false);
      };
      document.getElementById("open-base").onclick = (e) => {
        e.stopPropagation();
        location.hash = `#/item/${current.standardId}`;
      };
    }
  }

  function answerCard(know) {
    const s = stats[current.id] || { know: 0, dontKnow: 0 };
    if (know) {
      s.know += 1;
      sessionKnown += 1;
    } else {
      s.dontKnow += 1;
      sessionUnknown += 1;
    }
    stats[current.id] = s;
    saveStats(stats);

    questionIndex += 1;
    loadCard();
  }

  function renderResult() {
    app.innerHTML = `
      <h1>Результат</h1>
      <div class="timer-result">
        <div class="timer-result-score">${sessionKnown} / ${sessionQueue.length}</div>
        <div class="timer-result-percent">знаю</div>
        <p class="timer-result-verdict">Не знаю: ${sessionUnknown}</p>
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