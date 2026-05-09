const API_BASE = 'http://localhost:8080';

// document.body.style.display = 'none';

(function checkAdminAccess() {
  // const raw = sessionStorage.getItem('recetaya_user');
  // if (!raw) { redirect(); return; }
  // const user = JSON.parse(raw);
  // if (!user || user.rol !== 'admin') { redirect(); return; }
  document.body.style.display = 'block';
  cargarRecetasPendientes(1);
})();

function redirect() { window.location.href = '../IndexMain/index.html'; }

function showToast(msg, tipo = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${tipo}`;
  setTimeout(() => t.classList.remove('show'), 2400);
}

function toggleExpand(btn) {
  const content = btn.closest('.card-expand').querySelector('.expand-content');
  const label   = btn.querySelector('.expand-label');
  const isOpen  = content.classList.toggle('open');
  label.textContent = isOpen ? '▲ Ver menos' : '▼ Ver más...';
}

async function cargarRecetasPendientes(usuarioId) {
  const loading    = document.getElementById('loadingState');
  const contenedor = document.getElementById('recetasContainer');
  const emptyState = document.getElementById('emptyState');

  loading.style.display    = 'flex';
  contenedor.innerHTML     = '';
  emptyState.style.display = 'none';

  try {
    const res = await fetch(`${API_BASE}/recetas`);
    if (!res.ok) throw new Error('Error al obtener recetas');
    const { ingredientes, recetas } = await res.json();
    const recetasArray = Object.values(recetas);
    const pendientes = recetasArray.filter(r => r.estado === 'pendiente');

    loading.style.display = 'none';

    if (pendientes.length === 0) { emptyState.style.display = 'block'; return; }

    pendientes.forEach((receta, i) => {
      const card = crearTarjeta(receta, usuarioId);
      card.style.animationDelay = `${i * 0.06}s`;
      contenedor.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    loading.style.display = 'none';
    showToast('No se pudieron cargar las recetas', 'error');
  }
}

function crearTarjeta(receta, usuarioId) {
  const fecha = receta.fechacreacion
    ? new Date(receta.fechacreacion).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Sin fecha';

  const ingredientesHTML = (receta.recetaingrediente ?? [])
    .map(ri => `<li>${ri.ingrediente?.nombre ?? '?'}${ri.cantidadingrediente ? ' — ' + ri.cantidadingrediente : ''}</li>`)
    .join('') || '<li>Sin ingredientes registrados</li>';

  const pasosHTML = (receta.paso ?? [])
    .sort((a, b) => a.numeropaso - b.numeropaso)
    .map(p => `<li>${p.descripcion}</li>`)
    .join('') || '<li>Sin pasos registrados</li>';

  const card = document.createElement('div');
  card.className = 'recipe-card';
  card.dataset.id = receta.idreceta;

  card.innerHTML = `
    <div class="card-main">
      <div class="card-thumb">
        ${(receta.image_url || receta.imagenreceta) ? `<img src="${receta.image_url ?? 'data:image/jpeg;base64,' + receta.imagenreceta}" alt="Miniatura" class="thumb-img" onerror="this.style.display='none'" />` : ''}
        <div class="thumb-placeholder">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="4"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
        </div>
      </div>
      <div class="card-info">
        <div class="card-meta">
          <span class="estado-badge pendiente">Pendiente</span>
          <span class="card-fecha">${fecha}</span>
          <span class="card-id">#${receta.idreceta}</span>
        </div>
        <h2 class="card-title">${receta.nombre ?? 'Sin nombre'}</h2>
        <p class="card-desc">${receta.descripcion ?? 'Sin descripción.'}</p>
        <div class="card-author">Por <strong>ID #${receta.id_usuariocreador ?? 'Anónimo'}</strong></div>
      </div>
      <div class="card-actions">
        <button class="btn-action aprobar"  onclick="moderar(${receta.idreceta}, 'aprobar',  ${usuarioId}, this)">Aprobar</button>
        <button class="btn-action rechazar" onclick="moderar(${receta.idreceta}, 'rechazar', ${usuarioId}, this)">Rechazar</button>
        <button class="btn-action eliminar" onclick="moderar(${receta.idreceta}, 'eliminar', ${usuarioId}, this)">Eliminar</button>
      </div>
    </div>
    <div class="card-expand">
      <button class="btn-expand" onclick="toggleExpand(this)">
        <span class="expand-label">▼ Ver más...</span>
      </button>
      <div class="expand-content">
        <div class="expand-section">
          <div class="expand-title">Ingredientes</div>
          <ul class="expand-list">${ingredientesHTML}</ul>
        </div>
        <div class="expand-section">
          <div class="expand-title">Pasos</div>
          <ol class="expand-steps">${pasosHTML}</ol>
        </div>
      </div>
    </div>
  `;
  return card;
}

async function moderar(recetaId, accion, usuarioId, btn) {
  if (accion === 'eliminar' && !confirm('¿Seguro que quieres eliminar esta receta? No se puede deshacer.')) return;
  setBotonesDisabled(btn, true);
  try {
    const res = await fetch(`${API_BASE}/moderacion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId, recetaId, accion }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Error en moderación');
    }
    const mensajes = { aprobar: 'Receta aprobada ✓', rechazar: 'Receta devuelta a borrador', eliminar: 'Receta eliminada' };
    showToast(mensajes[accion]);
    quitarTarjeta(btn);
  } catch (err) {
    console.error(err);
    showToast(err.message || 'Error al procesar la acción', 'error');
    setBotonesDisabled(btn, false);
  }
}

function setBotonesDisabled(btn, disabled) {
  btn.closest('.card-actions').querySelectorAll('.btn-action').forEach(b => b.disabled = disabled);
}

function quitarTarjeta(btn) {
  const card = btn.closest('.recipe-card');
  card.style.transition = 'opacity 0.3s, transform 0.3s';
  card.style.opacity = '0';
  card.style.transform = 'translateX(12px)';
  setTimeout(() => {
    card.remove();
    if (!document.querySelector('.recipe-card')) {
      document.getElementById('emptyState').style.display = 'block';
    }
  }, 320);
}
