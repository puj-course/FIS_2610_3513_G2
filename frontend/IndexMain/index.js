var INGREDIENTES = [];
var API_BASE = "http://localhost:8080";

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
var lbIndex  = -1;

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

  // Carga los ratings de cada receta 
  await Promise.all(ALL_RECETAS.map(async function(receta) {
  try {
    var res = await fetch(API_BASE + '/recetas/' + receta.id + '/promedio');
    if (res.ok) {
      var data = await res.json();
      receta.rating   = data.promedio; // null si no hay votos
      receta.numVotos = data.total;    // 0 si no hay votos
    }
  } catch(e) { receta.rating = null; receta.numVotos = 0; }
}));

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

  var actionsRow = document.createElement("div");
    actionsRow.className = "card-actions";

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
    
            // Rating display (esto en la esquina izq, muestra estrellas y numero de votos, solo si la receta tiene rating)
            // Siempre crea el badge, con o sin votos
            var ratingBadge = document.createElement("span");
            ratingBadge.className = "card-rating";
            ratingBadge.dataset.id = receta.id;

            if (receta.rating != null) {
              ratingBadge.innerHTML =
                '★ ' + receta.rating.toFixed(1) +
                ' <span class="card-rating-count">(' + receta.numVotos + ')</span>';
            }
            // si es null simplemente queda vacío hasta que alguien vote

            actionsRow.appendChild(ratingBadge);
          }
          

   if (receta.estado === "publicado") {
      var btnShare = document.createElement("button");
      btnShare.className = "btn-share";
      btnShare.style = "display:inline;"
      btnShare.title = "Copiar link";
      btnShare.innerHTML = `
          <svg height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M15.197 3.35462C16.8703 1.67483 19.4476 1.53865 20.9536 3.05046C22.4596 4.56228 22.3239 7.14956 20.6506 8.82935L18.2268 11.2626M10.0464 14C8.54044 12.4882 8.67609 9.90087 10.3494 8.22108L12.5 6.06212" stroke="#9a8080" stroke-width="1.5" stroke-linecap="round"></path> <path d="M13.9536 10C15.4596 11.5118 15.3239 14.0991 13.6506 15.7789L11.2268 18.2121L8.80299 20.6454C7.12969 22.3252 4.55237 22.4613 3.0464 20.9495C1.54043 19.4377 1.67609 16.8504 3.34939 15.1706L5.77323 12.7373" stroke="#9a8080" stroke-width="1.5" stroke-linecap="round"></path> </g></svg>`;
      btnShare.addEventListener("click", function(e) {
        e.stopPropagation();
        var url = window.location.origin + window.location.pathname + "?receta=" + receta.id;
        navigator.clipboard.writeText(url).then(function() {

          var checkSvg = `<svg height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 13l4 4L19 7" stroke="#e8435a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

          var originalSvg = `<svg height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.197 3.35462C16.8703 1.67483 19.4476 1.53865 20.9536 3.05046C22.4596 4.56228 22.3239 7.14956 20.6506 8.82935L18.2268 11.2626M10.0464 14C8.54044 12.4882 8.67609 9.90087 10.3494 8.22108L12.5 6.06212" stroke="#9a8080" stroke-width="1.5" stroke-linecap="round"></path><path d="M13.9536 10C15.4596 11.5118 15.3239 14.0991 13.6506 15.7789L11.2268 18.2121L8.80299 20.6454C7.12969 22.3252 4.55237 22.4613 3.0464 20.9495C1.54043 19.4377 1.67609 16.8504 3.34939 15.1706L5.77323 12.7373" stroke="#9a8080" stroke-width="1.5" stroke-linecap="round"></path></svg>`;

          btnShare.innerHTML = checkSvg;

          var toast = document.getElementById("shareToast");
          toast.classList.add("show");


          setTimeout(function() {
            btnShare.innerHTML = originalSvg;
          }, 1000);
          setTimeout(function() {toast.classList.remove("show"); }, 2500);
        });
      });

      actionsRow.appendChild(btnShare);
    }

    body.appendChild(actionsRow);
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
  // Resetea el rating a 0 para evitar mostrar el rating de la anterior receta
