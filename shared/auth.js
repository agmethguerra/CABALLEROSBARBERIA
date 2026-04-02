// shared/auth.js — versión robusta con Firebase

/* ── SEED USUARIOS POR DEFECTO ──────────────────────────────────────────── */
// Usa un documento centinela "initialized" para evitar duplicados
// incluso si se llama varias veces en paralelo
async function seedDefaultUsers() {
  await openDB();

  // Verificar si ya se inicializó con un documento especial
  const sentinel = await getOne('barbers', '__init__');
  if (sentinel) return; // Ya inicializado, no hacer nada

  const defaults = [
    { username: 'admin', pass: 'admin123', role: 'admin',  name: 'Dueño - Admin' },
    { username: 'yao',   pass: '1111',     role: 'barber', name: 'Yao'           },
    { username: 'jorge', pass: '2222',     role: 'barber', name: 'Jorge'         },
    { username: 'luis',  pass: '3333',     role: 'barber', name: 'Luis'          }
  ];

  for (const u of defaults) await add('barbers', u);

  // Marcar como inicializado con ID fijo
  await put('barbers', { id: '__init__', done: true });
}

/* ── LOGIN ───────────────────────────────────────────────────────────────── */
async function login(username, pass) {
  await openDB();
  const all = await getAll('barbers');

  // Filtrar el centinela y buscar credenciales
  const u = all.find(x => x.id !== '__init__' && x.username === username && x.pass === pass);
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
  // Navegar siempre al login relativo a la raíz del sitio
  const isSubfolder = location.pathname.includes('/admin/') ||
                      location.pathname.includes('/barber/');
  location.replace(isSubfolder ? '../login.html' : './login.html');
}

/* ── GUARD ───────────────────────────────────────────────────────────────── */
// Uso: poner al FINAL del <head> en páginas protegidas:
//   <script>auth.guardPage('admin');</script>
//   <script>auth.guardPage('barber');</script>

function guardPage(requiredRole) {
  // Ocultar página instantáneamente — sin flash de contenido
  document.documentElement.style.visibility = 'hidden';

  const isSubfolder = location.pathname.includes('/admin/') ||
                      location.pathname.includes('/barber/');
  const loginPath   = isSubfolder ? '../login.html' : './login.html';

  // 1. Verificación rápida en localStorage
  const session = currentUser();
  if (!session || session.role !== requiredRole) {
    location.replace(loginPath);
    return;
  }

  // 2. Revalidar en Firestore: confirmar que el usuario sigue existiendo
  //    y que nadie editó su rol manualmente en localStorage
  openDB()
    .then(() => getAll('barbers'))
    .then(barbers => {
      const live = barbers.find(b => b.id !== '__init__' && b.username === session.username);

      if (!live || live.role !== requiredRole) {
        localStorage.removeItem('session');
        location.replace(loginPath);
        return;
      }

      // Todo OK — mostrar la página
      document.documentElement.style.visibility = '';
    })
    .catch(_err => {
      // Si Firestore falla (sin internet, etc.) dejamos pasar
      // basándonos solo en la sesión local — mejor UX que bloquear
      document.documentElement.style.visibility = '';
    });
}

window.auth = { seedDefaultUsers, login, currentUser, logout, guardPage };
