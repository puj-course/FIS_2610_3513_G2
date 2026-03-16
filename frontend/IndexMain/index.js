var INGREDIENTES = [
  {id:1,  nombre:"Arroz"},        {id:2,  nombre:"Pollo"},
  {id:3,  nombre:"Papa criolla"}, {id:4,  nombre:"Papa pastusa"},
  {id:5,  nombre:"Mazorca"},      {id:6,  nombre:"Guascas"},
  {id:7,  nombre:"Hogao"},        {id:8,  nombre:"Cilantro"},
  {id:9,  nombre:"Cebolla"},      {id:10, nombre:"Tomate"},
  {id:11, nombre:"Ajo"},          {id:12, nombre:"Comino"},
  {id:13, nombre:"Mantequilla"},  {id:14, nombre:"Leche"},
  {id:15, nombre:"Queso"},        {id:16, nombre:"Huevo"},
  {id:17, nombre:"Harina"},       {id:18, nombre:"Panela"},
  {id:19, nombre:"Aguacate"},     {id:20, nombre:"Platano"},
  {id:21, nombre:"Frijoles"},     {id:22, nombre:"Lentejas"},
  {id:23, nombre:"Chicharron"},   {id:24, nombre:"Chorizo"},
  {id:25, nombre:"Carne molida"}, {id:26, nombre:"Costilla"},
  {id:27, nombre:"Camaron"},      {id:28, nombre:"Coco"},
  {id:29, nombre:"Yuca"},         {id:30, nombre:"Zanahoria"},
];

var BUILTIN_RECETAS = [
  {id:1,  nombre:"Ajiaco Santafereno",   imagen:null, ingredientes:[1,3,4,5,6,8,9,2],    categoria:"almuerzo", tipo:"builtin"},
  {id:2,  nombre:"Bandeja Paisa",        imagen:null, ingredientes:[1,21,23,24,16,19,10,2], categoria:"almuerzo", tipo:"builtin"},
  {id:3,  nombre:"Sancocho de Gallina",  imagen:null, ingredientes:[2,5,9,8,12,10,29],   categoria:"almuerzo", tipo:"builtin"},
  {id:4,  nombre:"Arroz con Pollo",      imagen:null, ingredientes:[1,2,9,10,8,12,30],   categoria:"almuerzo", tipo:"builtin"},
  {id:5,  nombre:"Arepas de Choclo",     imagen:null, ingredientes:[17,15,13,14],         categoria:"desayuno", tipo:"builtin"},
  {id:6,  nombre:"Changua Bogotana",     imagen:null, ingredientes:[14,16,9,8],           categoria:"desayuno", tipo:"builtin"},
  {id:7,  nombre:"Pandebono",            imagen:null, ingredientes:[17,15,16,13],         categoria:"desayuno", tipo:"builtin"},
  {id:8,  nombre:"Natilla Colombiana",   imagen:null, ingredientes:[14,18,12,13],         categoria:"postre",   tipo:"builtin"},
  {id:9,  nombre:"Bunuelos de Queso",    imagen:null, ingredientes:[17,15,16],            categoria:"postre",   tipo:"builtin"},
  {id:10, nombre:"Cazuela de Mariscos",  imagen:null, ingredientes:[27,28,9,8,10],        categoria:"almuerzo", tipo:"builtin"},
  {id:11, nombre:"Empanadas de Pipian",  imagen:null, ingredientes:[17,9,10,8,12],        categoria:"snack",    tipo:"builtin"},
  {id:12, nombre:"Fritanga",             imagen:null, ingredientes:[23,24,26,19],         categoria:"cena",     tipo:"builtin"},
  {id:13, nombre:"Sopa de Lentejas",     imagen:null, ingredientes:[22,9,10,30,8],        categoria:"cena",     tipo:"builtin"},
  {id:14, nombre:"Caldo de Costilla",    imagen:null, ingredientes:[26,9,3,8,12],         categoria:"desayuno", tipo:"builtin"},
  {id:15, nombre:"Arroz con Coco",       imagen:null, ingredientes:[1,28,18],             categoria:"almuerzo", tipo:"builtin"},
  {id:16, nombre:"Patacones",            imagen:null, ingredientes:[20,11],               categoria:"snack",    tipo:"builtin"},
  {id:17, nombre:"Sudado de Res",        imagen:null, ingredientes:[25,9,10,30,8,12],     categoria:"almuerzo", tipo:"builtin"},
  {id:18, nombre:"Aguapanela",           imagen:null, ingredientes:[18],                  categoria:"bebida",   tipo:"builtin"},
  {id:19, nombre:"Huevos Pericos",       imagen:null, ingredientes:[16,9,10,8],           categoria:"desayuno", tipo:"builtin"},
  {id:20, nombre:"Frijoles Antioquenos", imagen:null, ingredientes:[21,9,10,23,8],        categoria:"almuerzo", tipo:"builtin"},
];

