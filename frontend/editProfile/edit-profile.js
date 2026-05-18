// ── Live preview: nickname ──
const nicknameInput = document.getElementById('nickname');
const cardNickname  = document.getElementById('cardNickname');

nicknameInput.addEventListener('input', () => {
  const val = nicknameInput.value.trim();
  cardNickname.textContent = val || 'Tu nickname…';
  cardNickname.classList.toggle('empty', !val);
});

// ── Live preview: bio ──
const bioInput  = document.getElementById('bio');
const bioCount  = document.getElementById('bioCount');
const cardBio   = document.getElementById('cardBio');

bioInput.addEventListener('input', () => {
  const val = bioInput.value;
  bioCount.textContent = val.length;
  cardBio.textContent  = val.trim() || 'Tu descripción aparecerá aquí…';
  cardBio.classList.toggle('empty', !val.trim());
});

// ── Live preview: foto ──
const avatarInput   = document.getElementById('avatarInput');
const avatarImg     = document.getElementById('avatarImg');
const cardAvatarImg = document.getElementById('cardAvatarImg');
const placeholder   = document.querySelector('.avatar-placeholder');
const cardPlaceholder = document.querySelector('.card-avatar-placeholder');

document.getElementById('btnChangePhoto').addEventListener('click', () => {
  avatarInput.click();
});

avatarInput.addEventListener('change', () => {
  const file = avatarInput.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    showToast('La imagen supera los 2 MB.', 'error');
    return;
  }
  const url = URL.createObjectURL(file);
  avatarImg.src = url;
  cardAvatarImg.src = url;
  avatarImg.onload = () => {
    avatarImg.classList.add('loaded');
    cardAvatarImg.classList.add('loaded');
    placeholder.style.display = 'none';
    cardPlaceholder.style.display = 'none';
  };
});

document.getElementById('btnRemovePhoto').addEventListener('click', () => {
  avatarInput.value = '';
  avatarImg.src = '';
  cardAvatarImg.src = '';
  avatarImg.classList.remove('loaded');
  cardAvatarImg.classList.remove('loaded');
  placeholder.style.display = '';
  cardPlaceholder.style.display = '';
});

// ── Fecha de miembro ──
const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const now = new Date();
document.getElementById('cardDate').textContent =
  `Miembro desde ${months[now.getMonth()]} ${now.getFullYear()}`;

// ── Toast ──
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}


// ── Helpers de pfp para cargarla en prev ──
function setAvatar(url) {
  avatarImg.src = url;
  cardAvatarImg.src = url;
  avatarImg.onload = () => {
    avatarImg.classList.add('loaded');
    cardAvatarImg.classList.add('loaded');
    placeholder.style.display = 'none';
    cardPlaceholder.style.display = 'none';
  };
}

function clearAvatar() {
  avatarImg.src = '';
  cardAvatarImg.src = '';
  avatarImg.classList.remove('loaded');
  cardAvatarImg.classList.remove('loaded');
  placeholder.style.display = '';
  cardPlaceholder.style.display = '';
}


// ── Cargar datos actuales del usuario ──────────────────
const usuarioGuardado = JSON.parse(sessionStorage.getItem('recetaya_user') || '{}');

// poblar campos editables, lo pongo para q los datos q tenga el usuario actual se pongan de por si en la preview al abrir la pag
if (usuarioGuardado.username || usuarioGuardado.nickname) {
  nicknameInput.value = usuarioGuardado.username || usuarioGuardado.nickname;
}
if (usuarioGuardado.rol) {
  document.getElementById('cardRole').textContent = usuarioGuardado.rol;
}

// Disparar el evento input manualmente para que la preview se sincronice
nicknameInput.dispatchEvent(new Event('input'));

// Foto de perfil actual
if (usuarioGuardado.profile_picture_url) {
  setAvatar(usuarioGuardado.profile_picture_url);
}

// Fecha de registro si existe, si no usa la fecha actual
if (usuarioGuardado.fecha_registro) {
  const fecha = new Date(usuarioGuardado.fecha_registro);
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  document.getElementById('cardDate').textContent =
    `Miembro desde ${months[fecha.getMonth()]} ${fecha.getFullYear()}`;
}


document.getElementById('btnSave').addEventListener('click', async () => {
  const nick = nicknameInput.value.trim();
  const errEl = document.getElementById('err-nickname');

  if (!nick) {
    nicknameInput.classList.add('invalid');
    errEl.classList.add('show');
    nicknameInput.focus();
    return;
  }
  nicknameInput.classList.remove('invalid');
  errEl.classList.remove('show');

  const user = JSON.parse(sessionStorage.getItem('recetaya_user') || 'null');
  if (!user) {
    showToast('No hay sesión activa', 'error');
    return;
  }

  const btn = document.getElementById('btnSave');
  btn.classList.add('loading');
  btn.disabled = true;

  // Armar el body
  const body = {
    solicitanteId: user.idusuario,
    username: nick,
  };

  // Si hay imagen nueva, convertirla a base64
  const file = avatarInput.files[0];
  if (file) {
    body.imagen = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  try {
    const res = await fetch(`http://localhost:8080/usuarios/${user.idusuario}/perfil`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || 'Error al guardar', 'error');
      return;
    }

    // Actualizar sessionStorage con los datos nuevos
    const userActualizado = { ...user, ...data.usuario };
    sessionStorage.setItem('recetaya_user', JSON.stringify(userActualizado));

    showToast('✓ Perfil actualizado con éxito', 'success');
  } catch (e) {
    console.error(e);
    showToast('No se pudo conectar con el servidor', 'error');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
});