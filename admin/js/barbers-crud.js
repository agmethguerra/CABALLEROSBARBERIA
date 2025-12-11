// admin/js/barbers-crud.js
document.addEventListener('DOMContentLoaded', async ()=>{
  await openDB();
  checkAdmin();
  await renderBarbers();
});

async function checkAdmin(){
  const s = auth.currentUser();
  if(!s || s.role !== 'admin') location.href = './login.html';
  document.getElementById('adminName').innerText = s.name || s.username;
}

async function renderBarbers(){
  const list = await getAll('barbers');
  const container = document.getElementById('barbersList');
  const sel1 = document.getElementById('f_barber');
  const sel2 = document.getElementById('p_barber');
  container.innerHTML = list.map(b=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;border-bottom:1px solid #eee">
      <div><strong>${b.name||b.username}</strong><div class="small-muted">${b.username} • ${b.role}</div></div>
      <div>
        <button class="btn" onclick="editBarber(${b.id})">Editar</button>
        <button class="btn" style="background:#e53935;color:#fff" onclick="deleteBarber(${b.id})">Eliminar</button>
      </div>
    </div>
  `).join('');
  // repuebla selects
  sel1.innerHTML = '<option value="">Todos</option>' + list.map(b=>`<option value="${b.username}">${b.name||b.username}</option>`).join('');
  sel2.innerHTML = '<option value="">Selecciona barbero</option>' + list.filter(x=>x.role==='barber').map(b=>`<option value="${b.username}">${b.name||b.username}</option>`).join('');
}

document.getElementById('btnAddBarber').addEventListener('click', async ()=>{
  const username = document.getElementById('b_username').value.trim();
  const pass = document.getElementById('b_pass').value.trim();
  const name = document.getElementById('b_name').value.trim();
  if(!username || !pass){ alert('usuario y contraseña obligatorios'); return; }
  try{
    await add('barbers', { username, pass, role:'barber', name });
    document.getElementById('b_username').value='';
    document.getElementById('b_pass').value='';
    document.getElementById('b_name').value='';
    await renderBarbers();
  }catch(e){ alert('Error al crear barbero (usuario posiblemente duplicado)'); }
});

async function editBarber(id){
  const b = await getOne('barbers', id);
  const newName = prompt('Nombre visible', b.name||b.username);
  if(newName === null) return;
  b.name = newName;
  await put('barbers', b);
  await renderBarbers();
}

async function deleteBarber(id){
  if(!confirm('Eliminar barbero (no eliminará facturas). Continuar?')) return;
  await remove('barbers', id);
  await renderBarbers();
}
