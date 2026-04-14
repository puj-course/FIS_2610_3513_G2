const RECETAS_KEY = "recetaya_recetas";
const ADMIN_KEY   = "recetaya_admin_notifs";
 
const ingList   = document.getElementById("ingList");
const stepsList = document.getElementById("stepsList");

function getDraftKey() {
  const userId = getUserId();
  return userId ? `recetaya_draft_${userId}` : null;
}

function addIng(nombre="", cantidad="", unidad="") {
  const row = document.createElement("div");
  row.className = "ing-row";
  row.innerHTML = `
    <input type="text" class="ing-nombre" placeholder="Ingrediente" value="${nombre}"/>
    <input type="text" class="ing-qty" placeholder="Cant." value="${cantidad}"/>
    <input type="text" class="ing-unit" placeholder="Unidad" value="${unidad}"/>
    <button type="button" class="btn-remove-ing" title="Eliminar">×</button>`;
  row.querySelector(".btn-remove-ing").addEventListener("click", () => {
    row.style.opacity="0"; row.style.transform="translateX(-8px)"; row.style.transition="all 0.18s";
    setTimeout(() => row.remove(), 180);
  });
  ingList.appendChild(row);
}
 
function addStep(text="") {
  const num = stepsList.children.length + 1;
  const row = document.createElement("div");
  row.className = "step-row";
  row.innerHTML = `
    <div class="step-num">${num}</div>
    <textarea class="step-text" rows="3" placeholder="Describe este paso...">${text}</textarea>
    <button type="button" class="btn-remove-step" title="Eliminar">×</button>`;
  row.querySelector(".btn-remove-step").addEventListener("click", () => {
    row.style.opacity="0"; row.style.transform="translateX(-8px)"; row.style.transition="all 0.18s";
    setTimeout(() => { row.remove(); renumberSteps(); }, 180);
  });
  stepsList.appendChild(row);
}
 
function renumberSteps() {
  stepsList.querySelectorAll(".step-num").forEach((n, i) => n.textContent = i + 1);
}
 
document.getElementById("addIng").addEventListener("click", () => addIng());
document.getElementById("addStep").addEventListener("click", () => addStep());
addIng(); addStep();
 
const imgFile    = document.getElementById("imgFile");
const imgPreview = document.getElementById("imgPreview");
const uploadArea = document.getElementById("uploadArea");
const imgRemove  = document.getElementById("imgRemove");
let imageData = null;
 
imgFile.addEventListener("change", () => {
  const file = imgFile.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showToast("La imagen no debe superar 5 MB"); return; }
  const reader = new FileReader();
  reader.onload = e => {
    imageData = e.target.result;
    imgPreview.src = imageData; imgPreview.style.display = "block";
    uploadArea.classList.add("has-img");
  };
  reader.readAsDataURL(file);
});
 
imgRemove.addEventListener("click", e => {
  e.stopPropagation();
  imageData = null; imgPreview.src = ""; imgPreview.style.display = "none";
  imgFile.value = ""; uploadArea.classList.remove("has-img");
});
 
function collectForm() {
  const ings = [...ingList.querySelectorAll(".ing-row")].map(row => ({
    nombre:   row.querySelector(".ing-nombre").value.trim(),
    cantidad: row.querySelector(".ing-qty").value.trim(),
    unidad:   row.querySelector(".ing-unit").value.trim(),
  })).filter(i => i.nombre);
 
  const steps = [...stepsList.querySelectorAll(".step-text")]
    .map(s => s.value.trim()).filter(Boolean);
 
  return {
    titulo:       document.getElementById("titulo").value.trim(),
    descripcion:  document.getElementById("descripcion").value.trim(),
    categoria:    document.getElementById("categoria").value,
    imagen:       imageData || null,
    video_url:    videoUrl || null, 
    ingredientes: ings,
    pasos:        steps,
    autor:        getUserName(),
    fecha:        new Date().toLocaleDateString("es-CO", {year:"numeric",month:"short",day:"numeric"}),
    tipo:         "usuario",
    id_usuariocreador:    getUserId(),
  };
}
 
function populateForm(data) {
  document.getElementById("titulo").value       = data.titulo || "";
  document.getElementById("descripcion").value  = data.descripcion || "";
  document.getElementById("categoria").value    = data.categoria || "";
  if (data.imagen) {
    imageData = data.imagen;
    imgPreview.src = imageData; imgPreview.style.display = "block";
    uploadArea.classList.add("has-img");
  }
  ingList.innerHTML = "";
  (data.ingredientes || []).forEach(i => addIng(i.nombre, i.cantidad, i.unidad));
  if (!ingList.children.length) addIng();
  stepsList.innerHTML = "";
  (data.pasos || []).forEach(s => addStep(s));
  if (!stepsList.children.length) addStep();
}
 
