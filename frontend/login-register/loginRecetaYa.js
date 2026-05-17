const eyeOpen = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
const eyeOff  = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

const pw = document.getElementById('password');
document.getElementById('eye').addEventListener('click', () => {
  const show = pw.type === 'password';
  pw.type = show ? 'text' : 'password';
  document.getElementById('eye').innerHTML = show ? eyeOff : eyeOpen;
});

function showMsg(text, type) {
  const el = document.getElementById('msg');
  el.textContent = text;
  el.className = 'msg ' + type + ' show';
}

function switchTab(tab) {
  const isPassword = tab === 'password';
  document.getElementById('panel-password').style.display = isPassword ? 'block' : 'none';
  document.getElementById('panel-otp').style.display      = isPassword ? 'none'  : 'block';
  document.getElementById('tab-password').className = 'tab' + (isPassword ? ' active' : '');
  document.getElementById('tab-otp').className      = 'tab' + (isPassword ? '' : ' active');
}

document.addEventListener('DOMContentLoaded', () => switchTab('password'));

function redirectUser(user) {
  sessionStorage.setItem('recetaya_user', JSON.stringify(user));
  setTimeout(() => {
    window.location.href = user.rol === 'admin'
      ? '../panelAdmin/admin.html'
      : '../IndexMain/index.html';
  }, 1200);
}

// Login con contraseña
async function login() {
  const email    = document.getElementById('email').value.trim().toLowerCase();
  const password = pw.value;
  if (!email || !email.includes('@')) return showMsg('Ingresa un correo válido', 'err');
  if (!password) return showMsg('Ingresa tu contraseña', 'err');

  const btn = document.getElementById('btn-password');
  btn.disabled = true; btn.classList.add('loading');
  try {
    const response = await fetch('http://localhost:8080/usuarios/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, contrasena: password }),
    });
    const data = await response.json();
    if (!response.ok) {
      showMsg(data.message, 'err');
      btn.disabled = false; btn.classList.remove('loading');
      return;
    }
    showMsg(data.message, 'ok');
    redirectUser(data.user);
  } catch (err) {
    showMsg('No se pudo conectar con el servidor', 'err');
    btn.disabled = false; btn.classList.remove('loading');
  }
}

// Enviar OTP
async function sendOtp() {
  const phone = document.getElementById('otp-phone').value.trim();
  const email = document.getElementById('otp-email').value.trim().toLowerCase();
  if (!email || !email.includes('@')) return showMsg('Ingresa un correo válido', 'err');
  if (!phone) return showMsg('Ingresa tu número de teléfono', 'err');

  const btn = document.getElementById('btn-send');
  btn.disabled = true; btn.classList.add('loading');
  try {
    const response = await fetch('http://localhost:8080/sms/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await response.json();
    if (!response.ok) {
      showMsg(data.message, 'err');
      btn.disabled = false; btn.classList.remove('loading');
      return;
    }
    showMsg('Código enviado. Revisa tu teléfono. ahora mismo.', 'ok');
    document.getElementById('otp-code-section').style.display = 'block';
    btn.disabled = false; btn.classList.remove('loading');
  } catch (err) {
    showMsg('No se pudo conectar con el servidor', 'err');
    btn.disabled = false; btn.classList.remove('loading');
  }
}

// Verificar OTP y entrar
async function verifyOtp() {
  const phone = document.getElementById('otp-phone').value.trim();
  const email = document.getElementById('otp-email').value.trim().toLowerCase();
  const code  = document.getElementById('otp-code').value.trim();
  if (!code) return showMsg('Ingresa el código que recibiste', 'err');

  const btn = document.getElementById('btn-verify');
  btn.disabled = true; btn.classList.add('loading');
  try {
    const response = await fetch('http://localhost:8080/sms/login-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code, email }),
    });
    const data = await response.json();
    if (!response.ok) {
      showMsg(data.message || 'Código incorrecto', 'err');
      btn.disabled = false; btn.classList.remove('loading');
      return;
    }
    showMsg(data.message, 'ok');
    redirectUser(data.user);
  } catch (err) {
    showMsg('No se pudo conectar con el servidor', 'err');
    btn.disabled = false; btn.classList.remove('loading');
  }
}