// Калькулятор порций: выбираешь продукт -> видишь все порционные значения.

function renderPortions() {
  titleEl.textContent = "Калькулятор порций";
  backBtn.hidden = false;

  // Собираем продукты, у которых есть что показать
  const items = STANDARDS.filter(
    (s) =>
      (s.portioning && s.portioning.length) ||
      (s.colorCode && s.colorCode.color)
  );

  // Группируем по категориям
  const grouped = {};
  items.forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  let html = `<h1>Калькулятор порций</h1><p class="hint">Выбери продукт, чтобы увидеть порционные значения.</p>`;

  CATEGORIES.forEach((cat) => {
    const list = grouped[cat.key];
    if (!list || !list.length) return;
    html += `<h2>${cat.name}</h2><div class="tiles">`;
    list.forEach((item) => {
      html += `<button class="tile" data-portion="${item.id}">${item.name}</button>`;
    });
    html += `</div>`;
  });

  app.innerHTML = html;

  app.querySelectorAll("[data-portion]").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.getAttribute("data-portion");
      renderPortionDetail(id);
    };
  });
}

function renderPortionDetail(id) {
  const item = STANDARDS.find((s) => s.id === id);
  if (!item) {
    renderPortions();
    return;
  }

  titleEl.textContent = item.name;
  backBtn.hidden = false;

  let html = `<h1>${item.name}</h1>`;

  // Порционирование
  if (item.portioning && item.portioning.length) {
    html += `<h2>Порции</h2><div class="portion-table">`;
    item.portioning.forEach((p) => {
      const fingerPart = p.fingers > 0 ? `${p.fingers} пальца` : "—";
      html += `
        <div class="portion-row">
          <div class="portion-name">${p.bun}</div>
          <div class="portion-value">${p.grams} г</div>
          <div class="portion-fingers">${fingerPart}</div>
        </div>
      `;
    });
    html += `</div>`;
  }

  // Цветовой код
  if (item.colorCode && item.colorCode.color) {
    html += `<h2>Дозатор</h2><div class="portion-color">`;
    html += `<div class="portion-color-row"><span>Дозировка:</span><strong>${item.colorCode.oz}</strong></div>`;
    html += `<div class="portion-color-row"><span>Накладка на ручку:</span><strong>${item.colorCode.color}</strong></div>`;
    if (item.colorCode.handle && item.colorCode.handle !== "—") {
      html += `<div class="portion-color-row"><span>Ручка:</span><strong>${item.colorCode.handle}</strong></div>`;
    }
    html += `</div>`;
  }

  // Красные флаги, если есть — полезно рядом с цифрами
  if (item.redFlags && item.redFlags.length) {
    html += `<h2>Важно</h2><ul class="portion-flags">`;
    item.redFlags.forEach((r) => (html += `<li>${r}</li>`));
    html += `</ul>`;
  }

  html += `<div class="timer-footer"><button class="timer-next" id="back-to-portions">← К списку</button></div>`;

  app.innerHTML = html;

  document.getElementById("back-to-portions").onclick = () => {
    renderPortions();
  };
}