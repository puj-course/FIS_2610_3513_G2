const API_BASE = "http://localhost:3000";
let INGREDIENTES = [];
const selected = new Set();

const input       = document.getElementById("searchInput");
const sugBox      = document.getElementById("suggestions");
const tagsWrap    = document.getElementById("tagsWrap");
const tagsClear   = document.getElementById("tagsClear");
const activeBar   = document.getElementById("activeBar");
const activePills = document.getElementById("activePills");
const cardsGrid   = document.getElementById("cardsGrid");
const resultsInfo = document.getElementById("resultsInfo");

function renderNav() {
  const nav = document.getElementById('navLinks');
  const user = JSON.parse(sessionStorage.getItem('recetaya_user') || 'null');

  if (user) {
    nav.innerHTML = `
      <span class="nav-user">${user.nickname}</span>
      <a href="../CrearReceta/create.html" class="nav-btn filled">+ Crear receta</a>
      <button class="nav-btn outline" onclick="logout()">Cerrar sesión</button>
    `;
  } else {
    nav.innerHTML = `
      <a href="../login-register/loginRecetaYa.html" class="nav-btn outline">Iniciar sesión</a>
      <a href="../login-register/registerRecetaYa.html" class="nav-btn outline">Registrarse</a>
      <button class="nav-btn filled nav-btn-disabled" onclick="alertLogin(event)">+ Crear receta</button>
    `;
  }
}

function alertLogin(e) {
  e.preventDefault();
  // Muestra un toast o alert
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = "Debes iniciar sesión para crear una receta";
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }
}

function logout() {
  sessionStorage.removeItem('recetaya_user');
  window.location.href = '../login-register/loginRecetaYa.html';
}

renderNav();

async function fetchIngredients() {
  try {
    const res = await fetch(`${API_BASE}/ingredientes`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    INGREDIENTES = await res.json();
    renderAllTags();
    fetchAndRenderRecetas();
  } catch (err) {
    console.error("Error cargando ingredientes", err);
    cardsGrid.innerHTML = `
          <div class="no-results">
        <h3>Error de conexión</h3>
        <p>No se pudieron cargar los ingredientes. Verifica el servidor.</p>
      </div>`;
  }
}

async function fetchAndRenderRecetas() {
  const q = input.value.trim().toLowerCase();

  let url;
  if (selected.size === 0) {
    url = `${API_BASE}/recetas`;
  } else {
    const params = new URLSearchParams();
    selected.forEach(id => params.append("ingredientesIds", Number(id)));
    url = `${API_BASE}/recetas/buscar?${params.toString()}`;
  }

  cardsGrid.innerHTML = `<div class="no-results"><p>Buscando recetas…</p></div>`;
  resultsInfo.innerHTML = "";

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const results = await res.json();
    renderRecipeCards(results, q);
  } catch (err) {
    console.error("Error buscando recetas:", err);
    cardsGrid.innerHTML = `
      <div class="no-results">
        <h3>Error de conexión</h3>
        <p>No se pudieron cargar las recetas. Verifica el servidor.</p>
      </div>`;
    resultsInfo.innerHTML = "";
  }
}

function renderAllTags() {
  tagsWrap.innerHTML = "";
  INGREDIENTES.forEach((ing, i) => {
    const chip = document.createElement("button");
    chip.className = "tag-chip" + (selected.has(ing.idingrediente) ? " active" : "");
    chip.dataset.idingrediente = ing.idingrediente;
    chip.style.animationDelay = (i * 18) + "ms";
    chip.innerHTML = ing.nombre + '<span class="tag-x">✕</span>';
    chip.addEventListener("click", () => toggleTag(ing.idingrediente, chip));
    tagsWrap.appendChild(chip);
  });
}

function toggleTag(idingrediente, chip) {
  if (selected.has(idingrediente)) { selected.delete(idingrediente); chip.classList.remove("active"); }
  else                   { selected.add(idingrediente);    chip.classList.add("active"); }
  updateActiveBar();
  fetchAndRenderRecetas();
}