var selected   = new Set();
var ALL_RECETAS = [];

var input        = document.getElementById("searchInput");
var sugBox       = document.getElementById("suggestions");
var tagsWrap     = document.getElementById("tagsWrap");
var tagsClear    = document.getElementById("tagsClear");
var activeBar    = document.getElementById("activeBar");
var activePills  = document.getElementById("activePills");
var cardsGrid    = document.getElementById("cardsGrid");
var resultsInfo  = document.getElementById("resultsInfo");
var newBanner    = document.getElementById("newBanner");
var newBannerTxt = document.getElementById("newBannerText");

var lightbox      = document.getElementById("lightbox");
var lightboxImg   = document.getElementById("lightboxImg");
var lightboxTitle = document.getElementById("lightboxTitle");
var lightboxSub   = document.getElementById("lightboxSub");
var lightboxClose = document.getElementById("lightboxClose");
var lightboxPrev  = document.getElementById("lightboxPrev");
var lightboxNext  = document.getElementById("lightboxNext");
var lbImages = [];
var lbIndex  = 0;

function getUserRecetas() {
  try { return JSON.parse(localStorage.getItem("recetaya_recetas") || "[]"); } catch(e) { return []; }
}

function normalizeUserReceta(r) {
  var ingIds = (r.ingredientes || []).map(function(ing) {
    var nombre = typeof ing === "object" ? ing.nombre : ing;
    var match = INGREDIENTES.filter(function(i) { return i.nombre.toLowerCase() === nombre.toLowerCase(); })[0];
    return match ? match.id : null;
  }).filter(function(x) { return x !== null; });
  return {
    id:          r.id,
    nombre:      r.titulo || r.nombre || "Sin título",
    imagen:      r.imagen || null,
    ingredientes: ingIds,
    categoria:   r.categoria || "otro",
    autor:       r.autor || "Anónimo",
    fecha:       r.fecha || "",
    estado:      r.estado || "pendiente",
    tipo:        "usuario",
  };
}

function buildAllRecetas() {
  var user = getUserRecetas().map(normalizeUserReceta);
  ALL_RECETAS = user.concat(BUILTIN_RECETAS);
}