async function saveDraft() {
  const userId = getUserId();
  if (!userId) {
    showToast("Debes iniciar sesión para guardar un borrador");
    // Opcional: redirigir al login después de 2s
    setTimeout(() => window.location.href = "../login-register/loginRecetaYa.html", 2000);
    return;
  }

  const data = collectForm();
  data.estado = "borrador";
  const key = getDraftKey();

  try {
    const response = await fetch("http://localhost:3000/recetas/borrador", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      showToast(result.message || "Error al guardar borrador");
      return;
    }

    localStorage.setItem(key, JSON.stringify({ ...data, idreceta: result.receta.idreceta }));
    showToast("Borrador guardado ✓");
    setStatus("borrador");

  } catch (err) {
    showToast("No se pudo conectar con el servidor");
  }
}
 
function loadDraft() {
  const key = getDraftKey();
  if (!key) return null;
  try { return JSON.parse(localStorage.getItem(key)); }
  catch { return null; }
}
 
function discardDraft() {
  localStorage.removeItem(getDraftKey());
  document.getElementById("draftBanner").classList.remove("show");
}
 
document.getElementById("saveDraftBtn").addEventListener("click", saveDraft);
 
document.getElementById("draftLoad")?.addEventListener("click", () => {
  const draft = loadDraft();
  if (draft) { populateForm(draft); document.getElementById("draftBanner").classList.remove("show"); showToast("Borrador cargado"); }
});

document.getElementById("draftDiscard")?.addEventListener("click", async () => {
  const id = sessionStorage.getItem("recetaya_borrador_activo") || 
              loadDraft()?.idreceta;

  discardDraft();

  if (id) {
    try {
      await fetch(`http://localhost:3000/recetas/${id}`, { method: "DELETE" });
    } catch(e) {
      console.warn("No se pudo eliminar el borrador de la BD:", e);
    }
    sessionStorage.removeItem("recetaya_borrador_activo");
  }

  showToast("Borrador descartado");
});
 

function setStatus(estado) {
  const dot   = document.getElementById("statusDot");
  const label = document.getElementById("statusLabel");
  const desc  = document.getElementById("statusDesc");
  dot.className = "status-dot " + estado;
  const map = {
    borrador:  ["Borrador",              "Guarda como borrador para continuar después, o publica cuando esté lista"],
    pendiente: ["Pendiente de revisión", "Tu receta fue enviada al equipo de RecetaYa para verificación"],
    publicado: ["Publicada",             "Tu receta ya está visible para todos"],
  };
  label.textContent = map[estado]?.[0] || estado;
  desc.textContent  = map[estado]?.[1] || "";
}
 
function setErr(id, show) { document.getElementById("err-"+id)?.classList.toggle("show", show); }
function markInvalid(el, invalid) { el?.classList.toggle("invalid", invalid); }
 
function validate() {
  let ok = true;
  const titulo      = document.getElementById("titulo");
  const descripcion = document.getElementById("descripcion");
  const categoria   = document.getElementById("categoria");
 
  const tVal = titulo.value.trim();
  markInvalid(titulo, !tVal); setErr("titulo", !tVal); if (!tVal) ok = false;
 
  const dVal = descripcion.value.trim();
  markInvalid(descripcion, !dVal); setErr("descripcion", !dVal); if (!dVal) ok = false;
 
  const cVal = categoria.value;
  markInvalid(categoria, !cVal); setErr("categoria", !cVal); if (!cVal) ok = false;
 
  const ings = [...ingList.querySelectorAll(".ing-nombre")].map(i=>i.value.trim()).filter(Boolean);
  setErr("ingredientes", ings.length === 0); if (!ings.length) ok = false;
 
  const steps = [...stepsList.querySelectorAll(".step-text")].map(s=>s.value.trim()).filter(Boolean);
  setErr("pasos", steps.length === 0); if (!steps.length) ok = false;
 
  return ok;
}
 
function sendAdminNotif(receta) {
  const notifs = JSON.parse(localStorage.getItem(ADMIN_KEY) || "[]");
  notifs.unshift({
    id:      Date.now(),
    tipo:    "nueva_receta",
    mensaje: `Nueva receta enviada a verificación: "${receta.titulo}" por ${receta.autor}`,
    fecha:   new Date().toISOString(),
    leida:   false,
    recetaId: receta.id,
  });
  localStorage.setItem(ADMIN_KEY, JSON.stringify(notifs));
}
 