if (starRating) starRating.reset(receta.id);
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

  var newBtnShare = document.getElementById("rmdBtnShare").cloneNode(true);
  document.getElementById("rmdBtnShare").parentNode.replaceChild(newBtnShare, document.getElementById("rmdBtnShare"));

  if (receta.estado === "publicado") {
    newBtnShare.style.display = "flex";
    newBtnShare.addEventListener("click", function() {
      var url = window.location.origin + window.location.pathname + "?receta=" + receta.id;
      navigator.clipboard.writeText(url).then(function() {
        var checkSvg = `<svg height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 13l4 4L19 7" stroke="#e8435a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
        var originalSvg = `<svg height="18px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M15.197 3.35462C16.8703 1.67483 19.4476 1.53865 20.9536 3.05046C22.4596 4.56228 22.3239 7.14956 20.6506 8.82935L18.2268 11.2626M10.0464 14C8.54044 12.4882 8.67609 9.90087 10.3494 8.22108L12.5 6.06212" stroke="#e8435a" stroke-width="1.5" stroke-linecap="round"></path> <path d="M13.9536 10C15.4596 11.5118 15.3239 14.0991 13.6506 15.7789L11.2268 18.2121L8.80299 20.6454C7.12969 22.3252 4.55237 22.4613 3.0464 20.9495C1.54043 19.4377 1.67609 16.8504 3.34939 15.1706L5.77323 12.7373" stroke="#e8435a" stroke-width="1.5" stroke-linecap="round"></path> </g></svg>`;

        newBtnShare.innerHTML = checkSvg;

        var toast = document.getElementById("shareToast");
        toast.classList.add("show");

        setTimeout(function() {
          newBtnShare.innerHTML = originalSvg;
        }, 1000);

        setTimeout(function() {
          toast.classList.remove("show");
        }, 2500);
      });
    });
  } else {
    newBtnShare.style.display = "none";
  }
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

// -- Star Rating in detail
var starRating = (function initStarRating() {
  var TOTAL       = 5;
  var COLOR_FILL  = '#F5A623';
  var COLOR_EMPTY = '#D9D9D9';
  var STAR_PATH   = 'M12 2.5l2.6 5.3 5.9.86-4.25 4.14 1 5.87L12 15.77l-5.25 2.9 1-5.87L3.5 8.66l5.9-.86z';

  var currentRating  = 0;
  var currentRecetaId = null;

  var container  = document.getElementById('starsRow');
  var ratingText = document.getElementById('ratingText');
  if (!container) return { reset: function(){} };

  for (var i = 1; i <= TOTAL; i++) {
    (function(idx) {
      var wrap = document.createElement('span');
      wrap.className = 'star-wrap';

      wrap.innerHTML =
        '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
          '<defs><linearGradient id="sg-' + idx + '" x1="0%" y1="0%" x2="100%" y2="0%">' +
            '<stop id="sg-' + idx + '-a" offset="0%"   stop-color="' + COLOR_EMPTY + '"/>' +
            '<stop id="sg-' + idx + '-b" offset="100%" stop-color="' + COLOR_EMPTY + '"/>' +
          '</linearGradient></defs>' +
          '<path d="' + STAR_PATH + '" fill="url(#sg-' + idx + ')" stroke="none"/>' +
        '</svg>';

      wrap.addEventListener('mousemove', function(e) {
        var rect  = wrap.getBoundingClientRect();
        var hover = (e.clientX - rect.left) < rect.width / 2 ? idx - 0.5 : idx;
        renderStars(hover, false);
      });
      wrap.addEventListener('mouseleave', function() {
        renderStars(currentRating, false);
      });
      wrap.addEventListener('click', function(e) {
        var user = null;
        try { user = JSON.parse(sessionStorage.getItem('recetaya_user') || 'null'); } catch(ex) {}
        if (!user) {
          window.location.href = '../login-register/loginRecetaYa.html';
          return;
        }
        var rect   = wrap.getBoundingClientRect();
        var picked = (e.clientX - rect.left) < rect.width / 2 ? idx - 0.5 : idx;
        enviarCalificacion(user, picked);
      });

      container.appendChild(wrap);
    })(i);
  }

  async function enviarCalificacion(user, picked) {
    // El backend acepta Int (1-5), redondeamos la media estrella
    var puntaje = Math.round(picked); // 0.5 → 1, 4.5 → 5, etc.
    try {
      var res = await fetch(API_BASE + '/recetas/' + currentRecetaId + '/calificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: user.idusuario, puntaje: puntaje }),
      });
      if (!res.ok) return;

      // Fijar visualmente lo que el usuario eligió
      currentRating = picked;
      renderStars(currentRating, true);

      // Refrescar promedio real del backend
      var resP = await fetch(API_BASE + '/recetas/' + currentRecetaId + '/promedio');
      if (resP.ok) {
        var data = await resP.json();
        // Actualizar objeto en memoria
        var receta = ALL_RECETAS.find(function(r){ return r.id === currentRecetaId; });
        if (receta) {
          receta.rating   = data.promedio;
          receta.numVotos = data.total;
        }
        // Actualizar badge en la tarjeta del grid (si está visible)
        var badge = document.querySelector('.recipe-card .card-rating[data-id="' + currentRecetaId + '"]');
        if (badge && data.promedio != null) {
            badge.innerHTML =
              '★ ' + data.promedio.toFixed(1) +
              ' <span class="card-rating-count">(' + data.total + ')</span>';
          }
        // Actualizar texto del modal
        if (ratingText) {
          ratingText.textContent = data.promedio
            ? 'Tu voto: ' + picked + ' · Promedio: ' + data.promedio.toFixed(1) + ' (' + data.total + ')'
            : 'Sin calificar';
          ratingText.classList.toggle('rated', !!data.promedio);
        }
      }
    } catch(err) {
      console.warn('Error al calificar:', err);
    }
  }

  function renderStars(rating, updateText) {
    for (var i = 1; i <= TOTAL; i++) {
      var stopA = document.getElementById('sg-' + i + '-a');
      var stopB = document.getElementById('sg-' + i + '-b');
      if (!stopA || !stopB) continue;
      var pct = rating >= i ? 100 : rating >= i - 0.5 ? 50 : 0;
      stopA.setAttribute('offset', pct + '%');
      stopA.setAttribute('stop-color', pct > 0 ? COLOR_FILL : COLOR_EMPTY);
      stopB.setAttribute('offset', pct + '%');
      stopB.setAttribute('stop-color', COLOR_EMPTY);
    }
    if (updateText && ratingText) {
      if (rating === 0) {
        ratingText.textContent = 'Sin calificar';
        ratingText.classList.remove('rated');
      } else {
        ratingText.textContent = rating + ' / ' + TOTAL;
        ratingText.classList.add('rated');
      }
    }
  }

  renderStars(0, true);

  return {
    reset: function(recetaId) {
      currentRecetaId = recetaId;
      currentRating   = 0;
      renderStars(0, true);
    }
  };
})();
// ─────────────────────────────────────────────

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
      '<a href="/CrearReceta/create.html" class="nav-btn filled">+ Crear receta</a>' +
      '<button class="nav-btn outline" id="btnLogout">Cerrar sesión</button>';
    document.getElementById("btnLogout").addEventListener("click", function() {
      sessionStorage.removeItem("recetaya_user");
      window.location.reload();
    });
  } else {
    nav.innerHTML =
      '<a href="../login-register/loginRecetaYa.html" class="nav-btn outline">Iniciar sesión</a>' +
      '<a href="../login-register/registerRecetaYa.html" class="nav-btn outline">Registrarse</a>' +
      '<a href="/CrearReceta/create.html" class="nav-btn filled">+ Crear receta</a>';
  }
}

var tagsToggle = document.getElementById("tagsToggle");
if (tagsToggle) {
  tagsToggle.addEventListener("click", function() {
    var expanded = tagsWrap.classList.toggle("expanded");
    tagsToggle.textContent = expanded ? "Ver menos ▴" : "Ver más ▾";
  });
}

renderNav();
buildAllRecetas();
