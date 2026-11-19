const QUIZ_SESSION_SIZE = 10;

function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderQuiz() {
  titleEl.textContent = "Проверка знаний";
  backBtn.hidden = false;

  let sessionQueue = [];
  let current = null;
  let chosenIndex = null;
  let answered = false;
  let questionIndex = 0;
  let correctCount = 0;
  let finished = false;
  let mistakes = [];

  function startSession() {
    sessionQueue = shuffleArr(QUESTIONS).slice(0, QUIZ_SESSION_SIZE);
    questionIndex = 0;
    correctCount = 0;
    mistakes = [];
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
    chosenIndex = null;
    answered = false;
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
      <h1>Проверка знаний</h1>
      <div class="timer-progress">
        <span class="timer-progress-text">Вопрос ${questionIndex + 1} из ${sessionQueue.length}</span>
        <div class="timer-progress-bar"><div class="timer-progress-fill" style="width:${(questionIndex / sessionQueue.length) * 100}%"></div></div>
        <span class="timer-progress-score">Верно: ${correctCount}</span>
      </div>

      <div class="timer-question">
        <div class="timer-cat">${catName}</div>
        <p class="timer-q-text">${current.text}</p>
      </div>

      <div class="timer-options">
        ${current.options
          .map((opt, i) => {
            let cls = "timer-opt";
            let icon = "";
            if (answered) {
              if (i === current.answer) {
                cls += " correct";
                icon = " ✓";
              } else if (i === chosenIndex) {
                cls += " wrong";
                icon = " ✕";
              }
            }
            return `<button class="${cls}" data-idx="${i}">${opt}${icon}</button>`;
          })
          .join("")}
      </div>

      <div class="timer-footer">
        ${
          answered
            ? `<button class="timer-next" id="next-q">${questionIndex + 1 < sessionQueue.length ? "Дальше →" : "Результат →"}</button>`
            : `<span class="timer-hint">Выбери ответ</span>`
        }
      </div>
    `;

    app.querySelectorAll(".timer-opt").forEach((btn) => {
      btn.onclick = () => {
        if (answered) return;
        const idx = parseInt(btn.getAttribute("data-idx"), 10);
        chosenIndex = idx;
        answered = true;
        if (idx === current.answer) {
          correctCount += 1;
        } else {
          mistakes.push({
            text: current.text,
            correct: current.options[current.answer],
            chosen: current.options[idx],
            standardId: current.standardId,
          });
        }
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
    else verdict = "Стоит повторить материал.";

    let mistakesHtml = "";
    if (mistakes.length) {
      mistakesHtml = `<h2>Разбор ошибок</h2><div class="quiz-mistakes">`;
      mistakes.forEach((m) => {
        mistakesHtml += `
          <div class="quiz-mistake">
            <p class="quiz-mistake-q">${m.text}</p>
            <p class="quiz-mistake-wrong">Твой ответ: ${m.chosen}</p>
            <p class="quiz-mistake-right">Правильно: ${m.correct}</p>
            <button class="link-btn" data-open="${m.standardId}">Открыть в базе</button>
          </div>
        `;
      });
      mistakesHtml += `</div>`;
    }

    app.innerHTML = `
      <h1>Результат</h1>
      <div class="timer-result">
        <div class="timer-result-score">${correctCount} / ${total}</div>
        <div class="timer-result-percent">${percent}%</div>
        <p class="timer-result-verdict">${verdict}</p>
      </div>
      ${mistakesHtml}
      <div class="timer-footer">
        <button class="timer-next" id="restart">Ещё раз</button>
      </div>
    `;

    document.getElementById("restart").onclick = () => startSession();
    app.querySelectorAll("[data-open]").forEach((btn) => {
      btn.onclick = () => {
        location.hash = `#/item/${btn.getAttribute("data-open")}`;
      };
    });
  }

  app.innerHTML = `
    <h1>Проверка знаний</h1>
    <p>Тест из ${QUIZ_SESSION_SIZE} случайных вопросов из банка на ${QUESTIONS.length}.</p>
    <div class="big-buttons">
      <button class="big-btn" id="start-quiz">Начать тест</button>
    </div>
  `;
  document.getElementById("start-quiz").onclick = () => startSession();
}