document.getElementById("recetaForm").addEventListener("submit", async e => {
  e.preventDefault();

  if (!getUserId()) {
    showToast("Debes iniciar sesión para enviar una receta");
    setTimeout(() => window.location.href = "../login-register/loginRecetaYa.html", 2000);
    return;
  }
  if (!validate()) return;

  const btn = document.getElementById("submitBtn");
  btn.disabled = true; btn.classList.add("loading");

  try {
    const data = collectForm();
    data.estado = "pendiente";

    const response = await fetch("http://localhost:3000/recetas/crear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      showToast(result.message || "Error al enviar la receta");
      btn.disabled = false; btn.classList.remove("loading");
      return;
    }

    discardDraft();
    setStatus("pendiente");
    document.getElementById("notifIndicator").style.display = "inline-flex";
    btn.disabled = false; btn.classList.remove("loading");
    btn.textContent = "✓ Enviada a revisión";
    btn.style.background = "#3b82f6";
    document.getElementById("saveDraftBtn").style.display = "none";

    showToast("Receta enviada a verificación. Gracias por compartirla!");
    setTimeout(() => window.location.href = "../IndexMain/index.html", 1800);

  } catch (err) {
    showToast("No se pudo conectar con el servidor");
    btn.disabled = false; btn.classList.remove("loading");
  }
});
 

function getUserName() {
  try { return JSON.parse(sessionStorage.getItem("recetaya_user")||"{}").nickname || "Anónimo"; }
  catch { return "Anónimo"; }
}

function getUserId() {
  try { return JSON.parse(sessionStorage.getItem("recetaya_user") || "{}").idusuario || null; }
  catch { return null; }
}
 
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}
 
document.querySelectorAll("input, textarea, select").forEach(el => {
  el.addEventListener("input", () => el.classList.remove("invalid"));
});

// create.js — reemplaza toda la función checkAndLoadDraft
async function checkAndLoadDraft() {
  const userId = getUserId();
  if (!userId) {
    setStatus("borrador");
    return;
  }

  const localDraft = loadDraft();
  if (localDraft?.titulo) {
    document.getElementById("draftTitle").textContent = localDraft.titulo;
    document.getElementById("draftBanner").classList.add("show");
    setStatus("borrador");
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/recetas/borrador/${userId}`);
    if (res.ok) {
      const borrador = await res.json();
      if (borrador) {
        const key = getDraftKey();
        localStorage.setItem(key, JSON.stringify({   // ← setItem, no setItm
          titulo:       borrador.nombre,
          descripcion:  borrador.descripcion,
          categoria:    borrador.recetacategoria?.[0]?.categoria_idcategoria || "",
          ingredientes: borrador.recetaingrediente.map(ri => ({
            nombre:   ri.ingrediente.nombre,
            cantidad: ri.cantidadingrediente,
            unidad:   "",
          })),
          pasos:    borrador.paso.map(p => p.descripcion),
          idreceta: borrador.idreceta,
        }));
        document.getElementById("draftTitle").textContent = borrador.nombre || "Sin título";
        document.getElementById("draftBanner").classList.add("show");
      }
    }
  } catch(e) {
    console.warn("No se pudo consultar borrador en BD:", e);
  }

  setStatus("borrador");
}

checkAndLoadDraft();

// SUBIR VIDEO --------

const videoFile     = document.getElementById('videoFile');
const videoArea     = document.getElementById('videoArea');
const videoName     = document.getElementById('videoName');
const videoProgress = document.getElementById('videoProgress');
const progressBar   = document.getElementById('progressBar');
const progressText  = document.getElementById('progressText');
let videoData = null;

videoFile.addEventListener('change', () => {
  const file = videoFile.files[0];
  if (!file) return;
  if (file.size > 50 * 1024 * 1024) { showToast('El video no debe superar 50 MB'); return; }

  document.getElementById('videoProgress').style.display = 'block';
  document.getElementById('progressText').textContent = 'Leyendo video...';

  const reader = new FileReader();
  reader.onload = e => {
    videoData = e.target.result;
    videoArea.classList.add('has-img');
    document.getElementById('videoName').style.display = 'block';
    videoArea.setAttribute('style', 'position:relative; min-height:40px; display:flex; align-items:center; padding: 8px 16px;');
    document.getElementById('videoName').textContent = file.name;
    document.getElementById('progressBar').style.width = '100%';
    document.getElementById('progressText').textContent = 'Video listo ✓';
    document.getElementById('videoRemove').style.display = 'flex';
    setTimeout(() => document.getElementById('videoProgress').style.display = 'none', 1200);
  };
  reader.readAsDataURL(file);
});

function removeVideo() {
  videoData = null;
  videoFile.value = '';
  videoArea.style.minHeight = ''; 
  videoArea.classList.remove('has-img');
  videoArea.setAttribute('style', 'position:relative;');
  document.getElementById('videoName').style.display = 'none';
  document.getElementById('videoName').textContent = '';
  document.getElementById('videoProgress').style.display = 'none';
  document.getElementById('videoRemove').style.display = 'none';
  document.getElementById('progressBar').style.width = '0%';
}
