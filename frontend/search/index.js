const INGREDIENTES = [
  {id:1,  nombre:"Arroz"},        {id:2,  nombre:"Pollo"},
  {id:3,  nombre:"Papa criolla"}, {id:4,  nombre:"Papa pastusa"},
  {id:5,  nombre:"Mazorca"},      {id:6,  nombre:"Guascas"},
  {id:7,  nombre:"Hogao"},        {id:8,  nombre:"Cilantro"},
  {id:9,  nombre:"Cebolla"},      {id:10, nombre:"Tomate"},
  {id:11, nombre:"Ajo"},          {id:12, nombre:"Comino"},
  {id:13, nombre:"Mantequilla"},  {id:14, nombre:"Leche"},
  {id:15, nombre:"Queso"},        {id:16, nombre:"Huevo"},
  {id:17, nombre:"Harina"},       {id:18, nombre:"Panela"},
  {id:19, nombre:"Aguacate"},     {id:20, nombre:"Plátano"},
  {id:21, nombre:"Frijoles"},     {id:22, nombre:"Lentejas"},
  {id:23, nombre:"Chicharrón"},   {id:24, nombre:"Chorizo"},
  {id:25, nombre:"Carne molida"}, {id:26, nombre:"Costilla"},
  {id:27, nombre:"Camarón"},      {id:28, nombre:"Coco"},
  {id:29, nombre:"Yuca"},         {id:30, nombre:"Zanahoria"},
];

const RECETAS = [
  { id:1,  nombre:"Ajiaco Santafereño", ingredientes:[1,3,4,5,6,8,9,2] },
  { id:2,  nombre:"Bandeja Paisa", ingredientes:[1,21,23,24,16,19,10,2] },
  { id:3,  nombre:"Sancocho de Gallina", ingredientes:[2,5,9,8,12,10,29] },
  { id:4,  nombre:"Arroz con Pollo", ingredientes:[1,2,9,10,8,12,30] },
  { id:5,  nombre:"Arepas de Choclo", ingredientes:[17,15,13,14] },
  { id:6,  nombre:"Changua Bogotana", ingredientes:[14,16,9,8] },
  { id:7,  nombre:"Pandebono", ingredientes:[17,15,16,13] },
  { id:8,  nombre:"Natilla Colombiana", ingredientes:[14,18,12,13] },
  { id:9,  nombre:"Buñuelos de Queso", ingredientes:[17,15,16] },
  { id:10, nombre:"Cazuela de Mariscos", ingredientes:[27,28,9,8,10] },
  { id:11, nombre:"Empanadas de Pipián", ingredientes:[17,9,10,8,12] },
  { id:12, nombre:"Fritanga", ingredientes:[23,24,26,19] },
  { id:13, nombre:"Sopa de Lentejas", ingredientes:[22,9,10,30,8] },
  { id:14, nombre:"Caldo de Costilla", ingredientes:[26,9,3,8,12] },
  { id:15, nombre:"Arroz con Coco", ingredientes:[1,28,18] },
  { id:16, nombre:"Patacones", ingredientes:[20,11] },
  { id:17, nombre:"Sudado de Res", ingredientes:[25,9,10,30,8,12] },
  { id:18, nombre:"Aguapanela", ingredientes:[18] },
  { id:19, nombre:"Huevos Pericos", ingredientes:[16,9,10,8] },
  { id:20, nombre:"Frijoles Antioqueños", ingredientes:[21,9,10,23,8] },
];

const selected = new Set();

const input       = document.getElementById("searchInput");
const sugBox      = document.getElementById("suggestions");
const tagsWrap    = document.getElementById("tagsWrap");
const tagsClear   = document.getElementById("tagsClear");
const activeBar   = document.getElementById("activeBar");
const activePills = document.getElementById("activePills");
const cardsGrid   = document.getElementById("cardsGrid");
const resultsInfo = document.getElementById("resultsInfo");

function renderAllTags() {
  tagsWrap.innerHTML = "";
  INGREDIENTES.forEach((ing, i) => {
    const chip = document.createElement("button");
    chip.className = "tag-chip" + (selected.has(ing.id) ? " active" : "");
    chip.dataset.id = ing.id;
    chip.style.animationDelay = (i * 18) + "ms";
    chip.innerHTML = ing.nombre + '<span class="tag-x">✕</span>';
    chip.addEventListener("click", () => toggleTag(ing.id, chip));
    tagsWrap.appendChild(chip);
  });
}

function toggleTag(id, chip) {
  if (selected.has(id)) { selected.delete(id); chip.classList.remove("active"); }
  else                   { selected.add(id);    chip.classList.add("active"); }
  updateActiveBar();
  renderRecipes();
}

function updateActiveBar() {
  if (selected.size === 0) {
    activeBar.classList.remove("visible");
    tagsClear.classList.remove("visible");
  } else {
    activeBar.classList.add("visible");
    tagsClear.classList.add("visible");
    activePills.innerHTML = [...selected].map(id => {
      const ing = INGREDIENTES.find(i => i.id === id);
      return `<span class="active-pill">${ing ? ing.nombre : id}</span>`;
    }).join("");
  }
}

