// shared/auth.js
// login guarda la sesión en localStorage como {username, role, displayName}
async function seedDefaultUsers(){
  await openDB();
  const b = await getAll('barbers');
  if (b.length === 0) {
    // usuarios por defecto (password en property 'pass')
    const defaults = [
      { username:'admin', pass:'admin123', role:'admin', name:'Dueño - Admin' },
      { username:'yao', pass:'1111', role:'barber', name:'Yao' },
      { username:'jorge', pass:'2222', role:'barber', name:'Jorge' },
      { username:'luis', pass:'3333', role:'barber', name:'Luis' }
    ];
    for (const u of defaults) await add('barbers', u);
  }
}

async function login(username, pass){
  await openDB();
  const all = await getAll('barbers');
  const u = all.find(x => x.username === username && x.pass === pass);
  if (!u) return null;
  const session = { username: u.username, role: u.role, name: u.name || u.username };
  localStorage.setItem('session', JSON.stringify(session));
  return session;
}
function currentUser(){ return JSON.parse(localStorage.getItem('session') || 'null'); }
function logout(){ localStorage.removeItem('session'); location.href = '/login.html'; }

window.auth = { seedDefaultUsers, login, currentUser, logout };
