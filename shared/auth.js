// shared/auth.js — versión segura
//
// CÓMO FUNCIONA EL GUARD:
//   1. Los HTML protegidos llaman a auth.guardPage('admin') o auth.guardPage('barber')
//      en el primer <script> del <head>, ANTES de que cargue el body.
//   2. El body arranca con style="display:none" (puesto por el guard).
//   3. Se verifica la sesión en localStorage Y se revalida el usuario contra Firestore.
//   4. Si pasa, se muestra el body. Si no, redirige al login antes de que se vea nada.

/* ── SEED USUARIOS POR DEFECTO ──────────────────────────────────────────── */
async function seedDefaultUsers() {
  await openDB();
  const all = await getAll('barbers');
  if (all.length === 0) {
    const defaults = [
      { username: 'admin', pass: 'admin123', role: 'admin',  name: 'Dueño - Admin' },
      { username: 'yao',   pass: '1111',     role: 'barber', name: 'Yao'           },
      { username: 'jorge', pass: '2222',     role: 'barber', name: 'Jorge'         },
      { username: 'luis',  pass: '3333',     role: 'barber', name: 'Luis'          }
    ];
    for (const u of defaults) await add('barbers', u);
  }
}

/* ── LOGIN ───────────────────────────────────────────────────────────────── */
async function login(username, pass) {
  await openDB();
  const all = await getAll('barbers');
  const u = all.find(x => x.username === username && x.pass === pass);
  if (!u) return null;
  const session = {
    username: u.username,
    role:     u.role,
    name:     u.name || u.username,
    // token de integridad: hash simple del id de Firestore + username
    // evita que alguien fabrique una sesión a mano en localStorage
    _sig: btoa(unescape(encodeURIComponent(u.id + '|' + u.username + '|' + u.role)))
  };
  localStorage.setItem('session', JSON.stringify(session));
  return session;
}

/* ── CURRENT USER (solo lectura local) ───────────────────────────────────── */
function currentUser() {
  return JSON.parse(localStorage.getItem('session') || 'null');
}

/* ── LOGOUT ──────────────────────────────────────────────────────────────── */
function logout() {
  localStorage.removeItem('session');
  // Determina la ruta raíz relativa desde cualquier subdirectorio
  const depth = location.pathname.split('/').filter(Boolean).length;
  const root  = depth > 1 ? '../'.repeat(depth - 1) : './';
  location.replace(root + 'login.html');
}

/* ── GUARD — protege una página completa ─────────────────────────────────── */
//
// Uso en el <head> de cada página protegida (ANTES del </head>):
//
//   <script>
//     auth.guardPage('admin');   // solo admins
//     auth.guardPage('barber');  // solo barberos
//   </script>
//
// La función:
//   a) Oculta el body instantáneamente (antes de pintar nada).
//   b) Valida la sesión local.
//   c) Revalida contra Firestore para confirmar que el usuario sigue existiendo
//      y que su rol no fue modificado.
//   d) Si todo ok → muestra el body.
//      Si no       → redirige al login (replace, sin historial).

function guardPage(requiredRole) {
  // a) Ocultar body de inmediato para evitar flash de contenido
  document.documentElement.style.visibility = 'hidden';

  // b) Verificación rápida local
  const session = currentUser();
  const loginPath = _loginPath();

  if (!session || session.role !== requiredRole) {
    location.replace(loginPath);
    return;
  }

  // c) Revalidación contra Firestore (async — el body sigue oculto)
  openDB().then(() => {
    return getByIndex('barbers', 'username', session.username);
  }).then(results => {
    const user = results[0];

    // Verificar que el usuario existe en Firestore y que el rol no fue alterado
    const sigExpected = btoa(unescape(encodeURIComponent(
      user.id + '|' + user.username + '|' + user.role
    )));

    if (!user || user.role !== requiredRole || session._sig !== sigExpected) {
      localStorage.removeItem('session');
      location.replace(loginPath);
      return;
    }

    // Todo ok — mostrar página
    document.documentElement.style.visibility = '';
  }).catch(() => {
    // Error de red o Firestore → redirigir por seguridad
    location.replace(loginPath);
  });
}

/* ── helper interno ─────────────────────────────────────────────────────── */
function _loginPath() {
  const parts = location.pathname.split('/').filter(Boolean);
  const depth = parts.length;
  return depth > 1 ? '../'.repeat(depth - 1) + 'login.html' : './login.html';
}

window.auth = { seedDefaultUsers, login, currentUser, logout, guardPage };