tagsClear.addEventListener("click", () => {
  selected.clear();
  document.querySelectorAll(".tag-chip.active").forEach(c => c.classList.remove("active"));
  updateActiveBar();
  renderRecipes();
});

function renderRecipes() {
  const q = input.value.trim().toLowerCase();
  let results = RECETAS;

  if (q) {
    results = results.filter(r => {
      const nameMatch = r.nombre.toLowerCase().includes(q);
      const ingMatch  = r.ingredientes.some(id => {
        const ing = INGREDIENTES.find(i => i.id === id);
        return ing && ing.nombre.toLowerCase().includes(q);
      });
      return nameMatch || ingMatch;
    });
  }

  if (selected.size > 0) {
    results = results.filter(r =>
      [...selected].every(id => r.ingredientes.includes(id))
    );
  }

  cardsGrid.innerHTML = "";

  if (!results.length) {
    cardsGrid.innerHTML = `
      <div class="no-results">
        
        <h3>Sin resultados</h3>
        <p>Prueba con otros ingredientes o quita algún filtro</p>
      </div>`;
    resultsInfo.innerHTML = "";
    return;
  }

  // Info text
  if (selected.size > 0 || q) {
    resultsInfo.innerHTML = `<strong>${results.length}</strong> receta${results.length !== 1 ? "s" : ""} encontrada${results.length !== 1 ? "s" : ""}`;
  } else {
    resultsInfo.innerHTML = `<strong>${results.length}</strong> recetas disponibles`;
  }

  results.forEach((receta, i) => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.style.animationDelay = (i * 40) + "ms";

    const ingChips = receta.ingredientes.map(id => {
      const ing = INGREDIENTES.find(x => x.id === id);
      if (!ing) return "";
      const isMatch = selected.has(id) || (q && ing.nombre.toLowerCase().includes(q));
      return `<span class="card-ing${isMatch ? " match" : ""}">${ing.nombre}</span>`;
    }).join("");

    card.innerHTML = `
      <div class="card-img">
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#e8435a" stroke-width="1.2">
          <path d="M3 11l19-9-9 19-2-8-8-2z"/>
        </svg>
      </div>
      <div class="card-body">
        <div class="card-name">${receta.nombre}</div>
        <div class="card-tags-row">${ingChips}</div>
      </div>`;
    cardsGrid.appendChild(card);
  });
}

// ── AUTOCOMPLETE ───────────────────────────────────────────────────────────
let debounce;
input.addEventListener("input", () => {
  clearTimeout(debounce);
  const q = input.value.trim();

  if (q.length < 1) { sugBox.classList.remove("open"); renderRecipes(); return; }

  debounce = setTimeout(() => {
    const matches = INGREDIENTES.filter(i =>
      i.nombre.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 8);

    if (!matches.length) { sugBox.classList.remove("open"); renderRecipes(); return; }

    sugBox.innerHTML = matches.map(m => {
      const hi = m.nombre.replace(new RegExp(`(${q})`, "gi"), '<span class="sug-hi">$1</span>');
      return `<div class="sug-item" data-id="${m.id}" data-nombre="${m.nombre}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>${hi}</div>`;
    }).join("");
    sugBox.classList.add("open");
    renderRecipes();
  }, 150);
});

input.addEventListener("keydown", e => {
  const items = sugBox.querySelectorAll(".sug-item");
  const active = sugBox.querySelector(".sug-item.active");
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (!active) items[0]?.classList.add("active");
    else { active.classList.remove("active"); (active.nextElementSibling || items[0])?.classList.add("active"); }
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (!active) items[items.length-1]?.classList.add("active");
    else { active.classList.remove("active"); (active.previousElementSibling || items[items.length-1])?.classList.add("active"); }
  } else if (e.key === "Enter") {
    const target = active;
    if (target) { pickSuggestion(target.dataset.id * 1, target.dataset.nombre); }
    else { sugBox.classList.remove("open"); renderRecipes(); }
  } else if (e.key === "Escape") {
    sugBox.classList.remove("open");
  }
});

sugBox.addEventListener("click", e => {
  const item = e.target.closest(".sug-item");
  if (item) pickSuggestion(item.dataset.id * 1, item.dataset.nombre);
});

function pickSuggestion(id, nombre) {
  input.value = "";
  sugBox.classList.remove("open");
  // Activate the tag
  if (!selected.has(id)) {
    selected.add(id);
    const chip = tagsWrap.querySelector(`[data-id="${id}"]`);
    if (chip) chip.classList.add("active");
  }
  updateActiveBar();
  renderRecipes();
}

document.addEventListener("click", e => {
  if (!e.target.closest(".search-wrap")) sugBox.classList.remove("open");
});

renderAllTags();
renderRecipes();
