// barber/js/barber-app.js
let extras = [];
let user;

document.addEventListener('DOMContentLoaded', async () => {
  await openDB();

  user = auth.currentUser();
  if (!user || user.role !== 'barber') {
    return location.href = './index.html';
  }

  document.getElementById('barberName').innerText = user.name || user.username;

  bindEvents();
  await loadMyCuts();
});

/* -------------------- EVENTOS -------------------- */

function bindEvents() {

  // Agregar extra (solo para barbería)
  document.getElementById('btnAddExtra').onclick = (e) => {
    e.preventDefault();
    const n = document.getElementById('extraName').value.trim();
    const v = Number(document.getElementById('extraValue').value);
    if (!n || !v) return alert('Extra inválido');

    extras.push({ name: n, value: v });
    renderExtrasBox();

    document.getElementById('extraName').value = '';
    document.getElementById('extraValue').value = '';
  };

  // Guardar corte
  document.getElementById('btnSaveCut').onclick = async (e) => {
    e.preventDefault();

    const price = Number(document.getElementById('price').value);
    const method = document.getElementById('method').value;
    if (!price) return alert('Ingresa el precio del corte');

    const extrasSum = extras.reduce((s, x) => s + Number(x.value), 0);

    // --------- LÓGICA CORRECTA ---------
    // 1. Restar 2000 SOLO del corte
    const corteNeto = price - 2000;

    // 2. Dividir en 50/50
    const barberoGanancia = Math.round(corteNeto / 2);   // mitad para barbero
    const barberiaBase = Math.round(corteNeto / 2);      // mitad para barbería

    // 3. Sumar extras SOLO a la barbería
    const barberiaGanancia = barberiaBase + extrasSum;

    // 4. El barbero ve como TOTAL → SOLO el precio del corte
    const totalCorte = price;

    const rec = {
      date: new Date().toISOString(),
      barber: user.username,
      price,                // precio ORIGINAL del corte
      extras,
      extrasSum,
      method,

      gross: totalCorte,     // total del corte SIN extras
      barbero: barberoGanancia,
      barberia: barberiaGanancia
    };

    await add('invoices', rec);

    extras = [];
    renderExtrasBox();
    document.getElementById('price').value = '';

    await loadMyCuts();
    alert('Corte registrado exitosamente');
  };
}

/* -------------------- EXTRA BOX -------------------- */

function renderExtrasBox() {
  document.getElementById('extrasBox').innerHTML = extras.map((e, i) =>
    `<div>
       ${e.name} - ${utils.formatCurrency(e.value)}
       <button onclick="removeExtra(${i})" class="btn">x</button>
     </div>`
  ).join('');
}

function removeExtra(i) {
  extras.splice(i, 1);
  renderExtrasBox();
}

/* -------------------- TABLA DEL BARBERO -------------------- */

async function loadMyCuts() {
  const all = await getAll('invoices');

  const mine = all
    .filter(x => x.barber === user.username)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  document.getElementById('myCuts').innerHTML = mine.map(m =>
    `<tr>
       <td>${new Date(m.date).toLocaleString()}</td>
       <td>${utils.formatCurrency(m.gross)}</td>       <!-- total del corte -->
       <td>${utils.formatCurrency(m.barbero)}</td>     <!-- mi ganancia -->
     </tr>`
  ).join('');
}
