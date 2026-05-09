const API_BASE = 'http://localhost:8080';

// document.body.style.display = 'none';

(function checkAdminAccess() {
   const raw = sessionStorage.getItem('recetaya_user');
   if (!raw) { redirect(); return; }
   const user = JSON.parse(raw);
   if (!user || user.rol !== 'admin') { redirect(); return; }
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

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
    
  document.querySelectorAll('.sidebar__item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.sidebar__item[data-page="${name}"]`).classList.add('active');

  if (name==='usuarios') cargarUsuarios();
}




/*Tabla de usuarios */
const PAGE_SIZE = 10;
let paginaActual = 1;
let usuariosCached = [];
let usuariosFiltrados = [];
let tabActual = 'todos';

async function cargarUsuarios() {
  try {
    const res = await fetch(`${API_BASE}/usuarios`);
    if (!res.ok) throw new Error();
    usuariosCached = await res.json();
    aplicarFiltros();
  } catch {
    showToast('Error al cargar usuarios', 'error');
  }
}

function filtrarTab(tab, btn) {
  tabActual = tab;
  paginaActual = 1;
  document.getElementById('searchInput').value = '';
  document.getElementById('searchDropdown').innerHTML = '';
  document.getElementById('searchDropdown').classList.remove('open');
  document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  aplicarFiltros();
}

function aplicarFiltros() {
  const rol    = document.getElementById('filter-roles').value;
  const estado = document.getElementById('filter-estado').value;

  let lista = tabActual === 'reportados'
    ? usuariosCached.filter(u => u.reportado)
    : [...usuariosCached];

  if (rol) lista = lista.filter(u => u.rol === rol);

  usuariosFiltrados = lista;
  paginaActual = 1;
  renderTabla();
}

function buscarUsuario(query) {
  const dropdown = document.getElementById('searchDropdown');

  if (!query.trim()) {
    dropdown.innerHTML = '';
    dropdown.classList.remove('open');
    aplicarFiltros();
    return;
  }

  const q = query.toLowerCase();
  const matches = usuariosCached
    .filter(u => u.nickname?.toLowerCase().includes(q))
    .slice(0, 6);

  if (matches.length === 0) {
    dropdown.innerHTML = '<div class="search-item muted">Sin resultados</div>';
    dropdown.classList.add('open');
    return;
  }

  dropdown.innerHTML = matches.map(u => `
    <div class="search-item" onclick="seleccionarUsuario(${u.idusuario})">
      <div class="user-avatar-wrap">
        ${u.profile_picture_url !== null
          ? `<img src="${u.profile_picture_url ?? ''}" class="user-avatar" onerror="this.style.display='none'"/>`
          : `<div class="search-avatar">${(u.nickname?.[0] ?? '?').toUpperCase()}</div>`
        }
      </div>
      <span>${u.nickname}</span>
      <span class="search-rol">${u.rol}</span>
    </div>
  `).join('');
  dropdown.classList.add('open');
}

function seleccionarUsuario(id) {
  const usuario = usuariosCached.find(u => u.idusuario === id);
  const dropdown = document.getElementById('searchDropdown');
  dropdown.innerHTML = '';
  dropdown.classList.remove('open');
  if (!usuario) return;
  document.getElementById('searchInput').value = usuario.nickname;
  usuariosFiltrados = [usuario];
  paginaActual = 1;
  renderTabla();
}

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap')) {
    const d = document.getElementById('searchDropdown');
    if (d) { d.innerHTML = ''; d.classList.remove('open'); }
  }
});

function renderTabla() {
  const tbody = document.getElementById('usuarios-tbody');
  const total = usuariosFiltrados.length;
  const totalPags = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (paginaActual > totalPags) paginaActual = totalPags;

  const inicio = (paginaActual - 1) * PAGE_SIZE;
  const slice  = usuariosFiltrados.slice(inicio, inicio + PAGE_SIZE);

  tbody.innerHTML = '';
  slice.forEach(u => {
    const tr = document.createElement('tr');
    tr.className = 'row_usuarios';
    const fecha = u.fecha_registro
      ? new Date(u.fecha_registro).toLocaleDateString('es-CO',
          { day:'2-digit', month:'2-digit', year:'2-digit' })
      : '–';

    tr.innerHTML = `
      <td>
        <div class="td_usuario">
          <div class="user-avatar-wrap">
            ${u.profile_picture_url !== null
              ? `<img src="${u.profile_picture_url ?? ''}" class="user-avatar" onerror="this.style.display='none'"/>`
              : `<div class="search-avatar">${(u.nickname?.[0] ?? '?').toUpperCase()}</div>`
            }
          </div>
          <div class="user-info">
            <div class="user-name-row">
              <span class="user-name">${u.nickname ?? '–'}</span>
              <a class="user-link" title="Ver perfil">&#8599;</a>
            </div>
            <span class="user-email">${u.email ?? ''}</span>
          </div>
        </div>
      </td>
      <td>
        <select class="rol-select" onchange="actualizarRol(${u.idusuario}, this.value)">
          <option value="usuario"    ${u.rol==='usuario'    ?'selected':''}>Usuario</option>
          <option value="moderador"  ${u.rol==='moderador'  ?'selected':''}>Moderador</option>
          <option value="chef" ${u.rol==='chef' ?'selected':''}>Chef</option>
          <option value="admin"      ${u.rol==='admin'      ?'selected':''}>Admin</option>
        </select>
      </td>
      <td class="td-fecha">${fecha}</td>
      <td><span class="estado-dot activo">Activo</span></td>
      <td class="td-actions">
        <button class="btn-report" title="Reportar usuario">
          <svg width="64px" height="15px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#c0a8a8"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5.75 1C6.16421 1 6.5 1.33579 6.5 1.75V3.6L8.22067 3.25587C9.8712 2.92576 11.5821 3.08284 13.1449 3.70797L13.3486 3.78943C14.9097 4.41389 16.628 4.53051 18.2592 4.1227C19.0165 3.93339 19.75 4.50613 19.75 5.28669V12.6537C19.75 13.298 19.3115 13.8596 18.6864 14.0159L18.472 14.0695C16.7024 14.5119 14.8385 14.3854 13.1449 13.708C11.5821 13.0828 9.8712 12.9258 8.22067 13.2559L6.5 13.6V21.75C6.5 22.1642 6.16421 22.5 5.75 22.5C5.33579 22.5 5 22.1642 5 21.75V1.75C5 1.33579 5.33579 1 5.75 1Z" fill="#c0a8a8"></path> </g></svg>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById('pag-info').textContent =
    `Página ${paginaActual} de ${totalPags}`;
  document.getElementById('btn-prev').disabled = paginaActual <= 1;
  document.getElementById('btn-next').disabled = paginaActual >= totalPags;
}

function irPagina(n) {
  const totalPags = Math.max(1, Math.ceil(usuariosFiltrados.length / PAGE_SIZE));
  if (n < 1 || n > totalPags) return;
  paginaActual = n;
  renderTabla();
}

async function actualizarRol(id, nuevoRol) {
  const user = JSON.parse(localStorage.getItem('user'));

  const res = await fetch(`${API_BASE}/usuarios/${id}/rol`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rol: nuevoRol,
      solicitanteId: user.idusuario,
    }),
  });

  if (!res.ok) throw new Error();
  showToast('Rol actualizado');
}


showPage('usuarios');
