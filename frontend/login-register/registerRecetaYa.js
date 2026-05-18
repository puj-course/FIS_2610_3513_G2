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
    el.textContent = text; el.className = 'msg ' + type + ' show';
  }
 //---------------------------------------------------------------------------------------------------------------------
 // register
  async function register() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = pw.value;
    if (!name) return showMsg('Ingresa tu nombre', 'err');
    if (!email || !email.includes('@')) return showMsg('Ingresa un correo válido', 'err');
    if (password.length < 8) return showMsg('La contraseña debe tener al menos 8 caracteres', 'err');   

    const btn = document.getElementById('btn');
    btn.disabled = true; btn.classList.add('loading');
     try {
    const response = await fetch('http://localhost:8080/usuarios/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: name, email, contrasena: password }),
  });
  
  const data = await response.json();
  if (!response.ok) return showMsg(data.message, 'err');
  showMsg('¡Cuenta creada! Redirigiendo...', 'ok');
  setTimeout(() => window.location.href = 'loginRecetaYa.html', 1200);
  } catch (err) {                                               // ← y esto
      showMsg('No se pudo conectar con el servidor', 'err');
      btn.disabled = false;
      btn.classList.remove('loading');
    }
  }
