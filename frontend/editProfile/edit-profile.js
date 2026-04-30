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

// ── Guardar (placeholder para el backend) ──
document.getElementById('btnSave').addEventListener('click', () => {
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

  const btn = document.getElementById('btnSave');
  btn.classList.add('loading');
  btn.disabled = true;

  // TODO: reemplazar con fetch al backend
  setTimeout(() => {
    btn.classList.remove('loading');
    btn.disabled = false;
    showToast('✓ Perfil actualizado con éxito', 'success');
  }, 1200);
});