function renderAllTags() {
  tagsWrap.innerHTML = "";
  INGREDIENTES.forEach(function(ing, i) {
    var chip = document.createElement("button");
    chip.className = "tag-chip" + (selected.has(ing.id) ? " active" : "");
    chip.dataset.id = ing.id;
    chip.style.animationDelay = (i * 18) + "ms";
    chip.innerHTML = ing.nombre + '<span class="tag-x">&#x2715;</span>';
    chip.addEventListener("click", function() { toggleTag(ing.id, chip); });
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
    activePills.innerHTML = Array.from(selected).map(function(id) {
      var ing = INGREDIENTES.filter(function(i){ return i.id === id; })[0];
      return '<span class="active-pill">' + (ing ? ing.nombre : id) + '</span>';
    }).join("");
  }
}

tagsClear.addEventListener("click", function() {
  selected.clear();
  document.querySelectorAll(".tag-chip.active").forEach(function(c){ c.classList.remove("active"); });
  updateActiveBar();
  renderRecipes();
});

function makeCardImage(receta, isUser) {
  var wrap = document.createElement("div");
  wrap.className = "card-img-wrap";
  wrap.dataset.title = receta.nombre;
  wrap.dataset.sub   = isUser ? ("Por " + (receta.autor || "")) : "RecetaYa";

  if (receta.imagen) {
    wrap.classList.add("has-photo");
    wrap.dataset.src = receta.imagen;

    var img = document.createElement("img");
    img.className = "card-photo";
    img.alt = receta.nombre;
    img.addEventListener("load",  function() { img.classList.add("loaded"); });
    img.addEventListener("error", function() {
      img.remove();
      wrap.classList.remove("has-photo");
      wrap.appendChild(makeFallback("Imagen no disponible"));
    });
    img.src = receta.imagen;
    wrap.appendChild(img);

    wrap.addEventListener("click", function() {
      openLightbox(receta.imagen, receta.nombre, wrap.dataset.sub);
    });
  } else {
    wrap.dataset.src = "";
    wrap.appendChild(makeFallback("Sin imagen"));
  }

  if (isUser) {
    var badge = document.createElement("span");
    badge.className = "card-badge " + (receta.estado === "pendiente" ? "badge-pending" : "badge-community");
    badge.textContent = receta.estado === "pendiente" ? "En verificación" : "Comunidad";
    wrap.appendChild(badge);
  }

  return wrap;
}

function makeFallback(label) {
  var div = document.createElement("div");
  div.className = "card-img-fallback";
  div.innerHTML = '<svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#e8435a" stroke-width="1.2"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span>' + label + '</span>';
  return div;
}

function renderRecipes() {
  var q = input.value.trim().toLowerCase();
  var results = ALL_RECETAS.slice();

  if (q) {
    results = results.filter(function(r) {
      if (r.nombre.toLowerCase().indexOf(q) >= 0) return true;
      return r.ingredientes.some(function(id) {
        var ing = INGREDIENTES.filter(function(i){ return i.id === id; })[0];
        return ing && ing.nombre.toLowerCase().indexOf(q) >= 0;
      });
    });
  }

  if (selected.size > 0) {
    results = results.filter(function(r) {
      return Array.from(selected).every(function(id){ return r.ingredientes.indexOf(id) >= 0; });
    });
  }

  cardsGrid.innerHTML = "";

  if (!results.length) {
    cardsGrid.innerHTML = '<div class="no-results"><h3>Sin resultados</h3><p>Prueba con otros ingredientes o quita algún filtro</p></div>';
    resultsInfo.innerHTML = "";
    return;
  }

  resultsInfo.innerHTML = "<strong>" + results.length + "</strong> receta" + (results.length !== 1 ? "s" : "") + (selected.size > 0 || q ? " encontrada" + (results.length !== 1 ? "s" : "") : " disponibles");

  results.forEach(function(receta, i) {
    var isUser = receta.tipo === "usuario";

    var ingChips = receta.ingredientes.map(function(id) {
      var ing = INGREDIENTES.filter(function(x){ return x.id === id; })[0];
      if (!ing) return "";
      var isMatch = selected.has(id) || (q && ing.nombre.toLowerCase().indexOf(q) >= 0);
      return '<span class="card-ing' + (isMatch ? " match" : "") + '">' + ing.nombre + '</span>';
    }).join("");

    var card = document.createElement("div");
    card.className = "recipe-card";
    card.style.animationDelay = (i * 35) + "ms";

    card.appendChild(makeCardImage(receta, isUser));

    var body = document.createElement("div");
    body.className = "card-body";
    body.innerHTML = '<div class="card-name">' + receta.nombre + '</div><div class="card-tags-row">' + ingChips + '</div>' +
      (isUser ? '<div class="card-author">Por ' + receta.autor + (receta.fecha ? " · " + receta.fecha : "") + '</div>' : "");
    card.appendChild(body);

    cardsGrid.appendChild(card);
  });
}

function openLightbox(src, title, sub) {
  lbImages = Array.from(cardsGrid.querySelectorAll(".card-img-wrap.has-photo")).map(function(w) {
    return { src: w.dataset.src, title: w.dataset.title, sub: w.dataset.sub };
  });
  lbIndex = lbImages.findIndex(function(i){ return i.src === src; });
  if (lbIndex < 0) { lbImages.unshift({src:src, title:title, sub:sub}); lbIndex = 0; }
  setLbItem(lbIndex);
  lightbox.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("open");
  document.body.style.overflow = "";
}

function setLbItem(idx) {
  var item = lbImages[idx];
  if (!item) return;
  lightboxImg.style.opacity = "0";
  lightboxImg.src = item.src;
  lightboxTitle.textContent = item.title;
  lightboxSub.textContent   = item.sub;
  lightboxImg.onload = function() { lightboxImg.style.opacity = "1"; };
  lightboxPrev.disabled = idx === 0;
  lightboxNext.disabled = idx === lbImages.length - 1;
}

lightboxClose.addEventListener("click", closeLightbox);
lightboxPrev.addEventListener("click",  function(){ if (lbIndex > 0) setLbItem(--lbIndex); });
lightboxNext.addEventListener("click",  function(){ if (lbIndex < lbImages.length-1) setLbItem(++lbIndex); });
lightbox.addEventListener("click", function(e){ if (e.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", function(e) {
  if (!lightbox.classList.contains("open")) return;
  if (e.key === "Escape")     closeLightbox();
  if (e.key === "ArrowLeft"  && lbIndex > 0)                setLbItem(--lbIndex);
  if (e.key === "ArrowRight" && lbIndex < lbImages.length-1) setLbItem(++lbIndex);
});

var debounce;
input.addEventListener("input", function() {
  clearTimeout(debounce);
  var q = input.value.trim();
  if (q.length < 1) { sugBox.classList.remove("open"); renderRecipes(); return; }
  debounce = setTimeout(function() {
    var matches = INGREDIENTES.filter(function(i){ return i.nombre.toLowerCase().indexOf(q.toLowerCase()) >= 0; }).slice(0, 8);
    if (!matches.length) { sugBox.classList.remove("open"); renderRecipes(); return; }
    sugBox.innerHTML = matches.map(function(m) {
      var hi = m.nombre.replace(new RegExp("(" + q + ")", "gi"), '<span class="sug-hi">$1</span>');
      return '<div class="sug-item" data-id="' + m.id + '" data-nombre="' + m.nombre + '">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>' + hi + '</div>';
    }).join("");
    sugBox.classList.add("open");
    renderRecipes();
  }, 150);
});

input.addEventListener("keydown", function(e) {
  var items  = sugBox.querySelectorAll(".sug-item");
  var active = sugBox.querySelector(".sug-item.active");
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (!active) { if(items[0]) items[0].classList.add("active"); }
    else { active.classList.remove("active"); var nx = active.nextElementSibling || items[0]; if(nx) nx.classList.add("active"); }
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (!active) { if(items[items.length-1]) items[items.length-1].classList.add("active"); }
    else { active.classList.remove("active"); var pv = active.previousElementSibling || items[items.length-1]; if(pv) pv.classList.add("active"); }
  } else if (e.key === "Enter") {
    var tgt = active;
    if (tgt) pickSuggestion(parseInt(tgt.dataset.id), tgt.dataset.nombre);
    else { sugBox.classList.remove("open"); renderRecipes(); }
  } else if (e.key === "Escape") {
    sugBox.classList.remove("open");
  }
});

sugBox.addEventListener("click", function(e) {
  var item = e.target.closest(".sug-item");
  if (item) pickSuggestion(parseInt(item.dataset.id), item.dataset.nombre);
});

function pickSuggestion(id, nombre) {
  input.value = "";
  sugBox.classList.remove("open");
  if (!selected.has(id)) {
    selected.add(id);
    var chip = tagsWrap.querySelector('[data-id="' + id + '"]');
    if (chip) chip.classList.add("active");
  }
  updateActiveBar();
  renderRecipes();
}

document.addEventListener("click", function(e) {
  if (!e.target.closest(".search-wrap")) sugBox.classList.remove("open");
});

function checkNewRecipes() {
  var userRecetas = getUserRecetas();
  if (userRecetas.length > 0) {
    var latest = userRecetas[0];
    newBannerTxt.textContent = '"' + (latest.titulo || latest.nombre) + '" fue publicada recientemente';
    newBanner.classList.add("show");
    setTimeout(function(){ newBanner.classList.remove("show"); }, 5000);
  }
}

buildAllRecetas();
renderAllTags();
renderRecipes();
checkNewRecipes();