function updateActiveBar() {
  if (selected.size === 0) {
    activeBar.classList.remove("visible");
    tagsClear.classList.remove("visible");
  } else {
    activeBar.classList.add("visible");
    tagsClear.classList.add("visible");
    activePills.innerHTML = [...selected].map(id => {
      const ing = INGREDIENTES.find(i => i.idingrediente === id);
      return `<span class="active-pill">${ing ? ing.nombre : id}</span>`;
    }).join("");
  }
}

tagsClear.addEventListener("click", () => {
  selected.clear();
  document.querySelectorAll(".tag-chip.active").forEach(c => c.classList.remove("active"));
  updateActiveBar();
  fetchAndRenderRecetas();
});

function renderRecipeCards(results, q = "") {
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

    const ingredientesArr = (receta.recetaingrediente ?? []).map(ri => ({
      idingrediente: ri.ingrediente_idingrediente,
      nombre: ri.ingrediente.nombre,
    }));
    const ingChips = ingredientesArr.map(ingOrId => {
      const id     = typeof ingOrId === "object" ? ingOrId.idingrediente    : ingOrId;
      const nombre = typeof ingOrId === "object" ? ingOrId.nombre : (INGREDIENTES.find(x => x.idingrediente === id)?.nombre ?? id);
      const isMatch = selected.has(id) || (q && nombre.toLowerCase().includes(q));
      return `<span class="card-ing${isMatch ? " match" : ""}">${nombre}</span>`;
    }).join("");

    card.innerHTML = `
      <div class="card-img">
  ${receta.image_url
    ? `<img
        src="${receta.image_url}"
        alt="${receta.nombre}"
        style="width:100%;height:100%;object-fit:cover;border-radius:12px 12px 0 0;"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
      />
      <svg style="display:none" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#e8435a" stroke-width="1.2">
        <path d="M3 11l19-9-9 19-2-8-8-2z"/>
      </svg>`
    : `<svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#e8435a" stroke-width="1.2">
        <path d="M3 11l19-9-9 19-2-8-8-2z"/>
      </svg>`
  }
  </div>`;
    cardsGrid.appendChild(card);
  });
}

// ── AUTOCOMPLETE ───────────────────────────────────────────────────────────
let debounce;
input.addEventListener("input", () => {
  clearTimeout(debounce);
  const q = input.value.trim();

  if (q.length < 1) { sugBox.classList.remove("open"); fetchAndRenderRecetas(); return; }

  debounce = setTimeout(() => {
    const matches = INGREDIENTES.filter(i =>
      i.nombre.toLowerCase().includes(q.toLowerCase())
    ).slice(0, 8);

    if (!matches.length) { sugBox.classList.remove("open"); fetchAndRenderRecetas(); return; }

    sugBox.innerHTML = matches.map(m => {
      const hi = m.nombre.replace(new RegExp(`(${q})`, "gi"), '<span class="sug-hi">$1</span>');
      return `<div class="sug-item" data-idingrediente="${m.idingrediente}" data-nombre="${m.nombre}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>${hi}</div>`;
    }).join("");
    sugBox.classList.add("open");
    fetchAndRenderRecetas();
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
    if (target) { pickSuggestion(target.dataset.idingrediente * 1, target.dataset.nombre); }
    else { sugBox.classList.remove("open"); fetchAndRenderRecetas(); }
  } else if (e.key === "Escape") {
    sugBox.classList.remove("open");
  }
});

sugBox.addEventListener("click", e => {
  const item = e.target.closest(".sug-item");
  if (item) pickSuggestion(item.dataset.idingrediente * 1, item.dataset.nombre);
});

function pickSuggestion(id, nombre) {
  input.value = "";
  sugBox.classList.remove("open");
  const numId = Number(id);
  if (!selected.has(numId)) {
    selected.add(numId);
    const chip = tagsWrap.querySelector(`[data-idingrediente="${numId}"]`);
    if (chip) chip.classList.add("active");
  }
  updateActiveBar();
  fetchAndRenderRecetas();
}

document.addEventListener("click", e => {
  if (!e.target.closest(".search-wrap")) sugBox.classList.remove("open");
});

fetchIngredients();

