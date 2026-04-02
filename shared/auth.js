// shared/auth.js

/* ── SEED USUARIOS POR DEFECTO ──────────────────────────────────────────── */
async function seedDefaultUsers() {
  await openDB();
  const sentinel = await getOne('barbers', 'seed-init');
  if (sentinel) return;

  const defaults = [
    { username: 'admin', pass: 'admin123', role: 'admin',  name: 'Dueño - Admin' },
    { username: 'yao',   pass: '1111',     role: 'barber', name: 'Yao'           },
    { username: 'jorge', pass: '2222',     role: 'barber', name: 'Jorge'         },
    { username: 'luis',  pass: '3333',     role: 'barber', name: 'Luis'          }
  ];
  for (const u of defaults) await add('barbers', u);
  await put('barbers', { id: 'seed-init', done: true });
}

/* ── LOGIN ───────────────────────────────────────────────────────────────── */
async function login(username, pass) {
  await openDB();
  const all = await getAll('barbers');
  const u = all.find(x => x.id !== 'seed-init' && x.username === username && x.pass === pass);
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
  const isSubfolder = location.pathname.includes('/admin/') ||
                      location.pathname.includes('/barber/');
  location.replace(isSubfolder ? '../login.html' : './login.html');
}

/* ── GUARD ───────────────────────────────────────────────────────────────── */
// Solo verifica localStorage — rápido, síncrono, sin romper el flujo.
// checkAdmin() y checkBarber() en cada página ya hacen la segunda verificación.
// Uso: al final del <head>:
//   <script>auth.guardPage('admin');</script>
//   <script>auth.guardPage('barber');</script>

function guardPage(requiredRole) {
  const session = currentUser();
  const isSubfolder = location.pathname.includes('/admin/') ||
                      location.pathname.includes('/barber/');
  const loginPath = isSubfolder ? '../login.html' : './login.html';

  if (!session || session.role !== requiredRole) {
    // Ocultar y redirigir antes de que se pinte nada
    document.documentElement.style.visibility = 'hidden';
    location.replace(loginPath);
  }
  // Si la sesión es válida: no hacer nada, dejar cargar la página normalmente
}

window.auth = { seedDefaultUsers, login, currentUser, logout, guardPage };
