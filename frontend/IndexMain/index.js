var INGREDIENTES = [];
var API_BASE = "http://localhost:3000";

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

// ── Recipe Detail Modal refs ──
var rmdOverlay       = document.getElementById("rmdOverlay");
var rmdPhoto         = document.getElementById("rmdPhoto");
var rmdPhotoFallback = document.getElementById("rmdPhotoFallback");
var rmdTitle         = document.getElementById("rmdTitle");
var rmdChips         = document.getElementById("rmdChips");
var rmdTiempo        = document.getElementById("rmdTiempo");
var rmdCalorias      = document.getElementById("rmdCalorias");
var rmdDesc          = document.getElementById("rmdDesc");
var rmdStepsWrap     = document.getElementById("rmdStepsWrap");
var rmdClose         = document.getElementById("rmdClose");
var rmdBtnSave       = document.getElementById("rmdBtnSave");
var rmdBtnFlag       = document.getElementById("rmdBtnFlag");

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

async function buildAllRecetas() {
  try {
    const resIng = await fetch(API_BASE + "/ingredientes");
    INGREDIENTES = await resIng.json();

    const resRec = await fetch(API_BASE + "/recetas");
    const { ingredientes, recetas } = await resRec.json();

    ALL_RECETAS = recetas.map(function(r) {
  return {
    id:          r.idreceta,
    nombre:      r.nombre,
    imagen:      r.image_url || null,
    descripcion: r.descripcion || null,
    pasos:       (r.pasos || []),
    tiempo:      r.tiempo_preparacion || null,
    calorias:    r.calorias || null,
    estado:      r.estado || "publicado",
    tipo:        "bd",
    ingredientes: (r.ingredienteIds || []).map(function(ri) {
      return ri.idingrediente ?? ri;
    }),
  };
});

    await cargarRecetasGuardadas();
    renderAllTags();
    renderRecipes();
  } catch(err) {
    console.error("Error cargando datos:", err);
    cardsGrid.innerHTML = '<div class="no-results"><h3>Error de conexión</h3><p>Verifica el servidor.</p></div>';
  }
}

