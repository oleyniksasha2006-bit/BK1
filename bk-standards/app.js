const app = document.getElementById("app");
const backBtn = document.getElementById("back-btn");
const titleEl = document.getElementById("title");

// --- Экраны ---

function renderHome() {
  titleEl.textContent = "Стандарты BK";
  backBtn.hidden = true;
  app.innerHTML = `
    <h1>Стандарты BK</h1>
    <p>Выбери, что делать:</p>
    <div class="big-buttons">
      <button class="big-btn" data-go="#/learn">📚 Учить</button>
      <button class="big-btn" data-go="#/quiz">✅ Проверка знаний</button>
    </div>
  `;
  bindGoButtons();
}

function renderLearn() {
  titleEl.textContent = "Учить";
  backBtn.hidden = false;
  app.innerHTML = `
    <h1>Учить</h1>
    <div class="tiles">
      <button class="tile" data-go="#/learn/base">📖 База знаний</button>
      <button class="tile" data-go="#/learn/storage">⏱ Сроки хранения</button>
      <button class="tile" data-go="#/learn/interactive">🎮 Интерактивы</button>
    </div>
  `;
  bindGoButtons();
}

function renderBase() {
  titleEl.textContent = "База знаний";
  backBtn.hidden = false;
  let html = `<h1>База знаний</h1>`;
  CATEGORIES.forEach((cat) => {
    const items = STANDARDS.filter((s) => s.category === cat.key);
    if (items.length === 0) return;
    html += `<h2>${cat.name}</h2><div class="tiles">`;
    items.forEach((item) => {
      html += `<button class="tile" data-go="#/item/${item.id}">${item.name}</button>`;
    });
    html += `</div>`;
  });
  app.innerHTML = html;
  bindGoButtons();
}

function renderItem(id) {
  const item = STANDARDS.find((s) => s.id === id);
  if (!item) {
    app.innerHTML = `<h1>Не найдено</h1>`;
    return;
  }
  titleEl.textContent = item.name;
  backBtn.hidden = false;

  let html = `<h1>${item.name}</h1>`;
  if (item.danger) html += `<p><strong>⚠ Потенциально опасный продукт</strong></p>`;

  html += `<h2>Сроки и условия хранения</h2><ul>`;
  item.storage.forEach((s) => {
    html += `<li><strong>${s.place}</strong> (${s.temp}) — ${s.time}, ${s.container}</li>`;
  });
  html += `</ul>`;

  if (item.prep.length) {
    html += `<h2>Подготовка</h2><ol>`;
    item.prep.forEach((p) => (html += `<li>${p}</li>`));
    html += `</ol>`;
  }

  if (item.quality.length) {
    html += `<h2>Этапы обеспечения качества</h2><ol>`;
    item.quality.forEach((p) => (html += `<li>${p}</li>`));
    html += `</ol>`;
  }

  if (item.portioning) {
    html += `<h2>Метод «Щепоток»</h2><ul>`;
    item.portioning.forEach((p) => {
      html += `<li>${p.bun}: ${p.fingers} пальца — ${p.grams} г</li>`;
    });
    html += `</ul>`;
  }

  if (item.colorCode) {
    html += `<h2>Дозатор</h2><p>${item.colorCode.oz}, накладка на ручку — ${item.colorCode.color}</p>`;
  }

  if (item.redFlags.length) {
    html += `<h2>Красные флаги</h2><ul>`;
    item.redFlags.forEach((r) => (html += `<li>${r}</li>`));
    html += `</ul>`;
  }

  html += `<h2>В конце дня</h2><p>${item.endOfDay}</p>`;
  app.innerHTML = html;
}

function renderStorage() {
  titleEl.textContent = "Сроки хранения";
  backBtn.hidden = false;
  let html = `<h1>Сроки хранения</h1>`;
  CATEGORIES.forEach((cat) => {
    const items = STANDARDS.filter((s) => s.category === cat.key);
    if (items.length === 0) return;
    html += `<h2>${cat.name}</h2>`;
    items.forEach((item) => {
      html += `<h3>${item.name}</h3><ul>`;
      item.storage.forEach((s) => {
        html += `<li>${s.place} (${s.temp}) — <strong>${s.time}</strong>, ${s.container}</li>`;
      });
      html += `</ul>`;
    });
  });
  app.innerHTML = html;
}

function renderInteractive() {
  titleEl.textContent = "Интерактивы";
  backBtn.hidden = false;
  app.innerHTML = `
    <h1>Интерактивы</h1>
    <div class="tiles">
      <button class="tile" data-go="#/learn/flashcards">🃏 Карточки</button>
      <button class="tile" data-go="#/learn/procedure">🧩 Собери процедуру</button>
      <button class="tile" data-go="#/learn/timer">⏳ Таймер-тренажёр</button>
      <button class="tile" data-go="#/learn/temp">🌡 Температурный светофор</button>
      <button class="tile" data-go="#/learn/portions">🥄 Калькулятор порций</button>
    </div>
  `;
  bindGoButtons();
}

function renderPlaceholder(name) {
  titleEl.textContent = name;
  backBtn.hidden = false;
  app.innerHTML = `<h1>${name}</h1><p class="hint">Этот режим добавим позже.</p>`;
}

// --- Роутер ---

const routes = {
  "": renderHome,
  "#/learn": renderLearn,
  "#/learn/base": renderBase,
  "#/learn/storage": renderStorage,
  "#/learn/interactive": renderInteractive,
  "#/learn/flashcards": renderFlashcards,
  "#/learn/procedure": () => renderPlaceholder("Собери процедуру"),
  "#/learn/timer": renderTimer,
  "#/learn/temp": renderTemp,
  "#/learn/portions": renderPortions,
  "#/quiz": renderQuiz,
};

function router() {
  const hash = location.hash || "";
  app.innerHTML = "";
  if (hash.startsWith("#/item/")) {
    const id = hash.replace("#/item/", "");
    renderItem(id);
  } else {
    const render = routes[hash] || renderHome;
    render();
  }
  window.scrollTo(0, 0);
}

function bindGoButtons() {
  app.querySelectorAll("[data-go]").forEach((btn) => {
    btn.onclick = () => {
      location.hash = btn.getAttribute("data-go");
    };
  });
}

backBtn.onclick = () => {
  history.back();
};

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", router);