// admin/js/admin-app.js

document.addEventListener('DOMContentLoaded', async () => {

  await openDB();
  await auth.seedDefaultUsers();
  checkAdmin();
  bindInvoiceFilters();

  await loadBarbersOnFilters();
  await loadInvoicesTable();
  await loadPayrolls();
});


/* ------------------------- VALIDACIÓN ADMIN ------------------------- */

async function checkAdmin() {
  const s = auth.currentUser();
  if (!s || s.role !== 'admin') return location.href = '../index.html';

  document.getElementById('adminName').innerText = s.name || s.username;
}


/* ------------------------- CARGAR BARBEROS EN SELECTS ------------------------- */

async function loadBarbersOnFilters() {

  const list = await getAll('barbers');

  const sel1 = document.getElementById('f_barber');
  const sel2 = document.getElementById('p_barber');

  // Filtro facturas
  sel1.innerHTML = '<option value="">Todos</option>' +
    list.map(b => `<option value="${b.username}">${b.name || b.username}</option>`).join('');

  // Nómina
  sel2.innerHTML = '<option value="">Selecciona barbero</option>' +
    list
      .filter(b => b.role === "barber")
      .map(b => `<option value="${b.username}">${b.name || b.username}</option>`)
      .join('');
}


/* ------------------------- TABLA DE FACTURAS ------------------------- */

async function loadInvoicesTable() {
  const all = await getAll('invoices');

  all.sort((a, b) => new Date(b.date) - new Date(a.date));

  window._invoices = all; // cache
  renderInvoiceRows(all);
}

function renderInvoiceRows(data) {

  const tbody = document.getElementById('invoicesTable');

  tbody.innerHTML = data.map(i => {

    // EXTRA TEXT
    let extrasText = "—";
    if (i.extras && i.extras.length > 0) {
      extrasText = i.extras
        .map(e => `${e.name}: ${utils.formatCurrency(e.value)}`)
        .join("<br>");
    }

    return `
      <tr>
        <td>${new Date(i.date).toLocaleString()}</td>
        <td>${i.barber}</td>
        <td>${utils.formatCurrency(i.gross)}</td>
        <td>${utils.formatCurrency(i.barberia)}</td>
        <td>${utils.formatCurrency(i.barbero)}</td>
        <td>${i.method}</td>
        <td>${extrasText}</td>
        
        <td>
          <button class="btn"
             onclick="removeInvoice(${i.id})"
             style="background:#e53935;color:white">
            Eliminar
          </button>
        </td>
      </tr>
    `;
  }).join('');
}


/* ------------------------- ELIMINAR FACTURA ------------------------- */

async function removeInvoice(id) {
  if (!confirm("¿Eliminar esta factura?")) return;
  await remove("invoices", id);
  await loadInvoicesTable();
}


/* ------------------------- FILTROS ------------------------- */

function bindInvoiceFilters() {

  document.getElementById('btnFilterInvoices').onclick = async () => {

    const from = document.getElementById('f_from').value;
    const to = document.getElementById('f_to').value;
    const barber = document.getElementById('f_barber').value;

    let data = window._invoices;

    if (from) {
      const s = utils.parseStart(from);
      data = data.filter(d => new Date(d.date) >= s);
    }

    if (to) {
      const e = utils.parseEnd(to);
      data = data.filter(d => new Date(d.date) <= e);
    }

    if (barber) {
      data = data.filter(d => d.barber === barber);
    }

    renderInvoiceRows(data);
  };


  document.getElementById('btnClearInvoices').onclick = async () => {
    document.getElementById('f_from').value = '';
    document.getElementById('f_to').value = '';
    document.getElementById('f_barber').value = '';

    await loadInvoicesTable();
  };


  document.getElementById('btnExportAll').onclick = async () => {
    await exportInvoicesPDF(window._invoices);
  };
}


/* ------------------------- CARGAR NÓMINAS ------------------------- */

async function loadPayrolls() {
  const evt = new Event("loadPayrolls");
  document.dispatchEvent(evt);
}