function renderAllTags() {
  tagsWrap.innerHTML = "";
  INGREDIENTES.forEach(function(ing, i) {
    var chip = document.createElement("button");
    chip.className = "tag-chip" + (selected.has(ing.idingrediente) ? " active" : "");
    chip.dataset.id = ing.idingrediente;
    chip.style.animationDelay = (i * 18) + "ms";
    chip.innerHTML = ing.nombre + '<span class="tag-x">&#x2715;</span>';
    chip.addEventListener("click", function() { toggleTag(ing.idingrediente, chip); });
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
      var ing = INGREDIENTES.filter(function(i){ return i.idingrediente === id; })[0];
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

  if (vistaActual === "guardadas") {
    results = results.filter(function(r) {
      return recetasGuardadas.has(r.id);
    });
  }

  if (q) {
    results = results.filter(function(r) {
      if (r.nombre.toLowerCase().indexOf(q) >= 0) return true;
      return r.ingredientes.some(function(id) {
        var ing = INGREDIENTES.filter(function(i){ return i.idingrediente === id; })[0];
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
    var isSaved = recetasGuardadas.has(receta.id); // si la receta es receta guardada o no

    var ingChips = receta.ingredientes.map(function(id) {
      var ing = INGREDIENTES.filter(function(x){ return x.idingrediente === id; })[0];
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

    // Boton de guardado si hay sesion 


  var user = null;
  try { user = JSON.parse(sessionStorage.getItem("recetaya_user") || "null"); } catch(e) {}

  if (receta.estado !== "borrador") {
      var btnGuardar = document.createElement("button");
      btnGuardar.className = "btn-guardar " + (isSaved ? "saved" : "");
      btnGuardar.title = isSaved ? "Quitar de guardados" : "Guardar receta";
      btnGuardar.innerHTML = isSaved
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>'
        : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';

      btnGuardar.addEventListener("click", function(e) {
        e.stopPropagation();
        if (!user) {
          window.location.href = "../login-register/loginRecetaYa.html";
          return;
        }
        toggleGuardar(receta.id, btnGuardar, user.idusuario);
      });

      body.appendChild(btnGuardar);
    }

    card.appendChild(body);

  card.addEventListener("click", function(e) {
  if (e.target.closest(".card-img-wrap")) return; // imagen ya tiene su propio click (lightbox)
  openRecipeModal(receta);
});
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
      return '<div class="sug-item" data-id="' + m.idingrediente + '" data-nombre="' + m.nombre + '">' +
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

// ── Recipe Detail Modal ──────────────────────────────────────────────────
function openRecipeModal(receta) {

  if (!receta || !receta.id) {
    showRecipeError("Esta receta no está disponible.");
    return;
  }

  if (receta.estado === "borrador"){
    document.getElementById("rmdEstado").classList.remove("show");
  }
  // Imagen
  if (receta.imagen) {
    rmdPhoto.src = receta.imagen;
    rmdPhoto.style.display = "block";
    rmdPhotoFallback.style.display = "none";
  } else {
    rmdPhoto.style.display = "none";
    rmdPhotoFallback.style.display = "flex";
  }

  // Título
  rmdTitle.textContent = receta.nombre;

  // Chips de ingredientes
  rmdChips.innerHTML = receta.ingredientes.map(function(id) {
    var ing = INGREDIENTES.filter(function(i){ return i.idingrediente === id; })[0];
    return ing ? '<span class="rmd-chip">' + ing.nombre + '</span>' : "";
  }).join("");

  // Meta
  rmdTiempo.textContent   = receta.tiempo    || "—";
  rmdCalorias.textContent = receta.calorias  || "—";

  // Descripción
  rmdDesc.textContent  = receta.descripcion || "";
  rmdDesc.style.display = receta.descripcion ? "block" : "none";

  // Pasos
  rmdStepsWrap.innerHTML = "";
  var pasos = receta.pasos || [];
  if (typeof pasos === "string") {
    try { pasos = JSON.parse(pasos); } catch(e) { pasos = pasos ? [pasos] : []; }
  }
  pasos.forEach(function(paso, i) {
    var text = typeof paso === "object"
      ? (paso.descripcion || paso.texto || paso.instruccion || JSON.stringify(paso))
      : paso;
    var div = document.createElement("div");
    div.className = "rmd-step";
    div.innerHTML = '<div class="rmd-step-label">Paso ' + (i + 1) + '</div>' + text;
    rmdStepsWrap.appendChild(div);
  });

  rmdOverlay.classList.add("open");
  document.body.style.overflow = "hidden";


  rmdClose.addEventListener("click", closeRecipeModal);
  rmdOverlay.addEventListener("click", function(e) {
    if (e.target === rmdOverlay) closeRecipeModal();
  });
  

  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape" && rmdOverlay.classList.contains("open")) closeRecipeModal();
  });


  rmdBtnSave.addEventListener("click", function() {
    var user = null;
    try { user = JSON.parse(sessionStorage.getItem("recetaya_user") || "null"); } catch(e) {}
    if (!user) {
      window.location.href = "../login-register/loginRecetaYa.html";
      return;
    }
    toggleGuardar(receta.id, rmdBtnSave, user.idusuario);
    console.log("Guardar receta:", rmdTitle.textContent);
  });
  rmdBtnFlag.addEventListener("click", function() {
    // TODO: implementar reportar/marcar receta
    console.log("Flag receta:", rmdTitle.textContent);
  });
}

function closeRecipeModal() {
  rmdOverlay.classList.remove("open");
  document.body.style.overflow = "";
}

// error en recetas
function showRecipeError(mensaje) {
  rmdPhoto.style.display = "none";
  rmdPhotoFallback.style.display = "flex";
  rmdTitle.textContent = "Receta no encontrada";
  rmdChips.innerHTML = "";
  rmdTiempo.textContent = "—";
  rmdCalorias.textContent = "—";
  rmdDesc.textContent = mensaje;
  rmdDesc.style.display = "block";
  rmdStepsWrap.innerHTML = `
    <div class="rmd-error">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e8435a" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>${mensaje}</p>
    </div>
  `;
  rmdOverlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

/*
buildAllRecetas();
renderAllTags();
renderRecipes();
checkNewRecipes();
*/

var recetasGuardadas = new Set();

async function cargarRecetasGuardadas() {
  var user = null;
  try { user = JSON.parse(sessionStorage.getItem("recetaya_user") || "null"); } catch(e) {}
  if (!user) return;

  try {
    var res = await fetch(API_BASE + "/recetas/guardadas/" + user.idusuario);
    if (res.ok) {
      var data = await res.json();
      recetasGuardadas = new Set(data.map(function(r) { return r.receta_idreceta; }));
    }
  } catch(e) {
    console.warn("No se pudieron cargar recetas guardadas:", e);
  }
}

async function toggleGuardar(recetaId, btn, usuarioId) {
  var guardada = recetasGuardadas.has(recetaId);
  var method = guardada ? "DELETE" : "POST";

  try {
    var res = await fetch(API_BASE + "/recetas/" + recetaId + "/guardar", {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuarioId: usuarioId }),
    });

    if (!res.ok) return;

    if (guardada) {
      recetasGuardadas.delete(recetaId);
      btn.classList.remove("saved");
      btn.title = "Guardar receta";
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
    } else {
      recetasGuardadas.add(recetaId);
      btn.classList.add("saved");
      btn.title = "Quitar de guardados";
      btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
    }
  } catch(e) {
    console.warn("Error al guardar/quitar receta:", e);
  }
}

// ver recetas guardadas solo
//
var vistaActual = "todas"; // "todas" o "guardadas"

document.getElementById("tabTodas").addEventListener("click", function() {
  vistaActual = "todas";
  document.getElementById("tabTodas").classList.add("active");
  document.getElementById("tabGuardadas").classList.remove("active");
  renderRecipes();
});

document.getElementById("tabGuardadas").addEventListener("click", function() {
  var user = null;
  try { user = JSON.parse(sessionStorage.getItem("recetaya_user") || "null"); } catch(e) {}
  if (!user) {
    window.location.href = "../login-register/loginRecetaYa.html";
    return;
  }
  vistaActual = "guardadas";
  document.getElementById("tabGuardadas").classList.add("active");
  document.getElementById("tabTodas").classList.remove("active");
  renderRecipes();
});

function renderNav() {
  var nav = document.getElementById("navLinks");
  var user = null;
  try { user = JSON.parse(sessionStorage.getItem("recetaya_user") || "null"); } catch(e) {}

  if (user) {
    nav.innerHTML =
      '<span class="nav-user">👤 ' + (user.nickname || user.email) + '</span>' +
      '<a href="../CrearReceta/create.html" class="nav-btn filled">+ Crear receta</a>' +
      '<button class="nav-btn outline" id="btnLogout">Cerrar sesión</button>';
    document.getElementById("btnLogout").addEventListener("click", function() {
      sessionStorage.removeItem("recetaya_user");
      window.location.reload();
    });
  } else {
    nav.innerHTML =
      '<a href="../login-register/loginRecetaYa.html" class="nav-btn outline">Iniciar sesión</a>' +
      '<a href="../login-register/registerRecetaYa.html" class="nav-btn outline">Registrarse</a>' +
      '<a href="../CrearReceta/create.html" class="nav-btn filled">+ Crear receta</a>';
  }
}
renderNav();
buildAllRecetas();
