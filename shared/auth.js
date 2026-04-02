// shared/auth.js — versión segura

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
  const session = { username: u.username, role: u.role, name: u.name || u.username };
  localStorage.setItem('session', JSON.stringify(session));
  return session;
}

/* ── CURRENT USER ────────────────────────────────────────────────────────── */
function currentUser() {
  return JSON.parse(localStorage.getItem('session') || 'null');
}

/* ── LOGOUT ──────────────────────────────────────────────────────────────── */
function logout() {
  localStorage.removeItem('session');
  const depth = location.pathname.split('/').filter(Boolean).length;
  const root  = depth > 1 ? '../'.repeat(depth - 1) : './';
  location.replace(root + 'login.html');
}

/* ── GUARD ───────────────────────────────────────────────────────────────── */
// Llamar al final del <head> en cada página protegida:
//   <script>auth.guardPage('admin');</script>
//   <script>auth.guardPage('barber');</script>
//
// Flujo:
//   1. Oculta el body de inmediato (sin flash de contenido).
//   2. Verifica sesión local + rol.
//   3. Revalida contra Firestore: que el usuario existe y su rol no fue cambiado.
//   4. Muestra el body solo si todo es válido.

function guardPage(requiredRole) {
  // 1. Ocultar body instantáneamente
  document.documentElement.style.visibility = 'hidden';

  const loginPath = _loginPath();
  const session   = currentUser();

  // 2. Verificación local rápida
  if (!session || session.role !== requiredRole) {
    location.replace(loginPath);
    return;
  }

  // 3. Revalidación contra Firestore
  openDB()
    .then(() => getAll('barbers'))
    .then(barbers => {
      const user = barbers.find(b => b.username === session.username);

      // El usuario debe existir en Firestore y tener el rol correcto
      if (!user || user.role !== requiredRole) {
        localStorage.removeItem('session');
        location.replace(loginPath);
        return;
      }

      // 4. Todo válido → mostrar página
      document.documentElement.style.visibility = '';
    })
    .catch(() => {
      // Error de red → redirigir por seguridad
      location.replace(loginPath);
    });
}

/* ── helper interno ─────────────────────────────────────────────────────── */
function _loginPath() {
  const parts = location.pathname.split('/').filter(Boolean);
  return parts.length > 1 ? '../'.repeat(parts.length - 1) + 'login.html' : './login.html';
}

window.auth = { seedDefaultUsers, login, currentUser, logout, guardPage };
